import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Nhân viên đặt phòng hộ khách đến cửa hàng
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mvn-assisted-'));
process.env.MVN_DATA_DIR = dataDir;
process.env.ADMIN_EMAILS = 'admin@test.vn';
process.env.MVN_BOOKINGS_DB = 'off';

let api;
let customersApi;
let assisted;

const USERS = {
  'token-admin': { id: 'admin-1', email: 'admin@test.vn', user_metadata: { full_name: 'Nhân viên Lan' } },
  'token-a': { id: 'user-a', email: '0900000001@meovangnha.vn' },
  'token-b': { id: 'user-b', email: 'b@test.vn' },
};

const call = async (handler, { method = 'GET', body, token } = {}) => {
  const req = { method, body, query: {}, headers: token ? { authorization: `Bearer ${token}` } : {} };
  const res = {
    statusCode: 200,
    payload: undefined,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.payload = obj; return this; },
    end(str) { this.payload = str ? JSON.parse(str) : undefined; return this; },
  };
  await handler(req, res);
  return res;
};

const addDays = (n) => new Date(Date.now() + 7 * 3600000 + n * 86400000).toISOString().slice(0, 10);

let seq = 0;
const assistedBooking = (overrides = {}) => {
  seq += 1;
  return {
    id: `AS-${seq}`,
    code: `AS-${seq}`,
    cats: 1,
    checkIn: addDays(5),
    checkOut: addDays(7),
    totalPrice: 600000,
    ...assisted.assistedOwnerFields({ id: 'user-a', fullName: 'Chị A', phone: '0900000001' }, { staffName: 'Lan' }),
    pending_changes: assisted.buildConfirmRequest({ staffName: 'Lan' }),
    ...overrides,
  };
};

beforeAll(async () => {
  const auth = await import('../../api/_lib/auth.js');
  auth.setTokenVerifier(async (token) => USERS[token] || null);
  api = await import('../../api/_lib/bookingsService.js');
  customersApi = await import('../../api/_lib/adminCustomers.js');
  assisted = await import('../../src/utils/assistedBooking.js');
});

const findLive = (code) => Object.values(api.getAllBookings()).flat().find((b) => b.code === code);

describe('Nhân viên đặt hộ khách đã có tài khoản', () => {
  it('đơn thuộc về khách, giữ chỗ trong phòng và chờ khách xác nhận', async () => {
    const res = await call(api.handleAddBooking, { method: 'POST', token: 'token-admin', body: { roomId: 'VIP-05', booking: assistedBooking({ cats: 2 }) } });
    expect(res.statusCode).toBe(200);
    const booking = res.payload.booking;
    expect(booking.customerId).toBe('user-a');
    expect(booking.ownerName).toBe('Chị A');
    expect(assisted.isAwaitingCustomerConfirm(booking)).toBe(true);
    expect(Date.parse(booking.pending_changes.dueAt)).toBeGreaterThan(Date.now());

    // Phòng VIP sức chứa 2: đơn chờ xác nhận vẫn giữ chỗ, khách khác không đặt trùng được
    const other = await call(api.handleAddBooking, { method: 'POST', token: 'token-b', body: { roomId: 'VIP-05', booking: { id: 'X-1', code: 'X-1', cats: 1, checkIn: addDays(5), checkOut: addDays(6) } } });
    expect(other.statusCode).toBe(409);
  });

  it('khách không tự gửi được yêu cầu xác nhận đơn', async () => {
    const res = await call(api.handleAddBooking, { method: 'POST', token: 'token-b', body: { roomId: 'VIP-06', booking: assistedBooking({ customerId: 'user-b' }) } });
    expect(res.statusCode).toBe(200);
    expect(res.payload.booking.pending_changes).toBeNull();
    expect(res.payload.booking.bookedByStaff).toBeUndefined();
  });

  it('khách xác nhận thì đơn được ghi nhận', async () => {
    const add = await call(api.handleAddBooking, { method: 'POST', token: 'token-admin', body: { roomId: 'VVIP-02', booking: assistedBooking() } });
    const { code, roomId } = add.payload.booking;
    const res = await call(api.handleUpdateBooking, { method: 'PUT', token: 'token-a', body: { roomId, code, updates: { pending_changes: null, customerConfirmedAt: 'x' } } });
    expect(res.statusCode).toBe(200);
    const live = findLive(code);
    expect(live.pending_changes).toBeNull();
    expect(live.customerConfirmedAt).toBeTruthy();
  });

  it('khách khác không xác nhận hộ được', async () => {
    const add = await call(api.handleAddBooking, { method: 'POST', token: 'token-admin', body: { roomId: 'VVIP-03', booking: assistedBooking() } });
    const { code, roomId } = add.payload.booking;
    const res = await call(api.handleUpdateBooking, { method: 'PUT', token: 'token-b', body: { roomId, code, updates: { pending_changes: null } } });
    expect(res.statusCode).toBe(403);
    expect(assisted.isAwaitingCustomerConfirm(findLive(code))).toBe(true);
  });

  it('khách từ chối thì đơn bị hủy và trả phòng', async () => {
    const add = await call(api.handleAddBooking, { method: 'POST', token: 'token-admin', body: { roomId: 'DELUXE-01', booking: assistedBooking({ checkIn: addDays(0), checkOut: addDays(2) }) } });
    const { code, roomId } = add.payload.booking;
    const res = await call(api.handleUpdateBooking, { method: 'PUT', token: 'token-a', body: { roomId, code, updates: { status: 'cancelled', cancelReason: 'Khách từ chối đơn nhân viên đặt hộ', pending_changes: null } } });
    expect(res.statusCode).toBe(200);
    expect(findLive(code)).toBeUndefined();
  });

  it('chưa xác nhận thì khách chưa được sửa đơn hay đổi lịch', async () => {
    const add = await call(api.handleAddBooking, { method: 'POST', token: 'token-admin', body: { roomId: 'DELUXE-02', booking: assistedBooking() } });
    const { code, roomId } = add.payload.booking;
    const edit = await call(api.handleUpdateBooking, { method: 'PUT', token: 'token-a', body: { roomId, code, updates: { customerEdit: true, cats: 2, totalPrice: 1 } } });
    expect(edit.statusCode).toBe(409);
    const move = await call(api.handleUpdateBooking, { method: 'PUT', token: 'token-a', body: { roomId, code, updates: { checkIn: addDays(8), checkOut: addDays(9) } } });
    expect(move.statusCode).toBe(409);
  });

  it('đơn đặt hộ cần cọc vẫn được server tính cọc và hạn cọc', async () => {
    const res = await call(api.handleAddBooking, {
      method: 'POST', token: 'token-admin',
      body: { roomId: 'VIP-01', booking: assistedBooking({ checkIn: addDays(20), checkOut: addDays(26), paymentStatus: 'Thanh toán khi nhận phòng' }) },
    });
    expect(res.payload.booking.depositRequired).toBe(true);
    expect(res.payload.booking.depositDueAt).toBeTruthy();
  });
});

