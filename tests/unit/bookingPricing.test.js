import { describe, expect, it } from 'vitest';
import { calculateBookingPrice, countStayDays, CAMERA_PRICE_PER_DAY } from '../../src/utils/bookingPricing';
import { packagesList } from '../../src/mockData/servicesData';

const pkg = (id) => packagesList.find((p) => p.id === id);

describe('Tính tiền đặt phòng', () => {
  it('đếm số ngày lưu trú', () => {
    expect(countStayDays('2026-11-10', '2026-11-13')).toBe(3);
    expect(countStayDays('', '2026-11-13')).toBe(0);
  });

  it('không thu thêm tiền camera với gói đã có camera', () => {
    const price = calculateBookingPrice({ lodging: pkg('p2'), days: 3, addCamera: true });
    expect(price.cameraIncluded).toBe(true);
    expect(price.cameraTotal).toBe(0);
    // 3 ngày × 150.000đ, giảm 10% còn 405.000đ
    expect(price.total).toBe(405000);
  });

  it('chỉ thu tiền camera khi khách chọn thêm', () => {
    const without = calculateBookingPrice({ lodging: pkg('p3'), days: 2 });
    const withCamera = calculateBookingPrice({ lodging: pkg('p3'), days: 2, addCamera: true });
    expect(without.cameraTotal).toBe(0);
    expect(withCamera.total - without.total).toBe(2 * CAMERA_PRICE_PER_DAY);
  });

  it('bỏ mã giảm giá thì trả giá gốc', () => {
    const price = calculateBookingPrice({ lodging: pkg('p2'), days: 3, couponApplied: false });
    expect(price.discount).toBe(0);
    expect(price.total).toBe(450000);
  });
});
