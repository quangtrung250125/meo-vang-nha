import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  referralCodeFor,
  tierFor,
  pointsForSpend,
  redeemPoints,
  checkVoucher,
  isVoucherExpired,
  buildAdminLoyaltyView as adminViewForExpiry,
  customerGroupOf,
  defaultLoyaltyConfig,
  buildAdminLoyaltyView,
  buildPromoAnalytics,
} from '../../src/utils/loyalty';
import { buildInvoice } from '../../src/utils/bookingInvoice';

// Dùng thư mục tạm, không dùng Supabase
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mvn-loyalty-'));
process.env.MVN_DATA_DIR = dataDir;
process.env.ADMIN_EMAILS = 'admin@test.vn';
process.env.MVN_BOOKINGS_DB = 'off';

const now = new Date().toISOString();
const USERS = {
  'token-admin': { id: 'admin-1', email: 'admin@test.vn', created_at: now, user_metadata: {} },
  'token-a': { id: 'user-a', email: 'a@test.vn', created_at: '2026-01-01T00:00:00Z', user_metadata: { full_name: 'Khách A', phone: '0900000001' } },
  'token-b': { id: 'user-b', email: 'b@test.vn', created_at: now, user_metadata: { full_name: 'Khách B', phone: '0900000002' } },
  'token-c': { id: 'user-c', email: 'c@test.vn', created_at: now, user_metadata: { full_name: 'Khách C', phone: '0900000003' } },
};

let api;
let loyalty;

const call = async (handler, { method = 'GET', body, token, query = {} } = {}) => {
  const req = { method, body, query, headers: token ? { authorization: `Bearer ${token}` } : {}, url: `/api/marketing/loyalty?op=${query.op || ''}` };
  const res = {
    statusCode: 200,
    payload: undefined,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.payload = obj; return this; },
    end(str) { this.payload = str ? JSON.parse(str) : undefined; return this; },
  };
  await handler(req, res);
  return res;
};
const loyaltyOp = (op, opts = {}) => call(loyalty.handleLoyalty, { ...opts, query: { op, ...(opts.query || {}) } });

const addDays = (n) => new Date(Date.now() + 7 * 3600000 + n * 86400000).toISOString().slice(0, 10);
let seq = 0;
const newBooking = (overrides = {}) => {
  seq += 1;
  return {
    id: `L-${seq}`,
    code: `L-${seq}`,
    cats: 1,
    checkIn: addDays(5),
    checkOut: addDays(8),
    ownerName: 'Khách',
    ownerPhone: '0900000001',
    totalPrice: 1000000,
    ...overrides,
  };
};

beforeAll(async () => {
  const auth = await import('../../api/_lib/auth.js');
  auth.setTokenVerifier(async (token) => USERS[token] || null);
  api = await import('../../api/_lib/bookingsService.js');
  loyalty = await import('../../api/_lib/loyaltyService.js');
});

