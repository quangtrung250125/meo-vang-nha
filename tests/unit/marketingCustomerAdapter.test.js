import { describe, it, expect } from 'vitest';
import {
  classifyCustomerSegment,
  getCustomerPetNames,
  buildRealRecipients,
  buildRealScheduleItems,
  MARKETING_SEGMENT_KEYS,
  MISSING_DATA_CONDITIONS,
} from '../../src/pages/AdminMarketing/marketingCustomerAdapter';

describe('Marketing Customer Adapter — Phân khúc khách hàng thật', () => {
  const baseDate = new Date('2026-11-01T00:00:00Z');

  it('xác định khách tiềm năng khi chưa có đơn hoàn tất nào', () => {
    const customer = {
      id: 'cust-1',
      fullName: 'Khách Tiềm Năng',
      bookingCount: 0,
      completedCount: 0,
      totalSpent: 0,
    };
    expect(classifyCustomerSegment(customer, baseDate)).toBe(MARKETING_SEGMENT_KEYS.POTENTIAL);
  });

  it('xác định khách mới khi có đúng 1 đơn hoàn tất', () => {
    const customer = {
      id: 'cust-2',
      fullName: 'Khách Mới',
      bookingCount: 1,
      completedCount: 1,
      totalSpent: 250000,
      lastBookingAt: '2026-10-25T00:00:00Z',
    };
    expect(classifyCustomerSegment(customer, baseDate)).toBe(MARKETING_SEGMENT_KEYS.NEW);
  });

  it('xác định khách quay lại khi có từ 2 đến 4 đơn hoàn tất', () => {
    const customer = {
      id: 'cust-3',
      fullName: 'Khách Quay Lại',
      bookingCount: 2,
      completedCount: 2,
      totalSpent: 1200000,
      lastBookingAt: '2026-10-15T00:00:00Z',
    };
    expect(classifyCustomerSegment(customer, baseDate)).toBe(MARKETING_SEGMENT_KEYS.RETURNING);
  });

  it('xác định khách thân thiết khi có từ 5 đơn hoàn tất trở lên', () => {
    const customer = {
      id: 'cust-4',
      fullName: 'Khách Thân Thiết',
      bookingCount: 5,
      completedCount: 5,
      totalSpent: 2500000,
      lastBookingAt: '2026-10-20T00:00:00Z',
    };
    expect(classifyCustomerSegment(customer, baseDate)).toBe(MARKETING_SEGMENT_KEYS.LOYAL);
  });

  it('xác định khách VIP khi chi tiêu đạt ngưỡng 3.000.000đ và từ 2 đơn', () => {
    const customer = {
      id: 'cust-5',
      fullName: 'Khách VIP',
      bookingCount: 3,
      completedCount: 3,
      totalSpent: 3500000,
      lastBookingAt: '2026-10-28T00:00:00Z',
    };
    expect(classifyCustomerSegment(customer, baseDate)).toBe(MARKETING_SEGMENT_KEYS.VIP);
  });

  it('xác định nguy cơ rời bỏ khi không đặt lại sau hơn 6 tháng (> 180 ngày)', () => {
    const customer = {
      id: 'cust-6',
      fullName: 'Khách Nguy Cơ',
      bookingCount: 2,
      completedCount: 2,
      totalSpent: 800000,
      lastBookingAt: '2026-03-01T00:00:00Z', // 8 tháng trước
    };
    expect(classifyCustomerSegment(customer, baseDate)).toBe(MARKETING_SEGMENT_KEYS.AT_RISK);
  });

  it('trích xuất tên mèo chính xác từ hồ sơ hoặc lịch sử đơn', () => {
    const c1 = { pets: [{ name: 'Mochi' }, { name: 'Bơ' }] };
    expect(getCustomerPetNames(c1)).toBe('Mochi, Bơ');

    const c2 = { pets: [], bookings: [{ petProfiles: [{ name: 'Cà Phê' }] }] };
    expect(getCustomerPetNames(c2)).toBe('Cà Phê');

    const c3 = { pets: [] };
    expect(getCustomerPetNames(c3)).toBe('Chưa có hồ sơ mèo');
  });

  it('tạo danh sách đối tượng người nhận thật và lịch gửi không dùng dữ liệu giả', () => {
    const realCustomers = [
      {
        id: 'user-1',
        fullName: 'Nguyễn Văn A',
        pets: [{ name: 'Miu' }],
        bookingCount: 0,
        completedCount: 0,
        totalSpent: 0,
        createdAt: '2026-10-20T00:00:00Z',
      },
      {
        id: 'user-2',
        fullName: 'Trần Thị B',
        pets: [{ name: 'Mun' }],
        bookingCount: 2,
        completedCount: 2,
        totalSpent: 4000000,
        bookings: [{ status: 'check-in', checkIn: '2026-11-03' }],
      },
    ];

    const scenarios = [
      { id: 'sc-1', name: 'Đăng ký chưa đặt phòng', enabled: true, segment: 'potential' },
      { id: 'sc-3', name: 'Nhắc lịch trước ngày gửi mèo', enabled: true, segment: 'confirmed' },
    ];

    const recipients = buildRealRecipients(realCustomers, scenarios, baseDate);
    expect(recipients).toHaveLength(2);
    expect(recipients[0].name).toBe('Nguyễn Văn A');
    expect(recipients[0].catName).toBe('Miu');
    expect(recipients[0].segment).toBe(MARKETING_SEGMENT_KEYS.POTENTIAL);

    expect(recipients[1].name).toBe('Trần Thị B');
    expect(recipients[1].segment).toBe(MARKETING_SEGMENT_KEYS.CONFIRMED);
    expect(recipients[1].trigger).toContain('2026-11-03');

    const schedule = buildRealScheduleItems(scenarios, recipients, baseDate);
    expect(schedule).toHaveLength(2);
    expect(schedule.find((s) => s.scenarioId === 'sc-1')?.recipients).toBe(1);
    expect(schedule.find((s) => s.scenarioId === 'sc-3')?.recipients).toBe(1);
  });

  it('định nghĩa rõ ràng danh sách các điều kiện chưa có dữ liệu thật', () => {
    expect(MISSING_DATA_CONDITIONS.length).toBeGreaterThanOrEqual(3);
    const cart = MISSING_DATA_CONDITIONS.find((c) => c.code === 'abandoned_cart');
    expect(cart?.name).toBe('Bỏ dở đặt phòng');
  });
});
