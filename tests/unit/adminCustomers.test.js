import { describe, expect, it } from 'vitest';
import { buildCustomers, computeFunnel, computeStats } from '../../src/pages/AdminCustomers/customerUtils';

const profiles = [
  { id: 'user-a', fullName: 'Nguyễn An', phone: '0901 111 111', email: 'an@example.com', createdAt: '2026-10-01T00:00:00Z' },
  { id: 'user-b', fullName: 'Trần Bình', phone: '0902222222', createdAt: '2026-10-02T00:00:00Z' },
  { id: 'admin-1', fullName: 'Quản trị viên' },
];

const bookings = [
  { code: 'MVN-1', customerId: 'user-a', status: 'check-out', totalPrice: 300000, createdAt: '2026-10-05T00:00:00Z', petIds: ['pet-1'] },
  { code: 'MVN-2', customerId: 'user-a', status: 'check-in', totalPrice: 450000, createdAt: '2026-10-20T00:00:00Z' },
  { code: 'MVN-3', customerId: 'user-a', status: 'Đã hủy', totalPrice: 999000, createdAt: '2026-10-21T00:00:00Z' },
  // Khách đặt khi chưa đăng nhập: gắn theo số điện thoại
  { code: 'MVN-4', customerPhone: '0902-222-222', status: 'đang ở', totalPrice: 200000, createdAt: '2026-10-22T00:00:00Z' },
  { code: 'MVN-5', customerPhone: '0909999999', customerName: 'Khách lẻ', totalPrice: 100000 },
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
