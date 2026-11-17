import { getRequestUser, getBearerToken } from './auth.js';
import { listAllStoredBookings } from './bookingsDb.js';
import { getSyncData } from './syncService.js';
import { getRow, putRow, insertRowOnce, listRows, isUsingDatabase } from './loyaltyDb.js';
import {
  CONFIG_KEYS,
  defaultLoyaltyConfig,
  isPromotionCurrentlyActive,
  mergeLoyaltyConfig,
  normalizeCode,
  referralCodeFor,
  spendingOf,
  tierFor,
  tierKeyOf,
  balanceOf,
  pointsForSpend,
  redeemPoints,
  customerGroupOf,
  checkVoucher,
  netTotalOf,
  isCompletedBooking,
  isCancelledBooking,
} from '../../src/utils/loyalty.js';
import { countStayDays } from '../../src/utils/bookingPricing.js';

// Khuyến mãi & Điểm thưởng phía máy chủ: kiểm tra mã giảm giá / điểm khi khách đặt phòng, tự cộng điểm khi
// check-out, hoàn điểm & lượt mã khi hủy đơn, ghi nhận giới thiệu bạn bè. Gọi qua /api/marketing/loyalty?op=...

const MAX_REFERRAL_CLAIM_DAYS = 7;

const bodyOf = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
};

// ---------- Cài đặt ----------
export async function getLoyaltyConfig() {
  const saved = await getRow('config');
  if (!saved) return mergeLoyaltyConfig({});
  if (saved.customerPromotionsMigratedV1) return mergeLoyaltyConfig(saved);

  const defaultPromotions = defaultLoyaltyConfig().promotions;
  const promotions = Array.isArray(saved.promotions)
    ? [...saved.promotions]
    : defaultPromotions;
  const ids = new Set(promotions.map((promo) => promo.id));
  const codes = new Set(promotions.map((promo) => normalizeCode(promo.code)).filter(Boolean));
  const legacyPromotions = defaultPromotions.filter((promo) => promo.customerLegacy);
  legacyPromotions.forEach((promo) => {
    const code = normalizeCode(promo.code);
    if (ids.has(promo.id) || (code && codes.has(code))) return;
    promotions.push(promo);
    ids.add(promo.id);
    if (code) codes.add(code);
  });

  const migrated = {
    ...saved,
    promotions,
    customerPromotionsMigratedV1: true,
  };
  await putRow('config', 'config', null, migrated);
  return mergeLoyaltyConfig(migrated);
}

export async function saveLoyaltyConfig(partial = {}, actor = '') {
  const current = (await getRow('config')) || {};
  const next = { ...current };
  CONFIG_KEYS.forEach((key) => {
    if (partial[key] !== undefined) next[key] = partial[key];
  });
  next.updatedAt = new Date().toISOString();
  next.updatedBy = actor;
  await putRow('config', 'config', null, next);
  return mergeLoyaltyConfig(next);
}

// ---------- Đơn của khách ----------
// Đơn đang mở / vừa đóng trong bộ nhớ server (bookingsService gắn vào khi khởi động, tránh import vòng)
let memoryBookingsProvider = () => [];
export function setMemoryBookingsProvider(fn) {
  memoryBookingsProvider = typeof fn === 'function' ? fn : () => [];
}

const codeOf = (b) => b?.code || b?.id;

async function allBookings(accessToken = null, extra = []) {
  const map = new Map();
  const add = (b) => {
    const code = codeOf(b);
    if (!code || String(code).includes('BK')) return;
    map.set(code, { ...(map.get(code) || {}), ...b, code });
  };
  (getSyncData()?.bookings || []).forEach(add);
  (await listAllStoredBookings(accessToken).catch(() => [])).forEach(add);
  (memoryBookingsProvider() || []).forEach(add);
  extra.forEach(add);
  return [...map.values()];
}

const bookingsOfUser = (bookings, userId) => bookings.filter((b) => userId && b.customerId === userId);

