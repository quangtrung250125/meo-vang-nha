import { describe, expect, it } from 'vitest';
import { updateBookingRows } from '../../src/utils/bookingRows';

// Client Supabase giả: ghi lại các bộ lọc được dùng và báo lỗi 22P02 nếu lọc id (uuid) bằng mã MVN-...
const makeClient = (rows) => {
  const calls = [];
  const client = {
    calls,
    rows,
    from() {
      return {
        select() {
          return {
            async eq(column, value) {
              calls.push(['select', column, value]);
              if (column === 'id' && !/^[0-9a-f-]{36}$/i.test(value)) {
                return { data: null, error: { code: '22P02', message: `invalid input syntax for type uuid: "${value}"` } };
              }
              return { data: rows.filter((r) => r[column] === value), error: null };
            },
          };
        },
        update(values) {
          return {
            async eq(column, value) {
              calls.push(['update', column, value]);
              rows.filter((r) => r[column] === value).forEach((r) => Object.assign(r, values));
              return { error: null };
            },
          };
        },
      };
    },
  };
  return client;
};

describe('Cập nhật đơn trên bảng bookings theo mã đơn', () => {
  it('lọc theo cột code với mã MVN-xxxxx (không lọc id) và gộp vào data', async () => {
    const rows = [{ id: 'd39c98ce-7eb4-42ed-a440-da3d9cf86d45', code: 'MVN-71590', data: { status: 'check-in', cats: 1 } }];
    const client = makeClient(rows);
    const updated = await updateBookingRows(client, 'MVN-71590', { status: 'cancelled' });
    expect(updated).toBe(true);
    expect(client.calls[0]).toEqual(['select', 'code', 'MVN-71590']);
    expect(rows[0].data).toEqual({ status: 'cancelled', cats: 1 });
  });

  it('cập nhật mọi dòng trùng mã đơn', async () => {
    const rows = [
      { id: '11111111-1111-4111-8111-111111111111', code: 'MVN-1', data: { paymentStatus: 'awaiting_deposit' } },
      { id: '22222222-2222-4222-8222-222222222222', code: 'MVN-1', data: { paymentStatus: 'awaiting_deposit' } },
    ];
    await updateBookingRows(makeClient(rows), 'MVN-1', { paymentStatus: 'deposit_paid' });
    expect(rows.map((r) => r.data.paymentStatus)).toEqual(['deposit_paid', 'deposit_paid']);
  });

  it('trả về false khi không có dòng nào', async () => {
    expect(await updateBookingRows(makeClient([]), 'MVN-404', { status: 'cancelled' })).toBe(false);
  });
});
