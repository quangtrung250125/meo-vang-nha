// Khuyến mãi, điểm thưởng, hạng thành viên và mã giới thiệu: phần tính toán dùng chung cho trang khách,
// trang Admin và máy chủ (/api/marketing/loyalty). Không đọc / ghi dữ liệu ở đây, chỉ tính.

import {
  initialPromotions,
  initialVouchers,
  initialGiftsCombos,
  initialMinigameSettings,
  initialMinigamePrizes,
  initialLoyaltyTiers,
  initialLoyaltyRules,
  initialReferralSettings,
  validateVoucherForBooking,
} from '../pages/AdminPromotions/promotionsStore.js';
import { buildInvoice } from './bookingInvoice.js';

// Các phần cài đặt Admin lưu trên máy chủ (mỗi phần là 1 tab trong trang Khuyến mãi & Điểm thưởng)
export const CONFIG_KEYS = ['promotions', 'vouchers', 'gifts', 'minigameSettings', 'minigamePrizes', 'tiers', 'rules', 'referralSettings'];

// Mã dành cho khách được giới thiệu: giảm 15% đơn đầu tiên (Admin sửa được ở tab Mã giảm giá)
const REFERRAL_VOUCHER = {
  id: 'vouch-ref',
  code: 'REFNEW15',
  discountType: 'percentage',
  discountValue: 15,
  maxDiscount: 200000,
  displayValue: 'Giảm 15% đơn đầu tiên (tối đa 200k)',
  promoName: 'Ưu đãi bạn mới được giới thiệu',
  promoId: '',
  maxUsage: 1000,
  limitPerCustomer: 1,
  minBookingDays: 1,
  minOrderValue: 0,
  targetGroup: 'new',
  validUntil: '31/12/2027',
  status: 'active',
};

// Cài đặt mặc định: lấy từ bộ mẫu của trang Admin nhưng bỏ hết số liệu giả (lượt dùng, ngân sách đã chi,
// số khách mỗi hạng...). Các số đó giờ được đếm từ dữ liệu thật.
export function defaultLoyaltyConfig() {
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const vouchers = clone(initialVouchers).map((v) => ({
    ...v,
    usageCount: 0,
    status: v.status === 'exhausted' ? 'expired' : v.status,
  }));
  if (!vouchers.some((v) => v.code === REFERRAL_VOUCHER.code)) vouchers.push({ ...REFERRAL_VOUCHER });
  return {
    promotions: clone(initialPromotions).map((p) => ({ ...p, usageCount: 0, budgetUsed: 0 })),
    vouchers,
    gifts: clone(initialGiftsCombos).map((g) => ({ ...g, stockUsed: 0 })),
    minigameSettings: {
      ...clone(initialMinigameSettings),
      totalPlaysThisMonth: 0,
      participatingCustomers: 0,
      pointsAwardedThisMonth: 0,
      prizesWonThisMonth: 0,
    },
    minigamePrizes: clone(initialMinigamePrizes).map((p) => ({ ...p, awardedCount: 0 })),
    tiers: clone(initialLoyaltyTiers).map((t) => ({ ...t, customerCount: 0 })),
    rules: clone(initialLoyaltyRules),
    referralSettings: {
      ...clone(initialReferralSettings),
      totalReferrals: 0,
      completedBookings: 0,
      pointsRewarded: 0,
      revenueGenerated: 0,
    },
  };
}

// Gộp cài đặt đã lưu với mặc định (phần nào chưa lưu thì dùng mặc định)
export function mergeLoyaltyConfig(saved = {}) {
  const base = defaultLoyaltyConfig();
  const out = { ...base };
  CONFIG_KEYS.forEach((key) => {
    const value = saved?.[key];
    if (value === undefined || value === null) return;
    if (Array.isArray(base[key])) out[key] = Array.isArray(value) ? value : base[key];
    else out[key] = { ...base[key], ...(typeof value === 'object' ? value : {}) };
  });
  if (saved?.updatedAt) out.updatedAt = saved.updatedAt;
  return out;
}

