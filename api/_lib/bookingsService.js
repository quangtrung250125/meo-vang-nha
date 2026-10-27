import fs from 'fs';
import path from 'path';
import { getRequestUser } from './auth.js';
import { getDepositPolicy, PAYMENT_STATUS } from '../../src/utils/bookingDeposit.js';
import { listStoredBookings, saveStoredBooking, updateStoredBooking } from './bookingsDb.js';

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

const DATA_DIR = process.env.MVN_DATA_DIR || path.resolve(process.cwd(), 'api/_lib');
const STORE_PATH = path.join(DATA_DIR, 'bookings_store.json');
const SYNC_STORE_PATH = path.join(DATA_DIR, 'sync_store.json');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD
export function getTodayStr(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const isValidDateStr = (value) => {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/**
 * Kiểm tra dữ liệu đơn đặt phòng mới. Trả về chuỗi lỗi, hoặc null nếu hợp lệ.
 */
export function validateNewBooking(booking, room, todayStr = getTodayStr()) {
  if (!isValidDateStr(booking.checkIn) || !isValidDateStr(booking.checkOut)) {
    return 'Ngày gửi hoặc ngày đón không hợp lệ.';
  }
  if (booking.checkOut <= booking.checkIn) {
    return 'Ngày đón bé phải sau ngày gửi bé.';
  }
  if (booking.checkIn < todayStr) {
    return 'Không thể đặt phòng cho ngày đã qua.';
  }
  const cats = Number(booking.cats);
  if (!Number.isInteger(cats) || cats < 1) {
    return 'Số lượng mèo phải là số nguyên từ 1 trở lên.';
  }
  if (cats > room.capacity) {
    return `Phòng ${room.id} chỉ chứa tối đa ${room.capacity} bé.`;
  }
  return null;
}

const isCodeTaken = (code) =>
  Object.values(globalBookings).some((list) =>
    (list || []).some((b) => b.code === code || b.id === code)
  );

function generateUniqueCode() {
  let code;
  do {
    code = `MVN-${Math.floor(10000 + Math.random() * 90000)}`;
  } while (isCodeTaken(code));
  return code;
}

// Các trường khách không phải admin được xem (đủ để tính phòng trống, không lộ thông tin cá nhân).
// paymentStatus để trang đặt phòng của khách tự hiện mã ngay khi admin xác nhận đã nhận cọc.
const PUBLIC_BOOKING_FIELDS = ['id', 'code', 'roomId', 'checkIn', 'checkOut', 'cats', 'status', 'customerId', 'paymentStatus', 'depositAmount'];

export function toPublicBookings(bookingsByRoom, viewerId = null) {
  const result = {};
  Object.entries(bookingsByRoom).forEach(([roomId, list]) => {
    result[roomId] = (list || []).map((b) => {
      if (viewerId && b.customerId === viewerId) return b;
      const pub = {};
      PUBLIC_BOOKING_FIELDS.forEach((key) => {
        if (b[key] !== undefined && key !== 'customerId') pub[key] = b[key];
      });
      return pub;
    });
  });
  return result;
}

// Khởi tạo globalBookings sạch từ cấu hình phòng
let globalBookings = {};
ROOM_CONFIG.forEach((r) => {
  globalBookings[r.id] = [];
});

// Hàm nạp tất cả booking đã lưu từ bookings_store.json và sync_store.json
function loadPersistedBookings() {
  const result = {};
  ROOM_CONFIG.forEach((r) => {
    result[r.id] = [];
  });

  // 1. Nạp từ bookings_store.json
  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        ROOM_CONFIG.forEach((r) => {
          if (Array.isArray(parsed[r.id])) {
            parsed[r.id].forEach((b) => {
              if (b && (b.code || b.id)) {
                const isFinished =
                  b.status === 'check-out' ||
                  b.status === 'Đã hoàn tất' ||
                  b.status === 'hoàn tất' ||
                  b.status === 'cancelled' ||
                  b.status === 'Đã hủy';
                if (!isFinished) {
                  result[r.id].push(b);
                }
              }
            });
          }
        });
      }
    } catch (e) {
      console.warn('[BookingsService] Không thể đọc bookings_store.json:', e.message);
    }
  }

  // 2. Hợp nhất từ sync_store.json (nguồn đồng bộ toàn hệ thống)
  if (fs.existsSync(SYNC_STORE_PATH)) {
    try {
      const raw = fs.readFileSync(SYNC_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.bookings)) {
        parsed.bookings.forEach((b) => {
          const roomId = b.roomId || b.selectedRoom?.id;
          const code = b.code || b.id;
          if (roomId && result[roomId] && code && !code.includes('BK')) {
            const isFinished =
              b.status === 'check-out' ||
              b.status === 'Đã hoàn tất' ||
              b.status === 'hoàn tất' ||
              b.status === 'cancelled' ||
              b.status === 'Đã hủy';
            if (!isFinished) {
              const exists = result[roomId].some((item) => item.code === code || item.id === code);
              if (!exists) {
                result[roomId].push({
                  ...b,
                  code,
                  id: b.id || code,
                  roomId,
                });
              }
            }
          }
        });
      }
    } catch (e) {
      console.warn('[BookingsService] Không thể đọc sync_store.json:', e.message);
    }
  }

  return result;
}

