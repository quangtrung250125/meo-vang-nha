// Tính tiền đơn đặt phòng (dùng ở bước 4 và trong test tự động)
import { computeRuleAdjustments } from './serviceCatalog.js';

export const CAMERA_PRICE_PER_DAY = 10000;

// Gói đã gồm camera riêng 24/24 thì không thu thêm phí camera
export const packageIncludesCamera = (pkg) => Boolean(pkg?.includesCamera);

export const countStayDays = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diffDays = Math.ceil(Math.abs(new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1; // Mặc định ít nhất 1 ngày
};

/**
 * Giá gói lưu trú theo hạng phòng (cộng phụ phí phòng VVIP / Deluxe do admin đặt).
 * Dùng ở bước 2 đặt phòng và khi khách chỉnh sửa đơn.
 */
export function lodgingPricingForRoom(pkg, roomType, roomSurcharges) {
  const surcharge = roomSurcharges?.[roomType] ?? 0;
  const baseOrig = pkg.baseOriginalPrice ?? pkg.originalPrice;
  const basePrc = pkg.basePrice ?? pkg.price;
  const originalPrice = baseOrig + surcharge;
  const pct = pkg.discountPercent ?? 10;
  const price = basePrc + Math.round(surcharge * (1 - pct / 100));
  const savings = originalPrice - price;
  const fmt = (n) => n.toLocaleString('vi-VN') + 'đ';
  return { price, originalPrice, priceString: fmt(price), originalPriceString: fmt(originalPrice), savingsString: fmt(savings), surcharge };
}

// Giá gốc trước ưu đãi: lấy originalPrice, nếu thiếu thì suy ra từ giá đã giảm 10%
const originalOf = (pkg) => pkg?.originalPrice || Math.round((pkg?.price || 0) / 0.9);

// Gói lưu trú và gói spa tính theo từng bé: giá gói × số mèo.
// Dịch vụ đưa đón tính theo chuyến, camera tính theo phòng nên không nhân số mèo.
// pricingRules + checkIn (tùy chọn): phụ thu cuối tuần / mùa / lễ Tết và giảm giá do admin bật ở trang Dịch vụ.
// Không truyền (hoặc chưa bật quy tắc nào) thì kết quả y như trước.
export function calculateBookingPrice({ lodging, spa, extra, days, cats = 1, couponApplied = true, addCamera = false, pricingRules = [], checkIn = '' }) {
  const catCount = Math.max(1, Number(cats) || 1);
  const lodgingPrice = lodging?.price || 0;
  const originalLodgingTotal = (lodging ? originalOf(lodging) : 0) * days * catCount;
  const discountedLodgingTotal = lodgingPrice * days * catCount;

  const spaOriginal = spa ? originalOf(spa) * catCount : 0;
  const spaDiscount = spa ? spaOriginal - (spa.price || 0) * catCount : 0;
  const extraOriginal = extra ? originalOf(extra) : 0;
  const extraDiscount = extra ? extraOriginal - (extra.price || 0) : 0;

  const cameraIncluded = packageIncludesCamera(lodging);
  const cameraTotal = !cameraIncluded && addCamera ? CAMERA_PRICE_PER_DAY * days : 0;

  const originalGrossTotal = originalLodgingTotal + spaOriginal + extraOriginal + cameraTotal;
  const discount = couponApplied
    ? originalLodgingTotal - discountedLodgingTotal + spaDiscount + extraDiscount
    : 0;

  const paidLodgingNightly = couponApplied ? lodgingPrice : (lodging ? originalOf(lodging) : 0);
  const rules = computeRuleAdjustments({
    rules: pricingRules,
    checkIn,
    days,
    cats: catCount,
    lodgingNightly: lodging ? paidLodgingNightly : 0,
    spaTotal: couponApplied ? spaOriginal - spaDiscount : spaOriginal,
    extraTotal: couponApplied ? extraOriginal - extraDiscount : extraOriginal,
  });

  return {
    catCount,
    spaOriginalTotal: spaOriginal,
    spaTotal: spaOriginal - spaDiscount,
    originalLodgingTotal,
    discountedLodgingTotal,
    cameraIncluded,
    cameraTotal,
    originalGrossTotal,
    discount,
    ruleAdjustments: rules.lines,
    ruleAdjustmentTotal: rules.total,
    total: originalGrossTotal - discount + rules.total,
  };
}