describe('Tính toán điểm, hạng, mã giảm giá', () => {
  it('mã giới thiệu cố định theo tài khoản, dạng MEOxxxxx', () => {
    expect(referralCodeFor('abc')).toBe(referralCodeFor('abc'));
    expect(referralCodeFor('abc')).not.toBe(referralCodeFor('abd'));
    expect(referralCodeFor('abc')).toMatch(/^MEO[A-Z2-9]{5}$/);
  });

  it('hạng theo chi tiêu hoặc số đơn hoàn tất', () => {
    const tiers = defaultLoyaltyConfig().tiers;
    expect(tierFor({ spend: 0, completedCount: 0 }, tiers).tier.name).toBe('Đồng');
    expect(tierFor({ spend: 1600000, completedCount: 1 }, tiers).tier.name).toBe('Bạc');
    expect(tierFor({ spend: 500000, completedCount: 3 }, tiers).tier.name).toBe('Bạc');
    expect(tierFor({ spend: 12000000, completedCount: 2 }, tiers).tier.name).toBe('Kim cương');
  });

  it('điểm = số tiền / 10.000 × hệ số hạng', () => {
    expect(pointsForSpend(1250000, { spendForOnePoint: 10000 }, { multiplier: 1 })).toBe(125);
    expect(pointsForSpend(1000000, { spendForOnePoint: 10000 }, { multiplier: 1.5 })).toBe(150);
  });

  it('dùng điểm: tối thiểu, không quá số dư và không quá % giá trị đơn', () => {
    const rules = { valuePerPoint: 1000, minPointsToRedeem: 50, maxRedeemPercentPerOrder: 30 };
    expect(redeemPoints({ balance: 40, requested: 40, orderTotal: 1000000, rules }).ok).toBe(false);
    expect(redeemPoints({ balance: 500, requested: 400, orderTotal: 1000000, rules }).ok).toBe(false); // > 30%
    const ok = redeemPoints({ balance: 500, requested: 300, orderTotal: 1000000, rules });
    expect(ok).toMatchObject({ ok: true, points: 300, amount: 300000 });
  });

  it('kiểm tra mã giảm giá theo nhóm khách, lượt dùng, đơn tối thiểu', () => {
    const vouchers = [{ code: 'ALL50', discountType: 'fixed', discountValue: 50000, maxUsage: 2, limitPerCustomer: 1, minBookingDays: 1, minOrderValue: 300000, targetGroup: 'all', validUntil: '31/12/2099', status: 'active' }];
    const group = customerGroupOf({ activeCount: 0 }, 'bronze');
    expect(checkVoucher({ code: 'all50', vouchers, group, orderTotal: 500000, bookingDays: 2 })).toMatchObject({ valid: true, discountAmount: 50000 });
    expect(checkVoucher({ code: 'ALL50', vouchers, group, orderTotal: 200000, bookingDays: 2 }).valid).toBe(false);
    expect(checkVoucher({ code: 'ALL50', vouchers, usage: { ALL50: 2 }, group, orderTotal: 500000, bookingDays: 2 }).valid).toBe(false);
    expect(checkVoucher({ code: 'ALL50', vouchers, usedByCustomer: 1, group, orderTotal: 500000, bookingDays: 2 }).valid).toBe(false);
    expect(checkVoucher({ code: 'NOPE', vouchers, group, orderTotal: 500000 }).valid).toBe(false);
  });

  it('hóa đơn trừ mã giảm giá và điểm', () => {
    const inv = buildInvoice({
      code: 'X', checkIn: '2026-11-20', checkOut: '2026-11-22', totalPrice: 1000000,
      promo: { voucherCode: 'ALL50', voucherDiscount: 50000, pointsUsed: 100, pointsDiscount: 100000 },
    });
    expect(inv.total).toBe(850000);
    expect(inv.lines.filter((l) => l.amount < 0).map((l) => l.kind)).toEqual(['voucher', 'points']);
  });
});

