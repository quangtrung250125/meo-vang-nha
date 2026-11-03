import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleMarketing, safeUrl } from '../../api/_lib/marketingService.js';
import { resetMarketingMemory, insertMessage, listMessages, saveContact } from '../../api/_lib/marketingDb.js';
import { setTokenVerifier } from '../../api/_lib/auth.js';
import { ownPushIds } from '../../api/_lib/pushAccess.js';

const mockRes = () => {
  const res = { statusCode: 200, body: null, headers: {} };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.setHeader = () => {};
  res.end = () => res;
  return res;
};

const req = (method, url, { body, token } = {}) => ({
  method,
  url,
  body,
  headers: token ? { authorization: `Bearer ${token}` } : {},
});

describe('API Marketing tự động', () => {
  beforeEach(() => {
    resetMarketingMemory({ useDatabase: false });
    setTokenVerifier(async (token) => {
      if (token === 'admin') return { id: 'a1', email: 'meovangnha@gmail.com' };
      if (token === 'khach') return { id: 'k1', email: '0901234567@meovangnha.vn' };
      return null;
    });
  });
  afterEach(() => setTokenVerifier(null));

  it('chỉ Admin mới xem cài đặt và gửi tin', async () => {
    let res = mockRes();
    await handleMarketing(req('GET', '/api/marketing/settings'), res, 'settings');
    expect(res.statusCode).toBe(401);

    res = mockRes();
    await handleMarketing(req('POST', '/api/marketing/send', { token: 'khach', body: { messages: [{ customerId: 'x', body: 'hi' }] } }), res, 'send');
    expect(res.statusCode).toBe(403);

    res = mockRes();
    await handleMarketing(req('GET', '/api/marketing/settings', { token: 'admin' }), res, 'settings');
    expect(res.statusCode).toBe(200);
  });

  it('Admin lưu và đọc lại cài đặt', async () => {
    const config = { scenarios: [{ id: 'sc-3', enabled: true }], templates: [{ id: 't', body: 'x' }], frequency: { maxPerWeek: 2 } };
    let res = mockRes();
    await handleMarketing(req('PUT', '/api/marketing/settings', { token: 'admin', body: config }), res, 'settings');
    expect(res.statusCode).toBe(200);
    res = mockRes();
    await handleMarketing(req('GET', '/api/marketing/settings', { token: 'admin' }), res, 'settings');
    expect(res.body.config.frequency.maxPerWeek).toBe(2);
    expect(res.body.database).toBe(false);
  });

  it('ghi nhận khách đã thấy / đã bấm thông báo', async () => {
    const m = await insertMessage({ customerId: 'k1', status: 'sent', title: 'a', body: 'b' });
    let res = mockRes();
    await handleMarketing(req('POST', '/api/marketing/track', { body: { messageId: m.id, event: 'click' } }), res, 'track');
    expect(res.body.ok).toBe(true);
    const [saved] = await listMessages();
    expect(saved.clickedAt).toBeTruthy();
    expect(saved.shownAt).toBeTruthy();

    res = mockRes();
    await handleMarketing(req('POST', '/api/marketing/track', { body: { messageId: 'abc', event: 'click' } }), res, 'track');
    expect(res.statusCode).toBe(400);
  });

  it('chạy theo lịch cần CRON_SECRET hoặc Admin', async () => {
    const res = mockRes();
    await handleMarketing(req('POST', '/api/marketing/run'), res, 'run');
    expect(res.statusCode).toBe(401);
  });

  it('chỉ mở trang trong web khi bấm thông báo', () => {
    expect(safeUrl('/my-booking?code=A')).toBe('/my-booking?code=A');
    expect(safeUrl('https://evil.example')).toBe('/');
    expect(safeUrl('//evil.example')).toBe('/');
  });

  it('trả họ tên, SĐT tài khoản khách cho trang Marketing', async () => {
    await saveContact({ id: 'k1', fullName: 'Lan Anh', phone: '0901234567', email: '0901234567@meovangnha.vn' });
    await saveContact({ id: 'a1', isAdmin: true, fullName: 'Admin' });
    const res = mockRes();
    await handleMarketing(req('GET', '/api/marketing/audience', { token: 'admin' }), res, 'audience');
    expect(res.statusCode).toBe(200);
    // Máy CI đọc được Supabase thật nên có thể có thêm tài khoản khác: chỉ kiểm tra khách k1 và không có Admin
    const ids = (res.body.accounts || []).map((a) => a.id);
    expect(ids).not.toContain('a1');
    expect(res.body.accounts.find((a) => a.id === 'k1')).toMatchObject({ fullName: 'Lan Anh', phone: '0901234567' });
    expect(res.body.subscriptionStore).toHaveProperty('ok');
  }, 20000);

  it('khách chỉ dùng thông báo cho mã tài khoản / SĐT của mình', () => {
    expect(ownPushIds({ id: 'k1', email: '0901234567@meovangnha.vn' })).toEqual(['k1', '0901234567']);
  });
});
