import { createHmac, timingSafeEqual } from 'crypto';
import { getRequestUser } from './auth.js';
import {
  getConversation,
  getConversationByRef,
  saveConversation,
  listConversations,
  hasMessageMid,
  insertMessengerMessage,
  listMessengerMessages,
  isMessengerDbReady,
} from './messengerDb.js';
import { tagMessengerLinks, isValidRef, DEFAULT_SITE_URL } from '../../src/utils/orderSource.js';

// Hộp thư tập trung — kết nối Fanpage Messenger:
//  - Facebook gọi webhook /api/marketing/messenger mỗi khi khách nhắn Fanpage (hoặc Fanpage trả lời).
//  - Nhân viên xem / trả lời trong thẻ "Hộp thư tập trung"; link web trong tin trả lời được gắn mã nguồn
//    để đơn khách đặt sau khi bấm link được ghi nhận là "Đặt qua Messenger".
//
// Biến môi trường (Vercel):
//   MESSENGER_PAGE_ACCESS_TOKEN  mã truy cập Fanpage (quyền pages_messaging)
//   MESSENGER_APP_SECRET         App Secret của ứng dụng Facebook (kiểm tra chữ ký webhook)
//   MESSENGER_VERIFY_TOKEN       chuỗi tự đặt, nhập giống hệt khi đăng ký webhook trên Facebook
//   SITE_URL                     địa chỉ web của tiệm (mặc định https://meovangnha.store)

const GRAPH_VERSION = process.env.MESSENGER_GRAPH_VERSION || 'v23.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const PSID_RE = /^\d{5,30}$/;
const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

const env = () => ({
  pageToken: process.env.MESSENGER_PAGE_ACCESS_TOKEN || '',
  appSecret: process.env.MESSENGER_APP_SECRET || '',
  verifyToken: process.env.MESSENGER_VERIFY_TOKEN || '',
  siteUrl: process.env.SITE_URL || process.env.VITE_SITE_URL || DEFAULT_SITE_URL,
});

export const messengerStatus = () => {
  const e = env();
  return {
    pageToken: Boolean(e.pageToken),
    appSecret: Boolean(e.appSecret),
    verifyToken: Boolean(e.verifyToken),
    configured: Boolean(e.pageToken && e.appSecret && e.verifyToken),
    siteUrl: e.siteUrl,
    database: isMessengerDbReady(),
  };
};

// Cho phép test thay thế lời gọi Graph API
let graphFetch = (...args) => fetch(...args);
export function setGraphFetch(fn) {
  graphFetch = fn || ((...args) => fetch(...args));
}

const clip = (s, n) => String(s || '').slice(0, n);

const bodyOf = (req) => {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
};

async function requireAdmin(req, res) {
  const user = await getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: 'Cần đăng nhập tài khoản Admin.' });
    return null;
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: 'Chỉ Admin mới dùng được Hộp thư tập trung.' });
    return null;
  }
  return user;
}

