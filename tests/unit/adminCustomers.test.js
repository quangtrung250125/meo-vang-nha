import { describe, expect, it } from 'vitest';
import { buildCustomers, computeFunnel, computeRevenueByMonth, computeStats, revenueMonthOf } from '../../src/pages/AdminCustomers/customerUtils';

const profiles = [
  { id: 'user-a', fullName: 'Nguyễn An', phone: '0901 111 111', email: 'an@example.com', createdAt: '2026-10-01T00:00:00Z' },
  { id: 'user-b', fullName: 'Trần Bình', phone: '0902222222', createdAt: '2026-10-02T00:00:00Z' },
  { id: 'admin-1', fullName: 'Quản trị viên' },
];

// Các đơn mẫu đều đã thanh toán đủ để kiểm tra phần gom dữ liệu; phần thanh toán có bộ test riêng bên dưới
const PAID = 'Đã thanh toán';
const bookings = [
  { code: 'MVN-1', customerId: 'user-a', paymentStatus: PAID, status: 'check-out', totalPrice: 300000, createdAt: '2026-10-05T00:00:00Z', petIds: ['pet-1'] },
  { code: 'MVN-2', customerId: 'user-a', paymentStatus: PAID, status: 'check-in', totalPrice: 450000, createdAt: '2026-10-20T00:00:00Z' },
  { code: 'MVN-3', customerId: 'user-a', paymentStatus: PAID, status: 'Đã hủy', totalPrice: 999000, createdAt: '2026-10-21T00:00:00Z' },
  // Khách đặt khi chưa đăng nhập: gắn theo số điện thoại
  { code: 'MVN-4', paymentStatus: PAID, customerPhone: '0902-222-222', status: 'đang ở', totalPrice: 200000, createdAt: '2026-10-22T00:00:00Z' },
  { code: 'MVN-5', paymentStatus: PAID, customerPhone: '0909999999', customerName: 'Khách lẻ', totalPrice: 100000 },
];

const pets = [
  { id: 'pet-1', name: 'Mochi', ownerId: 'user-a' },
  { id: 'pet-2', name: 'Mochi', ownerId: 'user-b' },
  { id: 'pet-3', name: 'Bơ' },
];

describe('Admin > Khách hàng: gom dữ liệu từ giao diện khách', () => {
  const customers = buildCustomers({ profiles, bookings, pets, excludeIds: ['admin-1'] });
  const byId = Object.fromEntries(customers.map((c) => [c.id, c]));

  it('mỗi khách có đúng mèo và đơn của mình, không gộp 2 bé cùng tên', () => {
    expect(byId['user-a'].pets.map((p) => p.id)).toEqual(['pet-1']);
    expect(byId['user-b'].pets.map((p) => p.id)).toEqual(['pet-2']);
    expect(byId['user-a'].bookings.map((b) => b.code)).toEqual(['MVN-3', 'MVN-2', 'MVN-1']);
  });

  it('không tính đơn đã hủy vào số đơn và chi tiêu', () => {
    expect(byId['user-a'].bookingCount).toBe(2);
    expect(byId['user-a'].totalSpent).toBe(750000);
    expect(byId['user-a'].completedCount).toBe(1);
    expect(byId['user-a'].segment).toBe('returning');
  });

  it('gắn đơn của khách chưa đăng nhập theo số điện thoại', () => {
    expect(byId['user-b'].bookings.map((b) => b.code)).toEqual(['MVN-4']);
    expect(byId['user-b'].isStaying).toBe(true);
    expect(byId['phone:0909999999'].fullName).toBe('Khách lẻ');
  });

  it('bỏ tài khoản admin và mèo không rõ chủ', () => {
    expect(byId['admin-1']).toBeUndefined();
    expect(customers.flatMap((c) => c.pets).some((p) => p.id === 'pet-3')).toBe(false);
  });

  it('thẻ số liệu và phễu chuyển đổi', () => {
    const stats = computeStats(customers, new Date('2026-10-25T00:00:00Z'));
    expect(stats.total).toBe(3);
    expect(stats.pets).toBe(2);
    expect(stats.staying).toBe(1);
    expect(stats.revenue).toBe(1050000);

    const funnel = computeFunnel(customers);
    expect(funnel.map((s) => s.count)).toEqual([3, 2, 3, 1, 1]);
  });
});

describe('Admin > Khách hàng: chỉ ghi nhận doanh thu khi khách đã thanh toán, theo tháng gửi mèo', () => {
  const list = [
    // Gửi 25/10 → đón 08/11, thanh toán đầu tháng 11 vẫn tính cho tháng 10
    { code: 'P-1', customerId: 'u1', status: 'check-out', checkIn: '2026-10-25', checkOut: '2026-11-08', totalPrice: 1400000, paymentStatus: 'Đã thanh toán', paidAt: '2026-11-08T10:00:00Z' },
    { code: 'P-2', customerId: 'u1', status: 'check-in', checkIn: '2026-11-20', checkOut: '2026-11-22', totalPrice: 300000, paymentStatus: 'deposit_paid', depositAmount: 150000 },
    { code: 'P-3', customerId: 'u1', status: 'check-in', checkIn: '2026-11-03', checkOut: '2026-11-05', totalPrice: 250000, paymentStatus: 'pay_at_checkin' },
    { code: 'P-4', customerId: 'u2', status: 'đang ở', checkIn: '2026-11-01', checkOut: '2026-11-04', totalPrice: 500000, paymentStatus: 'Đã thanh toán' },
    { code: 'P-5', customerId: 'u2', status: 'cancelled', checkIn: '2026-10-10', checkOut: '2026-10-12', totalPrice: 900000, paymentStatus: 'Đã thanh toán' },
  ];
  const customers = buildCustomers({ bookings: list });
  const byId = Object.fromEntries(customers.map((c) => [c.id, c]));

  it('đơn chưa thanh toán đủ (mới đặt, chờ cọc, đã cọc) chưa cộng vào chi tiêu của khách', () => {
    expect(byId.u1.totalSpent).toBe(1400000);
    expect(byId.u1.bookingCount).toBe(3);
    expect(byId.u2.totalSpent).toBe(500000);
  });

  it('doanh thu gán cho tháng của ngày gửi mèo, không phải tháng thanh toán', () => {
    expect(revenueMonthOf(list[0])).toBe('2026-10');
    expect(computeRevenueByMonth(customers)).toEqual([
      { month: '2026-11', revenue: 500000, bookings: 1 },
      { month: '2026-10', revenue: 1400000, bookings: 1 },
    ]);
    expect(computeStats(customers).revenue).toBe(1900000);
  });

  it('khách thanh toán xong thì doanh thu tăng ngay', () => {
    const paid = list.map((b) => (b.code === 'P-3' ? { ...b, paymentStatus: 'Đã thanh toán' } : b));
    const after = buildCustomers({ bookings: paid });
    expect(after.find((c) => c.id === 'u1').totalSpent).toBe(1650000);
    expect(computeRevenueByMonth(after).find((r) => r.month === '2026-11').revenue).toBe(750000);
  });

  it('bản đơn cũ ở nguồn khác không đè mất trạng thái đã thanh toán', () => {
    const stale = { code: 'P-1', customerId: 'u1', status: 'check-out', checkIn: '2026-10-25', totalPrice: 1400000, paymentStatus: 'pay_at_checkin' };
    const merged = buildCustomers({ bookings: [...list, stale] });
    expect(merged.find((c) => c.id === 'u1').totalSpent).toBe(1400000);
  });
});
