import { describe, expect, it } from 'vitest';
import {
  mergeCatalog,
  deriveItem,
  buildBoardingPackages,
  computeRuleAdjustments,
  computeServicePerformance,
  ruleCoversDate,
  isItemVisible,
  DEFAULT_ITEMS,
} from '../../src/utils/serviceCatalog';
import { packagesList } from '../../src/mockData/servicesData';
import { BOARDING_PACKAGES } from '../../src/mockData/boardingServicesData';
import { calculateBookingPrice } from '../../src/utils/bookingPricing';

describe('Danh mục dịch vụ: bản mặc định', () => {
  it('bảng Supabase trống thì giá & chuỗi giá y như trước', () => {
    const { items } = mergeCatalog([]);
    expect(items).toHaveLength(packagesList.length);
    for (const pkg of packagesList) {
      const item = items.find((i) => i.id === pkg.id);
      expect(item.price).toBe(pkg.price);
      expect(item.originalPrice).toBe(pkg.originalPrice);
      expect(item.priceString).toBe(pkg.priceString);
      expect(item.originalPriceString).toBe(pkg.originalPriceString);
      expect(item.savingsString).toBe(pkg.savingsString);
      if ('basePrice' in pkg) expect(item.basePrice).toBe(pkg.basePrice);
    }
  });

  it('gói lưu trú chi tiết giữ nguyên giá khi chưa sửa', () => {
    const { items, rooms } = mergeCatalog([]);
    const boarding = buildBoardingPackages(items, rooms);
    expect(boarding.map((b) => [b.id, b.basePrice, b.priceString])).toEqual(
      BOARDING_PACKAGES.map((b) => [b.id, b.basePrice, b.priceString])
    );
  });
});

describe('Danh mục dịch vụ: admin sửa', () => {
  it('sửa giá thì tính lại giá ưu đãi, chuỗi giá', () => {
    const { items } = mergeCatalog([{ id: 'spa3', kind: 'item', data: { originalPrice: 150000, discountPercent: 20 }, is_published: true }]);
    const spa = items.find((i) => i.id === 'spa3');
    expect(spa.price).toBe(120000);
    expect(spa.priceString).toBe('từ 120.000đ');
    expect(spa.originalPriceString).toBe('từ 150.000đ');
    expect(spa.edited).toBe(true);
  });

  it('gỡ dịch vụ thì khách không thấy, admin vẫn thấy', () => {
    const { items } = mergeCatalog([{ id: 's2', kind: 'item', data: {}, is_published: false }]);
    const s2 = items.find((i) => i.id === 's2');
    expect(s2).toBeTruthy();
    expect(isItemVisible(s2)).toBe(false);
  });

  it('gỡ gói lưu trú thì phần chi tiết lưu trú ẩn gói đó; đổi giá thì cập nhật', () => {
    const { items, rooms } = mergeCatalog([
      { id: 'p3', kind: 'item', data: {}, is_published: false },
      { id: 'p2', kind: 'item', data: { originalPrice: 160000, name: 'Gói Sang Chảnh Mới' }, is_published: true },
      { id: 'VVIP', kind: 'room', data: { surcharge: 15000 } },
    ]);
    const boarding = buildBoardingPackages(items, rooms);
    expect(boarding.find((b) => b.id === 'p3')).toBeUndefined();
    const p2 = boarding.find((b) => b.id === 'p2');
    expect(p2.basePrice).toBe(160000);
    expect(p2.name).toBe('Gói Sang Chảnh Mới');
    expect(p2.availableUpgrades.find((u) => u.roomId === 'VVIP').surcharge).toBe(15000);
  });

  it('thêm dịch vụ mới', () => {
    const { items } = mergeCatalog([
      { id: 'svc-x', kind: 'item', data: { name: 'Cắt móng lẻ', category: 'Spa - Tắm cắt', originalPrice: 50000, discountPercent: 0, period: '/lần' }, is_published: true },
    ]);
    const x = items.find((i) => i.id === 'svc-x');
    expect(x.isCustom).toBe(true);
    expect(x.priceString).toBe('50.000đ');
    expect(x.isPromo).toBe(false);
    expect(items.length).toBe(DEFAULT_ITEMS.length + 1);
  });

  it('tính giá ưu đãi làm tròn nghìn', () => {
    expect(deriveItem({ originalPrice: 99000, discountPercent: 10 }).price).toBe(89000);
  });
});

