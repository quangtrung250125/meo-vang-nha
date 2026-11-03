// Bộ máy "Marketing tự động": tìm khách đến hạn nhận tin theo từng kịch bản, ghép nội dung mẫu tin,
// áp giới hạn tần suất. Không phụ thuộc React, dùng chung cho trang Admin (src/) và server (api/).
import { calculateMembership, TIER_BRONZE } from './membership.js';

export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// ---------- Đích đến khi khách bấm vào thông báo (trang của khách) ----------
export const PUSH_DESTINATIONS = [
  { id: '/booking', label: 'Đặt phòng' },
  { id: '/my-booking', label: 'Lịch đặt của tôi' },
  { id: '/tracking', label: 'Theo dõi lưu trú' },
  { id: '/promotions', label: 'Ưu đãi' },
  { id: '/customer-profile?tab=tier', label: 'Hạng thành viên' },
  { id: '/customer-profile?tab=history', label: 'Lịch sử lưu trú' },
  { id: '/pet-profile', label: 'Hồ sơ mèo' },
  { id: '/services', label: 'Bảng giá dịch vụ' },
  { id: '/', label: 'Trang chủ' },
];

export const destinationLabel = (url = '') => {
  const base = String(url || '').split('&code=')[0].replace(/[?&]code=[^&]*/, '');
  return PUSH_DESTINATIONS.find((d) => d.id === url || d.id === base)?.label || url || 'Trang chủ';
};

// ---------- Loại điều kiện kích hoạt ----------
export const RULE_TYPES = [
  { id: 'signup_no_booking', label: 'Đăng ký nhưng chưa đặt phòng', unit: 'days', defaultValue: 3, hint: 'Gửi khi tài khoản đã đăng ký đủ X ngày mà chưa có đơn nào' },
  { id: 'abandoned_booking', label: 'Bỏ dở đặt phòng', unit: 'hours', defaultValue: 2, hint: 'Gửi khi khách bắt đầu đặt phòng nhưng sau X giờ vẫn chưa đặt xong' },
  { id: 'before_checkin', label: 'Trước ngày gửi mèo', unit: 'days', defaultValue: 2, hint: 'Gửi khi còn X ngày nữa là đến ngày check-in' },
  { id: 'after_checkout', label: 'Sau khi check-out', unit: 'days', defaultValue: 1, hint: 'Gửi X ngày sau khi bé được đón về' },
  { id: 'inactive', label: 'Lâu chưa quay lại', unit: 'days', defaultValue: 60, hint: 'Khách đã từng gửi mèo, X ngày nay chưa có đơn mới' },
  { id: 'tier_up', label: 'Lên hạng thành viên', unit: null, defaultValue: 0, hint: 'Gửi khi khách vừa đạt hạng Vàng / Kim Cương' },
  { id: 'at_risk', label: 'Nguy cơ rời bỏ', unit: 'days', defaultValue: 120, hint: 'Khách quen (từ 2 đơn) đã X ngày không quay lại' },
];

export const ruleTypeOf = (id) => RULE_TYPES.find((r) => r.id === id) || null;

export const describeRule = (rule) => {
  const type = ruleTypeOf(rule?.type);
  if (!type) return 'Chỉ gửi thủ công';
  const value = Number(rule.value ?? type.defaultValue);
  switch (type.id) {
    case 'signup_no_booking': return `Đăng ký ≥ ${value} ngày, chưa đặt phòng`;
    case 'abandoned_booking': return `Bỏ dở đặt phòng > ${value} giờ`;
    case 'before_checkin': return `${value} ngày trước check-in`;
    case 'after_checkout': return `${value} ngày sau check-out`;
    case 'inactive': return `${value} ngày chưa quay lại`;
    case 'at_risk': return `Khách quen, ${value} ngày chưa quay lại`;
    case 'tier_up': return 'Ngay khi lên hạng Vàng / Kim Cương';
    default: return type.label;
  }
};

// Kịch bản có sẵn (id cũ sc-1 … sc-7) -> điều kiện kích hoạt
export const DEFAULT_RULES = {
  'sc-1': { type: 'signup_no_booking', value: 3 },
  'sc-2': { type: 'abandoned_booking', value: 2 },
  'sc-3': { type: 'before_checkin', value: 2 },
  'sc-4': { type: 'after_checkout', value: 1 },
  'sc-5': { type: 'inactive', value: 60 },
  'sc-6': { type: 'tier_up', value: 0 },
  'sc-7': { type: 'at_risk', value: 120 },
};

