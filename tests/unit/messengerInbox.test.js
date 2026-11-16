import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createHmac } from 'crypto';

// Hộp thư tập trung: tin Messenger của Fanpage, gắn tài khoản web, nguồn đơn "Đặt qua Messenger"
process.env.MVN_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mvn-messenger-'));
process.env.MVN_BOOKINGS_DB = 'off';
process.env.ADMIN_EMAILS = 'admin@test.vn';

const SECRET = 'app-secret';
const PSID = '24680135791113';

const USERS = {
  admin: { id: 'admin-1', email: 'admin@test.vn' },
  khach: { id: 'user-k', email: '0901234567@meovangnha.vn' },
  khac: { id: 'user-x', email: 'x@test.vn' },
};

let svc;
let db;
let marketing;
let bookings;
let src;
let report;
let graphCalls = [];

const mockRes = () => {
  const res = { statusCode: 200, body: undefined, text: undefined, headers: {} };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.end = (t) => { res.text = t; return res; };
  return res;
};

const req = (method, url, { body, token, headers = {}, rawBody } = {}) => ({
  method,
  url,
  body,
  rawBody,
  query: {},
  headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
});

const sign = (raw) => `sha256=${createHmac('sha256', SECRET).update(raw, 'utf8').digest('hex')}`;

const call = async (action, method, url, opts) => {
  const res = mockRes();
  await marketing.handleMarketing(req(method, url, opts), res, action);
  return res;
};

const postWebhook = (payload, { tamper = false } = {}) => {
  const raw = JSON.stringify(payload);
  return call('messenger', 'POST', '/api/marketing/messenger', {
    rawBody: raw,
    body: payload,
    headers: { 'x-hub-signature-256': tamper ? sign(`${raw} `) : sign(raw) },
  });
};

const inbound = (text, { mid = `m-${Math.random()}`, psid = PSID, ts = Date.now() } = {}) => ({
  object: 'page',
  entry: [{ id: 'page-1', time: ts, messaging: [{ sender: { id: psid }, recipient: { id: 'page-1' }, timestamp: ts, message: { mid, text } }] }],
});

beforeAll(async () => {
  const auth = await import('../../api/_lib/auth.js');
  auth.setTokenVerifier(async (token) => USERS[token] || null);
  svc = await import('../../api/_lib/messengerService.js');
  db = await import('../../api/_lib/messengerDb.js');
  marketing = await import('../../api/_lib/marketingService.js');
  bookings = await import('../../api/_lib/bookingsService.js');
  src = await import('../../src/utils/orderSource.js');
  report = await import('../../src/utils/adminReport.js');
});

afterAll(() => svc.setGraphFetch(null));

beforeEach(() => {
  process.env.MESSENGER_PAGE_ACCESS_TOKEN = 'page-token';
  process.env.MESSENGER_APP_SECRET = SECRET;
  process.env.MESSENGER_VERIFY_TOKEN = 'verify-me';
  process.env.SITE_URL = 'https://meovangnha.store';
  db.resetMessengerMemory({ useDatabase: false });
  graphCalls = [];
  svc.setGraphFetch(async (url, init = {}) => {
    graphCalls.push({ url, init });
    if (url.includes('/me/messages')) {
      return { ok: true, json: async () => ({ recipient_id: PSID, message_id: `mid.out.${graphCalls.length}` }) };
    }
    return { ok: true, json: async () => ({ name: 'Mít Ướt', profile_pic: 'https://pic/1.jpg' }) };
  });
});

