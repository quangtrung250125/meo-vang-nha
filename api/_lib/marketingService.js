import { getRequestUser } from './auth.js';
import { supabaseAdmin, countSubscriptionsByUser, hasServiceRole, getSubscriptionDbError } from './db.js';
import { getAdminEmails, isAdminUser } from '../../src/utils/adminAccess.js';
import { normalizeVnPhone } from '../../src/utils/phone.js';
import { listStoredBookings } from './bookingsDb.js';
import { getSyncData } from './syncService.js';
import { isPushConfigured, sendPushToUserIds, PUSH_NOT_CONFIGURED } from './pushService.js';
import {
  getMarketingConfig,
  saveMarketingConfig,
  insertMessage,
  listMessages,
  hasSentDedupeKey,
  trackMessage,
  saveDraft,
  clearDraft,
  listDrafts,
  listContacts,
  newMessageId,
  isUsingDatabase,
} from './marketingDb.js';
import {
  evaluateScenarios,
  groupCustomers,
  frequencyBlock,
  historyByCustomer,
  isQuietHour,
  pushIdsOf,
} from '../../src/utils/marketingEngine.js';
import { fromPetRow } from '../../src/utils/petRows.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_RECIPIENTS = 500;
const ICON = '/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png';

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
    res.status(403).json({ error: 'Chỉ Admin mới dùng được Marketing tự động.' });
    return null;
  }
  return user;
}

// Chỉ nhận đường dẫn nội bộ của web (không cho mở trang ngoài từ thông báo)
export const safeUrl = (url) => {
  const s = String(url || '/').trim();
  return s.startsWith('/') && !s.startsWith('//') ? s.slice(0, 300) : '/';
};

const clip = (s, n) => String(s || '').slice(0, n);

/**
 * Gửi danh sách tin web push và ghi nhật ký.
 * source 'auto': kiểm lại trùng lặp, giờ yên lặng, giới hạn tần suất ở server; khách chưa bật thông báo thì bỏ qua (thử lại lần sau).
 * source 'manual': admin chủ động gửi, ghi nhật ký cả khi khách chưa bật thông báo.
 */
export async function sendMarketingMessages({ messages = [], source = 'manual', sentBy = null, frequency = null, now = Date.now() }) {
  if (!isPushConfigured()) return { error: PUSH_NOT_CONFIGURED, results: [] };

  const isAuto = source === 'auto';
  let history = null;
  if (isAuto) {
    const freq = frequency || (await getMarketingConfig())?.frequency || {};
    if (isQuietHour(freq, now)) {
      return { results: messages.map((m) => ({ customerId: m.customerId, status: 'deferred', reason: 'Giờ yên lặng' })) };
    }
    history = historyByCustomer(await listMessages({ days: 8 }));
    frequency = freq;
  }

  const results = [];
  for (const m of messages.slice(0, MAX_RECIPIENTS)) {
    const customerId = clip(m.customerId, 120);
    const ids = [...new Set([...(Array.isArray(m.pushIds) ? m.pushIds : []), ...pushIdsOf({ id: customerId, phone: m.phone })])]
      .map((x) => clip(x, 120)).filter(Boolean).slice(0, 10);
    const title = clip(m.title, 120) || 'Mèo Vắng Nhà 🐾';
    const body = clip(m.body, 500);
    const url = safeUrl(m.url);
    if (!customerId || !body) {
      results.push({ customerId, status: 'invalid', reason: 'Thiếu khách nhận hoặc nội dung' });
      continue;
    }

    if (m.dedupeKey && await hasSentDedupeKey(clip(m.dedupeKey, 200))) {
      results.push({ customerId, status: 'duplicate', reason: 'Đã gửi tin này trước đó' });
      continue;
    }
    if (isAuto) {
      const times = history.get(customerId) || [];
      const block = frequencyBlock(times, frequency, now);
      if (block) {
        results.push({ customerId, status: 'limited', reason: block });
        continue;
      }
    }

    const id = newMessageId();
    const push = await sendPushToUserIds(ids, {
      title,
      body,
      url,
      icon: ICON,
      badge: ICON,
      tag: `mvn-mkt-${id}`,
      data: { url, messageId: id },
    });

    if (!push.totalTargets && isAuto) {
      results.push({ customerId, status: 'no_device', reason: 'Khách chưa bật thông báo trên thiết bị nào' });
      continue;
    }

    const status = push.sentCount > 0 ? 'sent' : push.totalTargets ? 'failed' : 'no_device';
    await insertMessage({
      id,
      dedupeKey: clip(m.dedupeKey, 200) || null,
      customerId,
      customerName: clip(m.customerName, 120),
      scenarioId: m.scenarioId ? clip(m.scenarioId, 60) : null,
      templateId: m.templateId ? clip(m.templateId, 60) : null,
      source: isAuto ? 'auto' : 'manual',
      channel: 'webpush',
      title,
      body,
      url,
      status,
      deviceCount: push.sentCount || 0,
      error: status === 'failed' ? clip(push.error, 300) : null,
      sentBy,
      createdAt: new Date(now).toISOString(),
    });
    if (history && status === 'sent') history.set(customerId, [...(history.get(customerId) || []), now]);
    results.push({
      id,
      customerId,
      status,
      devices: push.sentCount || 0,
      reason: status === 'no_device' ? 'Khách chưa bật thông báo trên thiết bị nào' : status === 'failed' ? (push.error || 'Dịch vụ thông báo từ chối') : null,
    });
  }
  return { results };
}