// ---------- Tài khoản điểm & mã giới thiệu ----------
async function ensureAccount(user) {
  if (!user?.id) return null;
  const id = `account:${user.id}`;
  let account = await getRow(id);
  if (account?.referralCode) {
    // Cập nhật họ tên / SĐT mới nhất để Admin nhìn thấy
    const isAdmin = Boolean(user.isAdmin);
    if ((user.fullName && account.fullName !== user.fullName) || (user.phone && account.phone !== user.phone) || Boolean(account.isAdmin) !== isAdmin) {
      account = { ...account, fullName: user.fullName || account.fullName, phone: user.phone || account.phone, isAdmin };
      await putRow(id, 'account', user.id, account);
    }
    return account;
  }
  // Cấp mã giới thiệu cố định; trùng mã (rất hiếm) thì đổi muối
  let code = '';
  for (let salt = 0; salt < 20; salt += 1) {
    const candidate = referralCodeFor(user.id, salt);
    const owner = await getRow(`refcode:${candidate}`);
    if (!owner || owner.userId === user.id) {
      code = candidate;
      break;
    }
  }
  account = {
    userId: user.id,
    fullName: user.fullName || '',
    phone: user.phone || '',
    referralCode: code,
    // Tài khoản Admin không hiện trong danh sách khách tích điểm
    isAdmin: Boolean(user.isAdmin),
    referredByCode: account?.referredByCode || null,
    referredByUserId: account?.referredByUserId || null,
    createdAt: account?.createdAt || user.createdAt || new Date().toISOString(),
  };
  await putRow(`refcode:${code}`, 'refcode', user.id, { userId: user.id, code });
  await putRow(id, 'account', user.id, account);
  return account;
}

/**
 * Khách B nhập mã giới thiệu của khách A (lúc tạo tài khoản). Chỉ tài khoản mới (tạo trong 7 ngày, chưa có đơn)
 * mới nhập được, không tự giới thiệu mình, mỗi tài khoản chỉ nhập 1 lần.
 */
export async function claimReferral(user, rawCode, { bookings = null, now = Date.now() } = {}) {
  const code = normalizeCode(rawCode);
  if (!user?.id) return { ok: false, message: 'Vui lòng đăng nhập.' };
  if (!code) return { ok: false, message: 'Vui lòng nhập mã giới thiệu.' };
  const account = await ensureAccount(user);
  if (account.referredByUserId) return { ok: false, message: 'Tài khoản đã nhập mã giới thiệu trước đó.' };
  if (code === account.referralCode) return { ok: false, message: 'Bạn không thể nhập mã giới thiệu của chính mình.' };
  const owner = await getRow(`refcode:${code}`);
  if (!owner?.userId) return { ok: false, message: `Mã giới thiệu "${code}" không tồn tại.` };
  if (owner.userId === user.id) return { ok: false, message: 'Bạn không thể nhập mã giới thiệu của chính mình.' };
  const createdAt = Date.parse(user.createdAt || account.createdAt || '') || now;
  if (now - createdAt > MAX_REFERRAL_CLAIM_DAYS * 86400000) {
    return { ok: false, message: 'Mã giới thiệu chỉ nhập được khi vừa tạo tài khoản.' };
  }
  const list = bookings || bookingsOfUser(await allBookings(), user.id);
  if (list.some((b) => !isCancelledBooking(b))) {
    return { ok: false, message: 'Mã giới thiệu chỉ áp dụng cho khách chưa từng đặt phòng.' };
  }
  const config = await getLoyaltyConfig();
  if (config.referralSettings?.enabled === false) return { ok: false, message: 'Chương trình giới thiệu bạn bè đang tạm dừng.' };

  const referrer = (await getRow(`account:${owner.userId}`)) || { userId: owner.userId };
  // Chống gian lận cơ bản: chặn tự giới thiệu bằng trùng số điện thoại hoặc email
  const normPhone = (p) => String(p || '').replace(/\D/g, '').replace(/^84/, '0');
  if (user.phone && referrer.phone && normPhone(user.phone) === normPhone(referrer.phone)) {
    return { ok: false, message: 'Bạn không thể tự giới thiệu chính mình (trùng số điện thoại với người giới thiệu).' };
  }
  if (user.email && referrer.email && user.email.trim().toLowerCase() === referrer.email.trim().toLowerCase()) {
    return { ok: false, message: 'Bạn không thể tự giới thiệu chính mình (trùng email với người giới thiệu).' };
  }
  const nextAccount = { ...account, referredByCode: code, referredByUserId: owner.userId };
  await putRow(`account:${user.id}`, 'account', user.id, nextAccount);
  await putRow(`referral:${user.id}`, 'referral', owner.userId, {
    referrerUserId: owner.userId,
    referrerName: referrer.fullName || '',
    referrerPhone: referrer.phone || '',
    referralCode: code,
    refereeUserId: user.id,
    refereeName: user.fullName || '',
    refereePhone: user.phone || '',
    status: 'registered',
    createdAt: new Date(now).toISOString(),
  });
  return { ok: true, message: `Đã ghi nhận mã giới thiệu ${code}.`, referrerName: referrer.fullName || '' };
}

