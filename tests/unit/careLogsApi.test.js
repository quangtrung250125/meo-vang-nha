import { beforeAll, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Dữ liệu ghi vào thư mục tạm, không dùng Supabase
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mvn-carelogs-'));
process.env.MVN_DATA_DIR = dataDir;
process.env.ADMIN_EMAILS = 'admin@test.vn';
process.env.MVN_BOOKINGS_DB = 'off';

const USERS = {
  'token-admin': { id: 'admin-1', email: 'admin@test.vn' },
  'token-a': { id: 'user-a', email: 'a@test.vn' },
  'token-b': { id: 'user-b', email: 'b@test.vn' },
};

let bookings;
let careLogs;

const call = async (handler, { method = 'GET', body, token, query = {} } = {}) => {
  const req = { method, body, query, headers: token ? { authorization: `Bearer ${token}` } : {} };
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

const logs = (opts) => call(careLogs.handleCareLogs, { ...opts, query: { resource: 'care-logs', ...(opts.query || {}) } });

// Ngày theo giờ Việt Nam (server kiểm tra ngày gửi bé theo giờ Việt Nam)
const addDays = (n) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(Date.now() + n * 86400000));

let seq = 0;
// Đơn của khách user-a, phòng riêng cho từng test; checkIn = true thì admin check-in luôn
const createBooking = async (roomId, { checkIn = true } = {}) => {
  seq += 1;
  const created = await call(bookings.handleAddBooking, {
    method: 'POST',
    token: 'token-a',
    body: {
      roomId,
      booking: {
        id: `C-${seq}`, code: `C-${seq}`, cats: 1, checkIn: addDays(0), checkOut: addDays(2),
        petProfiles: [{ id: 'p1', name: 'Mochi' }], totalPrice: 100000,
      },
    },
  });
  const code = created.payload.booking.code;
  if (checkIn) {
    await call(bookings.handleUpdateBooking, { method: 'PUT', token: 'token-admin', body: { roomId, code, updates: { status: 'đang ở' } } });
  }
  return code;
};

beforeAll(async () => {
  const auth = await import('../../api/_lib/auth.js');
  auth.setTokenVerifier(async (token) => USERS[token] || null);
  bookings = await import('../../api/_lib/bookingsService.js');
  careLogs = await import('../../api/_lib/careLogsService.js');
});

describe('Nhật ký chăm sóc qua /api/bookings?resource=care-logs', () => {
  it('nhận đúng request nhật ký', () => {
    expect(careLogs.isCareLogsRequest({ query: { resource: 'care-logs' } })).toBe(true);
    expect(careLogs.isCareLogsRequest({ query: {}, url: '/api/bookings?resource=care-logs' })).toBe(true);
    expect(careLogs.isCareLogsRequest({ query: {}, url: '/api/bookings' })).toBe(false);
  });

  it('chỉ Admin được ghi nhật ký', async () => {
    const code = await createBooking('VIP-01');
    const entry = { bookingCode: code, petId: 'p1', type: 'eating', task: true };
    expect((await logs({ method: 'POST', body: entry })).statusCode).toBe(401);
    expect((await logs({ method: 'POST', token: 'token-a', body: entry })).statusCode).toBe(403);
  });

  it('Admin bấm "Cho ăn": ghi thời điểm của máy chủ và gắn với khách của đơn', async () => {
    const code = await createBooking('VIP-02');
    const before = Date.now();
    const res = await logs({
      method: 'POST', token: 'token-admin',
      body: { entries: [{ bookingCode: code, petId: 'p1', type: 'eating', label: 'Cho ăn', task: true, createdAt: '2020-01-01T00:00:00Z' }] },
    });
    expect(res.statusCode).toBe(200);
    const [log] = res.payload.logs;
    expect(new Date(log.createdAt).getTime()).toBeGreaterThanOrEqual(before);
    expect(log).toMatchObject({ bookingCode: code, petId: 'p1', type: 'eating', label: 'Cho ăn', customerId: 'user-a', createdBy: 'admin-1' });
  });

  it('mỗi tác vụ hằng ngày chỉ hoàn thành 1 lần, tác vụ khác vẫn ghi được', async () => {
    const code = await createBooking('VIP-03');
    const feed = { bookingCode: code, petId: 'p1', type: 'eating', task: true };
    expect((await logs({ method: 'POST', token: 'token-admin', body: feed })).statusCode).toBe(200);

    const again = await logs({ method: 'POST', token: 'token-admin', body: feed });
    expect(again.statusCode).toBe(409);
    expect(again.payload.skipped[0].reason).toBe('already_done');
    expect(again.payload.message).toMatch(/Đã hoàn thành lúc \d{2}:\d{2}/);

    const play = await logs({ method: 'POST', token: 'token-admin', body: { bookingCode: code, petId: 'p1', type: 'mood', task: true } });
    expect(play.statusCode).toBe(200);

    // Ghi chú chi tiết (không phải tác vụ 1 chạm) thì ghi thêm được
    const note = await logs({ method: 'POST', token: 'token-admin', body: { bookingCode: code, petId: 'p1', type: 'eating', detail: 'Ăn thêm pate' } });
    expect(note.statusCode).toBe(200);
  });

  it('cùng một lần gửi không ghi trùng tác vụ', async () => {
    const code = await createBooking('VVIP-01');
    const entry = { bookingCode: code, petId: 'p1', type: 'hygiene', task: true };
    const res = await logs({ method: 'POST', token: 'token-admin', body: { entries: [entry, entry] } });
    expect(res.payload.logs).toHaveLength(1);
    expect(res.payload.skipped[0].reason).toBe('already_done');
  });

  it('không ghi cho bé chưa check-in hoặc không thuộc đơn', async () => {
    const upcoming = await createBooking('VVIP-02', { checkIn: false });
    const notIn = await logs({ method: 'POST', token: 'token-admin', body: { bookingCode: upcoming, petId: 'p1', type: 'eating', task: true } });
    expect(notIn.statusCode).toBe(409);
    expect(notIn.payload.skipped[0].reason).toBe('not_in_house');

    const code = await createBooking('VVIP-03');
    const wrongPet = await logs({ method: 'POST', token: 'token-admin', body: { bookingCode: code, petId: 'khac', type: 'eating' } });
    expect(wrongPet.statusCode).toBe(400);
    expect((await logs({ method: 'POST', token: 'token-admin', body: { bookingCode: code, petId: 'p1', type: 'hack' } })).statusCode).toBe(400);
  });

  it('khách chỉ xem nhật ký đơn của mình, Admin xem tất cả', async () => {
    const code = await createBooking('DELUXE-01');
    await logs({ method: 'POST', token: 'token-admin', body: { bookingCode: code, petId: 'p1', type: 'media', label: 'Ảnh mới' } });

    const mine = await logs({ token: 'token-a' });
    expect(mine.payload.logs.some((l) => l.bookingCode === code)).toBe(true);
    expect(mine.payload.logs.every((l) => l.customerId === 'user-a')).toBe(true);

    const other = await logs({ token: 'token-b' });
    expect(other.payload.logs).toHaveLength(0);

    const admin = await logs({ token: 'token-admin', query: { bookingCode: code } });
    expect(admin.payload.logs.map((l) => l.type)).toEqual(['media']);
    expect((await logs({})).statusCode).toBe(401);
  });

  it('Admin hoàn tác được trong 5 phút, quá hạn thì không', async () => {
    const code = await createBooking('DELUXE-02');
    const first = await logs({ method: 'POST', token: 'token-admin', body: { bookingCode: code, petId: 'p1', type: 'eating', task: true } });
    const id = first.payload.logs[0].id;

    expect((await logs({ method: 'DELETE', token: 'token-a', body: { id } })).statusCode).toBe(403);
    expect((await logs({ method: 'DELETE', token: 'token-admin', body: { id } })).statusCode).toBe(200);
    // Đã hoàn tác thì bấm "Cho ăn" lại được
    const again = await logs({ method: 'POST', token: 'token-admin', body: { bookingCode: code, petId: 'p1', type: 'eating', task: true } });
    expect(again.statusCode).toBe(200);

    const now = Date.now();
    const spy = vi.spyOn(Date, 'now').mockReturnValue(now + 6 * 60 * 1000);
    const late = await logs({ method: 'DELETE', token: 'token-admin', body: { id: again.payload.logs[0].id } });
    spy.mockRestore();
    expect(late.statusCode).toBe(409);
  });
});
