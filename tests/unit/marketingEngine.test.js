import { describe, it, expect } from 'vitest';
import {
  evaluateScenarios,
  fillTemplate,
  frequencyBlock,
  isQuietHour,
  destinationFor,
  pushIdsOf,
  groupCustomers,
  normalizeScenario,
  normalizeTemplate,
  summarizeResults,
  composeMessage,
} from '../../src/utils/marketingEngine';
import { initialScenarios, initialTemplates } from '../../src/pages/AdminMarketing/marketingStore';

// 10:00 sáng 03/11/2026 giờ Việt Nam
const NOW = Date.UTC(2026, 10, 3, 3, 0);
const DAY = 24 * 60 * 60 * 1000;
const FREQ = { maxPerWeek: 3, minGapHours: 24, quietStart: '21:00', quietEnd: '08:00' };

const templates = initialTemplates.map(normalizeTemplate);
const scenario = (id, patch = {}) => ({ ...normalizeScenario(initialScenarios.find((s) => s.id === id)), enabled: true, channels: ['webpush'], ...patch });

const lan = {
  id: 'u-lan',
  name: 'Lan Anh',
  phone: '0901234567',
  hasAccount: true,
  createdAt: '2026-10-01T00:00:00Z',
  petNames: ['Bơ'],
  bookings: [{ code: 'MVN-111', status: 'Đã xác nhận', checkIn: '2026-11-05', checkOut: '2026-11-08', createdAt: '2026-10-20T00:00:00Z' }],
};

describe('Ghép nội dung mẫu tin', () => {
  it('thay biến cá nhân hóa, bỏ biến không có dữ liệu', () => {
    expect(fillTemplate('Chào {ten_chu}, bé {ten_meo} {ma_don}', { ten_chu: 'Lan', ten_meo: 'Bơ' })).toBe('Chào Lan, bé Bơ');
  });

  it('tin về một đơn mở đúng đơn trong Lịch đặt của tôi', () => {
    expect(destinationFor('/my-booking', { code: 'MVN-111' })).toBe('/my-booking?code=MVN-111');
    expect(destinationFor('/booking', { code: 'MVN-111' })).toBe('/booking');
    const msg = composeMessage({ template: templates.find((t) => t.id === 'tpl-checkin-remind'), customer: lan, booking: lan.bookings[0] });
    expect(msg.body).toContain('05/11/2026');
    expect(msg.body).toContain('Bơ');
    expect(msg.url).toBe('/my-booking?code=MVN-111');
  });

  it('kịch bản và mẫu tin cũ được bổ sung điều kiện, tiêu đề, đích đến', () => {
    expect(normalizeScenario({ id: 'sc-3', channels: ['zalo'] }).rule).toEqual({ type: 'before_checkin', value: 2 });
    const tpl = normalizeTemplate({ id: 'tpl-tier-up', name: 'Lên hạng', body: 'x' });
    expect(tpl.url).toBe('/customer-profile?tab=tier');
    expect(tpl.title).toBeTruthy();
  });
});