// ---------- Đối soát điểm theo đơn thật ----------
/**
 * Tự cộng điểm cho đơn đã check-out, hoàn điểm cho đơn đã hủy, ghi nhận lượt giới thiệu khi khách mới hoàn tất
 * đơn đầu tiên. Chạy lại bao nhiêu lần cũng không cộng trùng (mỗi dòng nhật ký có id cố định theo mã đơn).
 */
export async function reconcileCustomer(userId, { bookings = null, config = null } = {}) {
  if (!userId) return { changed: false };
  const cfg = config || (await getLoyaltyConfig());
  const mine = bookings || bookingsOfUser(await allBookings(), userId);
  const ledgerIds = new Set((await listRows('ledger', userId)).map((e) => e.id));
  let changed = false;

  // 1. Cộng điểm đơn đã check-out (hạng tính theo chi tiêu trước đơn đó)
  const completed = mine.filter(isCompletedBooking).sort((a, b) => String(a.checkedOutAt || a.checkOut || '').localeCompare(String(b.checkedOutAt || b.checkOut || '')));
  for (let i = 0; i < completed.length; i += 1) {
    const b = completed[i];
    const id = `earn:${codeOf(b)}`;
    if (ledgerIds.has(id)) continue;
    const net = netTotalOf(b);
    const { tier } = tierFor(spendingOf(completed.slice(0, i)), cfg.tiers);
    const points = pointsForSpend(net, cfg.rules, tier);
    if (points <= 0) continue;
    const added = await insertRowOnce(id, 'ledger', userId, {
      delta: points,
      type: 'earn',
      bookingCode: codeOf(b),
      reason: `Hoàn tất đơn ${codeOf(b)} (${net.toLocaleString('vi-VN')}đ${tier && Number(tier.multiplier) !== 1 ? `, hạng ${tier.name} x${tier.multiplier}` : ''})`,
      actor: 'Hệ thống tự động',
      at: b.checkedOutAt || new Date().toISOString(),
    });
    changed = changed || added;
  }

  // 2. Đơn đã hủy: trả lại điểm đã dùng và lượt dùng mã
  const redemptions = await listRows('redemption', userId);
  for (const r of redemptions) {
    if (r.status === 'cancelled') continue;
    const b = mine.find((x) => codeOf(x) === r.bookingCode);
    if (!b || !isCancelledBooking(b)) continue;
    await putRow(`redemption:${r.bookingCode}`, 'redemption', userId, { ...r, id: undefined, userId: undefined, status: 'cancelled', cancelledAt: new Date().toISOString() });
    if (Number(r.pointsUsed) > 0) {
      await insertRowOnce(`refund:${r.bookingCode}`, 'ledger', userId, {
        delta: Number(r.pointsUsed),
        type: 'refund',
        bookingCode: r.bookingCode,
        reason: `Hoàn ${r.pointsUsed} điểm do đơn ${r.bookingCode} đã hủy`,
        actor: 'Hệ thống tự động',
        at: new Date().toISOString(),
      });
    }
    changed = true;
  }

  // Đơn bị hủy / hoàn tiền sau khi đã cộng điểm: tự động trừ lại đúng số điểm đã cộng
  const cancelledBookings = mine.filter(isCancelledBooking);
  const currentLedger = await listRows('ledger', userId);
  for (const b of cancelledBookings) {
    const code = codeOf(b);
    const earnEntry = currentLedger.find((e) => e.id === `earn:${code}`);
    if (earnEntry && !ledgerIds.has(`revert_earn:${code}`)) {
      const added = await insertRowOnce(`revert_earn:${code}`, 'ledger', userId, {
        delta: -Math.abs(Number(earnEntry.delta) || 0),
        type: 'adjust',
        bookingCode: code,
        reason: `Thu hồi ${earnEntry.delta} điểm tích lũy do đơn ${code} bị hủy / hoàn tiền`,
        actor: 'Hệ thống tự động',
        at: new Date().toISOString(),
      });
      changed = changed || added;
    }
  }

  // 3. Giới thiệu bạn bè: khách B hoàn tất (check-out) đơn đầu tiên -> khách A được ghi nhận + thưởng điểm
  const referral = await getRow(`referral:${userId}`);
  if (referral && referral.status !== 'completed' && completed.length > 0) {
    const first = completed[0];
    const settings = cfg.referralSettings || {};
    const reward = settings.enabled === false ? 0 : Math.max(0, Number(settings.referrerRewardPoints) || 0);
    const done = {
      ...referral,
      status: 'completed',
      orderCode: codeOf(first),
      orderTotal: netTotalOf(first),
      completedAt: first.checkedOutAt || new Date().toISOString(),
      rewardPoints: reward,
    };
    await putRow(`referral:${userId}`, 'referral', referral.referrerUserId, done);
    if (reward > 0) {
      await insertRowOnce(`refbonus:${userId}`, 'ledger', referral.referrerUserId, {
        delta: reward,
        type: 'referral',
        bookingCode: codeOf(first),
        reason: `Thưởng giới thiệu ${referral.refereeName || 'bạn mới'} hoàn tất đơn đầu tiên ${codeOf(first)}`,
        actor: 'Hệ thống tự động',
        at: new Date().toISOString(),
      });
    }
    changed = true;
  } else if (referral && referral.status === 'completed' && completed.length === 0) {
    // Đơn đầu tiên của B bị hủy sau khi check-out: hoàn lại trạng thái chờ và thu hồi điểm thưởng của A
    const revertDone = {
      ...referral,
      status: 'registered',
      orderCode: null,
      orderTotal: 0,
      completedAt: null,
      rewardPoints: 0,
    };
    await putRow(`referral:${userId}`, 'referral', referral.referrerUserId, revertDone);
    if (referral.rewardPoints > 0) {
      const aLedger = await listRows('ledger', referral.referrerUserId);
      if (!aLedger.some((e) => e.id === `revert_refbonus:${userId}`)) {
        await insertRowOnce(`revert_refbonus:${userId}`, 'ledger', referral.referrerUserId, {
          delta: -Number(referral.rewardPoints),
          type: 'adjust',
          bookingCode: referral.orderCode || '',
          reason: `Thu hồi ${referral.rewardPoints} điểm thưởng giới thiệu do đơn đầu của ${referral.refereeName || 'bạn mới'} bị hủy`,
          actor: 'Hệ thống tự động',
          at: new Date().toISOString(),
        });
      }
    }
    changed = true;
  }
  return { changed };
}