const countBy = (results) => results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

// ---------- Dữ liệu khách cho lần chạy tự động trên server ----------
const safeRows = async (fn) => {
  try {
    const { data, error } = await Promise.race([fn(), new Promise((resolve) => setTimeout(() => resolve({ data: null }), 6000))]);
    return !error && Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const phoneOfEmail = (email = '') => /^(\d{9,12})@meovangnha\.vn$/i.exec(email)?.[1] || '';

// Tài khoản Supabase (cần service role): họ tên và SĐT khách nhập lúc đăng ký nằm trong user_metadata
async function listAuthUsers() {
  if (!hasServiceRole) return [];
  const adminEmails = getAdminEmails({
    emails: process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS,
    phones: process.env.ADMIN_PHONES || process.env.VITE_ADMIN_PHONES,
  });
  const out = [];
  try {
    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;
      const users = data?.users || [];
      users.forEach((u) => {
        if (!u?.id || isAdminUser(u, adminEmails)) return;
        const meta = u.user_metadata || {};
        out.push({
          id: u.id,
          fullName: meta.full_name || meta.fullName || meta.name || '',
          phone: meta.phone || u.phone || phoneOfEmail(u.email),
          email: phoneOfEmail(u.email) ? '' : (u.email || ''),
          createdAt: u.created_at || null,
        });
      });
      if (users.length < 1000) break;
    }
  } catch (err) {
    console.warn('[Marketing] Không đọc được danh sách tài khoản:', err?.message);
  }
  return out;
}

/**
 * Họ tên, SĐT của từng tài khoản khách: gom từ danh sách tài khoản Supabase, bảng customer_profiles
 * và thông tin khách gửi lên khi bật thông báo. Giá trị đầu tiên có dữ liệu được dùng.
 */
export async function loadAccounts() {
  const [users, profileRows, contacts] = await Promise.all([
    listAuthUsers(),
    safeRows(() => supabaseAdmin.from('customer_profiles').select('*')),
    listContacts().catch(() => []),
  ]);
  const map = new Map();
  const add = (p) => {
    if (!p?.id) return;
    const id = String(p.id);
    const cur = map.get(id) || { id, fullName: '', phone: '', email: '', createdAt: null };
    const clean = {
      fullName: String(p.fullName || p.full_name || '').trim(),
      phone: normalizeVnPhone(p.phone || ''),
      email: String(p.email || '').trim(),
      createdAt: p.createdAt || p.created_at || null,
    };
    Object.entries(clean).forEach(([k, v]) => { if (v && !cur[k]) cur[k] = v; });
    map.set(id, cur);
  };
  profileRows.forEach(add);
  users.forEach(add);
  contacts.forEach(add);
  return [...map.values()];
}

async function loadServerCustomers() {
  const [stored, accounts, petRows] = await Promise.all([
    listStoredBookings().then((x) => x || []),
    loadAccounts(),
    safeRows(() => supabaseAdmin.from('pets').select('*')),
  ]);
  const sync = getSyncData() || {};
  return groupCustomers({
    profiles: [
      ...accounts,
      ...(sync.profiles || []).filter((p) => p?.id),
    ],
    bookings: [...stored, ...(sync.bookings || [])],
    pets: [...petRows.map(fromPetRow), ...(sync.pets || [])],
  });
}

/**
 * Chạy tất cả kịch bản đang bật: tìm khách đến hạn và gửi web push.
 */
export async function runMarketingAutomation({ now = Date.now(), customers = null } = {}) {
  const config = await getMarketingConfig();
  if (!config?.scenarios?.length) return { ran: false, reason: 'Chưa lưu cài đặt Marketing tự động.' };
  const [list, messages, drafts] = await Promise.all([
    customers ? Promise.resolve(customers) : loadServerCustomers(),
    listMessages({ days: 120 }),
    listDrafts(),
  ]);
  const scenarios = config.scenarios.filter((s) => (s.channels || []).includes('webpush'));
  const { due, blocked } = evaluateScenarios({
    customers: list,
    scenarios,
    templates: config.templates || [],
    frequency: config.frequency || {},
    messages,
    drafts,
    now,
  });
  const { results = [], error } = due.length
    ? await sendMarketingMessages({ messages: due, source: 'auto', frequency: config.frequency || {}, now })
    : { results: [] };
  return { ran: true, error, checkedCustomers: list.length, due: due.length, blocked: blocked.length, counts: countBy(results), results };
}

// ---------- Các API ----------
export async function handleSettings(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  if (req.method === 'GET') {
    const config = await getMarketingConfig();
    return res.status(200).json({ config, pushConfigured: isPushConfigured(), database: isUsingDatabase() });
  }
  if (req.method === 'PUT' || req.method === 'POST') {
    const { scenarios, templates, frequency } = bodyOf(req);
    if (!Array.isArray(scenarios) || !Array.isArray(templates) || !frequency || typeof frequency !== 'object') {
      return res.status(400).json({ error: 'Cần gửi đủ kịch bản, mẫu tin và giới hạn tần suất.' });
    }
    const config = await saveMarketingConfig({ scenarios: scenarios.slice(0, 100), templates: templates.slice(0, 200), frequency, updatedBy: user.email });
    return res.status(200).json({ config, database: isUsingDatabase() });
  }
  return res.status(405).json({ error: 'Phương thức không được hỗ trợ.' });
}

export async function handleSend(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ chấp nhận POST.' });
  const user = await requireAdmin(req, res);
  if (!user) return;
  const { messages, source } = bodyOf(req);
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'Chưa chọn khách nhận.' });
  if (messages.length > MAX_RECIPIENTS) return res.status(400).json({ error: `Mỗi lần gửi tối đa ${MAX_RECIPIENTS} khách.` });
  const { results, error } = await sendMarketingMessages({ messages, source: source === 'auto' ? 'auto' : 'manual', sentBy: user.email });
  if (error) return res.status(503).json({ error, results });
  return res.status(200).json({ results, counts: countBy(results) });
}