describe('Tìm khách đến hạn nhận tin', () => {
  it('nhắc lịch: đến hạn khi còn 2 ngày, sắp tới khi còn xa hơn', () => {
    const due = evaluateScenarios({ customers: [lan], scenarios: [scenario('sc-3')], templates, frequency: FREQ, now: NOW });
    expect(due.due).toHaveLength(1);
    expect(due.due[0]).toMatchObject({ customerId: 'u-lan', dedupeKey: 'sc-3:u-lan:MVN-111', url: '/my-booking?code=MVN-111' });

    const early = evaluateScenarios({ customers: [lan], scenarios: [scenario('sc-3')], templates, frequency: FREQ, now: NOW - 3 * DAY });
    expect(early.due).toHaveLength(0);
    expect(early.upcoming).toHaveLength(1);
  });

  it('không gửi lại tin đã gửi, không gửi kịch bản đang tắt', () => {
    const messages = [{ dedupeKey: 'sc-3:u-lan:MVN-111', status: 'sent', customerId: 'other', createdAt: new Date(NOW - 30 * DAY).toISOString() }];
    expect(evaluateScenarios({ customers: [lan], scenarios: [scenario('sc-3')], templates, frequency: FREQ, messages, now: NOW }).due).toHaveLength(0);
    expect(evaluateScenarios({ customers: [lan], scenarios: [scenario('sc-3', { enabled: false })], templates, frequency: FREQ, now: NOW }).due).toHaveLength(0);
  });

  it('cảm ơn sau check-out 1 ngày, chỉ trong 7 ngày đầu', () => {
    const c = { ...lan, bookings: [{ code: 'MVN-222', status: 'check-out', checkIn: '2026-10-28', checkOut: '2026-11-02', checkedOutAt: '2026-11-02T03:00:00Z' }] };
    const res = evaluateScenarios({ customers: [c], scenarios: [scenario('sc-4')], templates, frequency: FREQ, now: NOW });
    expect(res.due.map((d) => d.dedupeKey)).toEqual(['sc-4:u-lan:MVN-222']);
    expect(evaluateScenarios({ customers: [c], scenarios: [scenario('sc-4')], templates, frequency: FREQ, now: NOW + 10 * DAY }).due).toHaveLength(0);
  });

  it('đăng ký 3 ngày chưa đặt phòng', () => {
    const c = { id: 'u-new', name: 'Khôi', hasAccount: true, createdAt: new Date(NOW - 4 * DAY).toISOString(), petNames: [], bookings: [] };
    expect(evaluateScenarios({ customers: [c], scenarios: [scenario('sc-1')], templates, frequency: FREQ, now: NOW }).due).toHaveLength(1);
    expect(evaluateScenarios({ customers: [lan], scenarios: [scenario('sc-1')], templates, frequency: FREQ, now: NOW }).due).toHaveLength(0);
  });

  it('bỏ dở đặt phòng quá 2 giờ, đặt xong thì thôi', () => {
    const c = { id: 'u-draft', name: 'Tú', hasAccount: true, bookings: [] };
    const drafts = { 'u-draft': { at: new Date(NOW - 3 * 60 * 60 * 1000).toISOString() } };
    expect(evaluateScenarios({ customers: [c], scenarios: [scenario('sc-2')], templates, frequency: FREQ, drafts, now: NOW }).due).toHaveLength(1);
    const booked = { ...c, bookings: [{ code: 'X', status: 'Đã xác nhận', createdAt: new Date(NOW - 60 * 60 * 1000).toISOString() }] };
    expect(evaluateScenarios({ customers: [booked], scenarios: [scenario('sc-2')], templates, frequency: FREQ, drafts, now: NOW }).due).toHaveLength(0);
  });

  it('giới hạn tần suất và giờ yên lặng chuyển tin sang tạm hoãn', () => {
    const messages = [{ customerId: 'u-lan', status: 'sent', createdAt: new Date(NOW - 2 * 60 * 60 * 1000).toISOString() }];
    const res = evaluateScenarios({ customers: [lan], scenarios: [scenario('sc-3')], templates, frequency: FREQ, messages, now: NOW });
    expect(res.due).toHaveLength(0);
    expect(res.blocked[0].blockReason).toMatch(/24 giờ/);

    const night = Date.UTC(2026, 10, 3, 15, 0); // 22:00 giờ Việt Nam
    expect(isQuietHour(FREQ, night)).toBe(true);
    expect(isQuietHour(FREQ, NOW)).toBe(false);
    const quiet = evaluateScenarios({ customers: [lan], scenarios: [scenario('sc-3')], templates, frequency: FREQ, now: night });
    expect(quiet.blocked[0].blockReason).toMatch(/yên lặng/);
  });

  it('đếm số tin trong tuần', () => {
    const times = [NOW - DAY * 2, NOW - DAY * 3, NOW - DAY * 4];
    expect(frequencyBlock(times, FREQ, NOW)).toMatch(/3\/3/);
    expect(frequencyBlock([NOW - DAY * 8], FREQ, NOW)).toBeNull();
  });

  it('nhận ra thiết bị đăng ký theo mã tài khoản hoặc số điện thoại', () => {
    expect(pushIdsOf({ id: 'u-lan', phone: '090 123 4567' })).toEqual(expect.arrayContaining(['u-lan', '0901234567', '84901234567']));
    expect(pushIdsOf({ id: 'phone:0901234567' })).toContain('0901234567');
    const res = evaluateScenarios({ customers: [lan], scenarios: [scenario('sc-3')], templates, frequency: FREQ, now: NOW, pushIds: new Set(['0901234567']) });
    expect(res.due[0].hasDevice).toBe(true);
  });

  it('gom khách ở server theo mã tài khoản và số điện thoại', () => {
    const list = groupCustomers({
      profiles: [{ id: 'u1', fullName: 'Lan', phone: '0901234567' }],
      bookings: [{ code: 'A', customerPhone: '0901234567' }, { code: 'B', customerId: 'u1' }, { code: 'C', ownerPhone: '0911111111' }],
      pets: [{ name: 'Bơ', ownerId: 'u1' }],
    });
    expect(list.find((c) => c.id === 'u1').bookings).toHaveLength(2);
    expect(list.find((c) => c.id === 'u1').petNames).toEqual(['Bơ']);
    expect(list.find((c) => c.id === 'phone:0911111111')).toBeTruthy();
  });
});

describe('Kết quả', () => {
  it('đếm đã gửi / đã mở / đã bấm / thành đơn trong khoảng thời gian', () => {
    const sentAt = new Date(NOW - 5 * DAY).toISOString();
    const messages = [
      { id: '1', customerId: 'u-lan', scenarioId: 'sc-3', status: 'sent', createdAt: sentAt, shownAt: sentAt, clickedAt: sentAt },
      { id: '2', customerId: 'u-x', scenarioId: null, status: 'sent', createdAt: sentAt, shownAt: sentAt },
      { id: '3', customerId: 'u-y', status: 'no_device', createdAt: sentAt },
      { id: '4', customerId: 'u-lan', status: 'sent', createdAt: new Date(NOW - 40 * DAY).toISOString() },
    ];
    const customers = [{ id: 'u-lan', bookings: [{ code: 'N', status: 'Đã xác nhận', createdAt: new Date(NOW - 4 * DAY).toISOString(), totalAmount: 500000 }] }];
    const { summary, byScenario } = summarizeResults({ messages, customers, scenarios: initialScenarios, days: 30, now: NOW });
    expect(summary).toMatchObject({ sent: 2, opened: 2, clicked: 1, converted: 1, revenue: 500000 });
    expect(byScenario.map((r) => r.name)).toEqual(expect.arrayContaining(['Gửi thủ công', 'Nhắc lịch trước ngày gửi mèo']));
  });
});
