import { randomUUID } from 'crypto';
import { supabaseAdmin, createUserClient } from './db.js';
import { updateBookingRows } from '../../src/utils/bookingRows.js';

// Lưu đơn đặt phòng vào bảng `bookings` trên Supabase (cột: id, customer_id, code, data, created_at).
// Bộ nhớ của server Vercel bị xóa mỗi lần cập nhật web hoặc khởi động lại, và mỗi bản server có bộ nhớ riêng,
// nên trang Tình trạng phòng phải đọc đơn từ database thì admin mới luôn thấy đủ đơn.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DB_TIMEOUT_MS = 4000;

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase không phản hồi')), DB_TIMEOUT_MS)),
  ]);

const BOOKING_COLUMNS = 'id, code, customer_id, created_at, data';

// Một dòng bảng bookings -> đơn đặt phòng dùng trong server
const fromRow = (row) => ({
  ...(row.data || {}),
  id: row.data?.id || row.code,
  code: row.code || row.data?.code,
  dbId: row.id,
  customerId: row.data?.customerId || row.customer_id || null,
  createdAt: row.data?.createdAt || row.created_at,
});

// Cập nhật mọi dòng cùng mã đơn, để không còn dòng cũ (vd. vẫn "chờ cọc") làm trang khách hiện sai
const updateRowsByCode = (client, code, updates) => withTimeout(updateBookingRows(client, code, updates));

const supabaseStore = {
  async list() {
    const { data, error } = await withTimeout(
      supabaseAdmin.from('bookings').select(BOOKING_COLUMNS)
    );
    if (error) throw error;
    return (data || []).map(fromRow);
  },

  // Đọc một đơn bằng quyền của người gửi request (RLS chỉ trả về đơn họ được xem)
  async findForUser(code, accessToken) {
    const { data, error } = await withTimeout(
      createUserClient(accessToken).from('bookings').select(BOOKING_COLUMNS).eq('code', code).limit(1)
    );
    if (error) throw error;
    return data && data.length > 0 ? fromRow(data[0]) : null;
  },

  async updateForUser(code, updates, accessToken) {
    return updateRowsByCode(createUserClient(accessToken), code, updates);
  },

  async save(booking) {
    const code = booking.code || booking.id;
    const { data: existing, error } = await withTimeout(
      supabaseAdmin.from('bookings').select('id, data').eq('code', code).limit(1)
    );
    if (error) throw error;
    if (existing && existing.length > 0) {
      const row = existing[0];
      const { error: updateError } = await withTimeout(
        supabaseAdmin.from('bookings').update({ data: { ...(row.data || {}), ...booking, dbId: row.id } }).eq('id', row.id)
      );
      if (updateError) throw updateError;
      return row.id;
    }
    const id = UUID_RE.test(booking.dbId || '') ? booking.dbId : randomUUID();
    const { error: insertError } = await withTimeout(
      supabaseAdmin.from('bookings').insert({
        id,
        customer_id: UUID_RE.test(booking.customerId || '') ? booking.customerId : null,
        code,
        data: { ...booking, dbId: id },
      })
    );
    if (insertError) throw insertError;
    return id;
  },

  async update(code, updates) {
    return updateRowsByCode(supabaseAdmin, code, updates);
  },
};

// MVN_BOOKINGS_DB=off: chạy không cần Supabase (test tự động, máy không có mạng)
let store = process.env.MVN_BOOKINGS_DB === 'off' ? null : supabaseStore;

// Cho phép test thay bằng kho dữ liệu giả
export function setBookingsStore(nextStore) {
  store = nextStore;
}

export async function listStoredBookings() {
  if (!store) return null;
  try {
    return await store.list();
  } catch (e) {
    console.warn('[BookingsDb] Không đọc được đơn từ Supabase:', e.message);
    return null;
  }
}

export async function saveStoredBooking(booking) {
  if (!store) return booking.dbId || null;
  try {
    return await store.save(booking);
  } catch (e) {
    console.warn('[BookingsDb] Không lưu được đơn lên Supabase:', e.message);
    return booking.dbId || null;
  }
}

/**
 * Đọc một đơn từ Supabase bằng token của người gửi request.
 * Dùng khi bộ nhớ server không có đơn (server mới khởi động, hoặc không có service role key để đọc hết đơn).
 */
export async function findStoredBookingForUser(code, accessToken) {
  if (!store || !accessToken || !store.findForUser) return null;
  try {
    return await store.findForUser(code, accessToken);
  } catch (e) {
    console.warn('[BookingsDb] Không đọc được đơn bằng quyền người dùng:', e.message);
    return null;
  }
}

export async function updateStoredBooking(code, updates, accessToken = null) {
  if (!store) return false;
  try {
    const updated = await store.update(code, updates);
    if (updated || !accessToken || !store.updateForUser) return updated;
    // Không cập nhật được bằng quyền server (thiếu service role key) -> dùng quyền của người gửi request
    return await store.updateForUser(code, updates, accessToken);
  } catch (e) {
    console.warn('[BookingsDb] Không cập nhật được đơn trên Supabase:', e.message);
    return false;
  }
}
