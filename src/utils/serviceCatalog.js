// ==========================================
// DANH MỤC DỊCH VỤ DÙNG CHUNG ADMIN + KHÁCH HÀNG
// ------------------------------------------
// - Dữ liệu gốc vẫn nằm trong src/mockData (không xoá, không sửa): đó là "bản mặc định".
// - Admin sửa gì thì lưu vào bảng Supabase `service_catalog` (mỗi dòng ghi đè 1 dịch vụ / 1 hạng phòng / 1 quy tắc giá).
// - Khi hiển thị: bản mặc định + phần admin đã sửa = dữ liệu khách nhìn thấy.
//   Bảng trống (hoặc Supabase lỗi) thì web hiện y như trước.
// ==========================================

import { packagesList as DEFAULT_PACKAGES, ROOM_SURCHARGES as DEFAULT_ROOM_SURCHARGES } from '../mockData/servicesData.js';
import { ROOM_TYPES as DEFAULT_ROOM_TYPES, BOARDING_PACKAGES as DEFAULT_BOARDING_PACKAGES } from '../mockData/boardingServicesData.js';

export const SERVICE_CATEGORIES = ['Lưu trú', 'Spa - Tắm cắt', 'Dịch vụ khác'];
export const ROOM_KEYS = ['VIP', 'VVIP', 'DELUXE'];

export const formatVnd = (n) => `${Math.round(Number(n) || 0).toLocaleString('vi-VN')}đ`;

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Giá sau ưu đãi, làm tròn tới nghìn đồng (khớp các giá đang có: 200k -10% = 180k...)
export const discountedPrice = (originalPrice, discountPercent) => {
  const original = toNumber(originalPrice);
  const pct = Math.min(100, Math.max(0, toNumber(discountPercent)));
  return Math.round((original * (1 - pct / 100)) / 1000) * 1000;
};

// Từ giá niêm yết + % ưu đãi -> tính lại mọi chuỗi giá mà các trang đang dùng
export function deriveItem(item) {
  const originalPrice = toNumber(item.originalPrice, toNumber(item.price));
  const discountPercent = toNumber(item.discountPercent, 0);
  const price = discountPercent > 0 ? discountedPrice(originalPrice, discountPercent) : originalPrice;
  const prefix = item.pricePrefix ? `${item.pricePrefix} ` : '';
  const derived = {
    ...item,
    originalPrice,
    price,
    discountPercent,
    priceString: `${prefix}${formatVnd(price)}`,
    originalPriceString: discountPercent > 0 ? `${prefix}${formatVnd(originalPrice)}` : '',
    savingsString: formatVnd(originalPrice - price),
    discountBadge: discountPercent > 0 ? `Lần 2: -${discountPercent}%` : '',
    isPromo: discountPercent > 0,
  };
  // Gói lưu trú cũ có thêm giá cơ sở (ứng với phòng VIP) -> giữ đồng bộ với giá mới
  if ('baseOriginalPrice' in item) derived.baseOriginalPrice = originalPrice;
  if ('basePrice' in item) derived.basePrice = price;
  return derived;
}

// "từ 110.000đ" -> tách ra chữ "từ" để admin sửa giá dạng số mà không mất chữ
const pricePrefixOf = (pkg) => {
  const m = /^(\D+?)\s*\d/.exec(pkg.priceString || '');
  return m ? m[1].trim() : '';
};

// Bản mặc định của 1 dịch vụ (lấy từ mockData), kèm các trường admin quản lý thêm
export const DEFAULT_ITEMS = DEFAULT_PACKAGES.map((pkg, index) => ({
  ...pkg,
  pricePrefix: pricePrefixOf(pkg),
  capacity: pkg.capacity || '',
  status: 'active', // active = đang nhận khách, paused = tạm ngưng nhận
  sortOrder: index,
}));

const DEFAULT_ITEM_IDS = new Set(DEFAULT_ITEMS.map((i) => i.id));

export const DEFAULT_ROOMS = ROOM_KEYS.map((key, index) => ({
  key,
  ...DEFAULT_ROOM_TYPES[key],
  surcharge: DEFAULT_ROOM_SURCHARGES[key] ?? 0,
  status: 'active',
  sortOrder: index,
}));

