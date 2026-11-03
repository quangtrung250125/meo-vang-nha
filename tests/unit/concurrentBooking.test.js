import { describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Nhiều khách bấm "Gửi yêu cầu đặt lịch" cùng lúc cho cùng một phòng.
// Mô phỏng cả trường hợp các request rơi vào nhiều máy chủ Vercel khác nhau (mỗi máy bộ nhớ riêng,
// dùng chung database Supabase).
process.env.MVN_BOOKINGS_DB = 'off';

const addDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const call = async (handler, body) => {
  const req = { method: 'POST', body, query: {}, headers: {} };
  const res = {
    statusCode: 200,
    payload: undefined,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.payload = obj; return this; },
  };
  await handler(req, res);
  return res;
};

let seq = 0;
const order = (roomId, cats, checkIn, checkOut, name) => {
  seq += 1;
  return {
    roomId,
    booking: { id: `C-${seq}`, code: `C-${seq}`, cats, checkIn, checkOut, ownerName: name, ownerPhone: '0900000000', totalPrice: 100000 },
  };
};

// Database Supabase giả, có độ trễ như mạng thật để các request xen kẽ nhau
const makeDb = (delay = 15) => ({
  rows: [],
  async list() { await sleep(delay); return this.rows.map((r) => ({ ...r })); },
  async save(b) { await sleep(delay); this.rows.push({ ...b }); return `db-${this.rows.length}`; },
  async update() { return false; },
});

// Bảng booking_locks giả: chỉ một dòng 'bookings' được tồn tại (khoá chính)
const makeLockTable = () => ({
  row: null,
  async tryAcquire(name, holder, expiresAt) {
    await sleep(2);
    if (this.row) return 'busy';
    this.row = { name, holder, expiresAt };
    return 'acquired';
  },
  async clearExpired(name, nowIso) {
    if (this.row && this.row.expiresAt < nowIso) this.row = null;
  },
  async release(name, holder) {
    if (this.row?.holder === holder) this.row = null;
  },
});

// Khởi động một "máy chủ" mới: module riêng, thư mục dữ liệu riêng, dùng chung db và bảng khoá
const startServer = async (db, lockTable) => {
  vi.resetModules();
  process.env.MVN_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mvn-concurrent-'));
  const dbMod = await import('../../api/_lib/bookingsDb.js');
  dbMod.setBookingsStore(db);
  const lockMod = await import('../../api/_lib/bookingLock.js');
  lockMod.setLockStore(lockTable);
  return import('../../api/_lib/bookingsService.js');
};

// Số mèo cao nhất trong một đêm của phòng, tính trên database
const peakCats = (rows, roomId) => {
  let peak = 0;
  for (let d = 0; d < 60; d += 1) {
    const day = addDays(d);
    const n = rows
      .filter((r) => r.roomId === roomId && r.checkIn <= day && r.checkOut > day)
      .reduce((sum, r) => sum + Number(r.cats), 0);
    peak = Math.max(peak, n);
  }
  return peak;
};

describe('Nhiều khách gửi đặt phòng cùng lúc trên một máy chủ', () => {
  it('tổng số mèo vừa đủ chỗ trống: tất cả đều nhận được mã đặt phòng', async () => {
    const api = await startServer(makeDb(), null);
    const results = await Promise.all([
      call(api.handleAddBooking, order('VVIP-01', 1, addDays(10), addDays(13), 'An')),
      call(api.handleAddBooking, order('VVIP-01', 2, addDays(11), addDays(14), 'Bình')),
      call(api.handleAddBooking, order('VVIP-01', 1, addDays(12), addDays(15), 'Chi')),
    ]);
    expect(results.map((r) => r.statusCode)).toEqual([200, 200, 200]);
    expect(results.every((r) => r.payload.booking.code)).toBe(true);
  });

  it('tổng số mèo vượt chỗ trống: ai gửi trước được nhận, người sau bị báo hết chỗ', async () => {
    const db = makeDb();
    const api = await startServer(db, null);
    // VIP-01 có 2 chỗ. An (1 bé) và Bình (1 bé) gửi trước, Chi (1 bé) gửi sau cùng, trùng một phần ngày
    const results = await Promise.all([
      call(api.handleAddBooking, order('VIP-01', 1, addDays(20), addDays(23), 'An')),
      call(api.handleAddBooking, order('VIP-01', 1, addDays(21), addDays(24), 'Bình')),
      call(api.handleAddBooking, order('VIP-01', 1, addDays(22), addDays(25), 'Chi')),
    ]);
    expect(results.map((r) => r.statusCode)).toEqual([200, 200, 409]);
    const loser = results[2].payload;
    expect(loser.conflict).toBe(true);
    expect(loser.booking).toBeUndefined();
    // Người chậm hơn nhận lại tình trạng phòng mới nhất để chọn lại
    expect(loser.allBookings['VIP-01'].length).toBe(2);
    expect(peakCats(db.rows, 'VIP-01')).toBe(2);
  });

  it('không trùng ngày thì không ảnh hưởng nhau', async () => {
    const api = await startServer(makeDb(), null);
    const results = await Promise.all([
      call(api.handleAddBooking, order('VIP-02', 2, addDays(30), addDays(32), 'An')),
      call(api.handleAddBooking, order('VIP-02', 2, addDays(32), addDays(34), 'Bình')),
    ]);
    expect(results.map((r) => r.statusCode)).toEqual([200, 200]);
  });
});

