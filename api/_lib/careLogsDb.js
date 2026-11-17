import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from './db.js';

// Lưu nhật ký chăm sóc (Cho ăn, Vận động, Dọn vệ sinh, ảnh, báo cáo ngày).
// Ưu tiên bảng Supabase `care_logs` (supabase/migrations/20261117_create_care_logs.sql). Chưa tạo bảng
// (hoặc máy không có service role key / không có mạng) thì giữ trong bộ nhớ / file JSON để vẫn chạy thử được.
//
// Dòng nhật ký trả về cho service: { id, bookingCode, petId, customerId, type, data, createdBy, createdAt }

const DATA_DIR = process.env.MVN_DATA_DIR || path.resolve(process.cwd(), 'api/_lib');
const FILE_PATH = path.join(DATA_DIR, 'care_logs_store.json');
const DB_TIMEOUT_MS = 5000;
const TABLE = 'care_logs';
const COLUMNS = 'id, booking_code, pet_id, customer_id, type, data, created_by, created_at';

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase không phản hồi')), DB_TIMEOUT_MS)),
  ]);

// ---------- Bộ nhớ dự phòng ----------
let memory = [];
const loadFile = () => {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
      if (Array.isArray(parsed?.rows)) memory = parsed.rows;
    }
  } catch (e) {
    console.warn('[CareLogs] Không đọc được care_logs_store.json:', e.message);
  }
};
loadFile();

const persist = () => {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify({ rows: memory }, null, 2), 'utf-8');
  } catch {
    // Vercel không cho ghi file: chỉ giữ trong bộ nhớ
  }
};

// MVN_CARELOGS_DB=off hoặc MVN_BOOKINGS_DB=off: không dùng Supabase (test, máy không có mạng)
let dbReady = process.env.MVN_CARELOGS_DB === 'off' || process.env.MVN_BOOKINGS_DB === 'off' ? false : null;
export const isUsingDatabase = () => dbReady !== false;

const tryDb = async (fn) => {
  if (dbReady === false) return { ok: false };
  try {
    const result = await withTimeout(fn());
    if (result?.error) {
      const msg = result.error.message || '';
      if (/relation|does not exist|schema cache|not find the table|row-level security|permission denied/i.test(msg)) dbReady = false;
      console.warn('[CareLogs] Supabase:', msg);
      return { ok: false };
    }
    dbReady = true;
    return { ok: true, data: result?.data };
  } catch (e) {
    console.warn('[CareLogs] Không kết nối được Supabase:', e.message);
    return { ok: false };
  }
};

// Dùng trong test
export function resetCareLogsMemory({ useDatabase = false } = {}) {
  memory = [];
  dbReady = useDatabase ? null : false;
}

const fromRow = (row) => ({
  id: row.id,
  bookingCode: row.booking_code,
  petId: row.pet_id,
  customerId: row.customer_id || null,
  type: row.type,
  data: row.data || {},
  createdBy: row.created_by || null,
  createdAt: new Date(row.created_at).toISOString(),
});

const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at);

/**
 * Danh sách nhật ký, mới nhất trước.
 * @param {{ customerId?: string, bookingCode?: string, sinceIso?: string }} filter
 */
export async function listCareLogs({ customerId = null, bookingCode = null, sinceIso = null } = {}) {
  const res = await tryDb(() => {
    let query = supabaseAdmin.from(TABLE).select(COLUMNS).order('created_at', { ascending: false }).limit(5000);
    if (customerId) query = query.eq('customer_id', String(customerId));
    if (bookingCode) query = query.eq('booking_code', bookingCode);
    if (sinceIso) query = query.gte('created_at', sinceIso);
    return query;
  });
  if (res.ok) return (res.data || []).map(fromRow);

  return memory
    .filter((r) => (!customerId || r.customer_id === String(customerId))
      && (!bookingCode || r.booking_code === bookingCode)
      && (!sinceIso || r.created_at >= sinceIso))
    .sort(byNewest)
    .map(fromRow);
}

/**
 * Ghi các dòng nhật ký. Thời điểm ghi luôn do server đặt.
 * @param {Array<{ bookingCode, petId, customerId, type, data, createdBy }>} entries
 */
export async function insertCareLogs(entries = []) {
  const now = new Date().toISOString();
  const rows = entries.map((e) => ({
    id: randomUUID(),
    booking_code: e.bookingCode,
    pet_id: String(e.petId),
    customer_id: e.customerId ? String(e.customerId) : null,
    type: e.type,
    data: e.data || {},
    created_by: e.createdBy ? String(e.createdBy) : null,
    created_at: now,
  }));
  if (rows.length === 0) return [];

  const res = await tryDb(() => supabaseAdmin.from(TABLE).insert(rows).select(COLUMNS));
  if (res.ok) return (res.data || rows).map(fromRow);

  memory.push(...rows);
  persist();
  return rows.map(fromRow);
}

export async function getCareLog(id) {
  const res = await tryDb(() => supabaseAdmin.from(TABLE).select(COLUMNS).eq('id', id).limit(1));
  if (res.ok) return res.data?.[0] ? fromRow(res.data[0]) : null;
  const row = memory.find((r) => r.id === id);
  return row ? fromRow(row) : null;
}

export async function deleteCareLog(id) {
  const res = await tryDb(() => supabaseAdmin.from(TABLE).delete().eq('id', id));
  if (res.ok) return true;
  const before = memory.length;
  memory = memory.filter((r) => r.id !== id);
  if (memory.length !== before) persist();
  return memory.length !== before;
}
