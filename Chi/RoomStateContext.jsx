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
const INITIAL_BOOKINGS = {
  'VIP-01': [],
  'VIP-02': [],
  'VIP-03': [],
  'VIP-04': [],
  'VIP-05': [],
  'VIP-06': [],
  'VVIP-01': [],
  'VVIP-02': [],
  'VVIP-03': [],
  'DELUXE-01': [],
  'DELUXE-02': [],
};

// ─────────────────────────────────────────────
// Helper: Tính trạng thái phòng
// ─────────────────────────────────────────────
export function getRoomStatus(roomId, bookings, isMaintenance) {
  if (isMaintenance) return 'maintenance';
  const room = ROOM_CONFIG.find((r) => r.id === roomId);
  if (!room) return 'empty';
  const bks = (bookings[roomId] || []).filter((b) => !b.code?.includes('BK'));
  const total = bks.reduce((s, b) => s + b.cats, 0);
  if (total === 0) return 'empty';
  if (total < room.capacity) return 'available';
  return 'full';
}

// ─────────────────────────────────────────────
// Helper: Xác định trạng thái booking dựa trên thời gian
// ─────────────────────────────────────────────
export function determineBookingStatus(checkIn) {
  if (!checkIn) return 'check-in';
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  // Nếu ngày check-in bằng hôm nay hoặc trước đó -> đang ở, nếu ngày mai trở đi -> check-in
  if (checkIn <= todayStr) {
    return 'đang ở';
  }
  return 'check-in';
}

// ─────────────────────────────────────────────
// Kênh BroadcastChannel đồng bộ tức thì giữa các tab
// ─────────────────────────────────────────────
const syncChannel = typeof window !== 'undefined' && window.BroadcastChannel
  ? new BroadcastChannel('mvn_room_channel')
  : null;

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

const getInitialBookings = () => {
  try {
    const saved = localStorage.getItem('mvn_room_bookings');
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleaned = { ...INITIAL_BOOKINGS };
      Object.keys(INITIAL_BOOKINGS).forEach((roomId) => {
        cleaned[roomId] = (parsed[roomId] || []).filter((b) => !b.code?.includes('BK'));
      });
      return cleaned;
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
    setBookings((prev) => {
      const current = prev[roomId] || [];
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

    // Đánh dấu booking mới để highlight nhấp nháy trong 6 giây trên bảng Admin
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
   */
  const getRoomAvailability = useCallback(
    (catCount = 1) => {
      const order = ['VIP', 'VVIP', 'DELUXE'];
      const grouped = {};

      ROOM_CONFIG.forEach((room) => {
        const isMaint = !!maintenanceRooms[room.id];
        const status = getRoomStatus(room.id, bookings, isMaint);
        // Bỏ qua phòng đang bảo trì hoặc đã đầy
        if (status === 'maintenance' || status === 'full') return;

        const bks = (bookings[room.id] || []).filter((b) => !b.code?.includes('BK'));
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
