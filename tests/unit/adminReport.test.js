import { describe, it, expect } from 'vitest';
import {
  computeAdminReport, computeRevenueReport, computeCustomerReport, computeOperationsReport, computeMarketingReport,
  computeForecast, upcomingPeaks, seasonOf, channelOf, reportToCsv,
} from '../../src/utils/adminReport';
import { buildCustomers } from '../../src/pages/AdminCustomers/customerUtils';
import { ROOM_CONFIG } from '../../Chi/RoomStateContext';

const TODAY = '2026-11-03';
const RANGE = { start: '2026-10-01', end: TODAY };
const done = (o) => ({ status: 'check-out', paymentStatus: 'Đã thanh toán', cats: 1, ...o });

const bookings = [
  done({ code: 'A1', customerId: 'A', roomId: 'VIP-01', createdAt: '2026-10-05T03:00:00Z', checkIn: '2026-10-06', checkOut: '2026-10-09',
    totalPrice: 600000, selectedSpa: { price: 100000 }, checkedOutAt: '2026-10-09T03:00:00Z' }),
  done({ code: 'A2', customerId: 'A', roomId: 'VVIP-01', createdAt: '2026-10-20T03:00:00Z', checkIn: '2026-10-21', checkOut: '2026-10-23',
    totalPrice: 400000, checkedOutAt: '2026-10-23T03:00:00Z' }),
  done({ code: 'B1', customerId: 'B', roomId: 'VIP-02', createdAt: '2026-10-12T03:00:00Z', checkIn: '2026-10-12', checkOut: '2026-10-13',
    totalPrice: 200000, checkedOutAt: '2026-10-13T03:00:00Z' }),
  { code: 'C1', customerId: 'C', status: 'Đã hủy', cancelReason: 'Đổi kế hoạch du lịch', createdAt: '2026-10-15T03:00:00Z', checkIn: '2026-10-20', checkOut: '2026-10-22', totalPrice: 300000 },
  { code: 'C2', customerId: 'C', status: 'Đã hủy', cancelReason: 'Đổi kế hoạch du lịch', createdAt: '2026-10-16T03:00:00Z', checkIn: '2026-10-25', checkOut: '2026-10-26', totalPrice: 150000 },
];
const customers = buildCustomers({ bookings });
// Tin marketing gửi cho A 2 ngày trước khi A đặt đơn A2
const messages = [
  { id: 'm1', status: 'sent', customerId: 'A', scenarioId: 'sc-quay-lai', createdAt: '2026-10-18T03:00:00Z', clickedAt: '2026-10-18T04:00:00Z' },
  { id: 'm2', status: 'sent', customerId: 'B', scenarioId: 'sc-quay-lai', createdAt: '2026-10-25T03:00:00Z' },
];
const scenarios = [{ id: 'sc-quay-lai', name: 'Mời khách quay lại' }];
const rules = [
  { id: 'r1', type: 'season', name: 'Mùa lễ hội tháng 10', active: true, startDate: '2026-10-20', endDate: '2026-10-31', percent: 10 },
];

