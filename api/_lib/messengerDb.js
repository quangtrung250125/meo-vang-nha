import fs from 'fs';
import path from 'path';
import { randomUUID, randomBytes } from 'crypto';
import { supabaseAdmin } from './db.js';

// Cuộc trò chuyện Messenger của Fanpage và từng tin nhắn (Hộp thư tập trung).
// Ưu tiên bảng Supabase (supabase/migrations/20261116_create_messenger_inbox.sql);
// chưa tạo bảng thì giữ tạm trong bộ nhớ / file JSON (chỉ dùng khi chạy ở máy).

const DATA_DIR = process.env.MVN_DATA_DIR || path.resolve(process.cwd(), 'api/_lib');
const FILE_PATH = path.join(DATA_DIR, 'messenger_store.json');
const DB_TIMEOUT_MS = 5000;

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase không phản hồi')), DB_TIMEOUT_MS)),
  ]);

let memory = { conversations: {}, messages: [] };
try {
  if (fs.existsSync(FILE_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
    memory = { conversations: parsed.conversations || {}, messages: Array.isArray(parsed.messages) ? parsed.messages : [] };
  }
} catch (e) {
  console.warn('[Messenger] Không đọc được messenger_store.json:', e.message);
}

const persist = () => {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(memory, null, 2), 'utf-8');
  } catch {
    // Vercel không cho ghi file: chỉ giữ trong bộ nhớ
  }
};

let dbReady = null;
export const isMessengerDbReady = () => dbReady !== false;

const tryDb = async (fn) => {
  if (dbReady === false) return { ok: false };
  try {
    const result = await withTimeout(fn());
    if (result?.error) {
      const msg = result.error.message || '';
      if (/relation|does not exist|schema cache|not find the table|row-level security|permission denied/i.test(msg)) dbReady = false;
      console.warn('[Messenger] Supabase:', msg);
      return { ok: false, error: msg };
    }
    dbReady = true;
    return { ok: true, data: result?.data };
  } catch (e) {
    console.warn('[Messenger] Không kết nối được Supabase:', e.message);
    return { ok: false };
  }
};

// Dùng trong test
export function resetMessengerMemory({ useDatabase = null } = {}) {
  memory = { conversations: {}, messages: [] };
  dbReady = useDatabase === false ? false : null;
}

const newRefToken = () => randomBytes(9).toString('base64url');

// ---------- Chuyển dòng bảng <-> đối tượng ----------
const convFromRow = (r) => ({
  psid: r.psid,
  nickname: r.nickname || '',
  profilePic: r.profile_pic || '',
  customerId: r.customer_id || null,
  linkedBy: r.linked_by || null,
  linkedAt: r.linked_at || null,
  refToken: r.ref_token || null,
  lastText: r.last_text || '',
  lastMessageAt: r.last_message_at || null,
  lastInboundAt: r.last_inbound_at || null,
  unread: Number(r.unread) || 0,
  createdAt: r.created_at || null,
});

const convToRow = (c) => ({
  psid: c.psid,
  nickname: c.nickname || null,
  profile_pic: c.profilePic || null,
  customer_id: c.customerId || null,
  linked_by: c.linkedBy || null,
  linked_at: c.linkedAt || null,
  ref_token: c.refToken || null,
  last_text: c.lastText || null,
  last_message_at: c.lastMessageAt || null,
  last_inbound_at: c.lastInboundAt || null,
  unread: c.unread || 0,
  created_at: c.createdAt || new Date().toISOString(),
});

const msgFromRow = (r) => ({
  id: r.id,
  mid: r.mid || null,
  psid: r.psid,
  direction: r.direction,
  text: r.text || '',
  attachments: r.attachments || null,
  sentBy: r.sent_by || null,
  createdAt: r.created_at,
});

const msgToRow = (m) => ({
  id: m.id,
  mid: m.mid || null,
  psid: m.psid,
  direction: m.direction,
  text: m.text || '',
  attachments: m.attachments || null,
  sent_by: m.sentBy || null,
  created_at: m.createdAt,
});

// ---------- Cuộc trò chuyện ----------
export async function getConversation(psid) {
  if (!psid) return null;
  const res = await tryDb(() => supabaseAdmin.from('messenger_conversations').select('*').eq('psid', psid).limit(1));
  if (res.ok && res.data?.[0]) return convFromRow(res.data[0]);
  return memory.conversations[psid] ? { ...memory.conversations[psid] } : null;
}

export async function getConversationByRef(refToken) {
  if (!refToken) return null;
  const res = await tryDb(() => supabaseAdmin.from('messenger_conversations').select('*').eq('ref_token', refToken).limit(1));
  if (res.ok && res.data?.[0]) return convFromRow(res.data[0]);
  const local = Object.values(memory.conversations).find((c) => c.refToken === refToken);
  return local ? { ...local } : null;
}

export async function saveConversation(conv) {
  const next = { ...conv, refToken: conv.refToken || newRefToken(), createdAt: conv.createdAt || new Date().toISOString() };
  memory.conversations[next.psid] = next;
  persist();
  await tryDb(() => supabaseAdmin.from('messenger_conversations').upsert(convToRow(next), { onConflict: 'psid' }));
  return next;
}

export async function listConversations({ limit = 300 } = {}) {
  const res = await tryDb(() => supabaseAdmin
    .from('messenger_conversations')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(limit));
  const fromDb = res.ok ? (res.data || []).map(convFromRow) : [];
  const seen = new Set(fromDb.map((c) => c.psid));
  const fromMemory = Object.values(memory.conversations).filter((c) => !seen.has(c.psid));
  return [...fromDb, ...fromMemory]
    .sort((a, b) => String(b.lastMessageAt || '').localeCompare(String(a.lastMessageAt || '')))
    .slice(0, limit);
}

// ---------- Tin nhắn ----------
export async function hasMessageMid(mid) {
  if (!mid) return false;
  const res = await tryDb(() => supabaseAdmin.from('messenger_messages').select('id').eq('mid', mid).limit(1));
  if (res.ok && res.data?.length) return true;
  return memory.messages.some((m) => m.mid === mid);
}

export async function insertMessengerMessage(message) {
  const m = { createdAt: new Date().toISOString(), ...message, id: message.id || randomUUID() };
  if (m.mid && memory.messages.some((x) => x.mid === m.mid)) return m;
  const res = await tryDb(() => supabaseAdmin.from('messenger_messages').insert(msgToRow(m)));
  // Tin đã có (webhook gửi lại / bản sao tin Fanpage tới trước): không lưu thêm
  if (!res.ok && /duplicate key|unique/i.test(res.error || '')) return { ...m, duplicate: true };
  if (!res.ok) {
    memory.messages.unshift(m);
    memory.messages = memory.messages.slice(0, 10000);
    persist();
  }
  return m;
}

// Tin của một cuộc trò chuyện, cũ trước mới sau
export async function listMessengerMessages(psid, { limit = 200 } = {}) {
  if (!psid) return [];
  const res = await tryDb(() => supabaseAdmin
    .from('messenger_messages')
    .select('*')
    .eq('psid', psid)
    .order('created_at', { ascending: false })
    .limit(limit));
  const fromDb = res.ok ? (res.data || []).map(msgFromRow) : [];
  const seen = new Set(fromDb.map((m) => m.id));
  const fromMemory = memory.messages.filter((m) => m.psid === psid && !seen.has(m.id));
  return [...fromDb, ...fromMemory]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit)
    .reverse();
}