export async function handleMessages(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const url = new URL(req.url, 'http://localhost');
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 90));
  const messages = await listMessages({ days });
  return res.status(200).json({ messages, database: isUsingDatabase() });
}

export async function handleAudience(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const [devices, drafts, accounts] = await Promise.all([countSubscriptionsByUser(), listDrafts(), loadAccounts()]);
  const dbError = getSubscriptionDbError();
  return res.status(200).json({
    devices,
    drafts,
    accounts,
    pushConfigured: isPushConfigured(),
    serviceRole: hasServiceRole,
    // Không đọc / ghi được bảng push_subscriptions: thiết bị khách bật thông báo không được lưu lại
    subscriptionStore: dbError ? { ok: false, error: describeDbError(dbError) } : { ok: true },
  });
}

const describeDbError = (msg = '') => {
  const m = String(msg);
  if (/push_subscriptions/i.test(m) && /(does not exist|schema cache|not find)/i.test(m)) return 'Chưa có bảng push_subscriptions trên Supabase.';
  if (/row-level security|permission denied/i.test(m)) return 'Supabase chặn ghi bảng push_subscriptions (thiếu SUPABASE_SERVICE_ROLE_KEY trên Vercel hoặc chưa có quyền).';
  return m.slice(0, 200);
};

// Khách (hoặc Service Worker) báo đã thấy / đã bấm thông báo; khách đang đặt phòng dở
export async function handleTrack(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ chấp nhận POST.' });
  const { messageId, event, step, phone } = bodyOf(req);
  if (event === 'shown' || event === 'click') {
    if (!UUID_RE.test(String(messageId || ''))) return res.status(400).json({ error: 'Mã tin không hợp lệ.' });
    await trackMessage(messageId, event);
    return res.status(200).json({ ok: true });
  }
  if (event === 'draft' || event === 'booked') {
    const user = await getRequestUser(req);
    if (!user) return res.status(200).json({ ok: false, reason: 'not_logged_in' });
    if (event === 'booked') await clearDraft(user.id);
    else await saveDraft(user.id, { at: new Date().toISOString(), step: Number(step) || 1, phone: String(phone || '').replace(/\D/g, '').slice(0, 15) });
    return res.status(200).json({ ok: true });
  }
  return res.status(400).json({ error: 'Sự kiện không hợp lệ.' });
}

// Lịch tự chạy (Vercel Cron, mang CRON_SECRET) hoặc Admin bấm "Chạy ngay"
export async function handleRun(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || req.headers?.Authorization || '';
  const fromCron = Boolean(secret) && auth === `Bearer ${secret}`;
  if (!fromCron) {
    const user = await requireAdmin(req, res);
    if (!user) return;
  }
  const result = await runMarketingAutomation();
  return res.status(200).json({ ...result, results: (result.results || []).slice(0, 100) });
}

export async function handleMarketing(req, res, action) {
  switch (action) {
    case 'settings': return handleSettings(req, res);
    case 'send': return handleSend(req, res);
    case 'messages': return handleMessages(req, res);
    case 'audience': return handleAudience(req, res);
    case 'track': return handleTrack(req, res);
    case 'run': return handleRun(req, res);
    default: return res.status(404).json({ error: 'Không có API này.' });
  }
}