// ---------- Tổng hợp cho trang khách ----------
async function customerSummary(user, { accessToken = null } = {}) {
  const config = await getLoyaltyConfig();
  const account = await ensureAccount(user);
  const all = await allBookings(accessToken);
  const mine = bookingsOfUser(all, user.id);

  // Mã giới thiệu nhập lúc tạo tài khoản (lưu trong hồ sơ đăng ký) được ghi nhận ở lần đầu đăng nhập
  if (user.referredByCode && !account.referredByUserId && !account.referralClaimTried) {
    await claimReferral(user, user.referredByCode, { bookings: mine }).catch(() => null);
    const latest = await getRow(`account:${user.id}`);
    await putRow(`account:${user.id}`, 'account', user.id, { ...(latest || account), referralClaimTried: true });
  }

  await reconcileCustomer(user.id, { bookings: mine, config });
  const [ledger, referrals, redemptions, accountNow] = await Promise.all([
    listRows('ledger', user.id),
    listRows('referral', user.id),
    listRows('redemption', user.id),
    getRow(`account:${user.id}`),
  ]);
  const spending = spendingOf(mine);
  const { tier, next, progress } = tierFor(spending, config.tiers);
  const tierKey = tierKeyOf(tier);
  const group = customerGroupOf(spending, tierKey);
  // Tính số dư sau mỗi giao dịch (sắp xếp tăng dần theo thời gian để cộng dồn, sau đó đảo ngược để hiển thị mới nhất trước)
  const chrono = [...ledger].sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')) || String(a.id || '').localeCompare(String(b.id || '')));
  let running = 0;
  const ledgerWithBalance = chrono.map((e) => {
    running += Number(e.delta) || 0;
    return {
      id: e.id,
      delta: Number(e.delta) || 0,
      type: e.type,
      reason: e.reason,
      actor: e.actor || '',
      bookingCode: e.bookingCode || '',
      at: e.at,
      balanceAfter: running,
    };
  });
  const sortedLedger = ledgerWithBalance.reverse();
  const myReferrals = referrals
    .filter((r) => r.referrerUserId === user.id)
    .map((r) => ({
      refereeName: r.refereeName || 'Bạn mới',
      status: r.status,
      createdAt: r.createdAt,
      completedAt: r.completedAt || null,
      rewardPoints: r.rewardPoints || 0,
    }));
  return {
    points: balanceOf(ledger),
    ledger: sortedLedger,
    tier,
    tierKey,
    nextTier: next,
    tierProgress: progress,
    spending,
    group,
    referralCode: accountNow?.referralCode || account.referralCode,
    referredByCode: accountNow?.referredByCode || null,
    referrals: myReferrals,
    referredCount: myReferrals.filter((r) => r.status === 'completed').length,
    redemptions: redemptions.map((r) => ({ bookingCode: r.bookingCode, voucherCode: r.voucherCode, voucherDiscount: r.voucherDiscount, pointsUsed: r.pointsUsed, pointsDiscount: r.pointsDiscount, status: r.status || 'active', at: r.at })),
    rules: config.rules,
    tiers: config.tiers,
    referralSettings: config.referralSettings,
  };
}

