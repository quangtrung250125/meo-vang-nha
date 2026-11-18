import { describe, expect, it } from 'vitest';
import {
  stayDaysOf, getDepositPolicy, hasBookingCode, PAYMENT_STATUS, getDepositDueAt, isDepositOverdue, formatVietnamDateTime,
  getEditedDepositState, depositReceivedOf, depositToTransferOf,
} from '../../src/utils/bookingDeposit';

describe('Quy định đặt cọc theo ngày đặt và ngày gửi bé', () => {
  it('đếm số ngày gửi bé', () => {
    expect(stayDaysOf('2026-11-01', '2026-11-06')).toBe(5);
    expect(stayDaysOf('2026-11-01', '2026-11-02')).toBe(1);
    expect(stayDaysOf('2026-10-30', '2026-11-03')).toBe(4);
  });

  it('đặt trước đúng 5 ngày thì không cần cọc', () => {
    const policy = getDepositPolicy({ checkIn: '2026-11-07', total: 500000, bookedAt: '2026-11-01T17:00:00Z' });
    expect(policy.advanceDays).toBe(5);
    expect(policy.required).toBe(false);
    expect(policy.amount).toBe(0);
    expect(policy.paymentStatus).toBe(PAYMENT_STATUS.PAY_AT_CHECKIN);
  });

  it('đặt trước 6 ngày thì cọc 50% tổng tiền', () => {
    const policy = getDepositPolicy({ checkIn: '2026-11-07', total: 894000, bookedAt: '2026-11-01T16:59:59Z' });
    expect(policy.advanceDays).toBe(6);
    expect(policy.required).toBe(true);
    expect(policy.amount).toBe(447000);
    expect(policy.paymentStatus).toBe(PAYMENT_STATUS.AWAITING_DEPOSIT);
  });

  it('chỉ cấp mã đặt phòng khi không phải chờ cọc lần đầu (chờ cọc bổ sung vẫn giữ mã)', () => {
    expect(hasBookingCode({ paymentStatus: PAYMENT_STATUS.AWAITING_DEPOSIT })).toBe(false);
    expect(hasBookingCode({ paymentStatus: PAYMENT_STATUS.AWAITING_TOP_UP })).toBe(true);
    expect(hasBookingCode({ paymentStatus: PAYMENT_STATUS.DEPOSIT_PAID })).toBe(true);
    expect(hasBookingCode({})).toBe(true);
  });
});

