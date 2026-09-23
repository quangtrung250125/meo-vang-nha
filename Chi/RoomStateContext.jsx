import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { supabase } from '../src/supabaseClient';

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
// Helper: Tính trạng thái phòng
// ─────────────────────────────────────────────
export function getRoomStatus(roomId, bookings, isMaintenance, targetDate = new Date()) {
  if (isMaintenance) return 'maintenance';
  const room = ROOM_CONFIG.find((r) => r.id === roomId);
  if (!room) return 'empty';

  const t = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  const targetDateStr = `${y}-${m}-${d}`;

  const bks = (bookings[roomId] || []).filter((b) => {
    if (!b || b.code?.includes('BK')) return false;
    // Bỏ qua các đơn đã check-out, đã hoàn tất hoặc bị hủy
    if (
      b.status === 'check-out' ||
      b.status === 'Đã hoàn tất' ||
      b.status === 'hoàn tất' ||
      b.status === 'cancelled' ||
      b.status === 'Đã hủy'
    ) {
      return false;
    }
    // Nếu ngày hết hạn đặt phòng đã qua so với ngày kiểm tra -> phòng đã hết hạn, không còn chiếm phòng
    if (b.checkOut && targetDateStr > b.checkOut) {
      return false;
    }
    // Chỉ tính chiếm phòng nếu ngày kiểm tra nằm trong khoảng [checkIn, checkOut]
    if (b.checkIn && b.checkOut) {
      return targetDateStr >= b.checkIn && targetDateStr <= b.checkOut;
    }
    return true;
  });

  const total = bks.reduce((s, b) => s + (b.cats || 1), 0);
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

export const isDateRangeOverlap = (startA, endA, startB, endB) => {
  if (!startA || !endA || !startB || !endB) return false;
  const aStart = new Date(`${startA}T00:00:00`).getTime();
  const aEnd = new Date(`${endA}T00:00:00`).getTime();
  const bStart = new Date(`${startB}T00:00:00`).getTime();
  const bEnd = new Date(`${endB}T00:00:00`).getTime();
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

const getInitialBookings = () => {
  try {
    const saved = localStorage.getItem('mvn_room_bookings');
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleaned = { ...INITIAL_BOOKINGS };
      let hasAny = false;
      Object.keys(INITIAL_BOOKINGS).forEach((roomId) => {
        const list = (parsed[roomId] || []).filter((b) => !b.code?.includes('BK'));
        if (list.length > 0) hasAny = true;
        cleaned[roomId] = list;
      });
      if (hasAny) {
        return cleaned;
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
        if (msg?.type === 'DEMO_RESET' && msg.allBookings) {
          setBookings(msg.allBookings);
        } else if (msg?.type === 'BOOKING_ADDED' && msg.allBookings) {
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

  // Lắng nghe và đồng bộ dữ liệu Realtime từ Supabase bookings table
  useEffect(() => {
    let isMounted = true;

    // 1. Tải bookings đã lưu từ Supabase Database
    const loadSupabaseBookings = async () => {
      try {
        const { data, error } = await supabase.from('bookings').select('*');
        if (!error && Array.isArray(data) && data.length > 0 && isMounted) {
          setBookings((prev) => {
            const next = { ...prev };
            let changed = false;

            data.forEach((row) => {
              const bData = row.data || {};
              const roomId = bData.roomId || bData.selectedRoom?.id;
              if (roomId && next[roomId]) {
                const existingList = next[roomId];
                const exists = existingList.some(
                  (b) => b.code === row.code || b.id === row.id || (bData.code && b.code === bData.code)
                );
                if (!exists) {
                  const bookingItem = {
                    ...bData,
                    id: row.id,
                    code: row.code || bData.code,
                    customerId: row.customer_id,
                  };
                  next[roomId] = [...existingList, bookingItem];
                  changed = true;
                }
              }
            });

            if (changed) {
              try {
                localStorage.setItem('mvn_room_bookings', JSON.stringify(next));
              } catch (e) {}
            }
            return changed ? next : prev;
          });
        }
      } catch (err) {
        console.warn('Lỗi kết nối Supabase bookings:', err);
      }
    };

    loadSupabaseBookings();

    // 2. Lắng nghe thay đổi Realtime từ Supabase
    const realtimeChannel = supabase
      .channel('mvn_room_state_rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const row = payload.new;
            const bData = row.data || {};
            const roomId = bData.roomId || bData.selectedRoom?.id;
            if (roomId) {
              setBookings((prev) => {
                const current = prev[roomId] || [];
                if (current.some((b) => b.code === row.code || b.id === row.id)) return prev;
                const nextBooking = {
                  ...bData,
                  id: row.id,
                  code: row.code || bData.code,
                  customerId: row.customer_id,
                };
                const updated = {
                  ...prev,
                  [roomId]: [...current, nextBooking],
                };
                try {
                  localStorage.setItem('mvn_room_bookings', JSON.stringify(updated));
                } catch (e) {}
                return updated;
              });
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old.id;
            setBookings((prev) => {
              let changed = false;
              const next = { ...prev };
              Object.keys(next).forEach((roomId) => {
                const filtered = next[roomId].filter((b) => b.id !== deletedId && b.code !== deletedId);
                if (filtered.length !== next[roomId].length) {
                  next[roomId] = filtered;
                  changed = true;
                }
              });
              if (changed) {
                try {
                  localStorage.setItem('mvn_room_bookings', JSON.stringify(next));
                } catch (e) {}
              }
              return changed ? next : prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(realtimeChannel);
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
   * Thêm booking mới vào phòng → kiểm tra độc quyền phòng theo ngày, đồng bộ tức thì sang Admin
   * @param {string} roomId    - ID phòng, VD: 'VIP-03'
   * @param {object} booking   - { code, cats, status, ...detailFields }
   * @returns {object} { success: boolean, conflict?: boolean, reason?: string, message?: string }
   */
  const addNewBooking = useCallback((roomId, booking) => {
    const current = bookings[roomId] || [];

    // 1. Kiểm tra trùng lặp nếu cùng 1 khách gửi lại đơn
    const duplicateByCustomer = current.find((existing) => {
      if (!booking.customerPhone || !existing.customerPhone) return false;
      return (
        existing.customerPhone === booking.customerPhone &&
        existing.checkIn === booking.checkIn &&
        existing.checkOut === booking.checkOut &&
        (existing.roomId === roomId || existing.code === booking.code || existing.id === booking.id)
      );
    });

    if (duplicateByCustomer) {
      const updated = {
        ...bookings,
        [roomId]: current.map((item) => item.code === duplicateByCustomer.code ? { ...item, ...booking } : item),
      };
      setBookings(updated);
      try { localStorage.setItem('mvn_room_bookings', JSON.stringify(updated)); } catch (e) {}
      if (syncChannel) {
        syncChannel.postMessage({ type: 'BOOKING_UPDATED', roomId, code: duplicateByCustomer.code, updates: booking, allBookings: updated });
      }
      return { success: true, isDuplicate: true, booking };
    }

    // 2. Kiểm tra xung đột ngày (Exclusive room per date range)
    const conflict = current.find((existing) => {
      if (!existing.checkIn || !existing.checkOut || !booking.checkIn || !booking.checkOut) return false;
      if (existing.code === booking.code || (booking.id && existing.id === booking.id)) return false;
      if (existing.status === 'cancelled' || existing.status === 'Đã hủy') return false;
      return isDateRangeOverlap(existing.checkIn, existing.checkOut, booking.checkIn, booking.checkOut);
    });

    if (conflict) {
      return {
        success: false,
        conflict: true,
        reason: 'DATE_OVERLAP',
        message: `Phòng ${roomId} đã được đặt từ ngày ${conflict.checkIn} đến ngày ${conflict.checkOut}. Vui lòng chọn phòng khác!`,
        conflictBooking: conflict
      };
    }

    // 3. Nếu không có xung đột, thêm booking vào phòng
    const updated = {
      ...bookings,
      [roomId]: [...current, booking],
    };
    setBookings(updated);

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

    if (booking?.code) {
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

    return { success: true, booking };
  }, [bookings]);

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
   * Check-out: cập nhật trạng thái đã check-out, giải phóng phòng để phòng TRỐNG ngay lập tức
   */
  const checkOutBooking = useCallback((roomId, code) => {
    setBookings((prev) => {
      const currentList = prev[roomId] || [];
      // Giải phóng booking khỏi phòng đang ở để phòng trở lại TRỐNG
      const updatedList = currentList.filter((b) => b.code !== code && b.id !== code);
      const updated = {
        ...prev,
        [roomId]: updatedList,
      };
      try {
        localStorage.setItem('mvn_room_bookings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to checkout booking', e);
      }
      if (syncChannel) {
        syncChannel.postMessage({
          type: 'BOOKING_REMOVED',
          roomId,
          code,
          allBookings: updated,
        });
      }
      return updated;
    });

    // Cập nhật trạng thái thành 'check-out' trong bookingHistory
    try {
      const savedHist = localStorage.getItem('bookingHistory');
      if (savedHist) {
        const list = JSON.parse(savedHist);
        if (Array.isArray(list)) {
          const nextList = list.map((item) =>
            item.id === code || item.code === code
              ? { ...item, status: 'check-out' }
              : item
          );
          localStorage.setItem('bookingHistory', JSON.stringify(nextList));
          window.dispatchEvent(new Event('mvn_booking_sync'));
        }
      }
    } catch (e) {}

    // Cập nhật lên Supabase Database realtime
    (async () => {
      try {
        const { data: existingRows } = await supabase
          .from('bookings')
          .select('id, data')
          .or(`id.eq.${code},code.eq.${code}`);

        if (existingRows && existingRows.length > 0) {
          const target = existingRows[0];
          await supabase
            .from('bookings')
            .update({
              data: { ...(target.data || {}), status: 'check-out' },
            })
            .eq('id', target.id);
        }
      } catch (err) {
        console.warn('Lỗi cập nhật check-out lên Supabase:', err);
      }
    })();
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
   * @param {string|null} checkIn - ngày nhận (YYYY-MM-DD)
   * @param {string|null} checkOut - ngày trả (YYYY-MM-DD)
   */
  const getRoomAvailability = useCallback(
    (catCount = 1, checkIn = null, checkOut = null) => {
      const order = ['VIP', 'VVIP', 'DELUXE'];
      const grouped = {};

      ROOM_CONFIG.forEach((room) => {
        const isMaint = !!maintenanceRooms[room.id];
        // Bỏ qua phòng đang bảo trì
        if (isMaint) return;

        // Bỏ qua phòng không đủ sức chứa số mèo
        if (catCount > room.capacity) return;

        const bks = (bookings[room.id] || []).filter(
          (b) =>
            !b.code?.includes('BK') &&
            b.status !== 'cancelled' &&
            b.status !== 'Đã hủy' &&
            b.status !== 'check-out' &&
            b.status !== 'Đã hoàn tất' &&
            b.status !== 'hoàn tất'
        );

        let isBookedInDateRange = false;
        let conflictItem = null;

        if (checkIn && checkOut) {
          conflictItem = bks.find((b) =>
            isDateRangeOverlap(b.checkIn, b.checkOut, checkIn, checkOut)
          );
          if (conflictItem) {
            isBookedInDateRange = true;
          }
        } else {
          // Nếu chưa chọn ngày, kiểm tra theo tổng số mèo đang ở
          const used = bks.reduce((s, b) => s + (b.cats || 1), 0);
          if (room.capacity - used < catCount) {
            isBookedInDateRange = true;
          }
        }

        const remaining = isBookedInDateRange ? 0 : room.capacity;
        const status = isBookedInDateRange ? 'full' : 'available';

        if (!grouped[room.type]) grouped[room.type] = [];
        grouped[room.type].push({
          id: room.id,
          type: room.type,
          capacity: room.capacity,
          remaining,
          isBooked: isBookedInDateRange,
          conflictingBooking: conflictItem ? {
            code: conflictItem.code,
            checkIn: conflictItem.checkIn,
            checkOut: conflictItem.checkOut,
          } : null,
          status,
        });
      });

      // Sắp xếp theo thứ tự VIP → VVIP → DELUXE
      return order
        .filter((t) => grouped[t]?.length > 0)
        .map((t) => ({ type: t, rooms: grouped[t] }));
    },
    [bookings, maintenanceRooms]
  );

  // HÀM KHÔI PHỤC DỮ LIỆU MẪU
  const resetDemoData = useCallback(() => {
    localStorage.removeItem('mvn_room_bookings');
    localStorage.removeItem(BOOKING_DETAILS_KEY);
    
    setBookings(INITIAL_BOOKINGS);
    
    if (syncChannel) {
      syncChannel.postMessage({ type: 'DEMO_RESET', allBookings: INITIAL_BOOKINGS });
    }
    
    window.location.reload();
  }, []);

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
        resetDemoData,
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
