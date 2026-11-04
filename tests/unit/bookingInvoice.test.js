import { describe, expect, it } from 'vitest';
import { buildInvoice, checkOutTimingLabel, nightsBetween, parseAddonPrice } from '../../src/utils/bookingInvoice';
import { buildCustomers, computeRevenueByMonth, paymentStateOf, segmentOf } from '../../src/pages/AdminCustomers/customerUtils';

const CATALOG = {
  food: { title: 'Cho ăn thêm', options: [{ value: 'extra_meal', label: 'Thêm 1 bữa phụ (+15.000đ/ngày)', price: '+15.000đ/ngày' }] },
  play: { title: 'Cho chơi thêm', options: [{ value: 'play_session', label: 'Buổi chơi riêng', price: 'Tư vấn' }] },
};

// Chị Lan gửi 1 bé từ 25/10 đến 08/11 (14 đêm), gói 100.000đ/đêm
const base = {
  code: 'MVN-1', customerId: 'lan', status: 'đang ở', checkIn: '2026-10-25', checkOut: '2026-11-08', cats: 1,
  selectedLodging: { price: 100000 }, totalPrice: 1400000, paymentStatus: 'pay_at_checkin',
};

describe('Hóa đơn tự cập nhật theo yêu cầu của khách', () => {
  it('đọc giá dịch vụ thêm và số đêm', () => {
    expect(parseAddonPrice('+15.000đ/ngày')).toBe(15000);
    expect(parseAddonPrice('Tư vấn')).toBeNull();
    expect(nightsBetween('2026-10-25', '2026-11-08')).toBe(14);
  });

  it('chưa có thay đổi: hóa đơn bằng giá lúc đặt', () => {
    const inv = buildInvoice(base, CATALOG);
    expect(inv.total).toBe(1400000);
    expect(inv.lines).toHaveLength(1);
    expect(inv.outstanding).toBe(1400000);
  });

  it('khách thêm dịch vụ trên trang theo dõi: cộng giá × số ngày từ hôm yêu cầu tới ngày đón', () => {
    const b = { ...base, addons: [{ id: 'a1', type: 'food', option: 'extra_meal', status: 'pending', timestamp: '2026-11-01T03:00:00Z' }] };
    const inv = buildInvoice(b, CATALOG);
    expect(inv.total).toBe(1400000 + 15000 * 7);
    expect(inv.lines[1].pending).toBe(true);
    expect(inv.changes[0].text).toContain('Thêm 1 bữa phụ');
  });

  it('Admin từ chối thì không tính, dịch vụ chưa có giá thì báo giá sau (0đ)', () => {
    const b = { ...base, addons: [
      { id: 'a1', type: 'food', option: 'extra_meal', status: 'rejected', timestamp: '2026-11-01T03:00:00Z' },
      { id: 'a2', type: 'play', option: 'play_session', status: 'active', timestamp: '2026-11-01T03:00:00Z' },
    ] };
    expect(buildInvoice(b, CATALOG).total).toBe(1400000);
  });

  it('check-out sớm không hoàn tiền những đêm không ở', () => {
    const b = { ...base, status: 'check-out', checkedOutAt: '2026-11-05T03:00:00Z' };
    const inv = buildInvoice(b, CATALOG);
    expect(inv.total).toBe(1400000);
    expect(inv.nights).toBe(11);
    const early = inv.lines.find((l) => l.kind === 'early');
    expect(early.amount).toBe(0);
    expect(early.detail).toContain('không hoàn tiền');
  });

  it('khách đổi lịch thêm đêm thì cộng thêm tiền phòng', () => {
    const b = { ...base, originalCheckIn: '2026-10-25', originalCheckOut: '2026-11-08', checkOut: '2026-11-10', rescheduledAt: '2026-10-20T00:00:00Z' };
    expect(buildInvoice(b, CATALOG).total).toBe(1600000);
  });

  it('thanh toán rồi mới thêm dịch vụ: còn thiếu tiền, chưa ghi doanh thu cho tới khi trả đủ', () => {
    const paidEarly = { ...base, status: 'check-out', paymentStatus: 'Đã thanh toán', paidAmount: 1400000,
      addons: [{ id: 'a1', type: 'food', option: 'extra_meal', status: 'active', timestamp: '2026-11-01T03:00:00Z' }] };
    expect(buildInvoice(paidEarly, CATALOG).outstanding).toBe(105000);
    expect(paymentStateOf(paidEarly)).toBe('partial');
    expect(buildCustomers({ bookings: [paidEarly] })[0].totalSpent).toBe(0);

    const paidAll = { ...paidEarly, paidAmount: 1505000 };
    expect(paymentStateOf(paidAll)).toBe('paid');
    const customers = buildCustomers({ bookings: [paidAll] });
    expect(customers[0].totalSpent).toBe(1505000);
    expect(computeRevenueByMonth(customers)).toEqual([{ month: '2026-10', revenue: 1505000, bookings: 1 }]);
  });
});

