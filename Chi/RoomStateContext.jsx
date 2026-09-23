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
      status: 'Đã hoàn tất',
      ownerName: 'Nguyễn Đức An',
      ownerPhone: '0376131531',
      ownerTier: 'Vàng',
      catNames: 'Bé Miu Miu',
      checkIn: '2026-09-15',
      checkOut: '2026-09-18',
      packages: ['Gói Chăm Sóc Toàn Diện', 'Combo Spa'],
    },
  ],
  'VIP-02': [
    {
      code: 'MVN-2026-8420',
      cats: 2,
      status: 'Đã hoàn tất',
      ownerName: 'Trần Thị Mai',
      ownerPhone: '0912345678',
      ownerTier: 'Bạch_Kim',
      catNames: 'Bánh Bao, Đậu Phộng',
      checkIn: '2026-09-16',
      checkOut: '2026-09-20',
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
      status: 'Đã hoàn tất',
      ownerName: 'Lê Hoàng Long',
      ownerPhone: '0988776655',
      ownerTier: 'Kim_Cương',
      catNames: 'Sữa, Cà Phê',
      checkIn: '2026-09-17',
      checkOut: '2026-09-21',
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

/**
 * Helper: Tính số lượng chỗ (số mèo) đang bị chiếm dụng cao nhất trong một khoảng ngày hoặc tại một ngày cụ thể
 * @param {string} roomId 
 * @param {object} allBookingsByRoom - Danh sách bookings theo phòng
 * @param {string|null} checkIn - Ngày bắt đầu YYYY-MM-DD
 * @param {string|null} checkOut - Ngày kết thúc YYYY-MM-DD
 * @param {Array<string>} excludeCodes - Các mã đơn muốn loại trừ (ví dụ khi đang sửa đơn hoặc cập nhật)
 * @returns {number} Số chỗ cao nhất đã được đặt (peak occupied cats)
 */
export function getPeakOccupancyForRoom(roomId, allBookingsByRoom, checkIn, checkOut, excludeCodes = []) {
  const list = (allBookingsByRoom[roomId] || []).filter((b) => {
    if (!b || b.code?.includes('BK')) return false;
    if (excludeCodes.length > 0 && (excludeCodes.includes(b.code) || excludeCodes.includes(b.id))) {
      return false;
    }
    // Bỏ qua các đơn đã kết thúc / đã hủy
    if (
      b.status === 'cancelled' ||
      b.status === 'Đã hủy' ||
      b.status === 'check-out' ||
      b.status === 'Đã hoàn tất' ||
      b.status === 'hoàn tất'
    ) {
      return false;
    }
    return true;
  });

  if (list.length === 0) return 0;

  // Trường hợp 1: Có cả ngày checkIn và checkOut
  if (checkIn && checkOut) {
    const startDate = new Date(`${checkIn}T00:00:00`);
    const endDate = new Date(`${checkOut}T00:00:00`);
    const endLimit = startDate.getTime() >= endDate.getTime() ? startDate : endDate;

    let maxOccupied = 0;
    const curr = new Date(startDate);
    const isSingleDay = startDate.getTime() === endLimit.getTime();

    while (isSingleDay ? curr.getTime() <= endLimit.getTime() : curr.getTime() < endLimit.getTime()) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      let occupiedOnDate = 0;
      for (const b of list) {
        if (!b.checkIn || !b.checkOut) continue;
        const coversDate =
          b.checkIn <= dateStr &&
          (b.checkOut > dateStr || (b.checkIn === b.checkOut && b.checkOut === dateStr));

        if (coversDate) {
          occupiedOnDate += Number(b.cats) || 1;
        }
      }

      if (occupiedOnDate > maxOccupied) {
        maxOccupied = occupiedOnDate;
      }

      if (isSingleDay) break;
      curr.setDate(curr.getDate() + 1);
    }

    return maxOccupied;
  }

  // Trường hợp 2: Không truyền ngày (mặc định lấy theo ngày hiện tại)
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  let todayOccupied = 0;
  for (const b of list) {
    if (!b.checkIn || !b.checkOut) {
      todayOccupied += Number(b.cats) || 1;
      continue;
    }
    if (b.checkIn <= todayStr && (b.checkOut > todayStr || b.checkOut === todayStr)) {
      todayOccupied += Number(b.cats) || 1;
    }
  }

  return todayOccupied;
}

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
        const list = (parsed[roomId] || []).filter((b) => {
          if (!b || b.code?.includes('BK')) return false;
          // Bỏ dữ liệu mẫu cũ bị kẹt thời gian lưu trú
          if (b.code === 'MVN-2026-8891' || b.code === 'MVN-2026-8420' || b.code === 'MVN-2026-7734') {
            return false;
          }
          return true;
        });
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

    // 2. Lắng nghe thay đổi Realtime từ Supabase (hỗ trợ cả Broadcast WebSockets và Postgres Changes)
    const realtimeChannel = supabase
      .channel('mvn_room_state_rt')
      .on(
        'broadcast',
        { event: 'BOOKING_ADDED' },
        ({ payload }) => {
          if (payload?.roomId && payload?.booking) {
            setBookings((prev) => {
              const current = prev[payload.roomId] || [];
              if (current.some((b) => b.code === payload.booking.code || b.id === payload.booking.id)) {
                return prev;
              }
              const updated = {
                ...prev,
                [payload.roomId]: [...current, payload.booking],
              };
              try {
                localStorage.setItem('mvn_room_bookings', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        }
      )
      .on(
        'broadcast',
        { event: 'BOOKING_UPDATED' },
        ({ payload }) => {
          if (payload?.allBookings) {
            setBookings(payload.allBookings);
            try {
              localStorage.setItem('mvn_room_bookings', JSON.stringify(payload.allBookings));
            } catch (e) {}
          }
        }
      )
      .on(
        'broadcast',
        { event: 'BOOKING_REMOVED' },
        ({ payload }) => {
          if (payload?.roomId && payload?.code) {
            setBookings((prev) => {
              const current = prev[payload.roomId] || [];
              const updated = {
                ...prev,
                [payload.roomId]: current.filter((b) => b.code !== payload.code && b.id !== payload.code),
              };
              try {
                localStorage.setItem('mvn_room_bookings', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        }
      )
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

    // 1. Kiểm tra nếu cùng 1 khách hàng gửi lại / cập nhật đơn
    const duplicateByCustomer = current.find((existing) => {
      if ((booking.code && existing.code === booking.code) || (booking.id && existing.id === booking.id)) {
        return true;
      }
      const sameCustomer =
        (booking.customerId && existing.customerId && booking.customerId === existing.customerId) ||
        (booking.customerPhone && existing.customerPhone && booking.customerPhone === existing.customerPhone);
      return (
        sameCustomer &&
        existing.checkIn === booking.checkIn &&
        existing.checkOut === booking.checkOut
      );
    });

    if (duplicateByCustomer) {
      const updated = {
        ...bookings,
        [roomId]: current.map((item) =>
          item.code === duplicateByCustomer.code || item.id === duplicateByCustomer.id
            ? { ...item, ...booking }
            : item
        ),
      };
      setBookings(updated);
      try { localStorage.setItem('mvn_room_bookings', JSON.stringify(updated)); } catch (e) {}
      if (syncChannel) {
        syncChannel.postMessage({ type: 'BOOKING_UPDATED', roomId, code: duplicateByCustomer.code, updates: booking, allBookings: updated });
      }
      try {
        supabase.channel('mvn_room_state_rt').send({
          type: 'broadcast',
          event: 'BOOKING_UPDATED',
          payload: { roomId, code: duplicateByCustomer.code, updates: booking, allBookings: updated }
        });
      } catch (e) {}
      return { success: true, isDuplicate: true, booking };
    }

    // 2. Kiểm tra số chỗ còn trống theo sức chứa phòng trong khoảng ngày lưu trú
    const room = ROOM_CONFIG.find((r) => r.id === roomId);
    const capacity = room?.capacity || 2;
    const newCats = Number(booking.cats) || 1;

    const currentOccupied = getPeakOccupancyForRoom(
      roomId,
      bookings,
      booking.checkIn,
      booking.checkOut,
      [booking.code, booking.id].filter(Boolean)
    );

    const availableSlots = Math.max(0, capacity - currentOccupied);

    if (availableSlots < newCats) {
      const conflictItem = current.find(
        (b) =>
          b.checkIn &&
          b.checkOut &&
          booking.checkIn &&
          booking.checkOut &&
          isDateRangeOverlap(b.checkIn, b.checkOut, booking.checkIn, booking.checkOut)
      );

      return {
        success: false,
        conflict: true,
        reason: 'ROOM_CAPACITY_FULL',
        message:
          availableSlots === 0
            ? `Phòng ${roomId} đã kín chỗ (${capacity}/${capacity} chỗ) từ ngày ${booking.checkIn} đến ngày ${booking.checkOut}. Vui lòng bấm "Chọn phòng khác"!`
            : `Phòng ${roomId} chỉ còn ${availableSlots} chỗ trống trong thời gian này (bạn đang đặt ${newCats} bé). Vui lòng bấm "Chọn phòng khác"!`,
        availableSlots,
        capacity,
        conflictedRoomId: roomId,
        conflictBooking: conflictItem,
      };
    }

    // 3. Nếu còn đủ chỗ, thêm booking vào phòng
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

    // Phát sóng đa tab qua BroadcastChannel
    if (syncChannel) {
      syncChannel.postMessage({
        type: 'BOOKING_ADDED',
        roomId,
        booking,
        allBookings: updated,
      });
    }

    // Phát sóng đa trình duyệt / ẩn danh qua Supabase Realtime Broadcast
    try {
      supabase.channel('mvn_room_state_rt').send({
        type: 'broadcast',
        event: 'BOOKING_ADDED',
        payload: {
          roomId,
          booking,
          allBookings: updated,
        }
      });
    } catch (e) {}

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
      try {
        supabase.channel('mvn_room_state_rt').send({
          type: 'broadcast',
          event: 'BOOKING_REMOVED',
          payload: { roomId, code, allBookings: updated }
        });
      } catch (e) {}
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
      try {
        supabase.channel('mvn_room_state_rt').send({
          type: 'broadcast',
          event: 'BOOKING_REMOVED',
          payload: { roomId, code, allBookings: updated }
        });
      } catch (e) {}
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

        // Bỏ qua phòng không đủ sức chứa tổng cho số mèo
        if (catCount > room.capacity) return;

        const occupied = getPeakOccupancyForRoom(room.id, bookings, checkIn, checkOut);
        const remaining = Math.max(0, room.capacity - occupied);
        const isFull = remaining === 0;
        const cannotFit = remaining < catCount;

        const bks = bookings[room.id] || [];
        const conflictItem = isFull || cannotFit
          ? bks.find(
              (b) =>
                b.checkIn &&
                b.checkOut &&
                checkIn &&
                checkOut &&
                isDateRangeOverlap(b.checkIn, b.checkOut, checkIn, checkOut) &&
                b.status !== 'cancelled' &&
                b.status !== 'Đã hủy' &&
                b.status !== 'check-out' &&
                b.status !== 'Đã hoàn tất' &&
                b.status !== 'hoàn tất'
            )
          : null;

        const status = isFull ? 'full' : remaining < room.capacity ? 'partial' : 'available';

        if (!grouped[room.type]) grouped[room.type] = [];
        grouped[room.type].push({
          id: room.id,
          type: room.type,
          capacity: room.capacity,
          occupied,
          remaining,
          isBooked: cannotFit, // không thể đặt nếu không đủ số chỗ cho số mèo
          isFull,
          conflictingBooking: conflictItem
            ? {
                code: conflictItem.code,
                checkIn: conflictItem.checkIn,
                checkOut: conflictItem.checkOut,
              }
            : null,
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