// Chiến dịch (tab Tất cả ưu đãi) tạm dừng / chưa bắt đầu / đã kết thúc thì các mã thuộc chiến dịch đó cũng ngừng
const vouchersInEffect = (config) => {
  const statusOf = new Map((config.promotions || []).map((p) => [p.id, p.status]));
  return (config.vouchers || []).map((v) => (
    v.promoId && ['paused', 'ended', 'upcoming'].includes(statusOf.get(v.promoId)) ? { ...v, status: 'paused' } : v
  ));
};

// Mã giảm giá đang mở cho khách xem (không lộ số lượt dùng)
const publicVouchers = (config) => vouchersInEffect(config)
  .filter((v) => v.status === 'active')
  .map((v) => ({
    code: v.code,
    displayValue: v.displayValue,
    promoName: v.promoName,
    minBookingDays: v.minBookingDays,
    minOrderValue: v.minOrderValue,
    targetGroup: v.targetGroup,
    validUntil: v.validUntil,
  }));

const publicPromotions = (config) => config.promotions
  .filter((promo) => isPromotionCurrentlyActive(promo))
  .map((promo) => ({
    id: promo.id,
    category: promo.category || (
      ['gift', 'combo'].includes(promo.type) ? 'gifts' : promo.type === 'fixed' ? 'vouchers' : 'campaigns'
    ),
    title: promo.name,
    description: promo.description || '',
    discount: promo.discountDisplay || '',
    code: promo.code,
    minBookingDays: promo.minBookingDays || 1,
    badge: promo.targetGroupLabel || 'Ưu đãi',
    badgeColor: promo.targetBadgeColor || 'bg-emerald-100 text-emerald-800 border-emerald-200',
    validUntil: promo.validUntil || promo.endDate || '',
    endDate: promo.endDate || promo.validUntil || '',
    image: promo.image || '',
    terms: promo.terms || '',
    isHot: Boolean(promo.isHot),
  }));

// ---------- Mã giảm giá & điểm khi đặt phòng ----------
const voucherUsage = (redemptions) => {
  const usage = {};
  redemptions.forEach((r) => {
    if (r.status === 'cancelled' || !r.voucherCode) return;
    const code = normalizeCode(r.voucherCode);
    usage[code] = (usage[code] || 0) + 1;
  });
  return usage;
};

/**
 * Tính ưu đãi cho một đơn sắp đặt: kiểm tra mã giảm giá và số điểm khách muốn dùng.
 * @returns {{ ok, promo?, message?, voucherMessage?, pointsMessage? }}
 */
