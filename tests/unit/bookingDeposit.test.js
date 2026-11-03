import { describe, expect, it } from 'vitest';
import { daysUntilCheckIn, getDepositPolicy, hasBookingCode, PAYMENT_STATUS, getDepositDueAt, isDepositOverdue, formatVietnamDateTime } from '../../src/utils/bookingDeposit';

describe('Quy định đặt cọc', () => {
  const today = '2026-10-27';

  it('đếm số ngày từ hôm đặt đến ngày gửi bé', () => {
    expect(daysUntilCheckIn('2026-11-01', today)).toBe(5);
    expect(daysUntilCheckIn('2026-11-02', today)).toBe(6);
    expect(daysUntilCheckIn('2026-10-27', today)).toBe(0);
  });

  it('đặt trước 5 ngày trở xuống thì không cần cọc', () => {
    const policy = getDepositPolicy({ checkIn: '2026-11-01', total: 500000, todayStr: today });
    expect(policy.required).toBe(false);
    expect(policy.amount).toBe(0);
    expect(policy.paymentStatus).toBe(PAYMENT_STATUS.PAY_AT_CHECKIN);
  });

  it('đặt trước hơn 5 ngày thì cọc 50% tổng tiền', () => {
    const policy = getDepositPolicy({ checkIn: '2026-11-02', total: 894000, todayStr: today });
    expect(policy.required).toBe(true);
    expect(policy.amount).toBe(447000);
    expect(policy.paymentStatus).toBe(PAYMENT_STATUS.AWAITING_DEPOSIT);
  });

  it('chỉ cấp mã đặt phòng khi không phải chờ cọc', () => {
    expect(hasBookingCode({ paymentStatus: PAYMENT_STATUS.AWAITING_DEPOSIT })).toBe(false);
    expect(hasBookingCode({ paymentStatus: PAYMENT_STATUS.DEPOSIT_PAID })).toBe(true);
    expect(hasBookingCode({})).toBe(true);
  });
});

describe('hạn chuyển cọc 24 giờ', () => {
  const createdAt = '2026-11-02T10:00:00.000Z';
  const awaiting = { paymentStatus: PAYMENT_STATUS.AWAITING_DEPOSIT, createdAt };

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