describe('Phân loại VIP', () => {
  it('phải chi tiêu đã thanh toán từ 3 triệu VÀ là khách quay lại', () => {
    expect(segmentOf({ bookingCount: 1, totalSpent: 5000000 })).toBe('first');
    expect(segmentOf({ bookingCount: 6, totalSpent: 1000000 })).toBe('returning');
    expect(segmentOf({ bookingCount: 2, totalSpent: 3000000 })).toBe('vip');
  });
});

describe('Gia hạn từ trang Theo dõi lưu trú', () => {
  it('cộng phí gia hạn và lùi ngày đón; Admin từ chối thì bỏ', () => {
    const ext = { id: 'e1', days: 2, newCheckOut: '2026-11-10', pricePerDay: 100000, amount: 200000, status: 'pending', timestamp: '2026-11-02T03:00:00Z' };
    const inv = buildInvoice({ ...base, extensions: [ext] }, CATALOG);
    expect(inv.total).toBe(1600000);
    expect(inv.checkOut).toBe('2026-11-10');
    expect(inv.changes.some((c) => c.text.includes('gia hạn 2 ngày'))).toBe(true);
    expect(buildInvoice({ ...base, extensions: [{ ...ext, status: 'rejected' }] }, CATALOG).total).toBe(1400000);
  });

  it('gia hạn rồi lại đón sớm hơn ngày gia hạn: vẫn tính đủ tiền gia hạn, không hoàn', () => {
    const ext = { id: 'e1', days: 3, newCheckOut: '2026-11-11', pricePerDay: 180000, amount: 540000, status: 'pending', timestamp: '2026-11-02T03:00:00Z' };
    const inv = buildInvoice({ ...base, status: 'check-out', checkedOutAt: '2026-11-10T03:00:00Z', extensions: [ext] }, CATALOG);
    expect(inv.total).toBe(1400000 + 540000);
    expect(inv.lines.some((l) => l.pending)).toBe(false);
  });
});

describe('Check-out đúng hạn / sớm / muộn', () => {
  it('đúng hạn: giữ nguyên tiền, ghi chú đúng hạn', () => {
    const inv = buildInvoice({ ...base, status: 'check-out', checkedOutAt: '2026-11-08T03:00:00Z' }, CATALOG);
    expect(inv.total).toBe(1400000);
    expect(inv.checkOutTiming).toBe('on_time');
    expect(checkOutTimingLabel(inv)).toBe('Check-out đúng hạn');
    expect(inv.changes.some((c) => c.text.includes('đúng hạn'))).toBe(true);
  });

  it('sớm: giữ nguyên tiền (không hoàn), ghi chú sớm', () => {
    const inv = buildInvoice({ ...base, status: 'check-out', checkedOutAt: '2026-11-05T03:00:00Z' }, CATALOG);
    expect(inv.total).toBe(1400000);
    expect(inv.changes.some((c) => c.text.includes('không hoàn tiền'))).toBe(true);
    expect(checkOutTimingLabel(inv)).toBe('Check-out sớm 3 đêm');
  });

  it('muộn: cộng thêm tiền những đêm quá hạn, dịch vụ thêm tính tới ngày đón thật', () => {
    const b = { ...base, status: 'check-out', checkedOutAt: '2026-11-10T03:00:00Z',
      addons: [{ id: 'a1', type: 'food', option: 'extra_meal', status: 'active', timestamp: '2026-11-07T03:00:00Z' }] };
    const inv = buildInvoice(b, CATALOG);
    expect(inv.lines.find((l) => l.kind === 'late').amount).toBe(200000);
    expect(inv.total).toBe(1400000 + 200000 + 15000 * 3);
    expect(inv.nights).toBe(16);
    expect(checkOutTimingLabel(inv)).toBe('Check-out muộn 2 đêm');
    expect(inv.changes.some((c) => c.text.includes('Check-out muộn ngày 2026-11-10'))).toBe(true);
  });

  it('đã gia hạn thì muộn tính từ ngày gia hạn', () => {
    const ext = { id: 'e1', days: 2, newCheckOut: '2026-11-10', pricePerDay: 100000, amount: 200000, status: 'approved', timestamp: '2026-11-02T03:00:00Z' };
    const inv = buildInvoice({ ...base, extensions: [ext], status: 'check-out', checkedOutAt: '2026-11-11T03:00:00Z' }, CATALOG);
    expect(inv.total).toBe(1400000 + 200000 + 100000);
    expect(checkOutTimingLabel(inv)).toBe('Check-out muộn 1 đêm');
  });

  it('chưa check-out thì không có ghi chú', () => {
    expect(checkOutTimingLabel(buildInvoice(base, CATALOG))).toBe('');
  });
});
