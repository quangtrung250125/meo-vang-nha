import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from './db.js';

// Lưu cài đặt Marketing tự động (kịch bản, mẫu tin, giới hạn tần suất), lượt "bỏ dở đặt phòng"
// và nhật ký từng tin đã gửi. Ưu tiên bảng Supabase (supabase/migrations/20261103_create_marketing.sql);
// nếu chưa tạo bảng thì giữ tạm trong bộ nhớ / file JSON (chỉ dùng khi chạy ở máy).

const DATA_DIR = process.env.MVN_DATA_DIR || path.resolve(process.cwd(), 'api/_lib');
const FILE_PATH = path.join(DATA_DIR, 'marketing_store.json');
const DB_TIMEOUT_MS = 5000;
const CONFIG_ID = 'config';
const DRAFT_PREFIX = 'draft:';

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase không phản hồi')), DB_TIMEOUT_MS)),
  ]);

// ---------- Bộ nhớ dự phòng ----------
let memory = { kv: {}, messages: [] };
try {
  if (fs.existsSync(FILE_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
    memory = { kv: parsed.kv || {}, messages: Array.isArray(parsed.messages) ? parsed.messages : [] };
  }
} catch (e) {
  console.warn('[Marketing] Không đọc được marketing_store.json:', e.message);
}

const persist = () => {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(memory, null, 2), 'utf-8');
  } catch {
    // Vercel không cho ghi file: chỉ giữ trong bộ nhớ
  }
};

// Bảng chưa tạo / Supabase lỗi thì ghi nhớ để lần sau không chờ nữa
let dbReady = null;
export const isUsingDatabase = () => dbReady !== false;

const tryDb = async (fn) => {
  if (dbReady === false) return { ok: false };
  try {
    const result = await withTimeout(fn());
    if (result?.error) {
      const msg = result.error.message || '';
      if (/relation|does not exist|schema cache|not find the table|row-level security|permission denied/i.test(msg)) dbReady = false;
      console.warn('[Marketing] Supabase:', msg);
      return { ok: false };
    }
    dbReady = true;
    return { ok: true, data: result?.data };
  } catch (e) {
    console.warn('[Marketing] Không kết nối được Supabase:', e.message);
    return { ok: false };
  }
};

// Dùng trong test
export function resetMarketingMemory({ useDatabase = null } = {}) {
  memory = { kv: {}, messages: [] };
  dbReady = useDatabase === false ? false : null;
}

// ---------- Khóa / giá trị ----------
async function getKv(id) {
  const res = await tryDb(() => supabaseAdmin.from('marketing_settings').select('id, data').eq('id', id).limit(1));
  if (res.ok && res.data?.[0]?.data) return res.data[0].data;
  return memory.kv[id] ?? null;
}

async function setKv(id, data) {
  memory.kv[id] = data;
  persist();
  await tryDb(() => supabaseAdmin.from('marketing_settings').upsert({ id, data, updated_at: new Date().toISOString() }, { onConflict: 'id' }));
  return data;
}

export const getMarketingConfig = () => getKv(CONFIG_ID);
export const saveMarketingConfig = (config) => setKv(CONFIG_ID, { ...config, updatedAt: new Date().toISOString() });

export async function saveDraft(userId, draft) {
  if (!userId) return null;
  return setKv(`${DRAFT_PREFIX}${userId}`, { ...draft, userId: String(userId) });
}

export async function clearDraft(userId) {
  if (!userId) return;
  delete memory.kv[`${DRAFT_PREFIX}${userId}`];
  persist();
  await tryDb(() => supabaseAdmin.from('marketing_settings').delete().eq('id', `${DRAFT_PREFIX}${userId}`));
}

// Họ tên / SĐT khách ghi lại khi khách bật thông báo (dự phòng khi server không đọc được danh sách tài khoản)
const CONTACT_PREFIX = 'contact:';
export async function saveContact(user) {
  if (!user?.id || user.isAdmin) return null;
  const contact = { id: String(user.id), fullName: user.fullName || '', phone: user.phone || '', email: user.email || '', createdAt: user.createdAt || null };
  const old = memory.kv[`${CONTACT_PREFIX}${user.id}`];
  if (old && JSON.stringify(old) === JSON.stringify(contact)) return contact;
  return setKv(`${CONTACT_PREFIX}${user.id}`, contact);
}

