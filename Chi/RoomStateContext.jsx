import React, { createContext, useState, useContext, useCallback } from 'react';

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
// Dữ liệu booking khởi tạo (demo)
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
  const today = new Date();
  const checkInDate = new Date(checkIn + 'T00:00:00');
  const diffDays = Math.floor((checkInDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'đang ở';
  return 'check-in';
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

export const RoomStateProvider = ({ children }) => {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  // Lưu id các booking vừa được thêm mới để highlight
  const [newBookingIds, setNewBookingIds] = useState(new Set());
  // Trạng thái bảo trì phòng (lưu vĩnh viễn tới khi bấm "Hết bảo trì")
  const [maintenanceRooms, setMaintenanceRooms] = useState(getInitialMaintenance);

  /**
   * Bật/Tắt bảo trì cho 1 phòng - lưu trạng thái vào localStorage
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
      return updated;
    });
  }, []);

  /**
   * Thêm booking mới vào phòng → đồng bộ Admin tab Tình trạng phòng
   * @param {string} roomId    - ID phòng, VD: 'VIP-03'
   * @param {object} booking   - { code, cats, status }
   */
  const addNewBooking = useCallback((roomId, booking) => {
    setBookings((prev) => {
      const current = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: [...current, booking],
      };
    });
    // Đánh dấu booking mới để highlight flash trong 4 giây
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
    }, 4000);
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