globalBookings = loadPersistedBookings();

const FINISHED_STATUSES = ['check-out', 'Đã hoàn tất', 'hoàn tất', 'cancelled', 'Đã hủy'];

// Nạp lại đơn từ Supabase (tối đa 3 giây một lần) để mọi bản server đều thấy đủ đơn, kể cả sau khi khởi động lại
const DB_SYNC_TTL_MS = 3000;
let lastDbSync = 0;

async function syncFromDb(force = false) {
  if (!force && Date.now() - lastDbSync < DB_SYNC_TTL_MS) return;
  const stored = await listStoredBookings();
  lastDbSync = Date.now();
  if (!stored) return;

  stored.forEach((b) => {
    const roomId = b.roomId || b.selectedRoom?.id;
    const code = b.code || b.id;
    if (!roomId || !globalBookings[roomId] || !code || code.includes('BK')) return;
    const list = globalBookings[roomId];
    const idx = list.findIndex((item) => item.code === code || item.id === code);
    if (FINISHED_STATUSES.includes(b.status)) {
      if (idx >= 0) list.splice(idx, 1);
      return;
    }
    const merged = { ...(idx >= 0 ? list[idx] : {}), ...b, code, id: b.id || code, roomId };
    // Không để một bản ghi cũ "chờ cọc" ghi đè đơn đã được admin xác nhận nhận cọc
    if (idx >= 0 && list[idx].paymentStatus === PAYMENT_STATUS.DEPOSIT_PAID) {
      merged.paymentStatus = PAYMENT_STATUS.DEPOSIT_PAID;
    }
    if (idx >= 0) list[idx] = merged;
    else list.push(merged);
  });
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
        // Đọc đơn mới nhất từ database trước khi kiểm tra phòng trống
        await syncFromDb(true);
        const room = ROOM_CONFIG.find((r) => r.id === roomId);
        if (!room) {
          return resolve({ success: false, message: `Không tìm thấy phòng ${roomId}` });
        }

        const validationError = validateNewBooking(booking, room);
        if (validationError) {
          return resolve({ success: false, invalid: true, message: validationError });
        }

        const capacity = room.capacity;
        const newCats = Number(booking.cats);
        const currentList = globalBookings[roomId] || [];

        // 1. Không bao giờ ghi đè đơn đã có: nếu mã bị trùng thì cấp mã mới
        const requestedCode = booking.code || booking.id;
        if (!requestedCode || isCodeTaken(requestedCode) || (booking.id && booking.code && booking.id !== booking.code)) {
          const freshCode = generateUniqueCode();
          booking = { ...booking, id: freshCode, code: freshCode };
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
          cats: newCats,
          roomId,
          createdAt: booking.createdAt || new Date().toISOString(),
        };
        updatedBooking.dbId = await saveStoredBooking(updatedBooking);

        globalBookings[roomId] = [...(globalBookings[roomId] || []), updatedBooking];
        persistBookings();
        syncToSyncStore(updatedBooking);

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

function syncToSyncStore(booking) {
  try {
    if (!fs.existsSync(SYNC_STORE_PATH)) return;
    const raw = fs.readFileSync(SYNC_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.bookings)) return;

    const idx = parsed.bookings.findIndex(
      (b) => (b.id && b.id === booking.id) || (b.code && b.code === booking.code)
    );
    if (idx >= 0) {
      parsed.bookings[idx] = { ...parsed.bookings[idx], ...booking };
    } else {
      parsed.bookings.unshift(booking);
    }
    parsed.updatedAt = new Date().toISOString();
    fs.writeFileSync(SYNC_STORE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[BookingsService] Lỗi đồng bộ sang sync_store.json:', e.message);
  }
}

/**
 * Cập nhật thông tin hoặc trạng thái của một booking (Check-in, Check-out, Hủy)
 */
export async function updateBookingAtomic({ roomId, code, updates }) {
  return new Promise((resolve) => {
    bookingLock = bookingLock.then(async () => {
      try {
        await syncFromDb(true);
        let found = false;
        const targetRooms = roomId ? [roomId] : Object.keys(globalBookings);
        const isFinished =
          updates?.status === 'check-out' ||
          updates?.status === 'Đã hoàn tất' ||
          updates?.status === 'hoàn tất' ||
          updates?.status === 'cancelled' ||
          updates?.status === 'Đã hủy';

        targetRooms.forEach((rId) => {
          const list = globalBookings[rId] || [];
          const idx = list.findIndex((b) => b.code === code || b.id === code);
          if (idx >= 0) {
            found = true;
            if (isFinished) {
              list.splice(idx, 1);
            } else {
              list[idx] = { ...list[idx], ...updates };
            }
            globalBookings[rId] = list;
          }
        });

        // Cập nhật cả trong sync_store.json
        try {
          if (fs.existsSync(SYNC_STORE_PATH)) {
            const raw = fs.readFileSync(SYNC_STORE_PATH, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.bookings)) {
              let syncChanged = false;
              parsed.bookings = parsed.bookings.map((b) => {
                if (b.code === code || b.id === code) {
                  syncChanged = true;
                  return { ...b, ...updates };
                }
                return b;
              });
              if (syncChanged) {
                parsed.updatedAt = new Date().toISOString();
                fs.writeFileSync(SYNC_STORE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
              }
            }
          }
        } catch (e) {}

        persistBookings();
        const storedUpdated = await updateStoredBooking(code, updates);
        return resolve({ success: true, allBookings: globalBookings, found: found || storedUpdated });
      } catch (err) {
        return resolve({ success: false, error: err.message });
      }
    });
  });
}

/**
 * Xóa hoặc hủy booking khỏi hệ thống
 */
export async function removeBookingAtomic({ roomId, code }) {
  return updateBookingAtomic({ roomId, code, updates: { status: 'cancelled' } });
}

export async function handleGetBookings(req, res) {
  const user = await getRequestUser(req);
  await syncFromDb();
  const all = getAllBookings();
  const bookings = user?.isAdmin ? all : toPublicBookings(all, user?.id || null);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.end(JSON.stringify({ success: true, bookings }));
}

// Chỉ trả danh sách đầy đủ cho admin, khách chỉ thấy bản rút gọn
async function scopeResult(req, result) {
  if (!result?.allBookings) return result;
  const user = await getRequestUser(req);
  if (user?.isAdmin) return result;
  return { ...result, allBookings: toPublicBookings(result.allBookings, user?.id || null), conflictBooking: undefined };
}

async function requireAdmin(req, res) {
  const user = await getRequestUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập tài khoản quản trị.' });
    return null;
  }
  if (!user.isAdmin) {
    res.status(403).json({ success: false, message: 'Chỉ quản trị viên mới được thực hiện thao tác này.' });
    return null;
  }
  return user;
}

