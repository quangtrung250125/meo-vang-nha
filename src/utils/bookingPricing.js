// Tính tiền đơn đặt phòng (dùng ở bước 4 và trong test tự động)

export const CAMERA_PRICE_PER_DAY = 10000;

// Gói đã gồm camera riêng 24/24 thì không thu thêm phí camera
export const packageIncludesCamera = (pkg) => Boolean(pkg?.includesCamera);

export const countStayDays = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diffDays = Math.ceil(Math.abs(new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1; // Mặc định ít nhất 1 ngày
};

// Giá gốc trước ưu đãi: lấy originalPrice, nếu thiếu thì suy ra từ giá đã giảm 10%
const originalOf = (pkg) => pkg?.originalPrice || Math.round((pkg?.price || 0) / 0.9);

export function calculateBookingPrice({ lodging, spa, extra, days, couponApplied = true, addCamera = false }) {
  const lodgingPrice = lodging?.price || 0;
  const originalLodgingTotal = (lodging ? originalOf(lodging) : 0) * days;
  const discountedLodgingTotal = lodgingPrice * days;

  const spaOriginal = spa ? originalOf(spa) : 0;
  const spaDiscount = spa ? spaOriginal - (spa.price || 0) : 0;
  const extraOriginal = extra ? originalOf(extra) : 0;
  const extraDiscount = extra ? extraOriginal - (extra.price || 0) : 0;

  const cameraIncluded = packageIncludesCamera(lodging);
  const cameraTotal = !cameraIncluded && addCamera ? CAMERA_PRICE_PER_DAY * days : 0;

  const originalGrossTotal = originalLodgingTotal + spaOriginal + extraOriginal + cameraTotal;
  const discount = couponApplied
    ? originalLodgingTotal - discountedLodgingTotal + spaDiscount + extraDiscount
    : 0;

  return {
    originalLodgingTotal,
    discountedLodgingTotal,
    cameraIncluded,
    cameraTotal,
    originalGrossTotal,
    discount,
    total: originalGrossTotal - discount,
  };
}
