import { randomUUID } from 'crypto';
import { supabaseAdmin } from './db.js';

// Khoá đặt phòng dùng chung cho mọi máy chủ.
// Trên Vercel, nhiều khách bấm "Gửi yêu cầu đặt lịch" cùng lúc có thể rơi vào nhiều máy chủ khác nhau,
// mỗi máy có bộ nhớ riêng, nên khoá trong bộ nhớ (bookingLock trong bookingsService) không đủ.
// Khoá này là một dòng trong bảng `booking_locks` trên Supabase: ai chèn được dòng trước thì được
// kiểm tra chỗ trống và ghi đơn trước, người sau chờ tới lượt rồi mới kiểm tra lại phòng.

const LOCK_NAME = 'bookings';
const LOCK_TTL_MS = 15000; // máy chủ giữ khoá bị tắt giữa chừng thì khoá tự hết hạn
const WAIT_TIMEOUT_MS = 8000; // chờ quá lâu thì báo khách thử lại, không để request treo
const RETRY_MIN_MS = 60;
const RETRY_MAX_MS = 180;

export class LockBusyError extends Error {
  constructor() {
    super('Hệ thống đang xử lý nhiều yêu cầu đặt phòng cùng lúc. Vui lòng bấm gửi lại sau vài giây.');
    this.code = 'LOCK_BUSY';
  }
}

const isUniqueViolation = (error) => error?.code === '23505' || /duplicate key/i.test(error?.message || '');

// Kho khoá trên Supabase. Trả về 'acquired' | 'busy' | 'unavailable' (chưa tạo bảng / thiếu quyền).
const supabaseLockStore = {
  async tryAcquire(name, holder, expiresAt) {
    const { error } = await supabaseAdmin.from('booking_locks').insert({ name, holder, expires_at: expiresAt });
    if (!error) return 'acquired';
    if (isUniqueViolation(error)) return 'busy';
    throw error;
  },
  async clearExpired(name, nowIso) {
    await supabaseAdmin.from('booking_locks').delete().eq('name', name).lt('expires_at', nowIso);
  },
  async release(name, holder) {
    await supabaseAdmin.from('booking_locks').delete().eq('name', name).eq('holder', holder);
  },
};

let lockStore = process.env.MVN_BOOKINGS_DB === 'off' ? null : supabaseLockStore;
let warnedUnavailable = false;

// Cho phép test thay bằng kho khoá giả
export function setLockStore(next) {
  lockStore = next;
  warnedUnavailable = false;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Chạy `fn` khi đang giữ khoá đặt phòng dùng chung.
 * Không có bảng khoá (chưa chạy migration) thì vẫn chạy `fn` như trước, chỉ ghi cảnh báo.
 */
export async function withSharedBookingLock(fn, { waitTimeoutMs = WAIT_TIMEOUT_MS } = {}) {
  if (!lockStore) return fn();

  const holder = randomUUID();
  const deadline = Date.now() + waitTimeoutMs;
  let acquired = false;

  while (!acquired) {
    let state;
    try {
      state = await lockStore.tryAcquire(LOCK_NAME, holder, new Date(Date.now() + LOCK_TTL_MS).toISOString());
    } catch (e) {
      if (!warnedUnavailable) {
        console.warn('[BookingLock] Chưa dùng được bảng booking_locks, chỉ khoá trong từng máy chủ:', e.message);
        warnedUnavailable = true;
      }
      return fn();
    }
    if (state === 'acquired') {
      acquired = true;
      break;
    }
    if (Date.now() >= deadline) throw new LockBusyError();
    try {
      await lockStore.clearExpired(LOCK_NAME, new Date().toISOString());
    } catch { /* thử lại ở vòng sau */ }
    await sleep(RETRY_MIN_MS + Math.random() * (RETRY_MAX_MS - RETRY_MIN_MS));
  }

  try {
    return await fn();
  } finally {
    try {
      await lockStore.release(LOCK_NAME, holder);
    } catch (e) {
      console.warn('[BookingLock] Không nhả được khoá, khoá sẽ tự hết hạn:', e.message);
    }
  }
}