export async function handleAddBooking(req, res) {
  const { roomId, booking } = req.body || {};
  if (!roomId || !booking || typeof booking !== 'object') {
    return res.status(400).json({ success: false, message: 'Thiếu roomId hoặc booking payload' });
  }

  // Gắn đơn với tài khoản đang đăng nhập (nếu có) thay vì tin customerId do trình duyệt gửi lên
  const user = await getRequestUser(req);
  let payload = user && !user.isAdmin ? { ...booking, customerId: user.id } : booking;

  // Tiền cọc do server tính theo ngày gửi bé, khách không tự đặt trạng thái "đã cọc" được
  if (!user?.isAdmin || !payload.paymentStatus) {
    const deposit = getDepositPolicy({ checkIn: payload.checkIn, total: payload.totalPrice, todayStr: getTodayStr() });
    payload = {
      ...payload,
      depositRequired: deposit.required,
      depositAmount: deposit.amount,
      paymentStatus: deposit.paymentStatus,
    };
  }

  const result = await scopeResult(req, await addBookingAtomic({ roomId, booking: payload }));
  if (result.invalid) {
    return res.status(400).json(result);
  }
  if (result.conflict) {
    return res.status(409).json(result);
  }
  return res.status(200).json(result);
}

// Khách được tự hủy đơn của chính mình khi chưa nhận phòng (chưa check-in và chưa qua ngày nhận phòng)
export function canCustomerCancel(booking, userId, todayStr = getTodayStr()) {
  if (!booking || !userId || booking.customerId !== userId) return false;
  if (FINISHED_STATUSES.includes(booking.status)) return false;
  if (['đang ở', 'Đang lưu trú'].includes(booking.status)) return false;
  return Boolean(booking.checkIn) && booking.checkIn >= todayStr;
}