// Tiêu đề thông báo và trang mở ra khi bấm, cho các mẫu tin có sẵn
export const DEFAULT_TEMPLATE_PUSH = {
  'tpl-new-offer': { title: '🎁 Ưu đãi cho lần đầu gửi bé', url: '/booking' },
  'tpl-cart-abandon': { title: '🐾 Bạn chưa đặt phòng xong', url: '/booking' },
  'tpl-checkin-remind': { title: '⏰ Sắp đến ngày gửi bé', url: '/my-booking' },
  'tpl-thankyou': { title: '💛 Cảm ơn bạn đã tin Mèo Vắng Nhà', url: '/my-booking' },
  'tpl-holiday': { title: '🎉 Đặt phòng sớm dịp lễ', url: '/booking' },
  'tpl-tier-up': { title: '🏅 Chúc mừng bạn lên hạng!', url: '/customer-profile?tab=tier' },
  'tpl-winback': { title: '😿 Mèo Vắng Nhà nhớ bé lắm', url: '/promotions' },
};

export const DEFAULT_PROMO_CODE = 'MEOVANG';

export const TEMPLATE_VARIABLES = ['{ten_chu}', '{ten_meo}', '{ngay_nhan}', '{ma_don}', '{ma_uu_dai}', '{hang}'];

// Bổ sung các trường mới (điều kiện, tiêu đề, đích đến) cho kịch bản / mẫu tin đã lưu từ trước
export const normalizeScenario = (sc = {}) => ({
  ...sc,
  channels: Array.isArray(sc.channels) && sc.channels.length ? sc.channels : ['webpush'],
  rule: sc.rule?.type ? { type: sc.rule.type, value: Number(sc.rule.value ?? ruleTypeOf(sc.rule.type)?.defaultValue ?? 0) } : (DEFAULT_RULES[sc.id] || null),
});

export const normalizeTemplate = (tpl = {}) => {
  const defaults = DEFAULT_TEMPLATE_PUSH[tpl.id] || {};
  return {
    ...tpl,
    title: tpl.title || defaults.title || tpl.name || 'Mèo Vắng Nhà 🐾',
    url: tpl.url || defaults.url || '/',
  };
};

// ---------- Ngày giờ theo giờ Việt Nam ----------
const toTime = (value) => {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
};

export const vnDayKey = (value) => {
  const t = typeof value === 'number' ? value : toTime(value);
  if (t === null) return null;
  return new Date(t + VN_OFFSET_MS).toISOString().slice(0, 10);
};

// Ngày dạng YYYY-MM-DD (đơn lưu ngày check-in như vậy) -> mốc giờ 'hh:00' giờ Việt Nam
const dayAt = (dayKey, hour = 8) => {
  if (!dayKey || !/^\d{4}-\d{2}-\d{2}/.test(dayKey)) return null;
  return Date.UTC(+dayKey.slice(0, 4), +dayKey.slice(5, 7) - 1, +dayKey.slice(8, 10), hour) - VN_OFFSET_MS;
};

const bookingDay = (value) => {
  if (!value) return null;
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : vnDayKey(s);
};

export const formatVnDate = (dayKey) => {
  const d = bookingDay(dayKey);
  return d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '';
};

const minutesOf = (hhmm = '') => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
};

// Đang trong khung giờ yên lặng (vd. 21:00 – 08:00 giờ Việt Nam)?
export const isQuietHour = (frequency = {}, now = Date.now()) => {
  const start = minutesOf(frequency.quietStart);
  const end = minutesOf(frequency.quietEnd);
  if (start === null || end === null || start === end) return false;
  const d = new Date(now + VN_OFFSET_MS);
  const cur = d.getUTCHours() * 60 + d.getUTCMinutes();
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
};

// ---------- Trạng thái đơn ----------
const CANCELLED = ['cancelled', 'đã hủy', 'đã huỷ'];
const DONE = ['check-out', 'đã hoàn tất', 'hoàn tất', 'completed'];
const STAYING = ['đang ở', 'checked-in', 'check-in', 'đang lưu trú', 'staying'];