describe('Nhân viên tạo tài khoản cho khách mới', () => {
  const fakeDeps = () => {
    const created = [];
    const profiles = [];
    return {
      created,
      profiles,
      deps: {
        canManageUsers: true,
        phoneTaken: async (phone) => profiles.some((p) => p.phone === phone),
        admin: {
          from: () => ({
            select: async () => ({ data: profiles }),
            upsert: async (row) => { profiles.push(row); return { error: null }; },
          }),
          auth: {
            admin: {
              listUsers: async () => ({ data: { users: [] } }),
              createUser: async (args) => { created.push(args); return { data: { user: { id: `new-${created.length}` } }, error: null }; },
            },
          },
        },
      },
    };
  };

  it('tạo tài khoản bằng SĐT, trả mật khẩu tạm cho nhân viên', async () => {
    const fake = fakeDeps();
    customersApi.setAdminCustomerDeps(fake.deps);
    const res = await call(customersApi.handleCreateCustomer, { method: 'POST', token: 'token-admin', body: { fullName: 'Anh Bình', phone: '0912 345 678' } });
    expect(res.statusCode).toBe(200);
    expect(res.payload.customer).toMatchObject({ id: 'new-1', fullName: 'Anh Bình', phone: '0912345678' });
    expect(res.payload.password).toMatch(/^\d{6}$/);
    expect(fake.created[0]).toMatchObject({ email: '0912345678@meovangnha.vn', email_confirm: true });
    expect(fake.profiles[0]).toMatchObject({ id: 'new-1', phone: '0912345678' });

    // SĐT đã có tài khoản: báo trùng và trả khách có sẵn để nhân viên chọn
    const again = await call(customersApi.handleCreateCustomer, { method: 'POST', token: 'token-admin', body: { fullName: 'Anh Bình', phone: '0912345678' } });
    expect(again.statusCode).toBe(409);
    expect(again.payload.existing).toMatchObject({ id: 'new-1' });
    customersApi.setAdminCustomerDeps(null);
  });

  it('chỉ nhân viên mới tạo / xem được danh sách khách', async () => {
    customersApi.setAdminCustomerDeps(fakeDeps().deps);
    const create = await call(customersApi.handleCreateCustomer, { method: 'POST', token: 'token-a', body: { fullName: 'X', phone: '0912000000' } });
    expect(create.statusCode).toBe(403);
    const list = await call(customersApi.handleListCustomers, { token: 'token-b' });
    expect(list.statusCode).toBe(403);
    const anon = await call(customersApi.handleListCustomers, {});
    expect(anon.statusCode).toBe(401);
    customersApi.setAdminCustomerDeps(null);
  });

  it('kiểm tra họ tên, SĐT', async () => {
    customersApi.setAdminCustomerDeps(fakeDeps().deps);
    const noName = await call(customersApi.handleCreateCustomer, { method: 'POST', token: 'token-admin', body: { fullName: ' ', phone: '0912000000' } });
    expect(noName.statusCode).toBe(400);
    const badPhone = await call(customersApi.handleCreateCustomer, { method: 'POST', token: 'token-admin', body: { fullName: 'A', phone: '123' } });
    expect(badPhone.statusCode).toBe(400);
    customersApi.setAdminCustomerDeps(null);
  });
});
