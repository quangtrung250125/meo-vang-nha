import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  applyStayChange, findRoomsWithSpace, getStaySegments, packageNightlyPrice, peakCatsInRoom, segmentOnDate,
} from '../../src/utils/staySegments';
import { buildInvoice } from '../../src/utils/bookingInvoice';

process.env.MVN_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mvn-stay-'));
process.env.MVN_BOOKINGS_DB = 'off';
let service;
beforeAll(async () => {
  service = await import('../../api/_lib/bookingsService.js');
});

const ROOMS = [
  { id: 'VIP-01', type: 'VIP', capacity: 2 },
  { id: 'VIP-02', type: 'VIP', capacity: 2 },
  { id: 'VVIP-01', type: 'VVIP', capacity: 4 },
];

// Chị Lan gửi 1 bé ở VIP-01 từ 01/11 tới 05/11 (4 đêm), gói Sang Chảnh 135.000đ/đêm
const lan = {
  code: 'MVN-11111', id: 'MVN-11111', customerId: 'lan', status: 'đang ở', roomId: 'VIP-01', cats: 1,
  checkIn: '2026-11-01', checkOut: '2026-11-05',
  selectedLodging: { id: 'p2', name: 'Gói Mèo Sang Chảnh', price: 135000 },
  totalPrice: 540000, paymentStatus: 'pay_at_checkin',
};
// Anh Minh đặt 2 bé ở VIP-01 từ 05/11 tới 08/11 -> VIP-01 kín từ 05/11
const minh = { code: 'MVN-22222', id: 'MVN-22222', customerId: 'minh', status: 'check-in', roomId: 'VIP-01', cats: 2, checkIn: '2026-11-05', checkOut: '2026-11-08' };

const extend = (booking, to, room = 'VIP-01', pkg = { id: 'p2', name: 'Gói Mèo Sang Chảnh' }, price = 135000) =>
  applyStayChange(booking, { from: booking.checkOut, to, roomId: room, packageId: pkg.id, packageName: pkg.name, pricePerNight: price });

describe('Lịch lưu trú theo chặng', () => {
  it('đơn chưa đổi gì là 1 chặng phòng & gói lúc đặt', () => {
    const [seg] = getStaySegments(lan);
    expect(seg).toMatchObject({ from: '2026-11-01', to: '2026-11-05', roomId: 'VIP-01', packageName: 'Gói Mèo Sang Chảnh', pricePerNight: 135000 });
  });

  it('gia hạn cùng phòng cùng gói thì gộp thành 1 chặng dài hơn', () => {
    const plan = extend(lan, '2026-11-07');
    expect(plan.segments).toHaveLength(1);
    expect(plan.checkOut).toBe('2026-11-07');
  });

  it('gia hạn sang phòng khác tạo chặng mới; đổi phòng giữa kỳ tách chặng', () => {
    const plan = extend(lan, '2026-11-08', 'VVIP-01', { id: 'p2', name: 'Gói Mèo Sang Chảnh' }, 150000);
    expect(plan.segments.map((s) => [s.from, s.to, s.roomId])).toEqual([
      ['2026-11-01', '2026-11-05', 'VIP-01'],
      ['2026-11-05', '2026-11-08', 'VVIP-01'],
    ]);
    const moved = applyStayChange({ ...lan, staySegments: plan.segments, checkOut: plan.checkOut },
      { from: '2026-11-03', to: '2026-11-08', roomId: 'VIP-02', packageId: 'p3', packageName: 'Gói Thường', pricePerNight: 100000 });
    expect(moved.segments.map((s) => [s.from, s.to, s.roomId])).toEqual([
      ['2026-11-01', '2026-11-03', 'VIP-01'],
      ['2026-11-03', '2026-11-08', 'VIP-02'],
    ]);
    expect(segmentOnDate({ staySegments: moved.segments }, '2026-11-04').roomId).toBe('VIP-02');
  });

  it('chỗ trống tính theo đúng ngày bé ở phòng nào', () => {
    const plan = extend(lan, '2026-11-08', 'VVIP-01', {}, 150000);
    const all = { 'VIP-01': [{ ...lan, staySegments: plan.segments, checkOut: plan.checkOut }], 'VVIP-01': [] };
    expect(peakCatsInRoom('VIP-01', all, '2026-11-01', '2026-11-05')).toBe(1);
    expect(peakCatsInRoom('VIP-01', all, '2026-11-05', '2026-11-08')).toBe(0);
    expect(peakCatsInRoom('VVIP-01', all, '2026-11-05', '2026-11-08')).toBe(1);
    // Phòng tính chỗ ở server cũng hiểu lịch theo chặng
    expect(service.getPeakOccupancyForRoom('VVIP-01', all, '2026-11-06', '2026-11-07')).toBe(1);
  });

  it('phòng hiện tại hết chỗ thì gợi ý phòng khác còn chỗ', () => {
    const all = { 'VIP-01': [lan, minh], 'VIP-02': [], 'VVIP-01': [] };
    const rooms = findRoomsWithSpace({ rooms: ROOMS, allBookingsByRoom: all, from: '2026-11-05', to: '2026-11-07', cats: 1, excludeCodes: [lan.code] });
    expect(rooms.map((r) => r.id)).toEqual(['VIP-02', 'VVIP-01']);
  });

  it('giá gói theo hạng phòng có phụ phí như lúc đặt', () => {
    expect(packageNightlyPrice({ basePrice: 135000, discountPercent: 10 }, 'VVIP', { VVIP: 50000 })).toBe(180000);
  });
});

