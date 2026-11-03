import { describe, expect, it } from 'vitest';
import { buildBookingEdit, roomTypeOf, lodgingFitsRoom } from '../../src/utils/bookingEdit';
import { lodgingPricingForRoom } from '../../src/utils/bookingPricing';

const sangChanh = { id: 'sang-chanh', name: 'Gói Mèo Sang Chảnh', category: 'Lưu trú', price: 135000, originalPrice: 150000, basePrice: 135000, baseOriginalPrice: 150000, forRoomTypes: ['VIP', 'VVIP', 'DELUXE'] };
const deluxeOnly = { ...sangChanh, id: 'deluxe', name: 'Gói Deluxe', forRoomTypes: ['DELUXE'] };
const spa = { id: 'spa', name: 'Tắm sấy', price: 90000, originalPrice: 100000 };
const mochi = { id: 'p1', name: 'Mochi' };
const tiger = { id: 'p2', name: 'Tiger' };

const booking = {
  id: 'MVN-20001',
  code: 'MVN-20001',
  cats: 1,
  petIds: ['p1'],
  petProfiles: [mochi],
  catNames: 'Mochi',
  checkIn: '2026-12-01',
  checkOut: '2026-12-03',
  roomId: 'VIP-01',
  packages: ['Gói Mèo Sang Chảnh'],
  selectedLodging: sangChanh,
  totalPrice: 270000,
};

describe('Khách chỉnh sửa đơn: tính lại giá như lúc đặt phòng', () => {
  it('không đổi gì thì giá giữ nguyên và không có thay đổi', () => {
    const edit = buildBookingEdit(booking, { pets: [mochi], checkIn: booking.checkIn, checkOut: booking.checkOut, room: { id: 'VIP-01', type: 'VIP' }, lodging: sangChanh });
    expect(edit.changes.totalPrice).toBe(270000);
    expect(edit.summary).toEqual([]);
  });

  it('thêm bé, thêm ngày, đổi phòng và thêm spa: giá nhân theo số bé × số ngày, có tóm tắt cho Admin', () => {
    const lodging = { ...sangChanh, ...lodgingPricingForRoom(sangChanh, 'VVIP', { VVIP: 50000 }) };
    const edit = buildBookingEdit(booking, {
      pets: [mochi, tiger], checkIn: '2026-12-01', checkOut: '2026-12-06', room: { id: 'VVIP-01', type: 'VVIP' }, lodging, spa,
    });
    // Gói lưu trú phòng VVIP: 135.000 + 45.000 (phụ phí 50.000 giảm 10%) = 180.000đ/ngày/bé
    expect(lodging.price).toBe(180000);
    expect(edit.days).toBe(5);
    expect(edit.changes.totalPrice).toBe(180000 * 5 * 2 + 90000 * 2);
    expect(edit.changes).toMatchObject({ cats: 2, petIds: ['p1', 'p2'], catNames: 'Mochi, Tiger', roomId: 'VVIP-01', packages: ['Gói Mèo Sang Chảnh', 'Tắm sấy'] });
    expect(edit.summary.join('\n')).toMatch(/Mèo: Mochi → Mochi, Tiger \(2 bé\)/);
    expect(edit.summary.join('\n')).toMatch(/Lịch: 01\/12\/2026 - 03\/12\/2026 → 01\/12\/2026 - 06\/12\/2026/);
    expect(edit.summary.join('\n')).toMatch(/Phòng: VIP-01 → VVIP-01/);
    expect(edit.summary.join('\n')).toMatch(/Tiền dịch vụ: 270\.000đ → /);
  });

  it('đơn đặt không dùng ưu đãi thì giá mới cũng không giảm', () => {
    const edit = buildBookingEdit({ ...booking, couponApplied: false }, { pets: [mochi], checkIn: '2026-12-01', checkOut: '2026-12-03', room: { id: 'VIP-01', type: 'VIP' }, lodging: sangChanh });
    expect(edit.changes.totalPrice).toBe(300000);
  });
});

describe('Gói lưu trú theo hạng phòng', () => {
  it('đọc hạng phòng từ mã phòng', () => {
    expect(roomTypeOf('VVIP-02')).toBe('VVIP');
    expect(roomTypeOf({ id: 'DELUXE-01' })).toBe('DELUXE');
  });

  it('gói chỉ dành cho Deluxe thì không áp dụng phòng VIP', () => {
    expect(lodgingFitsRoom(deluxeOnly, 'VIP')).toBe(false);
    expect(lodgingFitsRoom(deluxeOnly, 'DELUXE')).toBe(true);
    expect(lodgingFitsRoom({ name: 'Gói cũ' }, 'VIP')).toBe(true);
  });
});
