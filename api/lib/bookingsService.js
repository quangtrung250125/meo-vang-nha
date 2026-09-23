import fs from 'fs';
import path from 'path';

export const ROOM_CONFIG = [
  ...['VIP-01', 'VIP-02', 'VIP-03', 'VIP-04', 'VIP-05', 'VIP-06'].map((id) => ({
    id,
    type: 'VIP',
    capacity: 2,
  })),
  ...['VVIP-01', 'VVIP-02', 'VVIP-03'].map((id) => ({
    id,
    type: 'VVIP',
    capacity: 4,
  })),
  ...['DELUXE-01', 'DELUXE-02'].map((id) => ({
    id,
    type: 'DELUXE',
    capacity: 6,
  })),
];

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

const STORE_PATH = path.resolve(process.cwd(), 'api/lib/bookings_store.json');

// In-memory cache
let globalBookings = { ...INITIAL_BOOKINGS };

// Load persisted bookings from file if available
try {
  if (fs.existsSync(STORE_PATH)) {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      ROOM_CONFIG.forEach((r) => {
        globalBookings[r.id] = Array.isArray(parsed[r.id]) ? parsed[r.id] : [];
      });
    }
  }
} catch (e) {
  console.warn('[BookingsService] Không thể đọc bookings_store.json, khởi tạo mặc định:', e.message);
}

function persistBookings() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(globalBookings, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[BookingsService] Không thể ghi bookings_store.json:', e.message);
  }
}

export function isDateRangeOverlap(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false;
  const aStart = new Date(`${startA}T00:00:00`).getTime();
  const aEnd = new Date(`${endA}T00:00:00`).getTime();
  const bStart = new Date(`${startB}T00:00:00`).getTime();
  const bEnd = new Date(`${endB}T00:00:00`).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export function getPeakOccupancyForRoom(roomId, allBookingsByRoom, checkIn, checkOut, excludeCodes = []) {
  const list = (allBookingsByRoom[roomId] || []).filter((b) => {
    if (!b || b.code?.includes('BK')) return false;
    if (excludeCodes.length > 0 && (excludeCodes.includes(b.code) || excludeCodes.includes(b.id))) {
      return false;
    }
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

// Mutex để đảm bảo các yêu cầu đặt phòng được xử lý tuần tự (Không bao giờ bị race condition)
let bookingLock = Promise.resolve();

export function getAllBookings() {
  return globalBookings;
}

/**
 * Xử lý đặt phòng Atomic: Đảm bảo khi 2 tài khoản bấm cùng lúc chỉ có 1 tài khoản đặt thành công
 */
export async function addBookingAtomic({ roomId, booking }) {
  // Chờ lượt lock trước hoàn tất
  return new Promise((resolve) => {
    bookingLock = bookingLock.then(async () => {
      try {
        const room = ROOM_CONFIG.find((r) => r.id === roomId);
        if (!room) {
          return resolve({ success: false, message: `Không tìm thấy phòng ${roomId}` });
        }

        const capacity = room.capacity;
        const newCats = Number(booking.cats) || 1;
        const currentList = globalBookings[roomId] || [];

        // 1. Kiểm tra nếu cùng khách hàng cập nhật đơn
        const duplicateIndex = currentList.findIndex((existing) => {
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

        if (duplicateIndex >= 0) {
          currentList[duplicateIndex] = { ...currentList[duplicateIndex], ...booking };
          persistBookings();
          return resolve({
            success: true,
            isDuplicate: true,
            booking: currentList[duplicateIndex],
            allBookings: globalBookings,
          });
        }

        // 2. Tính số chỗ đang bị chiếm dụng cao điểm trong thời gian khách đặt
        const occupied = getPeakOccupancyForRoom(
          roomId,
          globalBookings,
          booking.checkIn,
          booking.checkOut,
          [booking.code, booking.id].filter(Boolean)
        );

        const availableSlots = Math.max(0, capacity - occupied);

        // 3. Nếu số chỗ còn lại không đủ cho số mèo khách muốn gửi -> BÁO TRÙNG / HẾT CHỖ
        if (availableSlots < newCats) {
          const conflictBooking = currentList.find(
            (b) =>
              b.checkIn &&
              b.checkOut &&
              booking.checkIn &&
              booking.checkOut &&
              isDateRangeOverlap(b.checkIn, b.checkOut, booking.checkIn, booking.checkOut)
          );

          return resolve({
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
            conflictBooking,
            allBookings: globalBookings,
          });
        }

        // 4. Còn đủ chỗ -> GHI NHẬN ĐẶT PHÒNG THÀNH CÔNG VÀO BỘ NHỚ TRUNG TÂM
        const updatedBooking = {
          ...booking,
          roomId,
          createdAt: booking.createdAt || new Date().toISOString(),
        };

        globalBookings[roomId] = [...currentList, updatedBooking];
        persistBookings();

        return resolve({
          success: true,
          booking: updatedBooking,
          remainingSlots: availableSlots - newCats,
          allBookings: globalBookings,
        });
      } catch (err) {
        return resolve({ success: false, error: err.message });
      }
    });
  });
}

export function handleGetBookings(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.end(JSON.stringify({ success: true, bookings: getAllBookings() }));
}

export async function handleAddBooking(req, res) {
  const { roomId, booking } = req.body || {};
  if (!roomId || !booking) {
    return res.status(400).json({ success: false, message: 'Thiếu roomId hoặc booking payload' });
  }

  const result = await addBookingAtomic({ roomId, booking });
  if (result.conflict) {
    return res.status(409).json(result);
  }
  return res.status(200).json(result);
}