// Quy tắc giá mẫu: để TẮT sẵn nên giá khách thấy không đổi cho tới khi admin bật
export const DEFAULT_RULES = [
  {
    id: 'rule-weekend',
    type: 'weekend',
    name: 'Phụ thu cuối tuần (đêm thứ 6, thứ 7)',
    percent: 10,
    weekdays: [5, 6],
    appliesTo: ['Lưu trú'],
    active: false,
  },
  {
    id: 'rule-tet',
    type: 'holiday',
    name: 'Phụ thu Tết Nguyên Đán',
    percent: 30,
    startDate: '2027-02-01',
    endDate: '2027-02-14',
    appliesTo: ['Lưu trú'],
    active: false,
  },
  {
    id: 'rule-summer',
    type: 'season',
    name: 'Mùa hè cao điểm',
    percent: 15,
    startDate: '2027-06-01',
    endDate: '2027-08-31',
    repeatYearly: true,
    appliesTo: ['Lưu trú'],
    active: false,
  },
  {
    id: 'rule-long-stay',
    type: 'discount',
    name: 'Gửi từ 7 đêm giảm thêm 5%',
    percent: 5,
    minNights: 7,
    minCats: 1,
    appliesTo: ['Lưu trú'],
    active: false,
  },
];

export const RULE_TYPES = {
  weekend: { label: 'Cuối tuần', priority: 1 },
  season: { label: 'Theo mùa', priority: 2 },
  holiday: { label: 'Lễ, Tết', priority: 3 },
  discount: { label: 'Giảm giá', priority: 0 },
};

/**
 * Gộp bản mặc định với các dòng trên Supabase.
 * rows: [{ id, kind: 'item'|'room'|'rule', data, is_published, sort_order }]
 */
