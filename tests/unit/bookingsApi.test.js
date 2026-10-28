import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Dùng thư mục tạm để test không đụng tới dữ liệu thật trong api/_lib
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mvn-api-'));
process.env.MVN_DATA_DIR = dataDir;
process.env.ADMIN_EMAILS = 'admin@test.vn';
process.env.MVN_BOOKINGS_DB = 'off';

let api;
let sync;
let auth;

const USERS = {
  'token-admin': { id: 'admin-1', email: 'admin@test.vn' },
  'token-a': { id: 'user-a', email: 'a@test.vn' },
  'token-b': { id: 'user-b', email: 'b@test.vn' },
};

// Giả lập req/res giống Vercel
const call = async (handler, { method = 'GET', body, token } = {}) => {
  const req = { method, body, query: {}, headers: token ? { authorization: `Bearer ${token}` } : {} };
  const res = {
    statusCode: 200,
    payload: undefined,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.payload = obj; return this; },
    end(str) { this.payload = str ? JSON.parse(str) : undefined; return this; },
  };
  await handler(req, res);
  return res;
};

const addDays = (n) => {
  const d = new Date(Date.now() + n * 86400000);
  return d.toISOString().slice(0, 10);
};

let seq = 0;
const newBooking = (overrides = {}) => {
  seq += 1;
  return {
    id: `T-${seq}`,
    code: `T-${seq}`,
    cats: 1,
    checkIn: addDays(10),
    checkOut: addDays(12),
    ownerName: 'Khách Test',
    ownerPhone: '0900000001',
    ...overrides,
  };
};