export async function listContacts() {
  const out = new Map();
  const res = await tryDb(() => supabaseAdmin.from('marketing_settings').select('id, data').like('id', `${CONTACT_PREFIX}%`));
  if (res.ok) (res.data || []).forEach((row) => row.data?.id && out.set(row.data.id, row.data));
  Object.entries(memory.kv).forEach(([id, data]) => {
    if (id.startsWith(CONTACT_PREFIX) && data?.id && !out.has(data.id)) out.set(data.id, data);
  });
  return [...out.values()];
}

// { [userId hoặc SĐT]: { at, step } }
export async function listDrafts() {
  const out = {};
  const add = (id, data) => {
    if (!data?.at) return;
    const key = id.slice(DRAFT_PREFIX.length);
    out[key] = data;
    if (data.phone) out[String(data.phone).replace(/\D/g, '')] = data;
  };
  const res = await tryDb(() => supabaseAdmin.from('marketing_settings').select('id, data').like('id', `${DRAFT_PREFIX}%`));
  if (res.ok) (res.data || []).forEach((row) => add(row.id, row.data));
  Object.entries(memory.kv).forEach(([id, data]) => {
    if (id.startsWith(DRAFT_PREFIX) && !out[id.slice(DRAFT_PREFIX.length)]) add(id, data);
  });
  return out;
}

// ---------- Nhật ký tin ----------
const toRow = (m) => ({
  id: m.id,
  dedupe_key: m.dedupeKey || null,
  customer_id: m.customerId || null,
  customer_name: m.customerName || null,
  scenario_id: m.scenarioId || null,
  template_id: m.templateId || null,
  source: m.source || 'manual',
  channel: m.channel || 'webpush',
  title: m.title || '',
  body: m.body || '',
  url: m.url || '/',
  status: m.status,
  device_count: m.deviceCount || 0,
  error: m.error || null,
  sent_by: m.sentBy || null,
  created_at: m.createdAt,
  shown_at: m.shownAt || null,
  clicked_at: m.clickedAt || null,
});

const fromRow = (r) => ({
  id: r.id,
  dedupeKey: r.dedupe_key,
  customerId: r.customer_id,
  customerName: r.customer_name,
  scenarioId: r.scenario_id,
  templateId: r.template_id,
  source: r.source,
  channel: r.channel,
  title: r.title,
  body: r.body,
  url: r.url,
  status: r.status,
  deviceCount: r.device_count,
  error: r.error,
  sentBy: r.sent_by,
  createdAt: r.created_at,
  shownAt: r.shown_at,
  clickedAt: r.clicked_at,
});

export const newMessageId = () => randomUUID();

export async function insertMessage(message) {
  const m = { createdAt: new Date().toISOString(), ...message, id: message.id || randomUUID() };
  const res = await tryDb(() => supabaseAdmin.from('marketing_messages').insert(toRow(m)));
  if (!res.ok) {
    memory.messages.unshift(m);
    memory.messages = memory.messages.slice(0, 5000);
    persist();
  }
  return m;
}

export async function listMessages({ days = 90 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const res = await tryDb(() => supabaseAdmin
    .from('marketing_messages')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2000));
  const fromDb = res.ok ? (res.data || []).map(fromRow) : [];
  const ids = new Set(fromDb.map((m) => m.id));
  const fromMemory = memory.messages.filter((m) => !ids.has(m.id) && m.createdAt >= since);
  return [...fromDb, ...fromMemory].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function hasSentDedupeKey(dedupeKey) {
  if (!dedupeKey) return false;
  const res = await tryDb(() => supabaseAdmin.from('marketing_messages').select('id').eq('dedupe_key', dedupeKey).eq('status', 'sent').limit(1));
  if (res.ok && res.data?.length) return true;
  return memory.messages.some((m) => m.dedupeKey === dedupeKey && m.status === 'sent');
}

const TRACK_FIELDS = { shown: 'shown_at', click: 'clicked_at' };

// Ghi lần đầu khách thấy / bấm thông báo
export async function trackMessage(id, event) {
  const column = TRACK_FIELDS[event];
  if (!column || !id) return false;
  const at = new Date().toISOString();
  const local = memory.messages.find((m) => m.id === id);
  if (local) {
    const key = event === 'click' ? 'clickedAt' : 'shownAt';
    if (!local[key]) local[key] = at;
    if (event === 'click' && !local.shownAt) local.shownAt = at;
    persist();
  }
  const updates = event === 'click' ? { clicked_at: at } : { shown_at: at };
  await tryDb(() => supabaseAdmin.from('marketing_messages').update(updates).eq('id', id).is(column, null));
  if (event === 'click') {
    await tryDb(() => supabaseAdmin.from('marketing_messages').update({ shown_at: at }).eq('id', id).is('shown_at', null));
  }
  return true;
}