function findBooking(code) {
  for (const list of Object.values(globalBookings)) {
    const found = (list || []).find((b) => b.code === code || b.id === code);
    if (found) return found;
  }
  return null;
}

async function handleCustomerCancel(req, res, user) {
  const { roomId, code } = req.body || {};
  if (!code) {
    return res.status(400).json({ success: false, message: 'Thiếu mã booking' });
  }
  await syncFromDb(true);
  if (!canCustomerCancel(findBooking(code), user.id)) {
    return res.status(403).json({ success: false, message: 'Đơn này không thể tự hủy. Vui lòng liên hệ Mèo Vắng Nhà để được hỗ trợ.' });
  }
  const result = await updateBookingAtomic({ roomId, code, updates: { status: 'cancelled', cancelledBy: 'customer', cancelledAt: new Date().toISOString() } });
  return res.status(200).json(await scopeResult(req, result));
}

export async function handleUpdateBooking(req, res) {
  const user = await getRequestUser(req);
  const updates = req.body?.updates;
  const isCancelOnly = updates && Object.keys(updates).length === 1 && updates.status === 'cancelled';
  if (user && !user.isAdmin && isCancelOnly) {
    return handleCustomerCancel(req, res, user);
  }
  if (!(await requireAdmin(req, res))) return;
  const { roomId, code } = req.body || {};
  const targetCode = code || req.body?.code;
  if (!targetCode) {
    return res.status(400).json({ success: false, message: 'Thiếu mã booking' });
  }
  const result = await updateBookingAtomic({ roomId, code: targetCode, updates: updates || req.body });
  return res.status(200).json(result);
}

export async function handleRemoveBooking(req, res) {
  if (!(await requireAdmin(req, res))) return;
  const { roomId, code } = req.body || req.query || {};
  const targetCode = code || req.query?.code;
  if (!targetCode) {
    return res.status(400).json({ success: false, message: 'Thiếu mã booking' });
  }
  const result = await removeBookingAtomic({ roomId, code: targetCode });
  return res.status(200).json(result);
}