export const stageOf = (booking) => {
  const s = String(booking?.status || '').trim().toLowerCase();
  if (CANCELLED.includes(s)) return 'cancelled';
  if (DONE.includes(s)) return 'completed';
  if (STAYING.includes(s)) return 'staying';
  return 'upcoming';
};

const checkoutDayOf = (b) => bookingDay(b.checkedOutAt) || bookingDay(b.actualCheckOut) || bookingDay(b.checkOut);

// ---------- Khách hàng ----------
const digits = (v) => String(v || '').replace(/\D/g, '');

// Các mã mà thiết bị của khách có thể đã đăng ký nhận thông báo (mã tài khoản hoặc số điện thoại)
export const pushIdsOf = (customer = {}) => {
  const ids = new Set();
  const id = String(customer.id || '');
  if (id && !id.startsWith('phone:')) ids.add(id);
  const phone = digits(customer.phone) || (id.startsWith('phone:') ? digits(id) : '');
  if (phone) {
    ids.add(phone);
    if (phone.startsWith('84')) ids.add(`0${phone.slice(2)}`);
    if (phone.startsWith('0')) ids.add(`84${phone.slice(1)}`);
  }
  if (customer.customerId) ids.add(String(customer.customerId));
  return [...ids];
};

/**
 * Gom hồ sơ, đơn và hồ sơ mèo thành danh sách khách (dùng cho server, nơi không có trang Admin Khách hàng).
 */
export function groupCustomers({ profiles = [], bookings = [], pets = [] } = {}) {
  const map = new Map();
  const phoneIndex = new Map();
  const ensure = (id, seed = {}) => {
    if (!map.has(id)) map.set(id, { id, name: '', phone: '', createdAt: null, hasAccount: false, petNames: [], bookings: [] });
    const c = map.get(id);
    Object.entries(seed).forEach(([k, v]) => { if (v && !c[k]) c[k] = v; });
    const p = digits(c.phone);
    if (p && !phoneIndex.has(p)) phoneIndex.set(p, id);
    return c;
  };
  profiles.forEach((p) => {
    if (!p?.id) return;
    ensure(String(p.id), { name: p.fullName || p.full_name, phone: p.phone, createdAt: p.createdAt || p.created_at }).hasAccount = true;
  });
  const seenBookings = new Set();
  bookings.forEach((b) => {
    const key = b?.code || b?.id;
    if (!key || seenBookings.has(key)) return;
    seenBookings.add(key);
    const owner = b.customerId || b.customer_id;
    const phone = digits(b.customerPhone || b.ownerPhone || b.phone);
    const id = owner || (phone && phoneIndex.get(phone)) || (phone ? `phone:${phone}` : null);
    if (!id) return;
    const c = ensure(String(id), { name: b.customerName || b.ownerName, phone: b.customerPhone || b.ownerPhone });
    if (owner) c.hasAccount = true;
    c.bookings.push(b);
  });
  pets.forEach((pet) => {
    const owner = pet?.ownerId || pet?.user_id || pet?.customerId;
    if (owner && map.has(String(owner)) && pet.name) map.get(String(owner)).petNames.push(pet.name);
  });
  return [...map.values()];
}

// Khách từ trang Admin > Khách hàng (buildCustomers) -> dạng dùng cho bộ máy
export const fromAdminCustomer = (c = {}) => ({
  id: c.id,
  name: c.fullName || c.name || 'Khách hàng',
  phone: c.phone || '',
  createdAt: c.createdAt || null,
  hasAccount: Boolean(c.hasAccount),
  petNames: (c.pets || []).map((p) => p?.name).filter(Boolean),
  bookings: c.bookings || [],
  segment: c.segment,
});

const petNamesOf = (customer, booking) => {
  const fromBooking = booking?.catNames || booking?.petName;
  if (fromBooking) return String(fromBooking);
  const names = [...new Set(customer.petNames || [])];
  return names.length ? names.join(', ') : 'mèo cưng';
};

const tierShort = (tier = '') => String(tier).replace(/^HẠNG\s+/i, '').toLowerCase().replace(/(^|\s)\S/g, (s) => s.toUpperCase());