describe('Nhiều khách gửi cùng lúc nhưng rơi vào nhiều máy chủ Vercel khác nhau', () => {
  const burst = (servers) => Promise.all(
    ['An', 'Bình', 'Chi', 'Dung', 'Em', 'Giang'].map((name, i) =>
      call(servers[i % servers.length].handleAddBooking, order('VIP-03', 1, addDays(40), addDays(43), name))
    )
  );

  it('có khoá dùng chung: phòng 2 chỗ chỉ nhận đúng 2 bé, 4 người còn lại bị báo hết chỗ', async () => {
    const db = makeDb();
    const lock = makeLockTable();
    const servers = [await startServer(db, lock), await startServer(db, lock), await startServer(db, lock)];
    const results = await burst(servers);
    expect(results.filter((r) => r.statusCode === 200)).toHaveLength(2);
    expect(results.filter((r) => r.statusCode === 409)).toHaveLength(4);
    expect(peakCats(db.rows, 'VIP-03')).toBe(2);
    expect(lock.row).toBeNull();
  });

  it('(so sánh) không có khoá dùng chung thì các máy chủ nhận quá sức chứa', async () => {
    const db = makeDb();
    const servers = [await startServer(db, null), await startServer(db, null), await startServer(db, null)];
    await burst(servers);
    expect(peakCats(db.rows, 'VIP-03')).toBeGreaterThan(2);
  });

  it('chờ khoá quá lâu thì báo khách gửi lại, không ghi đơn', async () => {
    const db = makeDb();
    const lock = makeLockTable();
    const api = await startServer(db, lock);
    // Một máy chủ khác đang giữ khoá (chưa hết hạn)
    lock.row = { name: 'bookings', holder: 'other', expiresAt: new Date(Date.now() + 60000).toISOString() };
    const lockMod = await import('../../api/_lib/bookingLock.js');
    const result = await lockMod.withSharedBookingLock(async () => 'ran', { waitTimeoutMs: 200 }).catch((e) => e);
    expect(result).toBeInstanceOf(lockMod.LockBusyError);
    expect(db.rows).toHaveLength(0);
    expect(api).toBeTruthy();
  });

  it('khoá của máy chủ bị tắt giữa chừng tự hết hạn, máy khác vẫn đặt được', async () => {
    const db = makeDb();
    const lock = makeLockTable();
    const api = await startServer(db, lock);
    lock.row = { name: 'bookings', holder: 'dead', expiresAt: new Date(Date.now() - 1000).toISOString() };
    const res = await call(api.handleAddBooking, order('VIP-04', 1, addDays(45), addDays(46), 'An'));
    expect(res.statusCode).toBe(200);
  });

  it('chưa tạo bảng booking_locks thì vẫn đặt phòng được như trước', async () => {
    const db = makeDb();
    const missing = {
      async tryAcquire() { throw new Error('relation "booking_locks" does not exist'); },
      async clearExpired() {},
      async release() {},
    };
    const api = await startServer(db, missing);
    const res = await call(api.handleAddBooking, order('VIP-05', 1, addDays(47), addDays(48), 'An'));
    expect(res.statusCode).toBe(200);
  });

  it('hệ thống bận thì trả 503 và đơn chưa được ghi', async () => {
    const db = makeDb();
    const lock = makeLockTable();
    lock.tryAcquire = async () => 'busy';
    const api = await startServer(db, lock);
    vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 500 });
    try {
      const res = await call(api.handleAddBooking, order('VIP-06', 1, addDays(50), addDays(51), 'An'));
      expect(res.statusCode).toBe(503);
      expect(res.payload.retryable).toBe(true);
      expect(res.payload.success).toBe(false);
    } finally {
      vi.useRealTimers();
    }
    expect(db.rows).toHaveLength(0);
  }, 20000);
});