describe('Webhook Messenger', () => {
  it('xác minh webhook bằng verify token', async () => {
    let res = await call('messenger', 'GET', '/api/marketing/messenger?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=12345');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('12345');
    res = await call('messenger', 'GET', '/api/marketing/messenger?hub.mode=subscribe&hub.verify_token=sai&hub.challenge=1');
    expect(res.statusCode).toBe(403);
  });

  it('từ chối tin không có chữ ký đúng', async () => {
    const res = await postWebhook(inbound('xin chào'), { tamper: true });
    expect(res.statusCode).toBe(401);
    expect(await db.listConversations()).toHaveLength(0);
  });

  it('lưu tin khách nhắn, lấy tên Facebook, đếm chưa đọc, bỏ tin trùng', async () => {
    let res = await postWebhook(inbound('Cho mình hỏi giá phòng', { mid: 'mid-1' }));
    expect(res.statusCode).toBe(200);
    res = await postWebhook(inbound('Cho mình hỏi giá phòng', { mid: 'mid-1' }));
    expect(res.body.stored).toBe(0);
    await postWebhook(inbound('Còn phòng VIP không ạ?', { mid: 'mid-2' }));

    const [conv] = await db.listConversations();
    expect(conv.nickname).toBe('Mít Ướt');
    expect(conv.unread).toBe(2);
    expect(conv.lastText).toBe('Còn phòng VIP không ạ?');
    expect(conv.refToken).toMatch(/^[A-Za-z0-9_-]{6,}$/);
    const msgs = await db.listMessengerMessages(PSID);
    expect(msgs.map((m) => m.direction)).toEqual(['in', 'in']);
  });

  it('kiểm tra được chữ ký khi máy chủ đã đọc sẵn JSON (tiếng Việt, dấu gạch chéo)', async () => {
    const payload = inbound('Bé mèo ăn hạt gì ạ? https://x.y/z', { mid: 'mid-vn' });
    const fbRaw = JSON.stringify(payload)
      .replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
      .replace(/\//g, '\\/');
    const res = await call('messenger', 'POST', '/api/marketing/messenger', { body: payload, headers: { 'x-hub-signature-256': sign(fbRaw) } });
    expect(res.statusCode).toBe(200);
    expect((await db.listMessengerMessages(PSID))[0].text).toBe('Bé mèo ăn hạt gì ạ? https://x.y/z');
  });

  it('lưu cả tin nhân viên trả lời trong Meta Business Suite (echo)', async () => {
    await postWebhook(inbound('Alo', { mid: 'mid-a' }));
    const echo = {
      object: 'page',
      entry: [{ messaging: [{ sender: { id: 'page-1' }, recipient: { id: PSID }, timestamp: Date.now(), message: { mid: 'mid-echo', is_echo: true, text: 'Dạ chào bạn' } }] }],
    };
    await postWebhook(echo);
    const msgs = await db.listMessengerMessages(PSID);
    expect(msgs.at(-1)).toMatchObject({ direction: 'out', text: 'Dạ chào bạn', sentBy: 'fanpage' });
    expect((await db.getConversation(PSID)).unread).toBe(1);
  });
});

describe('Hộp thư tập trung cho Admin', () => {
  it('chỉ Admin xem được, mở hội thoại thì hết chưa đọc', async () => {
    await postWebhook(inbound('Hello', { mid: 'mid-h' }));
    let res = await call('messenger-inbox', 'GET', '/api/marketing/messenger-inbox', { token: 'khach' });
    expect(res.statusCode).toBe(403);

    res = await call('messenger-inbox', 'GET', '/api/marketing/messenger-inbox', { token: 'admin' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status.configured).toBe(true);
    expect(res.body.conversations[0]).toMatchObject({ psid: PSID, nickname: 'Mít Ướt', unread: 1 });

    res = await call('messenger-inbox', 'GET', `/api/marketing/messenger-inbox?psid=${PSID}`, { token: 'admin' });
    expect(res.body.messages).toHaveLength(1);
    expect((await db.getConversation(PSID)).unread).toBe(0);
  });

  it('trả lời qua Messenger: link web được gắn mã nguồn của cuộc trò chuyện', async () => {
    await postWebhook(inbound('Đặt phòng ở đâu ạ?', { mid: 'mid-q' }));
    const { refToken } = await db.getConversation(PSID);
    const res = await call('messenger-send', 'POST', '/api/marketing/messenger-send', {
      token: 'admin',
      body: { psid: PSID, text: 'Bạn đặt tại https://meovangnha.store/booking nhé. Trang khác: https://google.com' },
    });
    expect(res.statusCode).toBe(200);
    const sent = JSON.parse(graphCalls.find((c) => c.url.includes('/me/messages')).init.body);
    expect(sent.recipient.id).toBe(PSID);
    expect(sent.message.text).toContain(`https://meovangnha.store/booking?src=messenger&mref=${refToken}`);
    expect(sent.message.text).toContain('https://google.com');
    expect(sent.message.text).not.toContain('google.com?src');
    const msgs = await db.listMessengerMessages(PSID);
    expect(msgs.at(-1)).toMatchObject({ direction: 'out', sentBy: 'admin@test.vn' });
  });

  it('báo lỗi dễ hiểu khi quá 24 giờ', async () => {
    await postWebhook(inbound('Hi', { mid: 'mid-old' }));
    svc.setGraphFetch(async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'outside window', code: 10, error_subcode: 2018278 } }) }));
    const res = await call('messenger-send', 'POST', '/api/marketing/messenger-send', { token: 'admin', body: { psid: PSID, text: 'Chào bạn' } });
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toMatch(/24 giờ/);
  });

  it('nhân viên gắn / bỏ gắn tài khoản web', async () => {
    await postWebhook(inbound('Hi', { mid: 'mid-l' }));
    let res = await call('messenger-link', 'POST', '/api/marketing/messenger-link', { token: 'admin', body: { psid: PSID, customerId: 'user-k' } });
    expect(res.body.conversation).toMatchObject({ customerId: 'user-k', linkedBy: 'staff' });
    res = await call('messenger-link', 'POST', '/api/marketing/messenger-link', { token: 'admin', body: { psid: PSID, customerId: null } });
    expect(res.body.conversation.customerId).toBeNull();
  });

  it('khách đăng nhập mở link Messenger thì tự gắn; người sau không ghi đè', async () => {
    await postWebhook(inbound('Hi', { mid: 'mid-r' }));
    const { refToken } = await db.getConversation(PSID);
    let res = await call('messenger-ref', 'POST', '/api/marketing/messenger-ref', { token: 'khach', body: { ref: refToken } });
    expect(res.body).toMatchObject({ ok: true, linked: true });
    res = await call('messenger-ref', 'POST', '/api/marketing/messenger-ref', { token: 'khac', body: { ref: refToken } });
    expect(res.body.linked).toBe(false);
    expect((await db.getConversation(PSID)).customerId).toBe('user-k');
  });
});

