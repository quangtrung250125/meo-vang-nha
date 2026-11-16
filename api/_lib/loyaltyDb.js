import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from './db.js';

// Lưu dữ liệu Khuyến mãi & Điểm thưởng: cài đặt của Admin, tài khoản điểm của khách, nhật ký cộng / trừ điểm,
// lượt dùng mã giảm giá trên từng đơn và lượt giới thiệu bạn bè.
// Ưu tiên bảng Supabase `loyalty_store` (supabase/migrations/20261116_create_loyalty.sql). Chưa tạo bảng
// (hoặc chạy ở máy không có mạng) thì giữ trong bộ nhớ / file JSON để vẫn chạy thử được.
//
// Mỗi dòng: id (khóa duy nhất), kind, user_id, data (JSON)
//   kind = 'config'     id = 'config'               cài đặt 8 tab của trang Admin
//   kind = 'account'    id = 'account:<userId>'     mã giới thiệu, người đã giới thiệu mình
//   kind = 'refcode'    id = 'refcode:<MÃ>'         tra mã giới thiệu -> tài khoản
//   kind = 'ledger'     id = 'earn:<mã đơn>', 'redeem:', 'refund:', 'refbonus:<userId B>', 'adjust:'    một lần cộng / trừ điểm (id cố định nên không bao giờ cộng trùng)
//   kind = 'redemption' id = 'redemption:<mã đơn>' mã giảm giá + điểm khách dùng cho đơn
//   kind = 'referral'   id = 'referral:<userId B>'  khách A giới thiệu khách B

const DATA_DIR = process.env.MVN_DATA_DIR || path.resolve(process.cwd(), 'api/_lib');
const FILE_PATH = path.join(DATA_DIR, 'loyalty_store.json');
const DB_TIMEOUT_MS = 5000;
const TABLE = 'loyalty_store';

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase không phản hồi')), DB_TIMEOUT_MS)),
  ]);

// ---------- Bộ nhớ dự phòng ----------
let memory = {};
const loadFile = () => {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
      if (parsed && typeof parsed === 'object') memory = parsed.rows || {};
    }
  } catch (e) {
    console.warn('[Loyalty] Không đọc được loyalty_store.json:', e.message);
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

// MVN_LOYALTY_DB=off hoặc MVN_BOOKINGS_DB=off: không dùng Supabase (test, máy không có mạng)
let dbReady = process.env.MVN_LOYALTY_DB === 'off' || process.env.MVN_BOOKINGS_DB === 'off' ? false : null;
export const isUsingDatabase = () => dbReady !== false;

const tryDb = async (fn) => {
  if (dbReady === false) return { ok: false };
  try {
    const result = await withTimeout(fn());
    if (result?.error) {
      const msg = result.error.message || '';
      if (/relation|does not exist|schema cache|not find the table|row-level security|permission denied/i.test(msg)) dbReady = false;
      console.warn('[Loyalty] Supabase:', msg);
      return { ok: false };
    }
    dbReady = true;
    return { ok: true, data: result?.data };
  } catch (e) {
    console.warn('[Loyalty] Không kết nối được Supabase:', e.message);
    return { ok: false };
  }
};

// Dùng trong test
export function resetLoyaltyMemory({ useDatabase = false } = {}) {
  memory = {};
  dbReady = useDatabase ? null : false;
}

const toRow = (id, kind, userId, data) => ({
  id,
  kind,
  user_id: userId ? String(userId) : null,
  data,
  updated_at: new Date().toISOString(),
});

export async function getRow(id) {
  const res = await tryDb(() => supabaseAdmin.from(TABLE).select('id, kind, user_id, data').eq('id', id).limit(1));
  if (res.ok) return res.data?.[0]?.data ?? null;
  return memory[id]?.data ?? null;
}

export async function putRow(id, kind, userId, data) {
  memory[id] = { kind, user_id: userId ? String(userId) : null, data };
  persist();
  await tryDb(() => supabaseAdmin.from(TABLE).upsert(toRow(id, kind, userId, data), { onConflict: 'id' }));
  return data;
}

/**
 * Thêm dòng chỉ khi chưa có (dùng cho nhật ký điểm: id cố định theo mã đơn nên không cộng 2 lần).
 * @returns {Promise<boolean>} true nếu vừa thêm mới
 */
export async function insertRowOnce(id, kind, userId, data) {
  if (dbReady !== false) {
    const res = await tryDb(() => supabaseAdmin.from(TABLE).insert(toRow(id, kind, userId, data)));
    if (res.ok) {
      memory[id] = { kind, user_id: userId ? String(userId) : null, data };
      persist();
      return true;
    }
    if (dbReady !== false) {
      // Lỗi trùng khóa: dòng đã có
      const existing = await getRow(id);
      if (existing) return false;
    }
  }
  if (memory[id]) return false;
  memory[id] = { kind, user_id: userId ? String(userId) : null, data };
  persist();
  return true;
}

export async function deleteRow(id) {
  delete memory[id];
  persist();
  await tryDb(() => supabaseAdmin.from(TABLE).delete().eq('id', id));
}

/**
 * Các dòng theo loại (và theo khách nếu có userId).
 */
export async function listRows(kind, userId = null) {
  const res = await tryDb(() => {
    let q = supabaseAdmin.from(TABLE).select('id, kind, user_id, data').eq('kind', kind);
    if (userId) q = q.eq('user_id', String(userId));
    return q.limit(5000);
  });
  if (res.ok) return (res.data || []).map((r) => ({ id: r.id, userId: r.user_id, ...(r.data || {}) }));
  return Object.entries(memory)
    .filter(([, r]) => r.kind === kind && (!userId || r.user_id === String(userId)))
    .map(([id, r]) => ({ id, userId: r.user_id, ...(r.data || {}) }));
}