describe('Trang Báo cáo admin', () => {
  it('doanh thu theo hạng phòng, mùa, kênh, tháng và RevPAR', () => {
    const r = computeRevenueReport({ customers, range: RANGE, rules, messages, totalRooms: 11 });
    expect(r.revenue).toBe(1200000);
    expect(r.addon).toBe(100000);
    expect(r.byRoom.find((x) => x.key === 'VIP')).toMatchObject({ revenue: 800000, bookings: 2, nights: 4 });
    expect(r.byRoom.find((x) => x.key === 'VVIP')).toMatchObject({ revenue: 400000, nights: 2 });
    expect(r.bySeason.find((x) => x.label === 'Mùa lễ hội tháng 10').revenue).toBe(400000);
    expect(r.bySeason.find((x) => x.label === 'Ngày thường').revenue).toBe(800000);
    expect(r.byChannel.find((x) => x.key === 'marketing').revenue).toBe(400000);
    expect(r.byChannel.find((x) => x.key === 'direct').revenue).toBe(800000);
    expect(r.byMonth).toHaveLength(1);
    // 34 ngày × 11 phòng; tiền lưu trú 1.100.000
    expect(r.revPar).toBeCloseTo(1100000 / (34 * 11), 3);
  });

  it('khách hàng: CLV, quay lại, giữ chân, % doanh thu theo nhóm', () => {
    const c = computeCustomerReport({ customers, range: { start: '2026-10-17', end: TODAY } });
    expect(c.clv).toBe(600000); // A 1.000.000, B 200.000
    expect(c.returningRate).toBe(50); // A quay lại, B 1 đơn
    // kỳ trước 01/10–16/10: A và B có đơn; kỳ này chỉ A đặt tiếp
    expect(c.previousCustomers).toBe(2);
    expect(c.retained).toBe(1);
    expect(c.retentionRate).toBe(50);
    expect(c.bySegment.find((s) => s.key === 'returning').revenue).toBe(400000);
  });

  it('vận hành: lấp phòng theo thứ, thời gian ở TB, tỷ lệ hủy và lý do', () => {
    const o = computeOperationsReport({ customers, range: RANGE, totalRooms: 11 });
    expect(o.roomNights).toBe(6);
    expect(o.avgStay).toBe(2);
    expect(o.cancelRate).toBe(40);
    expect(o.reasons[0]).toMatchObject({ label: 'Đổi kế hoạch du lịch', count: 2 });
    expect(o.byWeekday.map((w) => w.label)).toEqual(['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']);
  });

  it('marketing: kênh chất lượng và chiến dịch thành đơn', () => {
    const m = computeMarketingReport({ customers, range: RANGE, messages, scenarios });
    const camp = m.campaigns[0];
    expect(camp).toMatchObject({ label: 'Mời khách quay lại', sent: 2, clicked: 1, converted: 1, revenue: 400000 });
    expect(m.best.label).toBe('Mời khách quay lại');
    expect(m.quality.key).toBe('marketing');
    const a2 = customers.find((c) => c.id === 'A').bookings.find((b) => b.code === 'A2');
    expect(channelOf(a2, { id: 'A' }, messages)).toMatchObject({ channel: 'marketing', scenarioId: 'sc-quay-lai' });
  });

  it('dự báo: dịp cao điểm sắp tới và gợi ý phòng', () => {
    const peaks = upcomingPeaks(TODAY, 365);
    expect(peaks[0].label).toMatch(/Giáng sinh/);
    expect(peaks.some((p) => p.label === 'Tết Nguyên Đán 2027' && p.start === '2027-01-30')).toBe(true);
    const vvipFull = { 'VVIP-01': [], 'VVIP-02': [], 'VVIP-03': [] };
    Object.keys(vvipFull).forEach((id) => { vvipFull[id] = [{ code: id, status: 'Chờ nhận', checkIn: '2026-11-05', checkOut: '2026-11-14' }]; });
    const f = computeForecast({ customers, roomBookings: vvipFull, rooms: ROOM_CONFIG, rules: [], today: TODAY });
    const vvip = f.roomTips.find((r) => r.type === 'VVIP');
    expect(vvip.fullDays).toBe(10);
    expect(vvip.tip).toMatch(/mở thêm/);
    expect(f.peaks[0].tips[0]).toMatch(/Chưa có giá mùa/);
    expect(seasonOf('2026-10-25', rules)).toBe('Mùa lễ hội tháng 10');
  });

  it('xuất Excel có đủ 5 phần', () => {
    const rep = computeAdminReport({ customers, range: RANGE, rules, messages, scenarios, rooms: ROOM_CONFIG, today: TODAY });
    const csv = reportToCsv(rep);
    ['1. DOANH THU', '2. KHÁCH HÀNG', '3. VẬN HÀNH', '4. MARKETING', '5. DỰ BÁO & GỢI Ý'].forEach((h) => expect(csv).toContain(h));
    expect(csv).toContain('Tổng doanh thu (đ),1200000');
  });
});