describe('Nguồn đơn "Đặt qua Messenger"', () => {
  it('gắn mã vào link web của tiệm, giữ dấu câu', () => {
    const out = src.tagMessengerLinks('Xem meovangnha.store/booking, hoặc https://www.meovangnha.store/services?x=1.', { ref: 'abcdef123' });
    expect(out).toContain('https://meovangnha.store/booking?src=messenger&mref=abcdef123,');
    expect(out).toContain('https://www.meovangnha.store/services?x=1&src=messenger&mref=abcdef123.');
    expect(src.tagMessengerLinks('meovangnha.store.evil.com/x', { ref: 'abcdef123' })).toBe('meovangnha.store.evil.com/x');
  });

  it('nhận ra lượt mở từ Messenger và nhớ 7 ngày', () => {
    expect(src.detectOrderSource({ search: '?src=messenger&mref=abcdef123' })).toEqual({ source: 'messenger', ref: 'abcdef123' });
    expect(src.detectOrderSource({ referrer: 'https://l.messenger.com/' })).toMatchObject({ source: 'messenger' });
    expect(src.detectOrderSource({ userAgent: 'Mozilla/5.0 [FBAN/MessengerForiOS;FBAV/450]' })).toMatchObject({ source: 'messenger' });
    expect(src.detectOrderSource({ search: '?utm_source=google', referrer: 'https://www.facebook.com/' })).toBeNull();

    const store = new Map();
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
    const t0 = Date.parse('2026-11-01T00:00:00Z');
    src.rememberOrderSource(storage, { source: 'messenger', ref: 'abcdef123' }, t0);
    // Lần mở sau qua trình duyệt Messenger (không có mã) vẫn giữ mã cũ
    src.rememberOrderSource(storage, { source: 'messenger', ref: '' }, t0 + 1000);
    expect(src.orderSourceFields(storage, t0 + 2 * 86400000)).toMatchObject({ orderSource: 'messenger', orderSourceRef: 'abcdef123' });
    expect(src.orderSourceFields(storage, t0 + 8 * 86400000)).toEqual({});
  });

  it('server chỉ nhận nguồn hợp lệ', () => {
    expect(src.sanitizeOrderSource({ orderSource: 'tiktok', orderSourceRef: 'x' })).toEqual({});
    expect(src.sanitizeOrderSource({ orderSource: 'messenger', orderSourceRef: '<script>' })).toMatchObject({ orderSource: 'messenger', orderSourceRef: null });
  });

  it('đơn đặt từ link Messenger: lưu nguồn đơn và gắn cuộc trò chuyện với tài khoản', async () => {
    await postWebhook(inbound('Mình muốn đặt phòng', { mid: 'mid-b' }));
    const { refToken } = await db.getConversation(PSID);
    const day = (n) => new Date(Date.now() + 7 * 3600000 + n * 86400000).toISOString().slice(0, 10);
    const res = mockRes();
    await bookings.handleAddBooking(req('POST', '/api/bookings', {
      token: 'khach',
      body: {
        roomId: 'DELUXE-01',
        booking: { id: 'MS-1', code: 'MS-1', cats: 1, checkIn: day(10), checkOut: day(12), totalPrice: 500000, orderSource: 'messenger', orderSourceRef: refToken, orderSourceAt: new Date().toISOString() },
      },
    }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.booking).toMatchObject({ orderSource: 'messenger', orderSourceRef: refToken });
    expect((await db.getConversation(PSID))).toMatchObject({ customerId: 'user-k', linkedBy: 'booking' });
  });

  it('Báo cáo tính đơn có nguồn Messenger vào kênh "Đặt qua Messenger"', () => {
    expect(report.channelOf({ orderSource: 'messenger', createdAt: '2026-11-02T00:00:00Z' }, { id: 'A' }, [])).toEqual({ channel: 'messenger' });
    expect(report.CHANNEL_LABEL.messenger).toBe('Đặt qua Messenger');
  });
});
