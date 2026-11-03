import { describe, it, expect } from 'vitest';
import {
  periodOf, computePeriodMetrics, computeDashboardKpis, computeRevenueSeries, computeRoomHeatmap, revenueSplitOf,
} from '../../src/utils/dashboardReport';
import { buildCustomers } from '../../src/pages/AdminCustomers/customerUtils';
import { ROOM_CONFIG } from '../../Chi/RoomStateContext';

const TODAY = '2026-11-03';

const paidDone = (over) => ({
  status: 'check-out',
  paymentStatus: 'Đã thanh toán',
  cats: 1,
  ...over,
});

const bookings = [
  // Khách A: đơn đầu 20/10 (đã chốt 600k, có spa 100k), đơn thứ 2 đặt 01/11 đang ở
  paidDone({ code: 'A1', customerId: 'A', createdAt: '2026-10-18T03:00:00Z', checkIn: '2026-10-20', checkOut: '2026-10-23',
    totalPrice: 600000, selectedLodging: { price: 166667 }, selectedSpa: { price: 100000 }, checkedOutAt: '2026-10-23T03:00:00Z' }),
  { code: 'A2', customerId: 'A', status: 'Đang ở', paymentStatus: 'deposit_paid', createdAt: '2026-11-01T03:00:00Z',
    checkIn: '2026-11-02', checkOut: '2026-11-05', totalPrice: 450000 },
  // Khách B: đặt 02/11, gửi 02/11, check-out & thanh toán 03/11
  paidDone({ code: 'B1', customerId: 'B', createdAt: '2026-11-02T01:00:00Z', checkIn: '2026-11-02', checkOut: '2026-11-03',
    totalPrice: 200000, checkedOutAt: '2026-11-03T02:00:00Z' }),
  // Khách C: đặt rồi hủy
  { code: 'C1', customerId: 'C', status: 'Đã hủy', createdAt: '2026-11-02T05:00:00Z', checkIn: '2026-11-10', checkOut: '2026-11-12', totalPrice: 300000 },
  // Khách D: đã check-out nhưng chưa thanh toán -> chưa tính doanh thu
  { code: 'D1', customerId: 'D', status: 'check-out', paymentStatus: 'deposit_paid', createdAt: '2026-10-30T05:00:00Z',
    checkIn: '2026-10-31', checkOut: '2026-11-01', totalPrice: 250000, checkedOutAt: '2026-11-01T02:00:00Z' },
];

const customers = buildCustomers({ bookings });