export function mergeCatalog(rows = []) {
  const byKind = { item: new Map(), room: new Map(), rule: new Map() };
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row && byKind[row.kind] && row.id) byKind[row.kind].set(row.id, row);
  }

  const applyRow = (base, row) => {
    if (!row) return base;
    const next = { ...base, ...(row.data || {}) };
    if (typeof row.is_published === 'boolean') next.published = row.is_published;
    if (Number.isFinite(row.sort_order)) next.sortOrder = row.sort_order;
    next.updatedAt = row.updated_at || next.updatedAt;
    next.edited = true;
    return next;
  };

  const items = [
    ...DEFAULT_ITEMS.map((d) => applyRow({ ...d, published: true, isCustom: false }, byKind.item.get(d.id))),
    ...[...byKind.item.values()]
      .filter((row) => !DEFAULT_ITEM_IDS.has(row.id))
      .map((row) => applyRow({ id: row.id, category: 'Dịch vụ khác', period: '/lần', features: [], status: 'active', published: true, isCustom: true, sortOrder: 999 }, row)),
  ]
    .map((item) => ({ ...deriveItem(item), id: item.id }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const rooms = DEFAULT_ROOMS.map((d) => applyRow({ ...d, published: true }, byKind.room.get(d.key)));

  const defaultRuleIds = new Set(DEFAULT_RULES.map((r) => r.id));
  const rules = [
    ...DEFAULT_RULES.map((d) => applyRow({ ...d, isCustom: false }, byKind.rule.get(d.id))),
    ...[...byKind.rule.values()]
      .filter((row) => !defaultRuleIds.has(row.id))
      .map((row) => applyRow({ id: row.id, type: 'discount', percent: 0, appliesTo: ['Lưu trú'], active: false, isCustom: true }, row)),
  ].filter((r) => !r.deleted);

  return { items, rooms, rules };
}

// Dịch vụ khách được thấy: đang đăng và không tạm ngưng
export const isItemVisible = (item) => item && item.published !== false && item.status !== 'paused';

export const roomSurchargesOf = (rooms = []) =>
  Object.fromEntries(rooms.map((r) => [r.key, toNumber(r.surcharge)]));

export const roomTypesOf = (rooms = []) =>
  Object.fromEntries(rooms.map((r) => [r.key, { ...(DEFAULT_ROOM_TYPES[r.key] || {}), ...r }]));

// Mã gói trong trang chi tiết lưu trú khác mã ở danh sách gói (p4 <-> p4-tt)
const BOARDING_TO_ITEM_ID = { p1: 'p1', p2: 'p2', p3: 'p3', p4: 'p4-tt' };

/**
 * Gói lưu trú chi tiết (trang Dịch vụ của khách) lấy giá, tên, mô tả, phụ phí phòng
 * từ dữ liệu admin đã sửa; gói bị gỡ hoặc tạm ngưng thì ẩn.
 */
export function buildBoardingPackages(items = [], rooms = []) {
  const itemById = new Map(items.map((i) => [i.id, i]));
  const roomByKey = new Map(rooms.map((r) => [r.key, r]));
  return DEFAULT_BOARDING_PACKAGES.map((pkg) => {
    const item = itemById.get(BOARDING_TO_ITEM_ID[pkg.id] || pkg.id);
    if (!item) return pkg;
    if (!isItemVisible(item)) return null;
    const upgrades = (pkg.availableUpgrades || [])
      .filter((u) => {
        const room = roomByKey.get(u.roomId);
        return !room || (room.published !== false && room.status !== 'paused') || u.roomId === pkg.defaultRoomId;
      })
      .map((u) => {
        if (u.surcharge === 0 || u.roomId === pkg.defaultRoomId) return u;
        const surcharge = toNumber(roomByKey.get(u.roomId)?.surcharge, u.surcharge);
        return { ...u, surcharge, surchargeString: `+${formatVnd(surcharge)}/ngày` };
      });
    return {
      ...pkg,
      itemId: item.id,
      name: item.name || pkg.name,
      tagline: item.tagline || pkg.tagline,
      basePrice: item.originalPrice,
      priceString: formatVnd(item.originalPrice),
      period: item.period || pkg.period,
      highlightBadge: item.highlightBadge ?? pkg.highlightBadge,
      availableUpgrades: upgrades,
    };
  }).filter(Boolean);
}

// ── Quy tắc giá (mùa, cuối tuần, lễ Tết, giảm giá) ──────────────────────────

const toDate = (str) => {
  if (!str) return null;
  const d = new Date(`${String(str).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Đêm `dateStr` (YYYY-MM-DD) có nằm trong khoảng ngày của quy tắc không
export function ruleCoversDate(rule, dateStr) {
  if (!rule || !dateStr) return false;
  if (rule.type === 'weekend') {
    const d = toDate(dateStr);
    return Boolean(d) && (rule.weekdays || []).map(Number).includes(d.getDay());
  }
  if (!rule.startDate || !rule.endDate) return false;
  if (rule.repeatYearly) {
    const md = dateStr.slice(5, 10);
    const from = String(rule.startDate).slice(5, 10);
    const to = String(rule.endDate).slice(5, 10);
    return from <= to ? md >= from && md <= to : md >= from || md <= to; // khoảng vắt qua năm mới
  }
  return dateStr >= String(rule.startDate).slice(0, 10) && dateStr <= String(rule.endDate).slice(0, 10);
}

const appliesToCategory = (rule, category) => {
  const list = Array.isArray(rule.appliesTo) && rule.appliesTo.length > 0 ? rule.appliesTo : ['Lưu trú'];
  return list.includes(category);
};

// Danh sách các đêm lưu trú (đêm đầu = ngày gửi)
export function stayNights(checkIn, days) {
  const start = toDate(checkIn);
  if (!start || !days) return [];
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return isoOf(d);
  });
}

/**
 * Tính tiền phụ thu / giảm giá theo quy tắc admin đã bật.
 * - Mỗi đêm chỉ áp 1 mức theo ngày: Lễ Tết ưu tiên trước, rồi Theo mùa, rồi Cuối tuần.
 * - Quy tắc "Giảm giá" (gửi dài ngày, nhiều mèo) chỉ lấy 1 mức tốt nhất, không cộng dồn.
 * @returns {{ lines: Array<{id,name,type,amount,nights?}>, total: number }}
 */
export function computeRuleAdjustments({ rules = [], checkIn, days = 0, cats = 1, lodgingNightly = 0, spaTotal = 0, extraTotal = 0 }) {
  const active = (rules || []).filter((r) => r && r.active && toNumber(r.percent) !== 0);
  if (active.length === 0) return { lines: [], total: 0 };
  const catCount = Math.max(1, toNumber(cats, 1));

  const dateRules = active
    .filter((r) => r.type !== 'discount' && appliesToCategory(r, 'Lưu trú'))
    .sort((a, b) => (RULE_TYPES[b.type]?.priority || 0) - (RULE_TYPES[a.type]?.priority || 0));

  const perRule = new Map();
  for (const night of stayNights(checkIn, days)) {
    const rule = dateRules.find((r) => ruleCoversDate(r, night));
    if (!rule) continue;
    const amount = Math.round((lodgingNightly * toNumber(rule.percent)) / 100) * catCount;
    const cur = perRule.get(rule.id) || { id: rule.id, name: rule.name, type: rule.type, percent: toNumber(rule.percent), amount: 0, nights: 0 };
    cur.amount += amount;
    cur.nights += 1;
    perRule.set(rule.id, cur);
  }
  const lines = [...perRule.values()];
  const dateTotal = lines.reduce((s, l) => s + l.amount, 0);

  const lodgingTotal = lodgingNightly * days * catCount + dateTotal;
  const baseByCategory = { 'Lưu trú': lodgingTotal, 'Spa - Tắm cắt': spaTotal, 'Dịch vụ khác': extraTotal };
  let best = null;
  for (const r of active.filter((x) => x.type === 'discount')) {
    if (days < toNumber(r.minNights, 0) || catCount < toNumber(r.minCats, 0)) continue;
    const base = SERVICE_CATEGORIES.filter((c) => appliesToCategory(r, c)).reduce((s, c) => s + (baseByCategory[c] || 0), 0);
    const amount = -Math.round((base * toNumber(r.percent)) / 100);
    if (amount < 0 && (!best || amount < best.amount)) best = { id: r.id, name: r.name, type: r.type, percent: toNumber(r.percent), amount };
  }
  if (best) lines.push(best);

  return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
}

// Mô tả ngắn 1 quy tắc cho khách đọc
export function describeRule(rule) {
  const pct = toNumber(rule.percent);
  const sign = rule.type === 'discount' ? `Giảm ${pct}%` : pct >= 0 ? `+${pct}%` : `${pct}%`;
  const fmtDate = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}${rule.repeatYearly ? '' : `/${s.slice(0, 4)}`}` : '');
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  let when = '';
  if (rule.type === 'weekend') when = `các đêm ${(rule.weekdays || []).map((d) => dayNames[d]).join(', ')}`;
  else if (rule.type === 'discount') {
    const parts = [];
    if (toNumber(rule.minNights) > 1) parts.push(`gửi từ ${rule.minNights} đêm`);
    if (toNumber(rule.minCats) > 1) parts.push(`từ ${rule.minCats} bé`);
    when = parts.join(', ') || 'mọi đơn';
  } else when = `từ ${fmtDate(rule.startDate)} đến ${fmtDate(rule.endDate)}${rule.repeatYearly ? ' hằng năm' : ''}`;
  const target = (rule.appliesTo || ['Lưu trú']).join(', ');
  return `${sign} giá ${target.toLowerCase()} ${when}`;
}

// ── Hiệu suất dịch vụ (từ các đơn đặt phòng) ──────────────────────────────

const isCancelled = (b) => String(b?.status || '').toUpperCase().includes('CANCEL') || /hủy|huỷ/i.test(String(b?.status || ''));

const roomTypeOf = (b) => {
  const r = b?.selectedRoom;
  const raw = r?.type || (typeof r?.id === 'string' ? r.id.split('-')[0] : '') || (typeof b?.roomId === 'string' ? b.roomId.split('-')[0] : '');
  const key = String(raw || '').toUpperCase();
  return ROOM_KEYS.includes(key) ? key : null;
};

export const CAMERA_ADDON_ID = 'addon-camera';

// Các dịch vụ trong 1 đơn: gói lưu trú, spa, dịch vụ khác, camera thêm
export function servicesInBooking(booking, items = []) {
  const byName = new Map(items.map((i) => [String(i.name || '').toLowerCase(), i.id]));
  const ids = new Set();
  for (const sel of [booking.selectedLodging || booking.selectedPackage, booking.selectedSpa, booking.selectedExtra]) {
    if (sel?.id) ids.add(sel.id);
    else if (sel?.name && byName.has(sel.name.toLowerCase())) ids.add(byName.get(sel.name.toLowerCase()));
  }
  for (const name of Array.isArray(booking.packages) ? booking.packages : []) {
    const id = byName.get(String(name).toLowerCase());
    if (id) ids.add(id);
  }
  if (booking.addCamera) ids.add(CAMERA_ADDON_ID);
  return [...ids];
}

/**
 * Thống kê: số lần bán, doanh thu ước tính, tỷ lệ mua kèm, gợi ý upsell theo hạng phòng.
 */
export function computeServicePerformance(bookings = [], items = []) {
  const valid = (Array.isArray(bookings) ? bookings : []).filter((b) => b && !isCancelled(b));
  const itemById = new Map(items.map((i) => [i.id, i]));
  const nameOf = (id) => (id === CAMERA_ADDON_ID ? 'Camera 24/7 thêm' : itemById.get(id)?.name || id);

  const sold = new Map();
  const revenue = new Map();
  const pairs = new Map();
  const withOthers = new Map(); // số đơn có dịch vụ này VÀ ít nhất 1 dịch vụ khác
  const byRoom = new Map();

  for (const b of valid) {
    const ids = servicesInBooking(b, items);
    const start = toDate(b.checkIn);
    const end = toDate(b.checkOut);
    const days = start && end ? Math.max(1, Math.round((end - start) / 86400000)) : 1;
    const cats = Math.max(1, toNumber(b.cats, 1));
    for (const id of ids) {
      sold.set(id, (sold.get(id) || 0) + 1);
      const item = itemById.get(id);
      let money = 0;
      if (id === CAMERA_ADDON_ID) money = 10000 * days;
      else if (item?.category === 'Lưu trú') money = toNumber((b.selectedLodging || b.selectedPackage)?.price, item.price) * days * cats;
      else if (item?.category === 'Spa - Tắm cắt') money = toNumber(item.price) * cats;
      else if (item) money = toNumber(item.price);
      revenue.set(id, (revenue.get(id) || 0) + money);
    }
    for (const a of ids) for (const c of ids) if (a !== c) pairs.set(`${a}|${c}`, (pairs.get(`${a}|${c}`) || 0) + 1);
    if (ids.length > 1) for (const a of ids) withOthers.set(a, (withOthers.get(a) || 0) + 1);

    const room = roomTypeOf(b);
    if (room) {
      const r = byRoom.get(room) || { room, bookings: 0, addons: new Map() };
      r.bookings += 1;
      for (const id of ids) {
        if (itemById.get(id)?.category === 'Lưu trú') continue;
        r.addons.set(id, (r.addons.get(id) || 0) + 1);
      }
      byRoom.set(room, r);
    }
  }

  const ids = [...new Set([...items.map((i) => i.id), ...sold.keys()])];
  const services = ids.map((id) => {
    const count = sold.get(id) || 0;
    const partners = ids
      .filter((other) => other !== id && (pairs.get(`${id}|${other}`) || 0) > 0)
      .map((other) => ({ id: other, name: nameOf(other), count: pairs.get(`${id}|${other}`), rate: count ? pairs.get(`${id}|${other}`) / count : 0 }))
      .sort((x, y) => y.count - x.count);
    return {
      id,
      name: nameOf(id),
      category: id === CAMERA_ADDON_ID ? 'Dịch vụ khác' : itemById.get(id)?.category || '',
      sold: count,
      revenue: revenue.get(id) || 0,
      share: valid.length ? count / valid.length : 0,
      attachRate: count ? (withOthers.get(id) || 0) / count : 0,
      topPartners: partners.slice(0, 3),
    };
  }).sort((a, b) => b.sold - a.sold);

  const addonItems = items.filter((i) => i.category !== 'Lưu trú' && isItemVisible(i));
  const upsell = [...byRoom.values()].map((r) => {
    const addons = [...r.addons.entries()]
      .map(([id, n]) => ({ id, name: nameOf(id), count: n, rate: n / r.bookings }))
      .sort((a, b) => b.count - a.count);
    const top = addons[0] || null;
    const boughtIds = new Set(addons.map((a) => a.id));
    const missing = addonItems.find((i) => !boughtIds.has(i.id)) || null;
    let suggestion;
    if (top && top.rate >= 0.4) suggestion = `Khách phòng ${r.room} hay mua kèm "${top.name}" (${Math.round(top.rate * 100)}%). Nên gợi ý sẵn món này ngay khi khách chọn phòng ${r.room}, hoặc tạo combo phòng + ${top.name}.`;
    else if (top) suggestion = `Khách phòng ${r.room} mua kèm "${top.name}" còn ít (${Math.round(top.rate * 100)}%). Có thể tặng thử hoặc giảm giá món này cho khách phòng ${r.room}.`;
    else suggestion = `Khách phòng ${r.room} chưa mua kèm dịch vụ nào.${missing ? ` Nên gợi ý "${missing.name}" ở bước chọn dịch vụ.` : ''}`;
    return { room: r.room, bookings: r.bookings, addons, top, suggestion };
  }).sort((a, b) => ROOM_KEYS.indexOf(a.room) - ROOM_KEYS.indexOf(b.room));

  const withAddon = valid.filter((b) => servicesInBooking(b, items).some((id) => id === CAMERA_ADDON_ID || itemById.get(id)?.category !== 'Lưu trú')).length;

  return {
    totalBookings: valid.length,
    addonRate: valid.length ? withAddon / valid.length : 0,
    services,
    upsell,
  };
}
