// Nguồn đơn: khách mở web từ link nhân viên gửi qua Messenger thì đơn khách đặt sau đó được ghi nhận
// là "Đặt qua Messenger" (trang Báo cáo). Dùng chung cho trình duyệt và máy chủ.

export const SOURCE_PARAM = 'src';
export const REF_PARAM = 'mref';
export const MESSENGER = 'messenger';
export const ATTRIBUTION_DAYS = 7;
export const STORAGE_KEY = 'mvn-order-source';
export const DEFAULT_SITE_URL = 'https://meovangnha.store';

const DAY_MS = 86400000;
const REF_RE = /^[A-Za-z0-9_-]{6,40}$/;
const MESSENGER_SOURCES = new Set(['messenger', 'fb_messenger', 'facebook_messenger', 'mess']);
const MESSENGER_REFERRERS = /(^|\.)(messenger\.com|m\.me)$/i;
// Trình duyệt bên trong ứng dụng Messenger (iOS, Android "Orca", Messenger Lite)
const MESSENGER_UA = /MessengerForiOS|Orca-Android|FB_IAB\/MESSENGER|MessengerLite|FBAN\/Messenger/i;

export const isValidRef = (ref) => REF_RE.test(String(ref || ''));

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Gắn ?src=messenger&mref=<mã cuộc trò chuyện> vào mọi link trỏ về web của tiệm trong tin nhắn.
 * Link trang khác giữ nguyên.
 */
export function tagMessengerLinks(text = '', { siteUrl = DEFAULT_SITE_URL, ref = '' } = {}) {
  const host = hostOf(siteUrl);
  if (!host) return String(text || '');
  const re = new RegExp(`(https?:\\/\\/)?(www\\.)?${escapeRe(host)}(?![\\w.-])(\\/[^\\s<>"]*)?`, 'gi');
  return String(text || '').replace(re, (match) => {
    // Bỏ dấu câu dính cuối link (dấu chấm, phẩy, ngoặc đóng...)
    const trail = /[.,!?;:)\]]+$/.exec(match)?.[0] || '';
    const raw = trail ? match.slice(0, -trail.length) : match;
    let url;
    try {
      url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
      return match;
    }
    url.searchParams.set(SOURCE_PARAM, MESSENGER);
    if (isValidRef(ref)) url.searchParams.set(REF_PARAM, ref);
    return `${url.toString()}${trail}`;
  });
}

/**
 * Lượt mở web này có đến từ Messenger không: link có ?src=messenger (hoặc utm_source=messenger),
 * trang trước là messenger.com / m.me, hoặc đang mở trong trình duyệt của ứng dụng Messenger.
 */
export function detectOrderSource({ search = '', referrer = '', userAgent = '' } = {}) {
  let params;
  try {
    params = new URLSearchParams(search);
  } catch {
    params = new URLSearchParams();
  }
  const src = String(params.get(SOURCE_PARAM) || params.get('utm_source') || '').toLowerCase();
  const ref = params.get(REF_PARAM) || '';
  if (MESSENGER_SOURCES.has(src)) return { source: MESSENGER, ref: isValidRef(ref) ? ref : '' };
  if (isValidRef(ref)) return { source: MESSENGER, ref };
  if (MESSENGER_REFERRERS.test(hostOf(referrer))) return { source: MESSENGER, ref: '' };
  if (MESSENGER_UA.test(String(userAgent || ''))) return { source: MESSENGER, ref: '' };
  return null;
}

// localStorage của trình duyệt (null trên máy chủ / khi trình duyệt chặn)
export const browserStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

const read = (storage) => {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Ghi nhớ nguồn mới nhất; nếu lần này không có mã cuộc trò chuyện thì giữ mã cũ (cùng nguồn)
export function rememberOrderSource(storage, detected, now = Date.now()) {
  if (!detected?.source) return null;
  const old = read(storage);
  const ref = detected.ref || (old?.source === detected.source ? old.ref : '') || '';
  const next = { source: detected.source, ref, at: new Date(now).toISOString(), linked: Boolean(old?.linked && old.ref === ref) };
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // trình duyệt chặn lưu: bỏ qua
  }
  return next;
}

// Nguồn còn hiệu lực (trong 7 ngày kể từ lần bấm link gần nhất)
export function currentOrderSource(storage, now = Date.now()) {
  const v = read(storage);
  if (!v?.source || !v.at) return null;
  const at = Date.parse(v.at);
  if (!Number.isFinite(at) || now - at > ATTRIBUTION_DAYS * DAY_MS) return null;
  return v;
}

export function markOrderSourceLinked(storage) {
  const v = read(storage);
  if (!v) return;
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ ...v, linked: true }));
  } catch {
    // bỏ qua
  }
}

export function clearOrderSource(storage) {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // bỏ qua
  }
}

// Trường gắn vào đơn đặt phòng
export function orderSourceFields(storage, now = Date.now()) {
  const v = currentOrderSource(storage, now);
  if (!v) return {};
  return { orderSource: v.source, orderSourceRef: v.ref || null, orderSourceAt: v.at };
}

// Máy chủ chỉ nhận nguồn hợp lệ do trình duyệt gửi lên
export function sanitizeOrderSource(payload = {}) {
  const out = { ...payload };
  if (out.orderSource !== MESSENGER) {
    delete out.orderSource;
    delete out.orderSourceRef;
    delete out.orderSourceAt;
    return out;
  }
  out.orderSourceRef = isValidRef(out.orderSourceRef) ? out.orderSourceRef : null;
  const at = Date.parse(out.orderSourceAt || '');
  out.orderSourceAt = Number.isFinite(at) ? new Date(at).toISOString() : null;
  return out;
}
