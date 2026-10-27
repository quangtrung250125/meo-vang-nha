import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDateVN,
  validateVoucherForBooking,
  initialVouchers
} from '../../src/pages/AdminPromotions/promotionsStore';

describe('Admin Promotions & Loyalty Rules', () => {
  describe('Formatters', () => {
    it('định dạng tiền tệ theo chuẩn 1.000.000đ', () => {
      expect(formatCurrency(1000000)).toBe('1.000.000đ');
      expect(formatCurrency(50000)).toBe('50.000đ');
      expect(formatCurrency(0)).toBe('0đ');
      expect(formatCurrency(null)).toBe('0đ');
    });

    it('định dạng ngày theo chuẩn dd/mm/yyyy', () => {
      expect(formatDateVN('2026-10-25')).toBe('25/10/2026');
      expect(formatDateVN('25/10/2026')).toBe('25/10/2026');
    });
  });

  describe('validateVoucherForBooking', () => {
    const mockVouchers = [
      {
        id: 'v1',
        code: 'NEW20',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscount: 150000,
        targetGroup: 'new',
        minBookingDays: 2,
        minOrderValue: 400000,
        maxUsage: 10,
        usageCount: 2,
        limitPerCustomer: 1,
        validUntil: '31/12/2026',
        status: 'active',
      },
      {
        id: 'v2',
        code: 'FIXED50',
        discountType: 'fixed',
        discountValue: 50000,
        targetGroup: 'all',
        minBookingDays: 1,
        minOrderValue: 200000,
        maxUsage: 10,
        usageCount: 10, // đã hết lượt
        limitPerCustomer: 2,
        validUntil: '31/12/2026',
        status: 'exhausted',
      },
      {
        id: 'v3',
        code: 'EXPIRED10',
        discountType: 'percentage',
        discountValue: 10,
        targetGroup: 'all',
        validUntil: '01/01/2020', // đã hết hạn
        maxUsage: 100,
        usageCount: 5,
        status: 'expired',
      },
      {
        id: 'v4',
        code: 'VIPWEEKEND',
        discountType: 'percentage',
        discountValue: 15,
        targetGroup: 'vip',
        minBookingDays: 2,
        minOrderValue: 500000,
        maxUsage: 50,
        usageCount: 5,
        limitPerCustomer: 2,
        validUntil: '31/12/2026',
        status: 'active',
      },
    ];

    it('từ chối khi không nhập mã', () => {
      const res = validateVoucherForBooking({
        voucherCode: '',
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(false);
      expect(res.message).toContain('Vui lòng nhập mã');
    });

    it('từ chối mã không tồn tại trên hệ thống', () => {
      const res = validateVoucherForBooking({
        voucherCode: 'UNKNOWN_CODE',
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(false);
      expect(res.message).toContain('không tồn tại');
    });

    it('từ chối khi mã đã hết lượt sử dụng', () => {
      const res = validateVoucherForBooking({
        voucherCode: 'FIXED50',
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(false);
      expect(res.message).toContain('hết lượt');
    });

    it('từ chối khi mã đã hết hạn', () => {
      const res = validateVoucherForBooking({
        voucherCode: 'EXPIRED10',
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(false);
      expect(res.message).toContain('hết hạn');
    });

    it('từ chối khi khách đã dùng hết lượt cho phép của cá nhân', () => {
      const res = validateVoucherForBooking({
        voucherCode: 'NEW20',
        customer: { segment: 'new', bookingCount: 0 },
        orderTotal: 500000,
        bookingDays: 2,
        usedCountByCustomer: 1, // đã dùng 1 lần, max là 1
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(false);
      expect(res.message).toContain('sử dụng hết giới hạn');
    });

    it('từ chối khi mã chỉ dành cho khách mới nhưng khách cũ sử dụng', () => {
      const res = validateVoucherForBooking({
        voucherCode: 'NEW20',
        customer: { segment: 'returning', bookingCount: 2 },
        orderTotal: 500000,
        bookingDays: 2,
        usedCountByCustomer: 0,
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(false);
      expect(res.message).toContain('chỉ áp dụng cho khách hàng mới');
    });

    it('từ chối khi không đạt số ngày lưu trú tối thiểu', () => {
      const res = validateVoucherForBooking({
        voucherCode: 'NEW20',
        customer: { segment: 'new', bookingCount: 0 },
        orderTotal: 500000,
        bookingDays: 1, // yêu cầu 2 ngày
        usedCountByCustomer: 0,
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(false);
      expect(res.message).toContain('tối thiểu 2 ngày');
    });

    it('từ chối khi chưa đạt đơn hàng tối thiểu', () => {
      const res = validateVoucherForBooking({
        voucherCode: 'NEW20',
        customer: { segment: 'new', bookingCount: 0 },
        orderTotal: 300000, // yêu cầu 400.000đ
        bookingDays: 2,
        usedCountByCustomer: 0,
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(false);
      expect(res.message).toContain('Đơn hàng tối thiểu');
    });

    it('từ chối mã VIP khi khách không phải là VIP', () => {
      const res = validateVoucherForBooking({
        voucherCode: 'VIPWEEKEND',
        customer: { segment: 'returning', tier: 'silver' },
        orderTotal: 600000,
        bookingDays: 2,
        usedCountByCustomer: 0,
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(false);
      expect(res.message).toContain('dành riêng cho khách hàng VIP');
    });

    it('chấp nhận đơn hợp lệ và tính đúng số tiền giảm tối đa', () => {
      const res = validateVoucherForBooking({
        voucherCode: 'NEW20',
        customer: { segment: 'new', bookingCount: 0 },
        orderTotal: 1000000, // 20% của 1tr = 200k, nhưng trần tối đa là 150k
        bookingDays: 3,
        usedCountByCustomer: 0,
        vouchersList: mockVouchers,
      });
      expect(res.valid).toBe(true);
      expect(res.discountAmount).toBe(150000);
      expect(res.message).toContain('Áp dụng thành công');
    });
  });
});