beforeAll(async () => {
  auth = await import('../../api/_lib/auth.js');
  auth.setTokenVerifier(async (token) => USERS[token] || null);
  api = await import('../../api/_lib/bookingsService.js');
  sync = await import('../../api/_lib/syncService.js');
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/bookings: kiểm tra dữ liệu đơn', () => {
  it('nhận đơn hợp lệ', async () => {
    const res = await call(api.handleAddBooking, { method: 'POST', body: { roomId: 'VIP-01', booking: newBooking() } });
    expect(res.statusCode).toBe(200);
    expect(res.payload.success).toBe(true);
  });

  it.each([
    ['ngày đón trước ngày gửi', { checkIn: addDays(20), checkOut: addDays(18) }],
    ['ngày trong quá khứ', { checkIn: '2020-01-01', checkOut: '2020-01-03' }],
    ['ngày sai định dạng', { checkIn: '2026-13-45', checkOut: addDays(30) }],
    ['số mèo âm', { cats: -5 }],
    ['số mèo lẻ', { cats: 1.5 }],
    ['vượt sức chứa phòng', { cats: 3 }],
  ])('từ chối đơn có %s', async (_name, overrides) => {
    const res = await call(api.handleAddBooking, { method: 'POST', body: { roomId: 'VIP-02', booking: newBooking(overrides) } });
    expect(res.statusCode).toBe(400);
    expect(res.payload.success).toBe(false);
  });

  it('báo hết chỗ khi phòng đã đầy trong khoảng ngày', async () => {
    const dates = { checkIn: addDays(40), checkOut: addDays(43) };
    const first = await call(api.handleAddBooking, { method: 'POST', body: { roomId: 'VIP-03', booking: newBooking({ ...dates, cats: 2 }) } });
    expect(first.statusCode).toBe(200);
    const second = await call(api.handleAddBooking, { method: 'POST', body: { roomId: 'VIP-03', booking: newBooking({ ...dates, cats: 1 }) } });
    expect(second.statusCode).toBe(409);
  });

  it('cho nhận phòng đúng ngày khách trước trả phòng', async () => {
    await call(api.handleAddBooking, { method: 'POST', body: { roomId: 'VIP-04', booking: newBooking({ checkIn: addDays(50), checkOut: addDays(52), cats: 2 }) } });
    const res = await call(api.handleAddBooking, { method: 'POST', body: { roomId: 'VIP-04', booking: newBooking({ checkIn: addDays(52), checkOut: addDays(54), cats: 2 }) } });
    expect(res.statusCode).toBe(200);
  });

  it('không ghi đè đơn cũ khi gửi trùng mã, mà cấp mã mới', async () => {
    const original = newBooking({ checkIn: addDays(60), checkOut: addDays(61), ownerName: 'Chủ thật' });
    await call(api.handleAddBooking, { method: 'POST', body: { roomId: 'VVIP-01', booking: original } });
    const res = await call(api.handleAddBooking, {
      method: 'POST',
      body: { roomId: 'VVIP-01', booking: { ...original, ownerName: 'Kẻ giả mạo', checkIn: addDays(70), checkOut: addDays(71) } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.payload.booking.code).not.toBe(original.code);
    const stored = api.getAllBookings()['VVIP-01'].find((b) => b.code === original.code);
    expect(stored.ownerName).toBe('Chủ thật');
  });

  it('gắn đơn với tài khoản đang đăng nhập', async () => {
    const res = await call(api.handleAddBooking, {
      method: 'POST',
      token: 'token-a',
      body: { roomId: 'VVIP-02', booking: newBooking({ customerId: 'user-b' }) },
    });
    expect(res.payload.booking.customerId).toBe('user-a');
  });
});

describe('Quyền truy cập /api/bookings', () => {
  it('khách vãng lai không thấy tên, số điện thoại của người khác', async () => {
    const res = await call(api.handleGetBookings);
    const all = Object.values(res.payload.bookings).flat();
    expect(all.length).toBeGreaterThan(0);
    all.forEach((b) => {
      expect(b.ownerName).toBeUndefined();
      expect(b.ownerPhone).toBeUndefined();
      expect(b.customerId).toBeUndefined();
    });
  });

  it('admin thấy đầy đủ thông tin', async () => {
    const res = await call(api.handleGetBookings, { token: 'token-admin' });
    const all = Object.values(res.payload.bookings).flat();
    expect(all.some((b) => b.ownerName)).toBe(true);
  });

  it('không cho khách vãng lai hoặc khách thường xóa / sửa đơn', async () => {
    const target = Object.values(api.getAllBookings()).flat()[0];
    const anon = await call(api.handleRemoveBooking, { method: 'DELETE', body: { roomId: target.roomId, code: target.code } });
    expect(anon.statusCode).toBe(401);
    const customer = await call(api.handleUpdateBooking, { method: 'PUT', token: 'token-b', body: { roomId: target.roomId, code: target.code, updates: { cats: 9 } } });
    expect(customer.statusCode).toBe(403);
    expect(Object.values(api.getAllBookings()).flat().find((b) => b.code === target.code)).toBeTruthy();
  });

  it('admin hủy được đơn', async () => {
    const created = await call(api.handleAddBooking, { method: 'POST', body: { roomId: 'DELUXE-01', booking: newBooking() } });
    const code = created.payload.booking.code;
    const res = await call(api.handleRemoveBooking, { method: 'DELETE', token: 'token-admin', body: { roomId: 'DELUXE-01', code } });
    expect(res.statusCode).toBe(200);
    expect(api.getAllBookings()['DELUXE-01'].some((b) => b.code === code)).toBe(false);
  });
});

describe('Khách tự thay đổi đơn của chính mình qua PUT /api/bookings', () => {
  // Tạo đơn gắn với user-a (khách đăng nhập) trong phòng riêng cho từng test
  const createOwnBooking = async (roomId, overrides = {}) => {
    const res = await call(api.handleAddBooking, { method: 'POST', token: 'token-a', body: { roomId, booking: newBooking(overrides) } });
    return res.payload.booking.code;
  };
  const put = (roomId, code, updates, token = 'token-a') =>
    call(api.handleUpdateBooking, { method: 'PUT', token, body: { roomId, code, updates } });
  const stored = (roomId, code) => api.getAllBookings()[roomId].find((b) => b.code === code);

  it('khách tự đổi lịch đơn chưa Check-in', async () => {
    const code = await createOwnBooking('VIP-05', { checkIn: addDays(80), checkOut: addDays(82) });
    const res = await put('VIP-05', code, { checkIn: addDays(81), checkOut: addDays(84), pending_changes: null });
    expect(res.statusCode).toBe(200);
    expect(stored('VIP-05', code).checkIn).toBe(addDays(81));
  });

  it('không cho đổi lịch sang khoảng ngày phòng đã kín chỗ', async () => {
    await call(api.handleAddBooking, { method: 'POST', body: { roomId: 'VIP-06', booking: newBooking({ checkIn: addDays(90), checkOut: addDays(92), cats: 2 }) } });
    const code = await createOwnBooking('VIP-06', { checkIn: addDays(95), checkOut: addDays(96) });
    const res = await put('VIP-06', code, { checkIn: addDays(90), checkOut: addDays(91) });
    expect(res.statusCode).toBe(409);
    expect(stored('VIP-06', code).checkIn).toBe(addDays(95));
  });

  it('khách tự hủy đơn chưa Check-in', async () => {
    const code = await createOwnBooking('VVIP-03');
    const res = await put('VVIP-03', code, { status: 'cancelled', cancelReason: 'Bận đột xuất' });
    expect(res.statusCode).toBe(200);
    expect(stored('VVIP-03', code)).toBeUndefined();
  });

  it('không cho khách hủy hoặc đổi lịch khi đơn đã Check-in, cũng không tự Check-in', async () => {
    const code = await createOwnBooking('DELUXE-02');
    expect((await put('DELUXE-02', code, { status: 'đang ở' })).statusCode).toBe(403);
    await put('DELUXE-02', code, { status: 'đang ở' }, 'token-admin');
    expect((await put('DELUXE-02', code, { status: 'cancelled' })).statusCode).toBe(409);
    expect((await put('DELUXE-02', code, { checkIn: addDays(11), checkOut: addDays(13) })).statusCode).toBe(409);
    expect(stored('DELUXE-02', code).status).toBe('đang ở');
  });

  it('không cho khách sửa đơn của người khác hoặc tự tạo đề xuất', async () => {
    const code = await createOwnBooking('VVIP-02', { checkIn: addDays(100), checkOut: addDays(101) });
    expect((await put('VVIP-02', code, { status: 'cancelled' }, 'token-b')).statusCode).toBe(403);
    expect((await put('VVIP-02', code, { pending_changes: { type: 'CANCEL' } })).statusCode).toBe(403);
    expect(stored('VVIP-02', code).status).not.toBe('cancelled');
  });

  it('khách chỉ nhận đúng gói dịch vụ Admin đã đề xuất', async () => {
    const code = await createOwnBooking('VIP-01', { checkIn: addDays(110), checkOut: addDays(111), packages: ['Gói Mèo Tự Túc'] });
    await put('VIP-01', code, { pending_changes: { type: 'UPDATE', newPackageName: 'Gói Mèo Sang Chảnh' } }, 'token-admin');
    const res = await put('VIP-01', code, { packages: ['Gói Mèo Thượng Đế'], pending_changes: null });
    expect(res.statusCode).toBe(200);
    expect(stored('VIP-01', code).packages[0]).toBe('Gói Mèo Sang Chảnh');
    expect(stored('VIP-01', code).pending_changes).toBeNull();
  });
});

describe('Khách tự hủy đơn', () => {
  const cancel = (token, roomId, code) =>
    call(api.handleUpdateBooking, { method: 'PUT', token, body: { roomId, code, updates: { status: 'cancelled' } } });

  it('khách hủy được đơn sắp tới của chính mình, phòng được trả lại', async () => {
    const created = await call(api.handleAddBooking, { method: 'POST', token: 'token-a', body: { roomId: 'VIP-02', booking: newBooking({ checkIn: addDays(30), checkOut: addDays(32) }) } });
    const code = created.payload.booking.code;
    const res = await cancel('token-a', 'VIP-02', code);
    expect(res.statusCode).toBe(200);
    expect(res.payload.success).toBe(true);
    expect(api.getAllBookings()['VIP-02'].some((b) => b.code === code)).toBe(false);
  });

  it('không hủy được đơn của người khác hoặc khi chưa đăng nhập', async () => {
    const created = await call(api.handleAddBooking, { method: 'POST', token: 'token-a', body: { roomId: 'VIP-02', booking: newBooking({ checkIn: addDays(50), checkOut: addDays(52) }) } });
    const code = created.payload.booking.code;
    expect((await cancel('token-b', 'VIP-02', code)).statusCode).toBe(403);
    expect((await cancel(undefined, 'VIP-02', code)).statusCode).toBe(401);
    expect(api.getAllBookings()['VIP-02'].some((b) => b.code === code)).toBe(true);
  });

  it('không tự hủy được khi bé đã nhận phòng hoặc đã qua ngày nhận phòng', () => {
    const today = '2026-11-10';
    const base = { customerId: 'user-a', status: 'check-in', checkIn: '2026-11-12' };
    expect(api.canCustomerCancel(base, 'user-a', today)).toBe(true);
    expect(api.canCustomerCancel({ ...base, checkIn: today }, 'user-a', today)).toBe(true);
    expect(api.canCustomerCancel({ ...base, checkIn: '2026-11-09' }, 'user-a', today)).toBe(false);
    expect(api.canCustomerCancel({ ...base, status: 'đang ở' }, 'user-a', today)).toBe(false);
    expect(api.canCustomerCancel({ ...base, status: 'cancelled' }, 'user-a', today)).toBe(false);
  });
});

describe('/api/sync chỉ trả dữ liệu của chính khách', () => {
  it('mỗi khách chỉ thấy mèo và hồ sơ của mình', async () => {
    await call(sync.handleSync, { method: 'POST', token: 'token-a', body: { pets: [{ id: 'pa', name: 'Mochi' }], profiles: [{ id: 'user-a', fullName: 'A' }] } });
    await call(sync.handleSync, { method: 'POST', token: 'token-b', body: { pets: [{ id: 'pb', name: 'Mochi' }], profiles: [{ id: 'user-b', fullName: 'B' }] } });

    const a = await call(sync.handleSync, { token: 'token-a' });
    expect(a.payload.data.pets.map((p) => p.id)).toEqual(['pa']);
    expect(a.payload.data.profiles.map((p) => p.id)).toEqual(['user-a']);

    const anon = await call(sync.handleSync);
    expect(anon.payload.data.pets).toEqual([]);
    expect(anon.payload.data.profiles).toEqual([]);
  });

  it('hai bé trùng tên của hai nhà khác nhau không bị gộp làm một', async () => {
    const admin = await call(sync.handleSync, { token: 'token-admin' });
    const mochis = admin.payload.data.pets.filter((p) => p.name === 'Mochi' && ['pa', 'pb'].includes(p.id));
    expect(mochis).toHaveLength(2);
  });

  it('khách không ghi đè được mèo của người khác', async () => {
    await call(sync.handleSync, { method: 'POST', token: 'token-b', body: { pets: [{ id: 'pa', name: 'Bị đổi tên' }] } });
    const a = await call(sync.handleSync, { token: 'token-a' });
    expect(a.payload.data.pets.find((p) => p.id === 'pa').name).toBe('Mochi');
  });

  it('khách vãng lai không ghi được dữ liệu', async () => {
    const res = await call(sync.handleSync, { method: 'POST', body: { pets: [{ id: 'x', name: 'X' }] } });
    expect(res.statusCode).toBe(401);
  });
});

describe('Đặt cọc khi đặt phòng', () => {
  it('đặt trước hơn 5 ngày thì đơn chờ cọc 50%', async () => {
    const res = await call(api.handleAddBooking, {
      method: 'POST',
      token: 'token-a',
      body: { roomId: 'VIP-01', booking: newBooking({ checkIn: addDays(30), checkOut: addDays(32), totalPrice: 600000 }) },
    });
    expect(res.payload.success).toBe(true);
    expect(res.payload.booking.paymentStatus).toBe('awaiting_deposit');
    expect(res.payload.booking.depositAmount).toBe(300000);
  });

  it('đặt sát ngày (≤ 5 ngày) thì không cần cọc', async () => {
    const res = await call(api.handleAddBooking, {
      method: 'POST',
      token: 'token-a',
      body: { roomId: 'VIP-01', booking: newBooking({ checkIn: addDays(2), checkOut: addDays(3), totalPrice: 300000 }) },
    });
    expect(res.payload.booking.paymentStatus).toBe('pay_at_checkin');
    expect(res.payload.booking.depositAmount).toBe(0);
  });

  it('khách không tự đánh dấu đã cọc được', async () => {
    const created = await call(api.handleAddBooking, {
      method: 'POST',
      token: 'token-a',
      body: {
        roomId: 'VIP-01',
        booking: newBooking({ checkIn: addDays(40), checkOut: addDays(41), totalPrice: 200000, paymentStatus: 'deposit_paid' }),
      },
    });
    expect(created.payload.booking.paymentStatus).toBe('awaiting_deposit');

    const code = created.payload.booking.code;
    const denied = await call(api.handleUpdateBooking, {
      method: 'PUT', token: 'token-a', body: { roomId: 'VIP-01', code, updates: { paymentStatus: 'deposit_paid' } },
    });
    expect(denied.statusCode).toBe(403);

    const ok = await call(api.handleUpdateBooking, {
      method: 'PUT', token: 'token-admin', body: { roomId: 'VIP-01', code, updates: { paymentStatus: 'deposit_paid' } },
    });
    expect(ok.payload.success).toBe(true);
    const mine = await call(api.handleGetBookings, { token: 'token-a' });
    expect(mine.payload.bookings['VIP-01'].find((b) => b.code === code).paymentStatus).toBe('deposit_paid');
  });
});

describe('Đơn đặt phòng lưu trên database', () => {
  // Kho giả thay cho bảng bookings trên Supabase
  const makeStore = (rows) => ({
    rows,
    async list() { return this.rows; },
    async save(b) { this.rows.push({ ...b, dbId: 'db-1' }); return 'db-1'; },
    async update(code, updates) {
      const matched = this.rows.filter((r) => r.code === code);
      matched.forEach((row) => Object.assign(row, updates));
      return matched.length > 0;
    },
  });

  it('server mới khởi động vẫn thấy đơn đã lưu, kể cả trạng thái chờ cọc', async () => {
    const store = makeStore([
      { id: 'MVN-77777', code: 'MVN-77777', roomId: 'DELUXE-01', checkIn: addDays(18), checkOut: addDays(20), cats: 1, status: 'check-in', paymentStatus: 'awaiting_deposit', depositAmount: 150000, customerId: 'user-a' },
      { id: 'MVN-77778', code: 'MVN-77778', roomId: 'DELUXE-01', checkIn: addDays(18), checkOut: addDays(20), cats: 1, status: 'cancelled' },
    ]);
    vi.resetModules();
    const db = await import('../../api/_lib/bookingsDb.js');
    db.setBookingsStore(store);
    const freshAuth = await import('../../api/_lib/auth.js');
    freshAuth.setTokenVerifier(async (token) => USERS[token] || null);
    const fresh = await import('../../api/_lib/bookingsService.js');

    const admin = await call(fresh.handleGetBookings, { token: 'token-admin' });
    const deluxe = admin.payload.bookings['DELUXE-01'];
    expect(deluxe.find((b) => b.code === 'MVN-77777').paymentStatus).toBe('awaiting_deposit');
    expect(deluxe.find((b) => b.code === 'MVN-77778')).toBeUndefined();

    // Admin xác nhận cọc thì database cũng được cập nhật
    await call(fresh.handleUpdateBooking, {
      method: 'PUT', token: 'token-admin', body: { roomId: 'DELUXE-01', code: 'MVN-77777', updates: { paymentStatus: 'deposit_paid' } },
    });
    expect(store.rows[0].paymentStatus).toBe('deposit_paid');

    // Đơn mới được ghi xuống database
    const created = await call(fresh.handleAddBooking, {
      method: 'POST', token: 'token-b', body: { roomId: 'DELUXE-02', booking: newBooking({ totalPrice: 100000 }) },
    });
    expect(created.payload.success).toBe(true);
    expect(created.payload.booking.dbId).toBe('db-1');
    expect(store.rows.some((r) => r.code === created.payload.booking.code)).toBe(true);
  });

  it('dòng cũ còn "chờ cọc" trên database không làm đơn đã nhận cọc quay về chờ cọc', async () => {
    const stale = { id: 'MVN-66666', code: 'MVN-66666', roomId: 'VVIP-02', checkIn: addDays(20), checkOut: addDays(22), cats: 1, status: 'check-in', customerId: 'user-a' };
    const store = makeStore([
      { ...stale, paymentStatus: 'deposit_paid' },
      { ...stale, paymentStatus: 'awaiting_deposit' },
    ]);
    vi.resetModules();
    const db = await import('../../api/_lib/bookingsDb.js');
    db.setBookingsStore(store);
    const freshAuth = await import('../../api/_lib/auth.js');
    freshAuth.setTokenVerifier(async (token) => USERS[token] || null);
    const fresh = await import('../../api/_lib/bookingsService.js');

    const mine = await call(fresh.handleGetBookings, { token: 'token-a' });
    expect(mine.payload.bookings['VVIP-02'].find((b) => b.code === 'MVN-66666').paymentStatus).toBe('deposit_paid');
  });
});