export async function quotePromo({ user, booking, voucherCode = '', pointsToUse = 0, accessToken = null, now = new Date() }) {
  const gross = Math.max(0, Number(booking?.totalPrice ?? booking?.totalAmount) || 0);
  const wantsVoucher = Boolean(normalizeCode(voucherCode));
  const wantsPoints = Number(pointsToUse) > 0;
  if (!wantsVoucher && !wantsPoints) return { ok: true, promo: null };
  if (!user?.id) return { ok: false, message: 'Vui lòng đăng nhập tài khoản để dùng mã giảm giá hoặc điểm thưởng.' };

  const config = await getLoyaltyConfig();
  const mine = bookingsOfUser(await allBookings(accessToken), user.id)
    .filter((b) => codeOf(b) !== codeOf(booking));
  await reconcileCustomer(user.id, { bookings: mine, config });
  const spending = spendingOf(mine);
  const { tier } = tierFor(spending, config.tiers);
  const group = customerGroupOf(spending, tierKeyOf(tier), now);

  let voucherDiscount = 0;
  let voucherInfo = null;
  let voucherMessage = '';
  if (wantsVoucher) {
    const all = await listRows('redemption');
    const usage = voucherUsage(all);
    const clean = normalizeCode(voucherCode);
    const usedByCustomer = all.filter((r) => r.userId === user.id && r.status !== 'cancelled' && normalizeCode(r.voucherCode) === clean).length;
    const res = checkVoucher({
      code: clean,
      vouchers: vouchersInEffect(config),
      usage,
      usedByCustomer,
      group,
      orderTotal: gross,
      bookingDays: countStayDays(booking?.checkIn, booking?.checkOut) || 1,
      now,
    });
    if (!res.valid) return { ok: false, field: 'voucher', message: res.message };
    voucherDiscount = Math.min(gross, Number(res.discountAmount) || 0);
    voucherInfo = res.voucher;
    voucherMessage = res.message;
  }

  let pointsUsed = 0;
  let pointsDiscount = 0;
  let pointsMessage = '';
  const ledger = await listRows('ledger', user.id);
  const balance = balanceOf(ledger);
  const redeem = redeemPoints({ balance, requested: pointsToUse, orderTotal: gross - voucherDiscount, rules: config.rules });
  if (wantsPoints) {
    if (!redeem.ok) return { ok: false, field: 'points', message: redeem.message, balance, maxPoints: redeem.maxPoints };
    pointsUsed = redeem.points;
    pointsDiscount = Math.min(gross - voucherDiscount, redeem.amount);
    pointsMessage = redeem.message;
  }

  return {
    ok: true,
    balance,
    maxPoints: redeem.maxPoints,
    voucherMessage,
    pointsMessage,
    promo: {
      grossTotal: gross,
      voucherCode: voucherInfo ? normalizeCode(voucherInfo.code) : '',
      voucherLabel: voucherInfo ? (voucherInfo.displayValue || voucherInfo.promoName || '') : '',
      voucherPromoId: voucherInfo?.promoId || '',
      voucherDiscount,
      pointsUsed,
      pointsDiscount,
      appliedAt: now.toISOString(),
    },
  };
}

/**
 * Ghi lượt dùng mã và trừ điểm sau khi đơn đã được giữ phòng thành công.
 */
export async function commitPromo({ user, booking }) {
  const promo = booking?.promo;
  const code = codeOf(booking);
  if (!promo || !code || !user?.id) return;
  // Khách mới = chưa có đơn nào hoàn tất trước đơn này (dùng cho biểu đồ Khách mới / Khách cũ)
  const before = bookingsOfUser(await allBookings().catch(() => []), user.id).filter((b) => codeOf(b) !== code);
  await putRow(`redemption:${code}`, 'redemption', user.id, {
    newCustomer: spendingOf(before).completedCount === 0,
    bookingCode: code,
    voucherCode: promo.voucherCode || '',
    voucherPromoId: promo.voucherPromoId || '',
    voucherDiscount: Number(promo.voucherDiscount) || 0,
    pointsUsed: Number(promo.pointsUsed) || 0,
    pointsDiscount: Number(promo.pointsDiscount) || 0,
    grossTotal: Number(promo.grossTotal) || 0,
    customerName: booking.ownerName || booking.customerName || user.fullName || '',
    status: 'active',
    at: new Date().toISOString(),
  });
  if (Number(promo.pointsUsed) > 0) {
    await insertRowOnce(`redeem:${code}`, 'ledger', user.id, {
      delta: -Number(promo.pointsUsed),
      type: 'redeem',
      bookingCode: code,
      reason: `Dùng ${promo.pointsUsed} điểm giảm ${(Number(promo.pointsDiscount) || 0).toLocaleString('vi-VN')}đ cho đơn ${code}`,
      actor: 'Khách hàng',
      at: new Date().toISOString(),
    });
  }
}

/**
 * Đơn vừa check-out / bị hủy: cộng điểm, hoàn điểm, ghi nhận giới thiệu cho đúng khách của đơn.
 */