// ---------- Chữ ký webhook ----------
export function verifySignature(rawBody, header, secret) {
  if (!secret || !header || typeof rawBody !== 'string') return false;
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(String(header));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Facebook gửi JSON có \uXXXX cho ký tự tiếng Việt và "\/" cho dấu gạch chéo
const facebookStyleJson = (obj) =>
  JSON.stringify(obj)
    .replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
    .replace(/\//g, '\\/');

// Thân request đúng như Facebook gửi (cần để kiểm tra chữ ký)
async function rawBodiesOf(req) {
  if (typeof req.rawBody === 'string') return [req.rawBody];
  if (Buffer.isBuffer(req.rawBody)) return [req.rawBody.toString('utf8')];
  if (req.readable && !req.readableEnded && typeof req.on === 'function') {
    const raw = await new Promise((resolve) => {
      const chunks = [];
      const timer = setTimeout(() => resolve(null), 5000);
      req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      req.on('end', () => { clearTimeout(timer); resolve(Buffer.concat(chunks).toString('utf8')); });
      req.on('error', () => { clearTimeout(timer); resolve(null); });
    });
    if (raw !== null) return [raw];
  }
  const body = req.body;
  if (typeof body === 'string') return [body];
  if (Buffer.isBuffer(body)) return [body.toString('utf8')];
  if (body && typeof body === 'object') return [facebookStyleJson(body), JSON.stringify(body)];
  return [];
}

// ---------- Graph API ----------
async function graph(pathname, { method = 'GET', body } = {}) {
  const { pageToken } = env();
  const sep = pathname.includes('?') ? '&' : '?';
  const res = await graphFetch(`${GRAPH}${pathname}${sep}access_token=${encodeURIComponent(pageToken)}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = new Error(data.error?.message || `Facebook trả lỗi ${res.status}`);
    err.code = data.error?.code;
    err.subcode = data.error?.error_subcode;
    throw err;
  }
  return data;
}

async function fetchProfile(psid) {
  if (!env().pageToken) return null;
  for (const fields of ['name,profile_pic', 'first_name,last_name,profile_pic']) {
    try {
      const p = await graph(`/${psid}?fields=${fields}`);
      // Không có tên đầy đủ thì ghép "Họ Tên" như cách người Việt hiển thị
      const name = String(p.name || [p.last_name, p.first_name].filter(Boolean).join(' ')).trim();
      return { nickname: clip(name, 120), profilePic: clip(p.profile_pic, 1000) };
    } catch (e) {
      console.warn('[Messenger] Không lấy được tên khách:', e.message);
    }
  }
  return null;
}

// ---------- Nhận tin từ webhook ----------
const attachmentsOf = (message = {}) =>
  (message.attachments || []).slice(0, 10).map((a) => ({
    type: clip(a.type, 20),
    url: clip(a.payload?.url, 1000) || null,
  }));

const ATTACHMENT_LABEL = { image: '[Ảnh]', video: '[Video]', audio: '[Tin nhắn thoại]', file: '[Tệp]', sticker: '[Nhãn dán]' };
const previewOf = (text, attachments = []) =>
  clip(text, 200) || (attachments[0] ? ATTACHMENT_LABEL[attachments[0].type] || '[Tệp đính kèm]' : '');

async function recordMessage({ psid, direction, mid, text, attachments, sentBy, at }) {
  if (mid && await hasMessageMid(mid)) return null;
  let conv = await getConversation(psid);
  if (!conv) conv = { psid, unread: 0 };
  if (!conv.nickname && direction === 'in') {
    const profile = await fetchProfile(psid);
    if (profile) conv = { ...conv, ...profile };
  }
  const saved = await insertMessengerMessage({
    psid,
    mid: mid || null,
    direction,
    text: clip(text, 4000),
    attachments: attachments?.length ? attachments : null,
    sentBy: sentBy || null,
    createdAt: at,
  });
  if (saved.duplicate) return null;
  const isNewer = !conv.lastMessageAt || at >= conv.lastMessageAt;
  conv = {
    ...conv,
    lastText: isNewer ? previewOf(text, attachments) : conv.lastText,
    lastMessageAt: isNewer ? at : conv.lastMessageAt,
    lastInboundAt: direction === 'in' && (!conv.lastInboundAt || at > conv.lastInboundAt) ? at : conv.lastInboundAt,
    unread: direction === 'in' ? (conv.unread || 0) + 1 : conv.unread || 0,
  };
  await saveConversation(conv);
  return saved;
}

/**
 * Xử lý một lần Facebook gọi webhook (object: "page").
 * Tin khách nhắn -> 'in'; bản sao tin Fanpage gửi (is_echo) -> 'out', kể cả tin nhân viên trả lời ngay trong Meta Business Suite.
 */
export async function processWebhook(payload = {}) {
  if (payload.object !== 'page') return { stored: 0 };
  let stored = 0;
  for (const entry of payload.entry || []) {
    for (const ev of entry.messaging || []) {
      const at = new Date(Number(ev.timestamp) || Date.now()).toISOString();
      const msg = ev.message;
      if (msg) {
        const isEcho = Boolean(msg.is_echo);
        const psid = String(isEcho ? ev.recipient?.id : ev.sender?.id || '');
        if (!PSID_RE.test(psid)) continue;
        const fromWeb = String(msg.metadata || '').startsWith('mvn:');
        const saved = await recordMessage({
          psid,
          direction: isEcho ? 'out' : 'in',
          mid: clip(msg.mid, 200),
          text: msg.text || '',
          attachments: attachmentsOf(msg),
          sentBy: isEcho ? (fromWeb ? clip(String(msg.metadata).slice(4), 120) : 'fanpage') : null,
          at,
        });
        if (saved) stored += 1;
        continue;
      }
      // Khách bấm nút "Bắt đầu" / nút trong tin của Fanpage
      if (ev.postback) {
        const psid = String(ev.sender?.id || '');
        if (!PSID_RE.test(psid)) continue;
        const saved = await recordMessage({
          psid,
          direction: 'in',
          mid: ev.postback.mid ? clip(ev.postback.mid, 200) : null,
          text: ev.postback.title ? `[Bấm nút] ${ev.postback.title}` : '[Bấm nút]',
          at,
        });
        if (saved) stored += 1;
      }
    }
  }
  return { stored };
}

export async function handleWebhook(req, res) {
  const { verifyToken, appSecret } = env();
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge') || '';
    if (mode === 'subscribe' && verifyToken && token === verifyToken) {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 200;
      return res.end(challenge);
    }
    return res.status(403).json({ error: 'Mã xác minh webhook không đúng.' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Phương thức không được hỗ trợ.' });
  if (!appSecret) return res.status(503).json({ error: 'Máy chủ chưa có MESSENGER_APP_SECRET.' });

  const header = req.headers?.['x-hub-signature-256'] || req.headers?.['X-Hub-Signature-256'];
  const raws = await rawBodiesOf(req);
  const raw = raws.find((r) => verifySignature(r, header, appSecret));
  if (raw === undefined) return res.status(401).json({ error: 'Chữ ký webhook không hợp lệ.' });

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Nội dung webhook không hợp lệ.' });
  }
  const result = await processWebhook(payload);
  return res.status(200).json({ ok: true, ...result });
}

// ---------- Gắn cuộc trò chuyện với tài khoản web ----------
/**
 * Khách bấm link web nhân viên gửi qua Messenger (mang mã mref) khi đã đăng nhập, hoặc đặt phòng từ link đó:
 * gắn cuộc trò chuyện với tài khoản. Cuộc trò chuyện đã gắn rồi thì giữ nguyên (nhân viên tự sửa nếu cần).
 */
export async function linkConversationByRef(ref, customerId, by = 'link') {
  if (!isValidRef(ref) || !customerId) return { linked: false };
  const conv = await getConversationByRef(ref);
  if (!conv) return { linked: false };
  if (conv.customerId) return { linked: conv.customerId === String(customerId), psid: conv.psid };
  await saveConversation({ ...conv, customerId: String(customerId), linkedBy: by, linkedAt: new Date().toISOString() });
  return { linked: true, psid: conv.psid };
}

// ---------- API cho Admin ----------
const publicConversation = (c) => ({
  psid: c.psid,
  nickname: c.nickname || '',
  profilePic: c.profilePic || '',
  customerId: c.customerId || null,
  linkedBy: c.linkedBy || null,
  lastText: c.lastText || '',
  lastMessageAt: c.lastMessageAt || null,
  lastInboundAt: c.lastInboundAt || null,
  unread: c.unread || 0,
  refToken: c.refToken || null,
});

// GET: danh sách cuộc trò chuyện; ?psid=... : tin của một cuộc trò chuyện (và đánh dấu đã đọc)
export async function handleInboxList(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const url = new URL(req.url, 'http://localhost');
  const psid = url.searchParams.get('psid');
  if (psid) {
    if (!PSID_RE.test(psid)) return res.status(400).json({ error: 'Mã cuộc trò chuyện không hợp lệ.' });
    const conv = await getConversation(psid);
    if (!conv) return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện.' });
    const messages = await listMessengerMessages(psid, { limit: 300 });
    if (conv.unread && url.searchParams.get('markRead') !== '0') await saveConversation({ ...conv, unread: 0 });
    return res.status(200).json({ conversation: publicConversation({ ...conv, unread: 0 }), messages });
  }
  const conversations = await listConversations();
  return res.status(200).json({ status: messengerStatus(), conversations: conversations.map(publicConversation) });
}

export const describeSendError = (err = {}) => {
  if (err.code === 10 || err.subcode === 2018278) {
    return 'Đã quá 24 giờ kể từ tin nhắn cuối của khách nên Messenger không cho Fanpage nhắn tiếp. Chờ khách nhắn lại rồi trả lời.';
  }
  if (err.code === 190) return 'Mã truy cập Fanpage (MESSENGER_PAGE_ACCESS_TOKEN) đã hết hạn hoặc không đúng.';
  if (err.code === 551 || err.subcode === 1545041) return 'Khách hiện không nhận được tin (đã chặn Fanpage hoặc không còn dùng Messenger).';
  return clip(err.message || 'Facebook từ chối gửi tin.', 300);
};

// POST { psid, text }: trả lời khách qua Messenger
export async function handleInboxSend(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ chấp nhận POST.' });
  const user = await requireAdmin(req, res);
  if (!user) return;
  const { psid, text } = bodyOf(req);
  const body = String(text || '').trim();
  if (!PSID_RE.test(String(psid || ''))) return res.status(400).json({ error: 'Mã cuộc trò chuyện không hợp lệ.' });
  if (!body) return res.status(400).json({ error: 'Chưa nhập nội dung.' });
  if (body.length > 2000) return res.status(400).json({ error: 'Tin Messenger tối đa 2000 ký tự.' });
  if (!env().pageToken) return res.status(503).json({ error: 'Máy chủ chưa có MESSENGER_PAGE_ACCESS_TOKEN nên chưa gửi được tin Messenger.' });

  const conv = await getConversation(String(psid));
  if (!conv) return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện.' });
  const saved = conv.refToken ? conv : await saveConversation(conv);
  const finalText = tagMessengerLinks(body, { siteUrl: env().siteUrl, ref: saved.refToken });

  let result;
  try {
    result = await graph('/me/messages', {
      method: 'POST',
      body: {
        recipient: { id: saved.psid },
        messaging_type: 'RESPONSE',
        message: { text: finalText, metadata: `mvn:${clip(user.email, 100)}` },
      },
    });
  } catch (err) {
    const outsideWindow = saved.lastInboundAt && Date.now() - Date.parse(saved.lastInboundAt) > REPLY_WINDOW_MS;
    return res.status(502).json({ error: outsideWindow && !err.code ? describeSendError({ code: 10 }) : describeSendError(err) });
  }

  const message = await recordMessage({
    psid: saved.psid,
    direction: 'out',
    mid: clip(result.message_id, 200) || null,
    text: finalText,
    sentBy: clip(user.email, 120),
    at: new Date().toISOString(),
  });
  return res.status(200).json({ ok: true, text: finalText, message });
}

// POST { psid, customerId | null }: nhân viên gắn / bỏ gắn cuộc trò chuyện với tài khoản khách
export async function handleInboxLink(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ chấp nhận POST.' });
  const user = await requireAdmin(req, res);
  if (!user) return;
  const { psid, customerId } = bodyOf(req);
  if (!PSID_RE.test(String(psid || ''))) return res.status(400).json({ error: 'Mã cuộc trò chuyện không hợp lệ.' });
  const conv = await getConversation(String(psid));
  if (!conv) return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện.' });
  const id = customerId ? clip(customerId, 120) : null;
  const next = await saveConversation({
    ...conv,
    customerId: id,
    linkedBy: id ? 'staff' : null,
    linkedAt: id ? new Date().toISOString() : null,
  });
  return res.status(200).json({ conversation: publicConversation(next) });
}

// POST { ref }: khách đã đăng nhập mở web từ link Messenger -> gắn cuộc trò chuyện với tài khoản của khách
export async function handleMessengerRef(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ chấp nhận POST.' });
  const user = await getRequestUser(req);
  if (!user) return res.status(200).json({ ok: false, reason: 'not_logged_in' });
  if (user.isAdmin) return res.status(200).json({ ok: false, reason: 'admin' });
  const { ref } = bodyOf(req);
  if (!isValidRef(ref)) return res.status(400).json({ error: 'Mã không hợp lệ.' });
  const result = await linkConversationByRef(ref, user.id, 'link');
  return res.status(200).json({ ok: true, linked: result.linked });
}