describe('Server nhận thay đổi khách tự làm', () => {
  const todayStr = '2026-11-03';
  const update = (booking, all, plan) => service.checkCustomerUpdate(
    { userId: booking.customerId, roomId: booking.roomId, code: booking.code, updates: { staySegments: plan.segments, checkOut: plan.checkOut } },
    all, todayStr,
  );

  it('gia hạn khi phòng còn chỗ: nhận ngay, không cần nhân viên duyệt', () => {
    const all = { 'VIP-01': [lan], 'VIP-02': [], 'VVIP-01': [] };
    const result = update(lan, all, extend(lan, '2026-11-07'));
    expect(result.ok).toBe(true);
    expect(result.updates.checkOut).toBe('2026-11-07');
    expect(result.updates.baseCheckOut).toBe('2026-11-05');
  });

  it('gia hạn khi phòng đã kín thì từ chối, sang phòng khác còn chỗ thì được', () => {
    const all = { 'VIP-01': [lan, minh], 'VIP-02': [], 'VVIP-01': [] };
    const full = update(lan, all, extend(lan, '2026-11-07'));
    expect(full.ok).toBe(false);
    expect(full.message).toContain('không còn đủ chỗ');
    const other = update(lan, all, extend(lan, '2026-11-07', 'VIP-02'));
    expect(other.ok).toBe(true);
  });

  it('không được sửa ngày đã qua, không được tự hạ giá gói đã đặt', () => {
    const all = { 'VIP-01': [lan], 'VIP-02': [], 'VVIP-01': [] };
    const past = applyStayChange(lan, { from: '2026-11-01', to: '2026-11-05', roomId: 'VIP-02', packageId: 'p2', packageName: 'Gói Mèo Sang Chảnh', pricePerNight: 135000 });
    expect(update(lan, all, past).message).toContain('đã qua');
    const cheap = extend(lan, '2026-11-07', 'VIP-01', { id: 'p2', name: 'Gói Mèo Sang Chảnh' }, 1000);
    expect(update(lan, all, cheap).ok).toBe(false);
  });
});

describe('Hóa đơn theo từng chặng', () => {
  it('gia hạn + đổi phòng: ghi rõ ngày a – b phòng nào gói nào và cộng tiền đúng', () => {
    // Gia hạn 05/11 → 07/11 sang VVIP-01 (150.000đ/đêm), rồi từ 03/11 đổi gói ở VIP-01 lên gói Quý Tộc (180.000đ/đêm)
    const ext = extend(lan, '2026-11-07', 'VVIP-01', { id: 'p2', name: 'Gói Mèo Sang Chảnh' }, 150000);
    const b1 = { ...lan, staySegments: ext.segments, checkOut: ext.checkOut, baseCheckOut: '2026-11-05' };
    const up = applyStayChange(b1, { from: '2026-11-03', to: '2026-11-05', roomId: 'VIP-01', packageId: 'p1', packageName: 'Gói Mèo Quý Tộc', pricePerNight: 180000 });
    const b2 = { ...b1, staySegments: up.segments, checkOut: up.checkOut,
      stayChanges: [{ at: '2026-11-03T02:00:00Z', text: 'gia hạn 2 đêm sang phòng VVIP-01' }] };
    const inv = buildInvoice(b2);
    // 540.000 (đơn gốc) + 2 đêm × 45.000 chênh lệch + 2 đêm × 150.000 gia hạn
    expect(inv.total).toBe(540000 + 90000 + 300000);
    expect(inv.checkOut).toBe('2026-11-07');
    expect(inv.stayPlan.map((s) => s.label)).toEqual([
      '01/11 – 03/11: Phòng VIP-01 · Gói Mèo Sang Chảnh',
      '03/11 – 05/11: Phòng VIP-01 · Gói Mèo Quý Tộc',
      '05/11 – 07/11: Phòng VVIP-01 · Gói Mèo Sang Chảnh',
    ]);
    expect(inv.lines.map((l) => l.label)).toEqual([
      'Đơn đặt ban đầu (4 đêm)',
      'Ngày 03/11 – 05/11: đổi sang Phòng VIP-01 · Gói Mèo Quý Tộc',
      'Gia hạn ngày 05/11 – 07/11: Phòng VVIP-01 · Gói Mèo Sang Chảnh',
    ]);
    expect(inv.changes.some((c) => c.text.includes('gia hạn 2 đêm'))).toBe(true);
  });

  it('check-out sớm trong phần gia hạn thì hoàn đúng giá đêm gia hạn', () => {
    const ext = extend(lan, '2026-11-07', 'VVIP-01', {}, 150000);
    const b = { ...lan, staySegments: ext.segments, checkOut: ext.checkOut, baseCheckOut: '2026-11-05', status: 'check-out', checkedOutAt: '2026-11-06T03:00:00Z' };
    expect(buildInvoice(b).total).toBe(540000 + 150000);
  });
});
