import { describe, expect, it } from 'vitest';
import { bookingFromDbRow, dedupeBookingsByCode, buildAuthoritativeBookings } from '../../src/utils/bookingSync';

const NOW = new Date('2026-11-02T12:00:00Z').getTime();

describe('bookingFromDbRow', () => {
  it('dùng mã đơn làm id, giữ uuid ở dbId', () => {
    const b = bookingFromDbRow({ id: 'uuid-1', code: 'MVN-1', customer_id: 'u1', created_at: '2026-10-01', data: { checkIn: '2026-10-05' } });
    expect(b).toMatchObject({ id: 'MVN-1', code: 'MVN-1', dbId: 'uuid-1', customerId: 'u1', checkIn: '2026-10-05' });
  });
});

describe('dedupeBookingsByCode', () => {
  it('nhiều dòng cùng mã chỉ còn 1 đơn (bản mới nhất)', () => {
    const list = dedupeBookingsByCode([
      { id: 'MVN-1', code: 'MVN-1', status: 'cũ', updatedAt: '2026-10-01T00:00:00Z' },
      { id: 'MVN-1', code: 'MVN-1', status: 'mới', updatedAt: '2026-10-02T00:00:00Z' },
      { id: 'MVN-2', code: 'MVN-2' },
    ]);
    expect(list).toHaveLength(2);
    expect(list.find(b => b.code === 'MVN-1').status).toBe('mới');
  });
});

describe('buildAuthoritativeBookings', () => {
  const db = [
    { id: 'MVN-1', code: 'MVN-1', status: 'Đang lưu trú', createdAt: '2026-10-01T00:00:00Z' },
    { id: 'MVN-2', code: 'MVN-2', status: 'Đã hoàn tất', createdAt: '2026-09-01T00:00:00Z' },
  ];

  it('hai trình duyệt có localStorage khác nhau vẫn ra cùng một danh sách', () => {
    const browserA = [
      ...db.map(b => ({ ...b, status: 'Sắp tới' })),
      { id: 'MVN-OLD1', code: 'MVN-OLD1', createdAt: '2026-08-01T00:00:00Z' },
      { id: 'MVN-OLD2', code: 'MVN-OLD2', createdAt: '2026-08-02T00:00:00Z' },
    ];
    const browserB = [db[0]];
    const a = buildAuthoritativeBookings(browserA, db, [], NOW);
    const b = buildAuthoritativeBookings(browserB, db, [], NOW);
    expect(a).toEqual(b);
    expect(a.map(x => x.code)).toEqual(['MVN-1', 'MVN-2']);
    expect(a[0].status).toBe('Đang lưu trú');
  });

  it('giữ đơn vừa tạo trên máy (chưa kịp ghi Supabase) trong 10 phút', () => {
    const fresh = { id: 'MVN-NEW', code: 'MVN-NEW', createdAt: new Date(NOW - 60 * 1000).toISOString() };
    const result = buildAuthoritativeBookings([fresh], db, [], NOW);
    expect(result.map(x => x.code)).toContain('MVN-NEW');
  });

  it('server sync chỉ bổ sung trường, không thêm đơn lạ', () => {
    const server = [
      { id: 'MVN-1', code: 'MVN-1', staffNote: 'ghi chú' },
      { id: 'MVN-GHOST', code: 'MVN-GHOST' },
    ];
    const result = buildAuthoritativeBookings([], db, server, NOW);
    expect(result.map(x => x.code)).not.toContain('MVN-GHOST');
    expect(result.find(x => x.code === 'MVN-1').staffNote).toBe('ghi chú');
  });
});