describe('Luồng thật qua API: mã giảm giá, điểm, giới thiệu bạn bè', () => {
  it('Admin tạo mã giảm giá, khách đặt phòng được trừ tiền thật', async () => {
    const cfg = defaultLoyaltyConfig();
    const vouchers = [...cfg.vouchers, { id: 'v-test', code: 'TEST100K', discountType: 'fixed', discountValue: 100000, maxUsage: 5, limitPerCustomer: 1, minBookingDays: 1, minOrderValue: 0, targetGroup: 'all', validUntil: '31/12/2099', status: 'active', displayValue: 'Giảm 100.000đ' }];
    const saved = await loyaltyOp('config', { method: 'PUT', token: 'token-admin', body: { vouchers } });
    expect(saved.statusCode).toBe(200);

    // Khách không thể tự đặt số tiền giảm
    const res = await call(api.handleAddBooking, {
      method: 'POST',
      token: 'token-a',
      body: { roomId: 'VIP-01', booking: newBooking({ promo: { voucherDiscount: 999999 }, promoRequest: { voucherCode: 'test100k' } }) },
    });
    expect(res.statusCode).toBe(200);
    expect(res.payload.booking.promo).toMatchObject({ voucherCode: 'TEST100K', voucherDiscount: 100000, grossTotal: 1000000 });
    expect(res.payload.booking.totalAmount).toBe(900000);
    expect(buildInvoice(res.payload.booking).total).toBe(900000);

    // Mỗi khách chỉ dùng 1 lần
    const again = await call(api.handleAddBooking, {
      method: 'POST',
      token: 'token-a',
      body: { roomId: 'VIP-02', booking: newBooking({ promoRequest: { voucherCode: 'TEST100K' } }) },
    });
    expect(again.statusCode).toBe(400);
    expect(again.payload.promoError).toBe(true);
  });

  it('check-out cộng điểm theo số tiền thực trả, khách dùng điểm giảm hóa đơn, hủy đơn được hoàn điểm', async () => {
    const booked = await call(api.handleAddBooking, { method: 'POST', token: 'token-a', body: { roomId: 'VIP-03', booking: newBooking() } });
    const code = booked.payload.booking.code;
    await call(api.handleUpdateBooking, { method: 'PUT', token: 'token-admin', body: { roomId: 'VIP-03', code, updates: { status: 'check-out', checkedOutAt: new Date().toISOString(), paymentStatus: 'Đã thanh toán', paidAmount: 1000000 } } });

    let me = await loyaltyOp('me', { token: 'token-a' });
    // Đơn đầu (dùng mã 100k) chưa check-out; đơn này 1.000.000đ -> 100 điểm
    expect(me.payload.points).toBe(100);
    expect(me.payload.ledger[0]).toMatchObject({ type: 'earn', delta: 100, bookingCode: code });

    // Dùng 60 điểm cho đơn mới
    const quote = await loyaltyOp('quote', { method: 'POST', token: 'token-a', body: { booking: { totalPrice: 800000, checkIn: addDays(10), checkOut: addDays(12) }, pointsToUse: 60 } });
    expect(quote.payload).toMatchObject({ ok: true, promo: { pointsUsed: 60, pointsDiscount: 60000 } });
    const withPoints = await call(api.handleAddBooking, { method: 'POST', token: 'token-a', body: { roomId: 'VIP-04', booking: newBooking({ totalPrice: 800000, promoRequest: { pointsToUse: 60 } }) } });
    expect(withPoints.statusCode).toBe(200);
    expect(withPoints.payload.booking.totalAmount).toBe(740000);
    me = await loyaltyOp('me', { token: 'token-a' });
    expect(me.payload.points).toBe(40);

    // Hủy đơn: hoàn 60 điểm
    await call(api.handleRemoveBooking, { method: 'DELETE', token: 'token-admin', body: { roomId: 'VIP-04', code: withPoints.payload.booking.code } });
    me = await loyaltyOp('me', { token: 'token-a' });
    expect(me.payload.points).toBe(100);
    expect(me.payload.ledger.some((e) => e.type === 'refund' && e.delta === 60)).toBe(true);
  });

  it('khách B nhập mã giới thiệu của A, B check-out đơn đầu thì A được ghi nhận 1 người', async () => {
    const meA = await loyaltyOp('me', { token: 'token-a' });
    const codeA = meA.payload.referralCode;
    expect(codeA).toMatch(/^MEO/);
    const pointsBefore = meA.payload.points;

    const check = await loyaltyOp('check-referral', { query: { code: codeA.toLowerCase() } });
    expect(check.payload.exists).toBe(true);

    // A không tự nhập mã của mình; B nhập mã của A
    expect((await loyaltyOp('claim-referral', { method: 'POST', token: 'token-a', body: { code: codeA } })).statusCode).toBe(400);
    const claim = await loyaltyOp('claim-referral', { method: 'POST', token: 'token-b', body: { code: codeA } });
    expect(claim.payload.ok).toBe(true);
    expect((await loyaltyOp('claim-referral', { method: 'POST', token: 'token-b', body: { code: codeA } })).payload.ok).toBe(false);

    let a = await loyaltyOp('me', { token: 'token-a' });
    expect(a.payload.referredCount).toBe(0);
    expect(a.payload.referrals[0]).toMatchObject({ refereeName: 'Khách B', status: 'registered' });

    // B đặt và check-out đơn đầu tiên
    const b = await call(api.handleAddBooking, { method: 'POST', token: 'token-b', body: { roomId: 'VIP-05', booking: newBooking({ ownerName: 'Khách B', totalPrice: 600000 }) } });
    await call(api.handleUpdateBooking, { method: 'PUT', token: 'token-admin', body: { roomId: 'VIP-05', code: b.payload.booking.code, updates: { status: 'check-out', checkedOutAt: new Date().toISOString(), paymentStatus: 'Đã thanh toán', paidAmount: 600000 } } });

    a = await loyaltyOp('me', { token: 'token-a' });
    expect(a.payload.referredCount).toBe(1);
    expect(a.payload.points).toBe(pointsBefore + 100);
    const bMe = await loyaltyOp('me', { token: 'token-b' });
    expect(bMe.payload.points).toBe(60);

    // Admin thấy lượt giới thiệu đã hoàn tất
    const admin = await loyaltyOp('admin', { token: 'token-admin' });
    const view = buildAdminLoyaltyView(admin.payload);
    expect(view.referralLogs[0]).toMatchObject({ status: 'completed', refereeName: 'Khách B' });
    expect(view.referralSettings.completedBookings).toBe(1);
    expect(view.vouchers.find((v) => v.code === 'TEST100K').usageCount).toBe(1);
    const analytics = buildPromoAnalytics({ redemptions: admin.payload.redemptions, promotions: view.promotions, vouchers: view.vouchers, customers: admin.payload.customers });
    expect(analytics.summary.redemptions).toBe(1); // đơn dùng điểm đã hủy nên không tính
    expect(analytics.summary.promotionsCost).toBe(100000);
  });

  it('tài khoản cũ đã có đơn không nhập mã giới thiệu được; Admin cộng / trừ điểm thủ công', async () => {
    const codeA = (await loyaltyOp('me', { token: 'token-a' })).payload.referralCode;
    await call(api.handleAddBooking, { method: 'POST', token: 'token-c', body: { roomId: 'VIP-06', booking: newBooking({ ownerName: 'Khách C' }) } });
    const claim = await loyaltyOp('claim-referral', { method: 'POST', token: 'token-c', body: { code: codeA } });
    expect(claim.payload.ok).toBe(false);

    const add = await loyaltyOp('adjust', { method: 'POST', token: 'token-admin', body: { customerId: 'user-c', delta: 30, reason: 'Tri ân' } });
    expect(add.payload.balance).toBe(30);
    const tooMuch = await loyaltyOp('adjust', { method: 'POST', token: 'token-admin', body: { customerId: 'user-c', delta: -50 } });
    expect(tooMuch.statusCode).toBe(400);
    expect((await loyaltyOp('adjust', { method: 'POST', token: 'token-c', body: { customerId: 'user-c', delta: 999 } })).statusCode).toBe(403);
  });
});

describe('Hạn dùng mã giảm giá', () => {
  const now = new Date(2026, 10, 16, 10, 0, 0);
  it('mã quá hạn hiện "Hết hạn" ở trang Admin, gia hạn thì dùng lại được', () => {
    expect(isVoucherExpired({ validUntil: '15/11/2026' }, now)).toBe(true);
    expect(isVoucherExpired({ validUntil: '16/11/2026' }, now)).toBe(false);
    const extended = { code: 'OLD10', status: 'expired', validUntil: '31/12/2026', discountType: 'fixed', discountValue: 10000, targetGroup: 'all' };
    const res = checkVoucher({ code: 'OLD10', vouchers: [extended], orderTotal: 500000, bookingDays: 3, now });
    expect(res.valid).toBe(true);
    const expired = checkVoucher({ code: 'OLD10', vouchers: [{ ...extended, status: 'active', validUntil: '15/11/2026' }], orderTotal: 500000, bookingDays: 3, now });
    expect(expired.valid).toBe(false);
    const view = adminViewForExpiry({ config: { vouchers: [{ ...extended, validUntil: '01/01/2020', status: 'active' }] }, redemptions: [] });
    expect(view.vouchers.find((v) => v.code === 'OLD10').status).toBe('expired');
  });
});