export const normalizeCode = (code) => String(code || '').trim().toUpperCase().replace(/\s+/g, '');

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ---------- Mã giới thiệu ----------
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// Mã giới thiệu cố định theo tài khoản, dạng MEO + 5 ký tự (không có 0/O/1/I/L dễ nhầm)
export function referralCodeFor(userId, salt = 0) {
  const str = `${userId || ''}#${salt}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < str.length; i += 1) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c, 2246822519) >>> 0;
  }
  let n = (h1 ^ (h2 << 7)) >>> 0;
  let out = '';
  for (let i = 0; i < 5; i += 1) {
    out += CODE_ALPHABET[n % CODE_ALPHABET.length];
    n = Math.floor(n / CODE_ALPHABET.length) ^ (i === 2 ? h2 : 0);
    n >>>= 0;
  }
  return `MEO${out}`;
}

export const referralLinkFor = (code, origin = 'https://meovangnha.store') => `${origin}/?ref=${encodeURIComponent(code)}`;

// ---------- Đơn của khách ----------
const lower = (s) => String(s || '').trim().toLowerCase();
const COMPLETED = ['check-out', 'đã hoàn tất', 'hoàn tất', 'completed', 'đã hoàn thành'];
const CANCELLED = ['cancelled', 'đã hủy', 'đã huỷ'];
export const isCompletedBooking = (b) => COMPLETED.includes(lower(b?.status));
export const isCancelledBooking = (b) => CANCELLED.includes(lower(b?.status));
const dayOf = (v) => {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(String(v))) return String(v).slice(0, 10);
  const t = new Date(v);
  return Number.isNaN(t.getTime()) ? '' : t.toISOString().slice(0, 10);
};

// Số tiền khách thực trả của đơn (hóa đơn cuối cùng, đã trừ mã giảm giá và điểm)
export const netTotalOf = (booking) => {
  try {
    return Math.max(0, toNum(buildInvoice(booking)?.total));
  } catch {
    // Đơn cũ thiếu dữ liệu để lập hóa đơn: dùng số tiền đã lưu
    return Math.max(0, toNum(booking?.totalAmount ?? booking?.totalPrice));
  }
};

/**
 * Tổng hợp chi tiêu của khách từ các đơn đã check-out (dùng để xếp hạng, tính nhóm khách cho mã giảm giá).
 */
export function spendingOf(bookings = []) {
  const unique = new Map();
  bookings.forEach((b) => {
    const code = b?.code || b?.id;
    if (code) unique.set(code, { ...(unique.get(code) || {}), ...b });
  });
  const list = [...unique.values()];
  const completed = list.filter(isCompletedBooking);
  const active = list.filter((b) => !isCancelledBooking(b));
  const lastCompletedDay = completed
    .map((b) => dayOf(b.checkedOutAt || b.checkOut))
    .filter(Boolean)
    .sort()
    .pop() || '';
  return {
    spend: completed.reduce((s, b) => s + netTotalOf(b), 0),
    completedCount: completed.length,
    activeCount: active.length,
    lastCompletedDay,
  };
}

// ---------- Hạng thành viên ----------
const sortTiers = (tiers = []) => [...tiers].sort((a, b) => toNum(a.minSpend) - toNum(b.minSpend) || toNum(a.minBookings) - toNum(b.minBookings));

/**
 * Hạng theo chi tiêu đã hoàn tất: đạt mức chi tiêu tối thiểu HOẶC đủ số đơn hoàn tất của hạng đó.
 * @returns {{ tier, next, progress }} progress: % tiến tới hạng kế tiếp theo chi tiêu
 */
export function tierFor({ spend = 0, completedCount = 0 } = {}, tiers = defaultLoyaltyConfig().tiers) {
  const sorted = sortTiers(tiers);
  if (sorted.length === 0) return { tier: null, next: null, progress: 100 };
  let current = sorted[0];
  sorted.forEach((t) => {
    const minSpend = toNum(t.minSpend);
    const minBookings = toNum(t.minBookings);
    const bySpend = minSpend <= 0 || spend >= minSpend;
    const byBookings = minBookings > 0 && completedCount >= minBookings;
    if (bySpend || byBookings) current = t;
  });
  const idx = sorted.indexOf(current);
  const next = sorted[idx + 1] || null;
  const progress = next
    ? Math.min(100, Math.round((spend / Math.max(1, toNum(next.minSpend))) * 100))
    : 100;
  return { tier: current, next, progress };
}

// Khóa hạng ngắn gọn: 'bronze' | 'silver' | 'gold' | 'diamond'
export const tierKeyOf = (tier) => String(tier?.id || '').replace(/^tier-/, '') || 'bronze';

// ---------- Điểm ----------
export const balanceOf = (ledger = []) => ledger.reduce((s, e) => s + toNum(e.delta), 0);

// Điểm thưởng khi hoàn tất đơn: (số tiền / số tiền cho 1 điểm) × hệ số hạng
export function pointsForSpend(amount, rules = {}, tier = null) {
  const per = Math.max(1, toNum(rules.spendForOnePoint, 10000));
  const multiplier = Math.max(0, toNum(tier?.multiplier, 1)) || 1;
  return Math.max(0, Math.floor((Math.max(0, toNum(amount)) / per) * multiplier));
}

/**
 * Khách dùng điểm trừ vào hóa đơn.
 * @returns {{ ok, points, amount, maxPoints, message }}
 */
export function redeemPoints({ balance = 0, requested = 0, orderTotal = 0, rules = {} }) {
  const valuePerPoint = Math.max(1, toNum(rules.valuePerPoint, 1000));
  const minPoints = Math.max(0, toNum(rules.minPointsToRedeem, 0));
  const maxPercent = Math.min(100, Math.max(0, toNum(rules.maxRedeemPercentPerOrder, 100)));
  const capByOrder = Math.floor((Math.max(0, toNum(orderTotal)) * maxPercent) / 100 / valuePerPoint);
  const maxPoints = Math.max(0, Math.min(Math.floor(toNum(balance)), capByOrder));
  const want = Math.floor(toNum(requested));
  if (want <= 0) return { ok: true, points: 0, amount: 0, maxPoints, message: '' };
  if (toNum(balance) < minPoints) {
    return { ok: false, points: 0, amount: 0, maxPoints, message: `Cần tối thiểu ${minPoints} điểm mới được dùng điểm (bạn đang có ${Math.floor(toNum(balance))} điểm).` };
  }
  if (want < minPoints) {
    return { ok: false, points: 0, amount: 0, maxPoints, message: `Mỗi lần dùng tối thiểu ${minPoints} điểm.` };
  }
  if (want > Math.floor(toNum(balance))) {
    return { ok: false, points: 0, amount: 0, maxPoints, message: `Bạn chỉ có ${Math.floor(toNum(balance))} điểm.` };
  }
  if (want > maxPoints) {
    return { ok: false, points: 0, amount: 0, maxPoints, message: `Mỗi đơn chỉ dùng điểm trừ tối đa ${maxPercent}% giá trị đơn (tối đa ${maxPoints} điểm cho đơn này).` };
  }
  return { ok: true, points: want, amount: want * valuePerPoint, maxPoints, message: `Dùng ${want} điểm, giảm ${(want * valuePerPoint).toLocaleString('vi-VN')}đ` };
}

// ---------- Mã giảm giá ----------
/**
 * Nhóm khách để xét mã: khách mới (chưa có đơn nào), khách quay lại, thân thiết / VIP theo hạng,
 * nguy cơ rời bỏ (lần check-out gần nhất cách đây trên 45 ngày).
 */
export function customerGroupOf({ activeCount = 0, completedCount = 0, lastCompletedDay = '' } = {}, tierKey = 'bronze', now = new Date()) {
  const daysSince = lastCompletedDay ? Math.floor((now.getTime() - Date.parse(`${lastCompletedDay}T00:00:00Z`)) / 86400000) : null;
  if (activeCount === 0) return { segment: 'new', bookingCount: 0, tier: tierKey };
  if (daysSince !== null && daysSince > 45) return { segment: 'at_risk', bookingCount: activeCount, tier: tierKey };
  if (tierKey === 'gold' || tierKey === 'diamond') return { segment: 'vip', bookingCount: activeCount, tier: tierKey };
  if (tierKey === 'silver' || completedCount >= 3) return { segment: 'loyal', bookingCount: activeCount, tier: tierKey };
  return { segment: 'returning', bookingCount: activeCount, tier: tierKey };
}

const INACTIVE_VOUCHER = ['paused', 'inactive', 'disabled'];

/**
 * Kiểm tra mã giảm giá thật cho một đơn (dùng ở máy chủ khi khách đặt phòng và ở trang khách để xem trước).
 * @param {object} p
 * @param {object[]} p.vouchers danh sách mã Admin đang có
 * @param {Record<string, number>} p.usage số lượt đã dùng của từng mã (toàn hệ thống)
 * @param {number} p.usedByCustomer số lần khách này đã dùng mã
 */
/**
 * Mã đã quá hạn dùng (validUntil dạng dd/mm/yyyy, hết hạn sau 23:59:59 ngày đó).
 */
export function isVoucherExpired(voucher, now = new Date()) {
  const parts = String(voucher?.validUntil || '').split('/');
  if (parts.length !== 3) return false;
  const expiry = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 23, 59, 59);
  return !Number.isNaN(expiry.getTime()) && now.getTime() > expiry.getTime();
}

export function checkVoucher({ code, vouchers = [], usage = {}, usedByCustomer = 0, group = {}, orderTotal = 0, bookingDays = 1, now = new Date() }) {
  const clean = normalizeCode(code);
  if (!clean) return { valid: false, message: 'Vui lòng nhập mã giảm giá' };
  const voucher = vouchers.find((v) => normalizeCode(v.code) === clean);
  if (!voucher) return { valid: false, message: `Mã giảm giá "${clean}" không tồn tại hoặc đã ngừng áp dụng` };
  if (INACTIVE_VOUCHER.includes(voucher.status)) return { valid: false, message: 'Mã giảm giá này đang tạm dừng', voucher };
  const group2 = group.segment;
  // Nhóm "thân thiết" và "quay lại": khách đã từng đặt phòng
  if (voucher.targetGroup === 'loyal' && !['loyal', 'vip'].includes(group2)) {
    return { valid: false, message: 'Mã này dành cho khách thân thiết (hạng Bạc trở lên hoặc từ 3 đơn hoàn tất)', voucher };
  }
  if (voucher.targetGroup === 'returning' && (group.bookingCount || 0) === 0) {
    return { valid: false, message: 'Mã này dành cho khách đã từng gửi bé tại Mèo Vắng Nhà', voucher };
  }
  const used = toNum(usage[clean]);
  const res = validateVoucherForBooking({
    voucherCode: clean,
    customer: group,
    orderTotal,
    bookingDays,
    usedCountByCustomer: usedByCustomer,
    vouchersList: [{
      ...voucher,
      code: clean,
      usageCount: used,
      // "Hết lượt" / "Hết hạn" chỉ là trạng thái hiển thị: Admin tăng giới hạn hoặc gia hạn thì mã dùng lại được
      status: (voucher.status === 'exhausted' && (!toNum(voucher.maxUsage) || used < toNum(voucher.maxUsage)))
        || (voucher.status === 'expired' && !isVoucherExpired(voucher, now))
        ? 'active'
        : voucher.status,
    }],
  });
  if (!res.valid) return res;
  // Hạn dùng tính theo ngày giờ truyền vào (máy chủ dùng giờ thật)
  if (isVoucherExpired(voucher, now)) return { valid: false, message: `Mã giảm giá đã hết hạn vào ngày ${voucher.validUntil}`, voucher };
  return { ...res, voucher };
}

// ---------- Ưu đãi trên đơn ----------
// booking.promo = { grossTotal, voucherCode, voucherDiscount, pointsUsed, pointsDiscount }
export const promoDiscountOf = (booking) => {
  const p = booking?.promo;
  if (!p) return 0;
  return Math.max(0, toNum(p.voucherDiscount)) + Math.max(0, toNum(p.pointsDiscount));
};

// Số tiền khách phải trả lúc đặt (tổng dịch vụ trừ mã giảm giá và điểm)
export const payableAtBooking = (booking) => Math.max(0, toNum(booking?.totalPrice ?? booking?.totalAmount) - promoDiscountOf(booking));

// Dòng nhật ký điểm hiển thị cho khách / Admin
export const LEDGER_TYPES = {
  earn: { label: 'Tích điểm từ đơn', cls: 'text-emerald-600' },
  redeem: { label: 'Dùng điểm giảm hóa đơn', cls: 'text-rose-600' },
  refund: { label: 'Hoàn điểm', cls: 'text-emerald-600' },
  referral: { label: 'Thưởng giới thiệu', cls: 'text-emerald-600' },
  adjust: { label: 'Admin điều chỉnh', cls: 'text-sky-600' },
};

// ---------- Trang Admin: ghép cài đặt với số liệu thật ----------
const REFERRAL_STAGES = {
  completed: { label: 'Đã hoàn tất đơn đầu', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending_completion: { label: 'Đã đặt phòng (chờ check-out)', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  registered: { label: 'Mới tạo tài khoản', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const fmtDateTime = (iso) => {
  const t = new Date(iso || '');
  if (Number.isNaN(t.getTime())) return '';
  return t.toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

/**
 * Dữ liệu cho 7 tab trang Admin từ /api/marketing/loyalty?op=admin: cài đặt Admin đã lưu + số liệu thật
 * (lượt dùng mã, ngân sách đã chi, số khách mỗi hạng, điểm từng khách, lượt giới thiệu).
 */
export function buildAdminLoyaltyView(overview = {}, origin = 'https://meovangnha.store') {
  const config = mergeLoyaltyConfig(overview.config || {});
  const redemptions = (overview.redemptions || []).filter((r) => r.status !== 'cancelled');
  const customers = overview.customers || [];
  const referrals = overview.referrals || [];
  const ledger = overview.ledger || [];

  const byVoucher = {};
  const byPromo = {};
  redemptions.forEach((r) => {
    if (!r.voucherCode) return;
    const code = normalizeCode(r.voucherCode);
    byVoucher[code] = byVoucher[code] || { count: 0, discount: 0 };
    byVoucher[code].count += 1;
    byVoucher[code].discount += Number(r.voucherDiscount) || 0;
  });

  const vouchers = config.vouchers.map((v) => {
    const used = byVoucher[normalizeCode(v.code)] || { count: 0, discount: 0 };
    if (v.promoId) {
      byPromo[v.promoId] = byPromo[v.promoId] || { count: 0, discount: 0 };
      byPromo[v.promoId].count += used.count;
      byPromo[v.promoId].discount += used.discount;
    }
    const exhausted = Number(v.maxUsage) > 0 && used.count >= Number(v.maxUsage);
    return {
      ...v,
      usageCount: used.count,
      totalDiscount: used.discount,
      status: exhausted ? 'exhausted'
        : isVoucherExpired(v) ? 'expired'
          : (['exhausted', 'expired'].includes(v.status) ? 'active' : v.status),
    };
  });

  const promotions = config.promotions.map((p) => {
    const used = byPromo[p.id] || { count: 0, discount: 0 };
    return { ...p, usageCount: used.count, budgetUsed: used.discount };
  });

  const tiers = config.tiers.map((t) => ({ ...t, customerCount: customers.filter((c) => c.tier === tierKeyOf(t)).length }));

  const customerPoints = customers.map((c) => ({
    ...c,
    expiringPoints: 0,
    pointsToNextTier: 0,
  }));

  const pointsAuditLogs = ledger.map((e) => ({
    id: e.id,
    timestamp: fmtDateTime(e.at),
    customerId: e.customerId,
    customerName: e.customerName || 'Khách hàng',
    action: Number(e.delta) >= 0 ? 'add' : 'subtract',
    amount: Math.abs(Number(e.delta) || 0),
    balanceAfter: e.balanceAfter !== undefined ? e.balanceAfter : null,
    reason: e.reason || LEDGER_TYPES[e.type]?.label || '',
    actor: e.actor || '',
    type: e.type,
  }));

  const referralLogs = referrals
    .map((r) => {
      const stage = REFERRAL_STAGES[r.stage || r.status] ? (r.stage || r.status) : 'registered';
      const done = stage === 'completed';
      const referrerFirst = String(r.referrerName || '').trim().split(/\s+/).pop() || 'người giới thiệu';
      return {
        id: `ref-${r.refereeUserId}`,
        referrerName: r.referrerName || 'Khách hàng',
        referrerPhone: r.referrerPhone || '',
        refereeName: r.refereeName || 'Khách mới',
        refereePhone: r.refereePhone || '',
        catName: '',
        referralCode: r.referralCode,
        bookingLink: referralLinkFor(r.referralCode, origin),
        createdAt: String(r.createdAt || '').slice(0, 10),
        status: stage,
        statusLabel: REFERRAL_STAGES[stage].label,
        statusCls: REFERRAL_STAGES[stage].cls,
        orderCode: done ? r.orderCode : (r.openOrderCode || 'Chưa đặt phòng'),
        orderTotal: done ? Number(r.orderTotal) || 0 : Number(r.openOrderTotal) || 0,
        rewardGiven: done
          ? (Number(r.rewardPoints) > 0 ? `Đã cộng ${r.rewardPoints} điểm cho ${referrerFirst}` : `Đã ghi nhận cho ${referrerFirst}`)
          : (stage === 'pending_completion' ? 'Ghi nhận khi khách mới check-out' : 'Chờ đặt phòng đầu tiên'),
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const completedRefs = referrals.filter((r) => (r.stage || r.status) === 'completed');
  const referralSettings = {
    ...config.referralSettings,
    totalReferrals: referrals.length,
    completedBookings: completedRefs.length,
    pointsRewarded: completedRefs.reduce((s, r) => s + (Number(r.rewardPoints) || 0), 0),
    revenueGenerated: completedRefs.reduce((s, r) => s + (Number(r.orderTotal) || 0), 0),
  };

  return {
    promotions,
    vouchers,
    gifts: config.gifts,
    minigameSettings: config.minigameSettings,
    minigamePrizes: config.minigamePrizes,
    tiers,
    rules: config.rules,
    referralSettings,
    customerPoints,
    pointsAuditLogs,
    referralLogs,
  };
}

const PERIOD_DAYS = { '7days': 7, '30days': 30, quarter: 92, year: 366 };

/**
 * Tab Hiệu quả: số liệu từ các đơn có dùng mã giảm giá / điểm trong kỳ.
 * Doanh thu = tiền khách thực trả của các đơn đó (sau giảm), chi phí = tổng tiền đã giảm.
 */
export function buildPromoAnalytics({ redemptions = [], promotions = [], vouchers = [], customers = [], period = '30days', bookingsInPeriod = null, now = new Date() } = {}) {
  const days = PERIOD_DAYS[period] || 30;
  const from = now.getTime() - days * 86400000;
  const inPeriod = redemptions.filter((r) => r.status !== 'cancelled' && (Date.parse(r.at || '') || 0) >= from);
  const revenueOf = (r) => Number(r.netTotal) || Math.max(0, (Number(r.grossTotal) || 0) - (Number(r.voucherDiscount) || 0) - (Number(r.pointsDiscount) || 0));
  const costOf = (r) => (Number(r.voucherDiscount) || 0) + (Number(r.pointsDiscount) || 0);
  const revenue = inPeriod.reduce((s, r) => s + revenueOf(r), 0);
  const cost = inPeriod.reduce((s, r) => s + costOf(r), 0);
  const roi = cost > 0 ? Math.round(((revenue - cost) / cost) * 100) : 0;

  // 5 tuần gần nhất
  const weeklyUsage = [];
  for (let i = 4; i >= 0; i -= 1) {
    const end = new Date(now.getTime() - i * 7 * 86400000);
    const start = new Date(end.getTime() - 7 * 86400000);
    const rows = redemptions.filter((r) => {
      const t = Date.parse(r.at || '') || 0;
      return r.status !== 'cancelled' && t > start.getTime() && t <= end.getTime();
    });
    const d = (x) => `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`;
    weeklyUsage.push({ week: `Tuần ${d(new Date(start.getTime() + 86400000))}-${d(end)}`, count: rows.length, revenue: rows.reduce((s, r) => s + revenueOf(r), 0) });
  }

  // Khách mới / quay lại trong các đơn dùng ưu đãi
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const newCount = inPeriod.filter((r) => (typeof r.newCustomer === 'boolean'
    ? r.newCustomer
    : (customerById.get(r.customerId || r.userId)?.totalBookings || 0) <= 1)).length;
  const newPct = inPeriod.length ? Math.round((newCount / inPeriod.length) * 100) : 0;

  const rate = (r) => {
    if (r.redemptions === 0) return { rating: 'Chưa có lượt dùng', ratingCls: 'bg-gray-50 text-gray-500 border-gray-200' };
    if (r.roi >= 300) return { rating: 'Xuất sắc', ratingCls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (r.roi >= 100) return { rating: 'Hiệu quả cao', ratingCls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { rating: 'Cần tối ưu', ratingCls: 'bg-amber-50 text-amber-700 border-amber-200' };
  };
  const perfRow = (id, name, type, rows) => {
    const rev = rows.reduce((s, r) => s + revenueOf(r), 0);
    const c = rows.reduce((s, r) => s + costOf(r), 0);
    const row = {
      id,
      campaignName: name,
      type,
      redemptions: rows.length,
      incrementalRevenue: rev,
      promotionCost: c,
      netProfit: rev - c,
      roi: c > 0 ? Math.round(((rev - c) / c) * 100) : 0,
    };
    return { ...row, ...rate(row) };
  };
  const voucherPromo = new Map(vouchers.map((v) => [normalizeCode(v.code), v.promoId]));
  const campaignPerformance = promotions.map((p) => perfRow(
    p.id,
    p.name,
    p.targetGroupLabel || 'Chiến dịch',
    inPeriod.filter((r) => r.voucherCode && (r.voucherPromoId || voucherPromo.get(normalizeCode(r.voucherCode))) === p.id),
  ));
  const otherVoucher = inPeriod.filter((r) => r.voucherCode && !promotions.some((p) => p.id === (r.voucherPromoId || voucherPromo.get(normalizeCode(r.voucherCode)))));
  if (otherVoucher.length) campaignPerformance.push(perfRow('perf-other', 'Mã giảm giá lẻ (không thuộc chiến dịch)', 'Mã giảm giá', otherVoucher));
  const pointRows = inPeriod.filter((r) => Number(r.pointsUsed) > 0);
  campaignPerformance.push(perfRow('perf-points', 'Khách dùng điểm thưởng trừ tiền', 'Điểm thưởng', pointRows.map((r) => ({ ...r, voucherDiscount: 0 }))));

  return {
    summary: {
      views: bookingsInPeriod ?? new Set(inPeriod.map((r) => r.customerId || r.userId).filter(Boolean)).size,
      redemptions: inPeriod.length,
      incrementalRevenue: revenue,
      promotionsCost: cost,
      netProfit: revenue - cost,
      roiPercent: roi,
    },
    weeklyUsage,
    customerDistribution: { newCustomersPercent: newPct, returningCustomersPercent: inPeriod.length ? 100 - newPct : 0 },
    campaignPerformance: campaignPerformance.sort((a, b) => b.redemptions - a.redemptions),
  };
}