export async function onBookingClosed(booking) {
  const userId = booking?.customerId;
  if (!userId) return;
  try {
    const all = await allBookings(null, [booking]);
    await reconcileCustomer(userId, { bookings: bookingsOfUser(all, userId) });
  } catch (e) {
    console.warn('[Loyalty] Không cập nhật được điểm sau khi đóng đơn:', e.message);
  }
}

// ---------- Trang Admin ----------
async function adminOverview(accessToken) {
  const config = await getLoyaltyConfig();
  const bookings = await allBookings(accessToken);
  const accounts = await listRows('account');
  const customerIds = new Set([
    ...accounts.filter((a) => !a.isAdmin).map((a) => a.userId).filter(Boolean),
    ...bookings.map((b) => b.customerId).filter(Boolean),
  ]);
  // Đối soát điểm cho mọi khách có đơn (không cộng trùng)
  for (const id of customerIds) {
    await reconcileCustomer(id, { bookings: bookingsOfUser(bookings, id), config }).catch(() => null);
  }
  const [ledger, redemptions, referrals] = await Promise.all([
    listRows('ledger'),
    listRows('redemption'),
    listRows('referral'),
  ]);
  const accountById = new Map(accounts.map((a) => [a.userId, a]));
  const customers = [...customerIds].map((id) => {
    const mine = bookingsOfUser(bookings, id);
    const spending = spendingOf(mine);
    const { tier, next } = tierFor(spending, config.tiers);
    const latest = [...mine].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0] || {};
    const acc = accountById.get(id) || {};
    const myLedger = ledger.filter((e) => e.userId === id);
    return {
      id,
      fullName: acc.fullName || latest.ownerName || latest.customerName || 'Khách hàng',
      phone: acc.phone || latest.ownerPhone || latest.customerPhone || '',
      catNames: [...new Set(mine.map((b) => b.catNames).filter(Boolean).flatMap((s) => String(s).split(',').map((x) => x.trim())))].slice(0, 4),
      tier: tierKeyOf(tier),
      tierName: tier?.name || '',
      currentPoints: balanceOf(myLedger),
      earnedPoints: myLedger.filter((e) => e.delta > 0).reduce((s, e) => s + e.delta, 0),
      usedPoints: myLedger.filter((e) => e.delta < 0).reduce((s, e) => s - e.delta, 0),
      totalSpent: spending.spend,
      totalBookings: spending.completedCount,
      lastBookingDate: spending.lastCompletedDay,
      nextTierName: next?.name || 'Hạng cao nhất',
      spendToNextTier: next ? Math.max(0, Number(next.minSpend || 0) - spending.spend) : 0,
      referralCode: acc.referralCode || '',
      referredCount: referrals.filter((r) => r.referrerUserId === id && r.status === 'completed').length,
    };
  }).filter((c) => c.fullName || c.phone);

  const bookingByCode = new Map(bookings.map((b) => [codeOf(b), b]));
  const nameOf = (id) => customers.find((c) => c.id === id)?.fullName || accountById.get(id)?.fullName || '';
  // Tính số dư sau giao dịch cho từng khách trong sổ nhật ký
  const customerRunningBalances = {};
  const chronoAdminLedger = [...ledger].sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')) || String(a.id || '').localeCompare(String(b.id || '')));
  const ledgerWithBalances = chronoAdminLedger.map((e) => {
    const cid = e.userId || 'anonymous';
    customerRunningBalances[cid] = (customerRunningBalances[cid] || 0) + (Number(e.delta) || 0);
    return {
      id: e.id,
      customerId: e.userId,
      customerName: nameOf(e.userId),
      delta: Number(e.delta) || 0,
      balanceAfter: customerRunningBalances[cid],
      type: e.type,
      reason: e.reason,
      actor: e.actor,
      bookingCode: e.bookingCode || '',
      at: e.at,
    };
  });
  const adminSortedLedger = ledgerWithBalances.reverse();

  return {
    config,
    database: isUsingDatabase(),
    customers,
    ledger: adminSortedLedger,
    redemptions: redemptions.map((r) => {
      const b = bookingByCode.get(r.bookingCode) || {};
      return {
        ...r,
        customerId: r.userId,
        customerName: r.customerName || nameOf(r.userId),
        bookingStatus: b.status || '',
        completed: isCompletedBooking(b),
        netTotal: b.code ? netTotalOf(b) : Math.max(0, (Number(r.grossTotal) || 0) - (Number(r.voucherDiscount) || 0) - (Number(r.pointsDiscount) || 0)),
      };
    }),
    referrals: referrals.map((r) => {
      const refereeBookings = bookingsOfUser(bookings, r.refereeUserId);
      const open = refereeBookings.find((b) => !isCancelledBooking(b) && !isCompletedBooking(b));
      return {
        ...r,
        referrerName: r.referrerName || nameOf(r.referrerUserId),
        stage: r.status === 'completed' ? 'completed' : open ? 'pending_completion' : 'registered',
        openOrderCode: open ? codeOf(open) : '',
        openOrderTotal: open ? netTotalOf(open) : 0,
      };
    }),
  };
}

