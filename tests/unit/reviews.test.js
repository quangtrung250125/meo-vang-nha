import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.MVN_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mvn-reviews-'));
process.env.ADMIN_EMAILS = 'admin@test.vn';
process.env.MVN_BOOKINGS_DB = 'off';

const USERS = {
  'token-admin': { id: 'admin-1', email: 'admin@test.vn' },
  'token-a': { id: 'user-a', email: 'a@test.vn', user_metadata: { full_name: 'Nguyễn Thị Lan' } },
  'token-b': { id: 'user-b', email: 'b@test.vn' },
};

const DAY = 86400000;
const ago = (days) => new Date(Date.now() - days * DAY).toISOString();

const ROWS = [
  { id: 'R-1', code: 'R-1', roomId: 'DELUXE-01', status: 'check-out', checkedOutAt: ago(1), customerId: 'user-a' },
  { id: 'R-2', code: 'R-2', roomId: 'DELUXE-01', status: 'check-out', checkedOutAt: ago(40), customerId: 'user-a' },
  { id: 'R-3', code: 'R-3', roomId: 'DELUXE-01', status: 'đang ở', customerId: 'user-a' },
  { id: 'R-4', code: 'R-4', roomId: 'DELUXE-01', status: 'check-out', checkedOutAt: ago(2), customerId: 'user-b' },
  { id: 'R-5', code: 'R-5', roomId: 'DELUXE-01', status: 'cancelled', cancelledAt: ago(1), customerId: 'user-a' },
];

let handleReviews;
let reviewsDb;
let rules;

const call = async ({ method = 'GET', body, token, url = '/api/marketing/reviews' } = {}) => {
  const req = { method, body, url, query: {}, headers: token ? { authorization: `Bearer ${token}` } : {} };
  const res = {
    statusCode: 200,
    body: undefined,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
    end() { return this; },
  };
  await handleReviews(req, res);
  return res;
};

const submit = (token, bookingCode, extra = {}) => call({
  method: 'POST', token, body: { bookingCode, rating: 5, tags: ['Phòng sạch sẽ', 'không có'], comment: 'Bé ăn ngon ngủ kỹ', allowPublic: true, petNames: 'Bơ', ...extra },
});

beforeAll(async () => {
  const db = await import('../../api/_lib/bookingsDb.js');
  db.setBookingsStore({
    list: async () => ROWS.map((r) => ({ ...r })),
    findForUser: async () => null,
    save: async () => null,
    update: async () => true,
  });
  const auth = await import('../../api/_lib/auth.js');
  auth.setTokenVerifier(async (token) => USERS[token] || null);
  ({ handleReviews } = await import('../../api/_lib/reviewsService.js'));
  reviewsDb = await import('../../api/_lib/reviewsDb.js');
  rules = await import('../../src/utils/reviewRules.js');
});

beforeEach(() => reviewsDb.resetReviewsMemory({ useDatabase: false }));

describe('Đánh giá sau check-out', () => {
  it('khách đánh giá được đơn đã check-out của mình, thẻ lạ bị bỏ', async () => {
    const res = await submit('token-a', 'R-1');
    expect(res.statusCode).toBe(201);
    expect(res.body.review.rating).toBe(5);
    expect(res.body.review.tags).toEqual(['Phòng sạch sẽ']);
    expect(res.body.review.customerName).toBe('Nguyễn Thị Lan');
    expect(res.body.review.isPublic).toBe(false);
  });

  it('chặn đơn chưa check-out, đã hủy, của người khác, chưa đăng nhập, admin', async () => {
    expect((await submit('token-a', 'R-3')).statusCode).toBe(403);
    expect((await submit('token-a', 'R-5')).statusCode).toBe(403);
    expect((await submit('token-a', 'R-4')).statusCode).toBe(403);
    expect((await submit(null, 'R-1')).statusCode).toBe(401);
    expect((await submit('token-admin', 'R-1')).statusCode).toBe(403);
  });

  it('quá 30 ngày sau check-out thì không đánh giá được', async () => {
    const res = await submit('token-a', 'R-2');
    expect(res.statusCode).toBe(409);
  });

  it('bắt buộc 1 đến 5 sao', async () => {
    expect((await submit('token-a', 'R-1', { rating: 0 })).statusCode).toBe(400);
    expect((await submit('token-a', 'R-1', { rating: 6 })).statusCode).toBe(400);
  });

  it('mỗi đơn một đánh giá: gửi lại là sửa, quá 7 ngày thì khóa', async () => {
    await submit('token-a', 'R-1');
    const edited = await submit('token-a', 'R-1', { rating: 4 });
    expect(edited.statusCode).toBe(200);
    expect((await reviewsDb.listReviews())).toHaveLength(1);
    expect(edited.body.review.rating).toBe(4);

    const old = await reviewsDb.getReviewByBooking('R-1');
    await reviewsDb.saveReview({ ...old, createdAt: ago(8) });
    expect((await submit('token-a', 'R-1', { rating: 3 })).statusCode).toBe(409);
  });

  it('khách chỉ thấy đánh giá của mình, admin thấy hết', async () => {
    await submit('token-a', 'R-1');
    await submit('token-b', 'R-4');
    expect((await call({ token: 'token-a' })).body.reviews.map((r) => r.bookingCode)).toEqual(['R-1']);
    expect((await call({ token: 'token-admin' })).body.reviews).toHaveLength(2);
    expect((await call({})).statusCode).toBe(401);
  });

  it('admin trả lời, duyệt hiển thị; trang chủ chỉ thấy đánh giá đã duyệt với tên rút gọn', async () => {
    await submit('token-a', 'R-1');
    await submit('token-b', 'R-4', { allowPublic: false });

    expect((await call({ method: 'PUT', token: 'token-a', body: { bookingCode: 'R-1', isPublic: true } })).statusCode).toBe(403);
    expect((await call({ method: 'PUT', token: 'token-admin', body: { bookingCode: 'R-4', isPublic: true } })).statusCode).toBe(400);

    const ok = await call({ method: 'PUT', token: 'token-admin', body: { bookingCode: 'R-1', isPublic: true, adminReply: 'Cảm ơn chị!' } });
    expect(ok.statusCode).toBe(200);
    expect(ok.body.review.adminReply).toBe('Cảm ơn chị!');

    const pub = await call({ url: '/api/marketing/reviews?scope=public' });
    expect(pub.body.reviews).toHaveLength(1);
    expect(pub.body.reviews[0].name).toBe('Lan N.');
    expect(pub.body.reviews[0].customerId).toBeUndefined();
  });

  it('khách sửa nội dung thì đánh giá phải được duyệt lại', async () => {
    await submit('token-a', 'R-1');
    await call({ method: 'PUT', token: 'token-admin', body: { bookingCode: 'R-1', isPublic: true } });
    const edited = await submit('token-a', 'R-1', { comment: 'Sửa lại' });
    expect(edited.body.review.isPublic).toBe(false);
  });

  it('tên công khai rút gọn', () => {
    expect(rules.shortPublicName('Trần Minh Đức')).toBe('Đức T.');
    expect(rules.shortPublicName('')).toBe('Khách hàng');
  });
});
