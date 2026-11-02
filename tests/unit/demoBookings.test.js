import { describe, expect, it } from 'vitest';
import { DEMO_BOOKING_IDS, isDemoBooking, withoutDemoBookings } from '../../src/utils/demoBookings';

describe('Lọc đơn mẫu kiểm thử', () => {
  it('nhận ra đơn mẫu theo id hoặc mã đơn', () => {
    expect(isDemoBooking({ id: 'MVN-88219' })).toBe(true);
    expect(isDemoBooking({ id: 'x', code: 'MVN-50913' })).toBe(true);
    expect(isDemoBooking({ id: 'MVN-12345', code: 'MVN-12345' })).toBe(false);
    expect(isDemoBooking(null)).toBe(false);
  });

  it('bỏ toàn bộ đơn mẫu, giữ nguyên đơn thật', () => {
    const real = { id: 'MVN-12345', code: 'MVN-12345' };
    const list = [...DEMO_BOOKING_IDS.map((id) => ({ id, code: id, customerId: 'user-a' })), real];
    expect(withoutDemoBookings(list)).toEqual([real]);
  });
});