describe('Quy tắc giá', () => {
  const weekend = { id: 'w', type: 'weekend', name: 'Cuối tuần', percent: 10, weekdays: [5, 6], active: true };
  const tet = { id: 't', type: 'holiday', name: 'Tết', percent: 30, startDate: '2027-02-05', endDate: '2027-02-10', active: true };
  const longStay = { id: 'l', type: 'discount', name: 'Dài ngày', percent: 5, minNights: 7, appliesTo: ['Lưu trú'], active: true };

  it('quy tắc lặp hằng năm vắt qua năm mới', () => {
    const r = { type: 'season', startDate: '2026-12-20', endDate: '2027-01-05', repeatYearly: true };
    expect(ruleCoversDate(r, '2030-12-31')).toBe(true);
    expect(ruleCoversDate(r, '2030-01-03')).toBe(true);
    expect(ruleCoversDate(r, '2030-02-01')).toBe(false);
  });

  it('phụ thu cuối tuần chỉ tính đêm thứ 6, thứ 7', () => {
    // 2026-11-06 là thứ 6: các đêm T6, T7, CN
    const { lines, total } = computeRuleAdjustments({ rules: [weekend], checkIn: '2026-11-06', days: 3, cats: 2, lodgingNightly: 100000 });
    expect(lines[0].nights).toBe(2);
    expect(total).toBe(2 * 10000 * 2);
  });

  it('lễ Tết ưu tiên hơn cuối tuần, mỗi đêm chỉ 1 mức', () => {
    // 2027-02-05 là thứ 6
    const { lines } = computeRuleAdjustments({ rules: [weekend, tet], checkIn: '2027-02-05', days: 2, lodgingNightly: 100000 });
    expect(lines).toHaveLength(1);
    expect(lines[0].id).toBe('t');
    expect(lines[0].amount).toBe(60000);
  });

  it('giảm giá gửi dài ngày chỉ khi đủ số đêm', () => {
    expect(computeRuleAdjustments({ rules: [longStay], checkIn: '2026-11-02', days: 6, lodgingNightly: 100000 }).total).toBe(0);
    expect(computeRuleAdjustments({ rules: [longStay], checkIn: '2026-11-02', days: 7, lodgingNightly: 100000 }).total).toBe(-35000);
  });

  it('quy tắc đang tắt không ảnh hưởng tổng tiền đặt phòng', () => {
    const lodging = packagesList.find((p) => p.id === 'p2');
    const before = calculateBookingPrice({ lodging, days: 3 });
    const after = calculateBookingPrice({ lodging, days: 3, checkIn: '2026-11-06', pricingRules: [{ ...weekend, active: false }] });
    expect(after.total).toBe(before.total);
  });

  it('quy tắc đang bật cộng vào tổng tiền đặt phòng', () => {
    const lodging = packagesList.find((p) => p.id === 'p2'); // 135.000đ/ngày sau ưu đãi
    const price = calculateBookingPrice({ lodging, days: 3, checkIn: '2026-11-06', pricingRules: [weekend] });
    expect(price.ruleAdjustmentTotal).toBe(2 * 13500);
    expect(price.total).toBe(405000 + 27000);
  });
});

describe('Hiệu suất dịch vụ', () => {
  const bookings = [
    { id: 'a', status: 'UPCOMING', checkIn: '2026-11-01', checkOut: '2026-11-03', cats: 1, selectedRoom: { id: 'VIP-01', type: 'VIP' }, selectedLodging: { id: 'p2', price: 135000 }, selectedSpa: { id: 'spa3' } },
    { id: 'b', status: 'COMPLETED', checkIn: '2026-11-01', checkOut: '2026-11-02', selectedRoom: { id: 'VIP-02' }, selectedLodging: { id: 'p2', price: 135000 } },
    { id: 'c', status: 'UPCOMING', checkIn: '2026-11-01', checkOut: '2026-11-02', selectedRoom: { id: 'DELUXE-01' }, selectedLodging: { id: 'p1', price: 180000 }, selectedExtra: { id: 's2' }, addCamera: false },
    { id: 'd', status: 'CANCELLED', selectedLodging: { id: 'p1' }, selectedSpa: { id: 'spa3' } },
  ];
  const { items } = mergeCatalog([]);
  const perf = computeServicePerformance(bookings, items);

  it('đếm số lần bán, bỏ đơn huỷ', () => {
    expect(perf.totalBookings).toBe(3);
    expect(perf.services.find((s) => s.id === 'p2').sold).toBe(2);
    expect(perf.services.find((s) => s.id === 'spa3').sold).toBe(1);
    expect(perf.services.find((s) => s.id === 'p2').revenue).toBe(135000 * 2 + 135000);
  });

  it('tỷ lệ mua kèm & dịch vụ hay đi cùng', () => {
    const p2 = perf.services.find((s) => s.id === 'p2');
    expect(p2.attachRate).toBe(0.5);
    expect(p2.topPartners[0].id).toBe('spa3');
  });

  it('gợi ý upsell theo hạng phòng', () => {
    const vip = perf.upsell.find((u) => u.room === 'VIP');
    expect(vip.bookings).toBe(2);
    expect(vip.top.id).toBe('spa3');
    expect(vip.suggestion).toContain('Combo Tắm Sấy');
  });
});