describe('Tiền cọc sau khi khách chỉnh sửa đơn', () => {
  const createdAt = '2026-11-25T03:00:00Z';
  const advanceBooking = { checkIn: '2026-12-01' };
  const nearBooking = { checkIn: '2026-11-30' };

  it('đơn đã có mã (không cần cọc) dời ngày gửi sang hơn 5 ngày sau ngày đặt: giữ mã, chờ cọc bổ sung', () => {
    const booking = { createdAt, paymentStatus: PAYMENT_STATUS.PAY_AT_CHECKIN, depositAmount: 0 };
    const state = getEditedDepositState({ booking, ...advanceBooking, total: 1000000 });
    expect(state.paymentStatus).toBe(PAYMENT_STATUS.AWAITING_TOP_UP);
    expect(state.depositAmount).toBe(500000);
    expect(depositToTransferOf({ ...booking, ...state })).toBe(500000);
    expect(hasBookingCode({ ...booking, ...state })).toBe(true);
  });

  it('đã cọc nhưng đơn mới đắt hơn: chỉ cọc thêm phần chênh lệch', () => {
    const booking = { createdAt, paymentStatus: PAYMENT_STATUS.DEPOSIT_PAID, depositAmount: 300000 };
    const state = getEditedDepositState({ booking, ...advanceBooking, total: 1000000 });
    expect(state.paymentStatus).toBe(PAYMENT_STATUS.AWAITING_TOP_UP);
    expect(state.depositReceivedAmount).toBe(300000);
    expect(depositToTransferOf({ ...booking, ...state })).toBe(200000);
    expect(depositReceivedOf({ ...booking, ...state })).toBe(300000);
  });

  it('đã cọc đủ mức mới thì giữ "đã cọc"', () => {
    const booking = { createdAt, paymentStatus: PAYMENT_STATUS.DEPOSIT_PAID, depositAmount: 600000 };
    const state = getEditedDepositState({ booking, ...advanceBooking, total: 1000000 });
    expect(state.paymentStatus).toBe(PAYMENT_STATUS.DEPOSIT_PAID);
    expect(state.depositAmount).toBe(600000);
  });

  it('đơn chưa có mã vẫn chờ cọc lần đầu với số tiền mới', () => {
    const booking = { createdAt, paymentStatus: PAYMENT_STATUS.AWAITING_DEPOSIT, depositAmount: 300000, depositReceivedAmount: 100000 };
    const state = getEditedDepositState({ booking, ...advanceBooking, total: 1000000 });
    expect(state.paymentStatus).toBe(PAYMENT_STATUS.AWAITING_DEPOSIT);
    expect(depositToTransferOf({ ...booking, ...state })).toBe(400000);
  });

  it('dời ngày gửi về trong 5 ngày kể từ ngày đặt: không bắt buộc cọc, chưa cọc thì nhận mã ngay, đã cọc thì vẫn tính tiền đã cọc', () => {
    const awaiting = getEditedDepositState({ booking: { createdAt, paymentStatus: PAYMENT_STATUS.AWAITING_DEPOSIT, depositAmount: 300000 }, ...nearBooking, total: 400000 });
    expect(awaiting.paymentStatus).toBe(PAYMENT_STATUS.PAY_AT_CHECKIN);
    const paid = getEditedDepositState({ booking: { createdAt, paymentStatus: PAYMENT_STATUS.DEPOSIT_PAID, depositAmount: 300000 }, ...nearBooking, total: 400000 });
    expect(paid.paymentStatus).toBe(PAYMENT_STATUS.DEPOSIT_PAID);
    expect(paid.depositRequired).toBe(false);
    expect(paid.depositAmount).toBe(300000);
  });

  it('đơn đã thanh toán đủ thì giữ nguyên trạng thái thanh toán', () => {
    expect(getEditedDepositState({ booking: { createdAt, paymentStatus: 'Đã thanh toán' }, ...advanceBooking, total: 2000000 })).toEqual({});
  });
});

describe('hạn chuyển cọc 24 giờ', () => {
  const createdAt = '2026-11-02T10:00:00.000Z';
  const awaiting = { createdAt, paymentStatus: PAYMENT_STATUS.AWAITING_DEPOSIT };

  it('đơn cũ chưa có depositDueAt thì tính 24 giờ từ lúc tạo đơn', () => {
    expect(getDepositDueAt(awaiting)).toBe('2026-11-03T10:00:00.000Z');
  });

  it('ưu tiên depositDueAt do server ghi', () => {
    expect(getDepositDueAt({ ...awaiting, depositDueAt: '2026-11-03T12:00:00.000Z' })).toBe('2026-11-03T12:00:00.000Z');
  });

  it('chỉ quá hạn khi đủ 24 giờ mà vẫn chờ cọc', () => {
    expect(isDepositOverdue(awaiting, Date.parse('2026-11-03T09:59:00Z'))).toBe(false);
    expect(isDepositOverdue(awaiting, Date.parse('2026-11-03T10:00:00Z'))).toBe(true);
    expect(isDepositOverdue({ ...awaiting, paymentStatus: PAYMENT_STATUS.DEPOSIT_PAID }, Date.parse('2026-11-05T00:00:00Z'))).toBe(false);
    expect(isDepositOverdue({ ...awaiting, paymentStatus: PAYMENT_STATUS.PAY_AT_CHECKIN }, Date.parse('2026-11-05T00:00:00Z'))).toBe(false);
  });

  it('hiện giờ Việt Nam', () => {
    expect(formatVietnamDateTime('2026-11-03T10:00:00.000Z')).toBe('17:00 03/11/2026');
  });
});
