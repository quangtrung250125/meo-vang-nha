import { BOOKING_STATUS, normalizeStatusValue } from './bookingStatus.js';

// Ngày hôm nay theo giờ máy (YYYY-MM-DD), so sánh trực tiếp với checkIn / checkOut của đơn
export const getTodayStr = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/**
 * Bước hiện tại của "Hành trình lưu trú" (trang Theo dõi lưu trú):
 * - 4 "Chuẩn bị check-out": bé đang ở và đã tới (hoặc qua) ngày đón bé. Khách gia hạn thì ngày đón
 *   (checkOut) lùi lại nên tự quay về bước 3. Admin Check-out thì đơn hoàn thành, trang không còn hiện đơn này.
 * - 3 "Đang lưu trú & chăm sóc": Admin đã chuyển đơn sang "đang ở" ở Tình trạng phòng, chưa tới ngày đón bé
 * - 2 "Check-in": đã tới ngày gửi bé nhưng Admin chưa chuyển sang "đang ở"
 * - 1 "Đặt cọc giữ phòng": chưa tới ngày gửi bé
 * Từ bước 3 trở đi mới hiện nhật ký, camera, gói đang sử dụng, dịch vụ thêm.
 */
export const getStayStep = (booking, todayStr = getTodayStr()) => {
  if (!booking) return 1;
  if (normalizeStatusValue(booking.status) === BOOKING_STATUS.IN_HOUSE) {
    return booking.checkOut && todayStr >= booking.checkOut ? 4 : 3;
  }
  if (booking.checkIn && todayStr >= booking.checkIn) return 2;
  return 1;
};

// Thời điểm Admin chuyển đơn sang "đang ở" -> "HH:mm, DD/MM/YYYY"
export const formatCheckInTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};
