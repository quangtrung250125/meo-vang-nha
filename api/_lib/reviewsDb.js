import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from './db.js';

// Đánh giá của khách sau check-out. Ưu tiên bảng Supabase (supabase/migrations/20261117_create_reviews.sql);
// chưa tạo bảng thì giữ tạm trong bộ nhớ / file JSON (chỉ dùng khi chạy ở máy).

const DATA_DIR = process.env.MVN_DATA_DIR || path.resolve(process.cwd(), 'api/_lib');
const FILE_PATH = path.join(DATA_DIR, 'reviews_store.json');
const DB_TIMEOUT_MS = 5000;

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase không phản hồi')), DB_TIMEOUT_MS)),
  ]);

let memory = { reviews: [] };
try {
  if (fs.existsSync(FILE_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
    memory = { reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [] };
  }
} catch (e) {
  console.warn('[Reviews] Không đọc được reviews_store.json:', e.message);
}

const persist = () => {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(memory, null, 2), 'utf-8');
  } catch {
    // Vercel không cho ghi file: chỉ giữ trong bộ nhớ
  }
};

// MVN_BOOKINGS_DB=off: chạy không cần Supabase (test tự động, máy không có mạng)
let dbReady = process.env.MVN_BOOKINGS_DB === 'off' ? false : null;
export const isReviewsDbReady = () => dbReady !== false;

const tryDb = async (fn) => {
  if (dbReady === false) return { ok: false };
  try {
    const result = await withTimeout(fn());
    if (result?.error) {
      const msg = result.error.message || '';
      if (/relation|does not exist|schema cache|not find the table|row-level security|permission denied/i.test(msg)) dbReady = false;
      console.warn('[Reviews] Supabase:', msg);
      return { ok: false, error: msg };
    }
    dbReady = true;
    return { ok: true, data: result?.data };
  } catch (e) {
    console.warn('[Reviews] Không kết nối được Supabase:', e.message);
    return { ok: false };
  }
};

// Dùng trong test
export function resetReviewsMemory({ useDatabase = null } = {}) {
  memory = { reviews: [] };
  dbReady = useDatabase === false ? false : null;
}

const toRow = (r) => ({
  id: r.id,
  booking_code: r.bookingCode,
  customer_id: r.customerId,
  customer_name: r.customerName || null,
  pet_names: r.petNames || null,
  room_name: r.roomName || null,
  rating: r.rating,
  tags: r.tags || [],
  comment: r.comment || null,
  allow_public: Boolean(r.allowPublic),
  is_public: Boolean(r.isPublic),
  admin_reply: r.adminReply || null,
  replied_at: r.repliedAt || null,
  checked_out_at: r.checkedOutAt || null,
  created_at: r.createdAt,
  updated_at: r.updatedAt,
});

const fromRow = (row) => ({
  id: row.id,
  bookingCode: row.booking_code,
  customerId: row.customer_id,
  customerName: row.customer_name || '',
  petNames: row.pet_names || '',
  roomName: row.room_name || '',
  rating: row.rating,
  tags: row.tags || [],
  comment: row.comment || '',
  allowPublic: Boolean(row.allow_public),
  isPublic: Boolean(row.is_public),
  adminReply: row.admin_reply || '',
  repliedAt: row.replied_at || null,
  checkedOutAt: row.checked_out_at || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const byNewest = (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''));

function rememberLocal(review) {
  const idx = memory.reviews.findIndex((r) => r.bookingCode === review.bookingCode);
  if (idx >= 0) memory.reviews[idx] = review;
  else memory.reviews.push(review);
  persist();
}

export async function listReviews() {
  const res = await tryDb(() => supabaseAdmin.from('reviews').select('*').order('created_at', { ascending: false }).limit(1000));
  if (res.ok) return (res.data || []).map(fromRow);
  return [...memory.reviews].sort(byNewest);
}

export async function listReviewsForCustomer(customerId) {
  if (!customerId) return [];
  const res = await tryDb(() => supabaseAdmin.from('reviews').select('*').eq('customer_id', String(customerId)));
  if (res.ok) return (res.data || []).map(fromRow).sort(byNewest);
  return memory.reviews.filter((r) => r.customerId === String(customerId)).sort(byNewest);
}

export async function listPublicReviews(limit = 12) {
  const res = await tryDb(() => supabaseAdmin.from('reviews').select('*')
    .eq('is_public', true).eq('allow_public', true).order('created_at', { ascending: false }).limit(limit));
  if (res.ok) return (res.data || []).map(fromRow);
  return memory.reviews.filter((r) => r.isPublic && r.allowPublic).sort(byNewest).slice(0, limit);
}

export async function getReviewByBooking(bookingCode) {
  const res = await tryDb(() => supabaseAdmin.from('reviews').select('*').eq('booking_code', bookingCode).limit(1));
  if (res.ok) return res.data?.[0] ? fromRow(res.data[0]) : null;
  return memory.reviews.find((r) => r.bookingCode === bookingCode) || null;
}

/**
 * Tạo mới (chưa có id) hoặc ghi đè đánh giá của một đơn.
 */
export async function saveReview(review) {
  const now = new Date().toISOString();
  const next = { ...review, id: review.id || randomUUID(), createdAt: review.createdAt || now, updatedAt: now };
  const res = await tryDb(() => supabaseAdmin.from('reviews').upsert(toRow(next), { onConflict: 'booking_code' }).select('*'));
  if (res.ok) return res.data?.[0] ? fromRow(res.data[0]) : next;
  rememberLocal(next);
  return next;
}
