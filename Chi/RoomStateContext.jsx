import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

// ─────────────────────────────────────────────
// Helper: generate a unique booking detail key for localStorage
// ─────────────────────────────────────────────
const BOOKING_DETAILS_KEY = 'mvn_booking_details';

// ─────────────────────────────────────────────
// Cấu hình phòng (source of truth dùng chung)
// ─────────────────────────────────────────────
export const ROOM_CONFIG = [
  // VIP: tối đa 2 mèo/phòng, 6 phòng
  ...['VIP-01', 'VIP-02', 'VIP-03', 'VIP-04', 'VIP-05', 'VIP-06'].map((id) => ({
    id,
    type: 'VIP',
    capacity: 2,
  })),
  // VVIP: tối đa 4 mèo/phòng, 3 phòng
  ...['VVIP-01', 'VVIP-02', 'VVIP-03'].map((id) => ({
    id,
    type: 'VVIP',
    capacity: 4,
  })),
  // DELUXE: tối đa 6 mèo/phòng, 2 phòng
  ...['DELUXE-01', 'DELUXE-02'].map((id) => ({
    id,
    type: 'DELUXE',
    capacity: 6,
  })),
];

// ─────────────────────────────────────────────
// Dữ liệu booking khởi tạo (sạch, không có mã BK)
// ─────────────────────────────────────────────
export const INITIAL_BOOKINGS = {
  'VIP-01': [
    {
      code: 'MVN-2026-8891',
      cats: 1,
      status: 'check-in',
      ownerName: 'Nguyễn Đức An',
      ownerPhone: '0376131531',
      ownerTier: 'Vàng',
      catNames: 'Bé Miu Miu',
      checkIn: '2026-09-22',
      checkOut: '2026-09-25',
      packages: ['Gói Chăm Sóc Toàn Diện', 'Combo Spa'],
    },
  ],
  'VIP-02': [
    {
      code: 'MVN-2026-8420',
      cats: 2,
      status: 'check-in',
      ownerName: 'Trần Thị Mai',
      ownerPhone: '0912345678',
      ownerTier: 'Bạch_Kim',
      catNames: 'Bánh Bao, Đậu Phộng',
      checkIn: '2026-09-22',
      checkOut: '2026-09-26',
      packages: ['Gói Cơ Bản', 'Tắm & Vệ Sinh'],
    },
  ],
  'VIP-03': [],
  'VIP-04': [],
  'VIP-05': [],
  'VIP-06': [],
  'VVIP-01': [
    {
      code: 'MVN-2026-7734',
      cats: 2,
      status: 'check-in',
      ownerName: 'Lê Hoàng Long',
      ownerPhone: '0988776655',
      ownerTier: 'Kim_Cương',
      catNames: 'Sữa, Cà Phê',
      checkIn: '2026-09-23',
      checkOut: '2026-09-28',
      packages: ['Gói VIP Hoàng Gia', 'Khám Sức Khỏe'],
    },
  ],
  'VVIP-02': [],
  'VVIP-03': [],
  'DELUXE-01': [],
  'DELUXE-02': [],
};