// ---------- API ----------
export async function handleLoyalty(req, res) {
  const op = String(req.query?.op || new URL(req.url || '/', 'http://x').searchParams.get('op') || '');
  const accessToken = getBearerToken(req);

  if (op === 'public-promotions') {
    res.setHeader('Cache-Control', 'no-store');
    const config = await getLoyaltyConfig();
    return res.status(200).json({ promotions: publicPromotions(config) });
  }

  if (op === 'public') {
    const config = await getLoyaltyConfig();
    return res.status(200).json({
      vouchers: publicVouchers(config),
      rules: config.rules,
      tiers: config.tiers,
      referralSettings: { enabled: config.referralSettings?.enabled !== false, referrerRewardPoints: config.referralSettings?.referrerRewardPoints, refereeRewardDiscount: config.referralSettings?.refereeRewardDiscount, refereeVoucherCode: config.referralSettings?.refereeVoucherCode },
    });
  }

  // Kiểm tra mã giới thiệu có tồn tại không (trước khi khách bấm tạo tài khoản)
  if (op === 'check-referral') {
    const code = normalizeCode(req.query?.code || new URL(req.url || '/', 'http://x').searchParams.get('code'));
    const owner = code ? await getRow(`refcode:${code}`) : null;
    const account = owner?.userId ? await getRow(`account:${owner.userId}`) : null;
    const firstName = String(account?.fullName || '').trim().split(/\s+/).pop() || '';
    return res.status(200).json({ exists: Boolean(owner?.userId), code, referrerName: firstName });
  }

  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });

  if (op === 'me') {
    return res.status(200).json(await customerSummary(user, { accessToken }));
  }

  if (op === 'quote') {
    const { booking = {}, voucherCode = '', pointsToUse = 0 } = bodyOf(req);
    const result = await quotePromo({ user, booking, voucherCode, pointsToUse, accessToken });
    return res.status(200).json(result);
  }

  if (op === 'claim-referral') {
    const { code } = bodyOf(req);
    const result = await claimReferral(user, code);
    return res.status(result.ok ? 200 : 400).json(result);
  }

  if (!user.isAdmin) return res.status(403).json({ error: 'Chỉ Admin mới xem được dữ liệu này.' });

  if (op === 'admin') {
    return res.status(200).json(await adminOverview(accessToken));
  }

  if (op === 'config') {
    const config = await saveLoyaltyConfig(bodyOf(req), user.email || user.phone || 'Admin');
    return res.status(200).json({ ok: true, config });
  }

  if (op === 'adjust') {
    const { customerId, delta, reason } = bodyOf(req);
    const amount = Math.trunc(Number(delta) || 0);
    if (!customerId || amount === 0) return res.status(400).json({ error: 'Thiếu khách hoặc số điểm.' });
    const ledger = await listRows('ledger', customerId);
    const balance = balanceOf(ledger);
    if (balance + amount < 0) return res.status(400).json({ error: `Khách chỉ có ${balance} điểm, không thể trừ ${-amount} điểm.` });
    const entryId = `adjust:${customerId}:${Date.now()}`;
    await insertRowOnce(entryId, 'ledger', customerId, {
      delta: amount,
      type: 'adjust',
      reason: String(reason || (amount > 0 ? 'Cộng điểm thủ công' : 'Trừ điểm thủ công')).slice(0, 200),
      actor: `Admin ${user.phone || user.email || ''}`.trim(),
      at: new Date().toISOString(),
    });
    return res.status(200).json({ ok: true, balance: balance + amount });
  }

  return res.status(404).json({ error: 'Không có API này.' });
}