// ---------- Ghép nội dung ----------
export const fillTemplate = (text = '', vars = {}) =>
  String(text || '').replace(/\{(ten_chu|ten_meo|ngay_nhan|ma_don|ma_uu_dai|hang)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null || v === '' ? '' : String(v);
  }).replace(/\s{2,}/g, ' ').trim();

export const variablesFor = (customer = {}, booking = null, { promoCode } = {}) => {
  const membership = calculateMembership(customer.bookings || []);
  return {
    ten_chu: customer.name || 'bạn',
    ten_meo: petNamesOf(customer, booking),
    ngay_nhan: booking ? formatVnDate(booking.checkIn) : '',
    ma_don: booking?.code || booking?.id || '',
    ma_uu_dai: promoCode || DEFAULT_PROMO_CODE,
    hang: tierShort(membership.tier),
  };
};

// Đường dẫn khi bấm thông báo: đơn cụ thể thì mở đúng đơn trong "Lịch đặt của tôi"
export const destinationFor = (baseUrl = '/', booking = null) => {
  const url = baseUrl || '/';
  const code = booking?.code || booking?.id;
  if (!code || !url.startsWith('/my-booking')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}code=${encodeURIComponent(code)}`;
};

export const composeMessage = ({ template, customer, booking = null, promoCode }) => {
  const tpl = normalizeTemplate(template || {});
  const vars = variablesFor(customer, booking, { promoCode: tpl.promoCode || promoCode });
  return {
    title: fillTemplate(tpl.title, vars) || 'Mèo Vắng Nhà 🐾',
    body: fillTemplate(tpl.body, vars),
    url: destinationFor(tpl.url, booking),
  };
};

// ---------- Điều kiện từng loại kịch bản ----------
// Mỗi hàm trả về các "lần gửi" { dedupe, dueAt, booking, reason } cho một khách
const RULES = {
  signup_no_booking(customer, value, ctx) {
    if (!customer.hasAccount) return [];
    const active = customer.bookings.filter((b) => stageOf(b) !== 'cancelled');
    const created = toTime(customer.createdAt);
    if (active.length > 0 || created === null) return [];
    const dueAt = created + value * DAY_MS;
    if (ctx.now - dueAt > 30 * DAY_MS) return []; // tài khoản quá cũ thì không nhắc nữa
    return [{ dedupe: '', dueAt, reason: `Đăng ký ${formatVnDate(vnDayKey(created))}, chưa đặt phòng` }];
  },

  abandoned_booking(customer, value, ctx) {
    const draft = pushIdsOf(customer).map((id) => ctx.drafts[id]).find(Boolean);
    const draftAt = toTime(draft?.at);
    if (draftAt === null || ctx.now - draftAt > 7 * DAY_MS) return [];
    const bookedAfter = customer.bookings.some((b) => (toTime(b.createdAt) || 0) >= draftAt - 60 * 1000);
    if (bookedAfter) return [];
    return [{ dedupe: String(draftAt), dueAt: draftAt + value * HOUR_MS, reason: `Bắt đầu đặt phòng lúc ${new Date(draftAt + VN_OFFSET_MS).toISOString().slice(11, 16)} ngày ${formatVnDate(vnDayKey(draftAt))}` }];
  },

  before_checkin(customer, value) {
    return customer.bookings
      .filter((b) => stageOf(b) === 'upcoming' && bookingDay(b.checkIn))
      .map((b) => {
        const checkIn = bookingDay(b.checkIn);
        return { booking: b, dedupe: b.code || b.id, dueAt: dayAt(checkIn) - value * DAY_MS, expiresAt: dayAt(checkIn, 23), reason: `Check-in ${formatVnDate(checkIn)} (đơn ${b.code || b.id})` };
      });
  },

  after_checkout(customer, value) {
    return customer.bookings
      .filter((b) => stageOf(b) === 'completed' && checkoutDayOf(b))
      .map((b) => {
        const out = checkoutDayOf(b);
        const dueAt = dayAt(out, 9) + value * DAY_MS;
        return { booking: b, dedupe: b.code || b.id, dueAt, expiresAt: dueAt + 7 * DAY_MS, reason: `Check-out ${formatVnDate(out)} (đơn ${b.code || b.id})` };
      });
  },

  inactive(customer, value, ctx, { minBookings = 1 } = {}) {
    const active = customer.bookings.filter((b) => stageOf(b) !== 'cancelled');
    if (active.length < minBookings) return [];
    if (active.some((b) => stageOf(b) === 'upcoming' || stageOf(b) === 'staying')) return [];
    const last = active
      .map((b) => ({ b, t: dayAt(checkoutDayOf(b), 9) || toTime(b.createdAt) }))
      .filter((x) => x.t)
      .sort((a, b) => b.t - a.t)[0];
    if (!last) return [];
    const dueAt = last.t + value * DAY_MS;
    return [{ dedupe: last.b.code || last.b.id, dueAt, reason: `Lần gửi gần nhất ${formatVnDate(vnDayKey(last.t))}` }];
  },

  at_risk(customer, value, ctx) {
    return RULES.inactive(customer, value, ctx, { minBookings: 2 });
  },

  tier_up(customer, value, ctx) {
    const { tier } = calculateMembership(customer.bookings || []);
    if (!tier || tier === TIER_BRONZE) return [];
    const lastPaid = customer.bookings
      .filter((b) => b.paymentStatus === 'Đã thanh toán')
      .map((b) => toTime(b.paidAt || b.checkedOutAt || b.updatedAt || b.createdAt) || 0)
      .sort((a, b) => b - a)[0] || 0;
    if (ctx.now - lastPaid > 30 * DAY_MS) return [];
    return [{ dedupe: tier, dueAt: lastPaid || ctx.now, reason: `Đạt ${tier.toLowerCase()}` }];
  },
};

// ---------- Giới hạn tần suất ----------
const SENT_STATUSES = ['sent'];

export const historyByCustomer = (messages = []) => {
  const map = new Map();
  messages.forEach((m) => {
    if (!SENT_STATUSES.includes(m.status)) return;
    const key = String(m.customerId || '');
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(toTime(m.createdAt) || 0);
  });
  return map;
};

// Lý do chưa gửi được cho khách (null = được gửi)
export const frequencyBlock = (times = [], frequency = {}, now = Date.now()) => {
  const maxPerWeek = Number(frequency.maxPerWeek) || 0;
  const minGapHours = Number(frequency.minGapHours) || 0;
  if (maxPerWeek > 0) {
    const inWeek = times.filter((t) => now - t < 7 * DAY_MS).length;
    if (inWeek >= maxPerWeek) return `Đã nhận ${inWeek}/${maxPerWeek} tin trong 7 ngày`;
  }
  if (minGapHours > 0) {
    const last = Math.max(0, ...times);
    if (last && now - last < minGapHours * HOUR_MS) {
      const left = Math.ceil((minGapHours * HOUR_MS - (now - last)) / HOUR_MS);
      return `Cách tin trước chưa đủ ${minGapHours} giờ (còn ${left} giờ)`;
    }
  }
  return null;
};

export const dedupeKeyOf = (scenarioId, customerId, part = '') => [scenarioId, customerId, part].filter((x) => x !== '').join(':');

/**
 * Tìm mọi tin đến hạn / sắp đến hạn.
 * @returns {{ due: object[], upcoming: object[], blocked: object[] }}
 *   due: gửi được ngay; upcoming: chưa tới giờ (trong 14 ngày tới); blocked: đến hạn nhưng vướng giới hạn tần suất / giờ yên lặng
 */
export function evaluateScenarios({
  customers = [],
  scenarios = [],
  templates = [],
  frequency = {},
  messages = [],
  drafts = {},
  now = Date.now(),
  pushIds = null, // Set các mã đã bật thông báo; null = không biết
} = {}) {
  const ctx = { now, drafts };
  const sentKeys = new Set(messages.filter((m) => m.dedupeKey && SENT_STATUSES.includes(m.status)).map((m) => m.dedupeKey));
  const history = historyByCustomer(messages);
  const quiet = isQuietHour(frequency, now);
  const templateById = new Map(templates.map((t) => [t.id, t]));
  const due = [];
  const upcoming = [];
  const blocked = [];
  const plannedPerCustomer = new Map();

  scenarios.map(normalizeScenario).forEach((sc) => {
    if (!sc.enabled || !sc.rule || !RULES[sc.rule.type]) return;
    const template = templateById.get(sc.templateId);
    if (!template) return;
    customers.forEach((customer) => {
      if (!customer?.id) return;
      const hits = RULES[sc.rule.type](customer, Number(sc.rule.value) || 0, ctx) || [];
      hits.forEach((hit) => {
        if (!hit.dueAt) return;
        const dedupeKey = dedupeKeyOf(sc.id, customer.id, hit.dedupe);
        if (sentKeys.has(dedupeKey)) return;
        if (hit.expiresAt && now > hit.expiresAt) return;
        const ids = pushIdsOf(customer);
        const item = {
          scenarioId: sc.id,
          scenarioName: sc.name,
          templateId: template.id,
          customerId: customer.id,
          customerName: customer.name,
          phone: customer.phone,
          pushIds: ids,
          hasDevice: pushIds ? ids.some((id) => pushIds.has(id)) : null,
          channels: sc.channels,
          dedupeKey,
          dueAt: hit.dueAt,
          reason: hit.reason,
          bookingCode: hit.booking?.code || hit.booking?.id || null,
          ...composeMessage({ template, customer, booking: hit.booking, promoCode: frequency.promoCode }),
        };
        if (hit.dueAt > now) {
          if (hit.dueAt - now <= 14 * DAY_MS) upcoming.push(item);
          return;
        }
        const planned = plannedPerCustomer.get(customer.id) || [];
        const block = quiet
          ? `Đang trong giờ yên lặng (${frequency.quietStart} – ${frequency.quietEnd}), sẽ gửi sau`
          : frequencyBlock([...(history.get(String(customer.id)) || []), ...planned], frequency, now);
        if (block) {
          blocked.push({ ...item, blockReason: block });
          return;
        }
        plannedPerCustomer.set(customer.id, [...planned, now]);
        due.push(item);
      });
    });
  });

  upcoming.sort((a, b) => a.dueAt - b.dueAt);
  return { due, upcoming, blocked };
}

// ---------- Kết quả ----------
/**
 * Số liệu kết quả từ nhật ký tin đã gửi. Thành đơn = khách có đơn mới trong 7 ngày sau khi nhận tin.
 */
export function summarizeResults({ messages = [], customers = [], scenarios = [], days = 30, now = Date.now(), revenueOf = (b) => Number(b.totalAmount) || 0 } = {}) {
  const since = now - days * DAY_MS;
  const sent = messages.filter((m) => m.status === 'sent' && (toTime(m.createdAt) || 0) >= since);
  const byCustomer = new Map(customers.map((c) => [String(c.id), c]));
  const convertedOf = (m) => {
    const c = byCustomer.get(String(m.customerId));
    if (!c) return null;
    const at = toTime(m.createdAt) || 0;
    return (c.bookings || []).find((b) => {
      const t = toTime(b.createdAt);
      return t && t > at && t - at <= 7 * DAY_MS && stageOf(b) !== 'cancelled';
    }) || null;
  };
  const row = (list) => {
    const conv = list.map(convertedOf).filter(Boolean);
    const uniq = [...new Map(conv.map((b) => [b.code || b.id, b])).values()];
    return {
      sent: list.length,
      opened: list.filter((m) => m.shownAt || m.clickedAt).length,
      clicked: list.filter((m) => m.clickedAt).length,
      converted: uniq.length,
      revenue: uniq.reduce((s, b) => s + revenueOf(b), 0),
    };
  };
  const summary = row(sent);
  const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);
  summary.openRate = pct(summary.opened, summary.sent);
  summary.clickRate = pct(summary.clicked, summary.sent);
  summary.convertRate = pct(summary.converted, summary.sent);

  const groups = new Map();
  sent.forEach((m) => {
    const key = m.scenarioId || 'manual';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  });
  const nameOf = (id) => (id === 'manual' ? 'Gửi thủ công' : scenarios.find((s) => s.id === id)?.name || id);
  const byScenario = [...groups.entries()].map(([id, list]) => ({ id, name: nameOf(id), ...row(list) }))
    .sort((a, b) => b.sent - a.sent);
  return { summary, byScenario };
}