// ─────────────────────────────────────────────
// Helper: Chuẩn hóa ngày về dạng YYYY-MM-DD
// ─────────────────────────────────────────────
export function formatDateKey(date) {
  if (!date) return '';
  if (date instanceof Date && !isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof date === 'string') {
    const trimmed = date.trim();
    // YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
      const parts = trimmed.split('T')[0].split('-');
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
      const parts = trimmed.split('/');
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return '';
}

// ─────────────────────────────────────────────
// Helper: Kiểm tra đơn đặt phòng có hiệu lực trên ngày đang xem hay không
// Quy tắc hiển thị: Ngày đang xem nằm trong khoảng lưu trú [checkIn, checkOut]
// Không làm thay đổi hay sửa đổi dữ liệu/mã của các booking đã lưu
// ─────────────────────────────────────────────
export function isBookingActiveOnDate(booking, targetDate) {
  if (!booking) return false;
  if (!targetDate) return true; // Không truyền ngày thì hiển thị
  const tKey = formatDateKey(targetDate);
  if (!tKey) return true;

  // Lấy ngày nhận và ngày trả của booking (không thay đổi booking gốc)
  let inKey = formatDateKey(booking.checkIn || booking.checkInDate || booking.check_in);
  let outKey = formatDateKey(booking.checkOut || booking.checkOutDate || booking.check_out);

  // Nếu là booking ban đầu mà dữ liệu cũ thiếu trường ngày, tra cứu ngày gốc tương ứng
  if ((!inKey || !outKey) && booking.code) {
    for (const rid of Object.keys(INITIAL_BOOKINGS)) {
      const found = INITIAL_BOOKINGS[rid].find((b) => b.code === booking.code);
      if (found) {
        inKey = inKey || formatDateKey(found.checkIn);
        outKey = outKey || formatDateKey(found.checkOut);
        break;
      }
    }
  }

  // Nếu không xác định được ngày, vẫn giữ hiển thị (bảo toàn booking trước đó)
  if (!inKey || !outKey) return true;

  // Quy tắc: Ngày đang xem nằm trong khoảng [checkIn, checkOut]
  return tKey >= inKey && tKey <= outKey;
}

// ─────────────────────────────────────────────
// Helper: Tính trạng thái phòng theo ngày
// ─────────────────────────────────────────────
export function getRoomStatus(roomId, bookings, isMaintenance, targetDate = null) {
  if (isMaintenance) return 'maintenance';
  const room = ROOM_CONFIG.find((r) => r.id === roomId);
  if (!room) return 'empty';
  const allBks = (bookings[roomId] || []).filter((b) => !b.code?.includes('BK'));
  const bks = targetDate
    ? allBks.filter((b) => isBookingActiveOnDate(b, targetDate))
    : allBks;
  const total = bks.reduce((s, b) => s + b.cats, 0);
  if (total === 0) return 'empty';
  if (total < room.capacity) return 'available';
  return 'full';
}

// ─────────────────────────────────────────────
// Helper: Xác định trạng thái booking dựa trên thời gian
// Mặc định ban đầu (kể cả hôm nay là ngày nhận): luôn ở trạng thái 'check-in'
// Cho đến khi Admin bấm nút 'Check-in' trong ô chi tiết đặt phòng mới chuyển sang 'đang ở'
// ─────────────────────────────────────────────
export function determineBookingStatus(checkIn) {
  return 'check-in';
}

// ─────────────────────────────────────────────
// Kênh BroadcastChannel đồng bộ tức thì giữa các tab
// ─────────────────────────────────────────────
const syncChannel = typeof window !== 'undefined' && window.BroadcastChannel
  ? new BroadcastChannel('mvn_room_channel')
  : null;

const isDateRangeOverlap = (startA, endA, startB, endB) => {
  if (!startA || !endA || !startB || !endB) return false;
  const aStart = new Date(`${startA}T00:00:00`);
  const aEnd = new Date(`${endA}T00:00:00`);
  const bStart = new Date(`${startB}T00:00:00`);
  const bEnd = new Date(`${endB}T00:00:00`);
  return aStart < bEnd && bStart < aEnd;
};

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const RoomStateContext = createContext(null);

const getInitialMaintenance = () => {
  try {
    const saved = localStorage.getItem('mvn_maintenance_rooms');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

/**
 * Khởi tạo danh sách booking:
 * Giữ nguyên 100% tất cả các booking trước đó từ localStorage và mã của từng booking,
 * tuyệt đối không xóa, không ghi đè và không làm thay đổi các booking đã lưu.
 */
const getInitialBookings = () => {
  try {
    const saved = localStorage.getItem('mvn_room_bookings');
    if (saved) {
      const parsed = JSON.parse(saved);
      const result = { ...INITIAL_BOOKINGS };
      let hasAny = false;

      // Giữ nguyên vẹn toàn bộ danh sách booking trước đó từ storage
      Object.keys(INITIAL_BOOKINGS).forEach((roomId) => {
        if (Array.isArray(parsed[roomId]) && parsed[roomId].length > 0) {
          hasAny = true;
          result[roomId] = parsed[roomId];
        }
      });

      // Bảo toàn cả các phòng khác nếu có trong storage
      Object.keys(parsed).forEach((roomId) => {
        if (!result[roomId] && Array.isArray(parsed[roomId])) {
          result[roomId] = parsed[roomId];
        }
      });

      if (hasAny) {
        return result;
      }
    }
  } catch (e) {
    console.error('Failed to load bookings from storage', e);
  }
  return INITIAL_BOOKINGS;
};

export const RoomStateProvider = ({ children }) => {
  const [bookings, setBookings] = useState(getInitialBookings);
  // Lưu id các booking vừa được thêm mới để highlight
  const [newBookingIds, setNewBookingIds] = useState(new Set());
  // Trạng thái bảo trì phòng (lưu vĩnh viễn tới khi bấm "Hết bảo trì")
  const [maintenanceRooms, setMaintenanceRooms] = useState(getInitialMaintenance);

  // Lắng nghe cập nhật đa tab (BroadcastChannel + storage event)
  useEffect(() => {
    // 1. BroadcastChannel: đồng bộ tức thì không độ trễ giữa các tab
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        const msg = event.data;
        if (msg?.type === 'BOOKING_ADDED' && msg.allBookings) {
          setBookings(msg.allBookings);
          if (msg.booking?.code) {
            setNewBookingIds((prev) => {
              const next = new Set(prev);
              next.add(msg.booking.code);
              return next;
            });
            setTimeout(() => {
              setNewBookingIds((prev) => {
                const next = new Set(prev);
                next.delete(msg.booking.code);
                return next;
              });
            }, 6000);
          }
        } else if (
          (msg?.type === 'BOOKING_UPDATED' || msg?.type === 'BOOKING_REMOVED') &&
          msg.allBookings
        ) {
          setBookings(msg.allBookings);
        } else if (msg?.type === 'MAINTENANCE_TOGGLED' && msg.maintenanceRooms) {
          setMaintenanceRooms(msg.maintenanceRooms);
        }
      };
    }

    // 2. Storage event fallback
    const handleStorageChange = (e) => {
      if (e.key === 'mvn_room_bookings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setBookings(parsed);
        } catch (err) {}
      }
      if (e.key === 'mvn_maintenance_rooms' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setMaintenanceRooms(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * Bật/Tắt bảo trì cho 1 phòng - lưu trạng thái vào localStorage & phát sóng đa tab
   */
  const toggleMaintenance = useCallback((roomId) => {
    setMaintenanceRooms((prev) => {
      const updated = {
        ...prev,
        [roomId]: !prev[roomId],
      };
      try {
        localStorage.setItem('mvn_maintenance_rooms', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save maintenance state', e);
      }
      if (syncChannel) {
        syncChannel.postMessage({
          type: 'MAINTENANCE_TOGGLED',
          maintenanceRooms: updated,
        });
      }
      return updated;
    });
  }, []);

  /**
   * Thêm booking mới vào phòng → đồng bộ tức thì sang Admin tab Tình trạng phòng (kể cả khác tab)
   * @param {string} roomId    - ID phòng, VD: 'VIP-03'
   * @param {object} booking   - { code, cats, status, ...detailFields }
   */
  const addNewBooking = useCallback((roomId, booking) => {
    let shouldAdd = true;
    let conflictBooking = null;

    setBookings((prev) => {
      const current = prev[roomId] || [];
      const duplicateByCustomer = current.find((existing) => {
        if (!booking.customerPhone || !existing.customerPhone) return false;
        return (
          existing.customerPhone === booking.customerPhone &&
          existing.checkIn === booking.checkIn &&
          existing.checkOut === booking.checkOut &&
          existing.roomId === roomId
        );
      });

      if (duplicateByCustomer) {
        const updated = {
          ...prev,
          [roomId]: current.map((item) => item.code === duplicateByCustomer.code ? { ...item, ...booking } : item),
        };
        try { localStorage.setItem('mvn_room_bookings', JSON.stringify(updated)); } catch (e) {}
        if (syncChannel) {
          syncChannel.postMessage({ type: 'BOOKING_UPDATED', roomId, code: duplicateByCustomer.code, updates: booking, allBookings: updated });
        }
        shouldAdd = false;
        conflictBooking = duplicateByCustomer;
        return updated;
      }

      const conflict = current.find((existing) => {
        if (!existing.checkIn || !existing.checkOut || !booking.checkIn || !booking.checkOut) return false;
        if (existing.code === booking.code) return false;
        return isDateRangeOverlap(existing.checkIn, existing.checkOut, booking.checkIn, booking.checkOut);
      });

      if (conflict) {
        shouldAdd = false;
        conflictBooking = conflict;
        return prev;
      }

      const updated = {
        ...prev,
        [roomId]: [...current, booking],
      };
      try {
        localStorage.setItem('mvn_room_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save bookings to localStorage', e);
      }
      if (syncChannel) {
        syncChannel.postMessage({
          type: 'BOOKING_ADDED',
          roomId,
          booking,
          allBookings: updated,
        });
      }
      return updated;
    });

    if (booking?.code && shouldAdd) {
      setNewBookingIds((prev) => {
        const next = new Set(prev);
        next.add(booking.code);
        return next;
      });
      setTimeout(() => {
        setNewBookingIds((prev) => {
          const next = new Set(prev);
          next.delete(booking.code);
          return next;
        });
      }, 6000);
    }

    return shouldAdd;
  }, []);

  /**
   * Cập nhật thông tin booking (chỉnh sửa)
   * @param {string} roomId   - ID phòng
   * @param {string} code     - Mã booking
   * @param {object} updates  - Các trường cần cập nhật
   */
  const updateBooking = useCallback((roomId, code, updates) => {
    setBookings((prev) => {
      const current = prev[roomId] || [];
      const updated = {
        ...prev,
        [roomId]: current.map((b) => b.code === code ? { ...b, ...updates } : b),
      };
      try {
        localStorage.setItem('mvn_room_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update booking in localStorage', e);
      }
      try {
        const savedHist = localStorage.getItem('bookingHistory');
        if (savedHist) {
          const list = JSON.parse(savedHist);
          if (Array.isArray(list)) {
            const nextList = list.map(item => (item.id === code || item.code === code) ? { ...item, ...updates } : item);
            localStorage.setItem('bookingHistory', JSON.stringify(nextList));
            window.dispatchEvent(new Event('mvn_booking_sync'));
          }
        }
      } catch (e) {}

      if (syncChannel) {
        syncChannel.postMessage({ type: 'BOOKING_UPDATED', roomId, code, updates, allBookings: updated });
      }
      return updated;
    });
  }, []);

  /**
   * Check-in: chuyển trạng thái booking → 'đang ở'
   */
  const checkInBooking = useCallback((roomId, code) => {
    updateBooking(roomId, code, { status: 'đang ở' });
  }, [updateBooking]);

  /**
   * Check-out: xóa booking khỏi phòng (sau khi thanh toán)
   */
  const checkOutBooking = useCallback((roomId, code) => {
    setBookings((prev) => {
      const updated = {
        ...prev,
        [roomId]: (prev[roomId] || []).filter((b) => b.code !== code),
      };
      try {
        localStorage.setItem('mvn_room_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to checkout booking', e);
      }
      if (syncChannel) {
        syncChannel.postMessage({ type: 'BOOKING_REMOVED', roomId, code, allBookings: updated });
      }
      return updated;
    });
  }, []);

  /**
   * Hủy / xóa đơn đặt phòng khỏi hệ thống
   */
  const removeBooking = useCallback((roomId, code) => {
    setBookings((prev) => {
      const updated = {
        ...prev,
        [roomId]: (prev[roomId] || []).filter((b) => b.code !== code),
      };
      try {
        localStorage.setItem('mvn_room_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to remove booking', e);
      }
      try {
        const savedHist = localStorage.getItem('bookingHistory');
        if (savedHist) {
          const list = JSON.parse(savedHist);
          if (Array.isArray(list)) {
            const nextList = list.filter(item => item.id !== code && item.code !== code);
            localStorage.setItem('bookingHistory', JSON.stringify(nextList));
            window.dispatchEvent(new Event('mvn_booking_sync'));
          }
        }
      } catch (e) {}

      if (syncChannel) {
        syncChannel.postMessage({ type: 'BOOKING_REMOVED', roomId, code, allBookings: updated });
      }
      return updated;
    });
  }, []);

  /**
   * Trả về danh sách phòng còn chỗ, nhóm theo hạng
   * Dùng bởi Step1Dates khi bấm "Kiểm tra phòng trống"
   * @param {number} catCount - số mèo cần gửi
   * @param {Date|string|null} targetDate - ngày cần kiểm tra phòng trống (tùy chọn)
   */
  const getRoomAvailability = useCallback(
    (catCount = 1, targetDate = null) => {
      const order = ['VIP', 'VVIP', 'DELUXE'];
      const grouped = {};

      ROOM_CONFIG.forEach((room) => {
        const isMaint = !!maintenanceRooms[room.id];
        const status = getRoomStatus(room.id, bookings, isMaint, targetDate);
        // Bỏ qua phòng đang bảo trì hoặc đã đầy
        if (status === 'maintenance' || status === 'full') return;

        const allBks = (bookings[room.id] || []).filter((b) => !b.code?.includes('BK'));
        const bks = targetDate
          ? allBks.filter((b) => isBookingActiveOnDate(b, targetDate))
          : allBks;
        const used = bks.reduce((s, b) => s + b.cats, 0);
        const remaining = room.capacity - used;

        // Chỉ giữ phòng còn đủ chỗ cho số mèo cần gửi
        if (remaining < catCount) return;

        if (!grouped[room.type]) grouped[room.type] = [];
        grouped[room.type].push({
          id: room.id,
          type: room.type,
          capacity: room.capacity,
          used,
          remaining,
          status, // 'empty' | 'available'
        });
      });

      // Sắp xếp theo thứ tự VIP → VVIP → DELUXE
      return order
        .filter((t) => grouped[t]?.length > 0)
        .map((t) => ({ type: t, rooms: grouped[t] }));
    },
    [bookings, maintenanceRooms]
  );

  return (
    <RoomStateContext.Provider
      value={{
        bookings,
        addNewBooking,
        updateBooking,
        checkInBooking,
        checkOutBooking,
        removeBooking,
        getRoomAvailability,
        newBookingIds,
        maintenanceRooms,
        toggleMaintenance,
      }}
    >
      {children}
    </RoomStateContext.Provider>
  );
};

export const useRoomState = () => {
  const ctx = useContext(RoomStateContext);
  if (!ctx) throw new Error('useRoomState phải dùng bên trong <RoomStateProvider>');
  return ctx;
};

export default RoomStateContext;