describe('Trang Tổng quan admin: số liệu từ đơn thật', () => {
  it('khoảng thời gian và kỳ trước cùng độ dài', () => {
    expect(periodOf('today', {}, TODAY)).toMatchObject({ current: { start: TODAY, end: TODAY }, previous: { start: '2026-11-02', end: '2026-11-02' } });
    expect(periodOf('7d', {}, TODAY).current).toEqual({ start: '2026-10-28', end: TODAY });
    expect(periodOf('7d', {}, TODAY).previous).toEqual({ start: '2026-10-21', end: '2026-10-27' });
    expect(periodOf('quarter', {}, TODAY).current).toEqual({ start: '2026-10-01', end: TODAY });
    expect(periodOf('custom', { startDate: '2026-11-05', endDate: '2026-11-01' }, TODAY).current).toEqual({ start: '2026-11-01', end: '2026-11-05' });
  });

  it('doanh thu chỉ cộng đơn đã check-out và thanh toán, theo ngày gửi mèo', () => {
    const m = computePeriodMetrics(customers, { start: '2026-10-01', end: TODAY }, { totalRooms: 11 });
    expect(m.revenue).toBe(800000); // A1 600k + B1 200k, không có D1 (chưa thanh toán), A2 (đang ở)
    expect(m.revenueBookings).toBe(2);
    const nov = computePeriodMetrics(customers, { start: '2026-11-01', end: TODAY });
    expect(nov.revenue).toBe(200000);
  });

  it('số đơn, tỷ lệ hủy, khách mới / quay lại theo ngày đặt', () => {
    const m = computePeriodMetrics(customers, { start: '2026-11-01', end: TODAY });
    expect(m.bookingCount).toBe(2); // A2, B1 (C1 hủy không tính)
    expect(m.cancelRate).toBeCloseTo((1 / 3) * 100, 5);
    expect(m.newCustomers).toBe(1); // B
    expect(m.returningCustomers).toBe(1); // A
  });

  it('tỷ lệ lấp phòng tính theo đêm có mèo ở', () => {
    const m = computePeriodMetrics(customers, { start: '2026-11-02', end: '2026-11-02' }, { totalRooms: 10 });
    // Đêm 02/11: A2 và B1 -> 2/10 phòng
    expect(m.roomNights).toBe(2);
    expect(m.occupancyRate).toBeCloseTo(20, 5);
  });

  it('so sánh kỳ trước; kỳ trước không có số liệu thì không bịa % tăng', () => {
    const k = computeDashboardKpis(customers, { preset: 'custom', customRange: { startDate: '2026-10-21', endDate: TODAY }, today: TODAY, totalRooms: 11 });
    expect(k.period.previous).toEqual({ start: '2026-10-07', end: '2026-10-20' });
    expect(k.revenue.current).toBe(200000);
    expect(k.revenue.previous).toBe(600000);
    expect(k.revenue.diff).toBeCloseTo(-66.67, 1);
    const empty = computeDashboardKpis([], { preset: '30d', today: TODAY });
    expect(empty.revenue).toEqual({ current: 0, previous: 0, diff: 0 });
    const fromZero = computeDashboardKpis(customers, { preset: 'today', today: '2026-10-20' });
    expect(fromZero.revenue.diff).toBeNull();
  });

  it('tách tiền lưu trú và dịch vụ thêm, tổng bằng hóa đơn', () => {
    const a1 = customers.find((c) => c.id === 'A').bookings.find((b) => b.code === 'A1');
    const split = revenueSplitOf(a1);
    expect(split.total).toBe(600000);
    expect(split.addon).toBe(100000);
    expect(split.stay).toBe(500000);
  });

  it('biểu đồ doanh thu theo ngày / tuần / tháng', () => {
    const s = computeRevenueSeries(customers, TODAY);
    expect(s.day).toHaveLength(7);
    expect(s.day.find((d) => d.shortLabel === '02/11')).toMatchObject({ stayRevenue: 200000, addonRevenue: 0, bookings: 1 });
    expect(s.week).toHaveLength(4);
    expect(s.month.map((m) => m.shortLabel)).toEqual(['T6', 'T7', 'T8', 'T9', 'T10', 'T11']);
    expect(s.month[4]).toMatchObject({ stayRevenue: 500000, addonRevenue: 100000, bookings: 1 });
    expect(s.month[5]).toMatchObject({ stayRevenue: 200000, bookings: 1 });
    expect(s.month.slice(0, 4).every((m) => m.stayRevenue === 0 && m.addonRevenue === 0)).toBe(true);
  });

  it('bản đồ nhiệt chỉ tính phòng có đơn hoặc bảo trì, không bịa số', () => {
    const empty = computeRoomHeatmap({}, {}, ROOM_CONFIG, { days: 14, today: TODAY });
    expect(empty).toHaveLength(14);
    expect(empty.every((d) => d.occupied === 0)).toBe(true);

    const map = computeRoomHeatmap(
      { 'VIP-01': [{ code: 'X', status: 'Chờ nhận', checkIn: '2026-11-04', checkOut: '2026-11-06' }] },
      { 'DELUXE-01': true },
      ROOM_CONFIG,
      { days: 5, today: TODAY }
    );
    expect(map.map((d) => d.occupied)).toEqual([1, 2, 2, 2, 1]);
    expect(map[0].dayName).toBe('Hôm nay');
  });
});
