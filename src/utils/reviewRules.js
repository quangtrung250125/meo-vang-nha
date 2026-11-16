// Quy tắc đánh giá sau check-out (dùng chung cho trình duyệt và máy chủ)

const DAY_MS = 24 * 3600 * 1000;

export const REVIEW_WINDOW_DAYS = 30; // gửi đánh giá trong 30 ngày sau check-out
export const REVIEW_EDIT_DAYS = 7;    // sửa đánh giá trong 7 ngày sau khi gửi
export const REVIEW_REMIND_DAYS = 14; // chuông nhắc đánh giá trong 14 ngày sau check-out
export const REVIEW_COMMENT_MAX = 1000;
export const PUBLIC_REVIEWS_MIN = 3;  // đủ 3 đánh giá thật được duyệt thì trang chủ thay đánh giá mẫu

export const REVIEW_TAGS = [
  'Chăm sóc tận tâm',
  'Phòng sạch sẽ',
  'Nhân viên thân thiện',
  'Nhật ký & ảnh đầy đủ',
  'Giá hợp lý',
  'Cần cải thiện',
];

const toMs = (iso) => {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? t : null;
};

export const isCheckedOutStatus = (status) => ['check-out', 'Đã hoàn tất', 'hoàn tất', 'COMPLETED'].includes(status);

// Còn trong hạn gửi đánh giá (30 ngày sau check-out)
export function isWithinReviewWindow(checkedOutAt, now = Date.now()) {
  const t = toMs(checkedOutAt);
  if (t === null) return true; // đơn cũ không ghi giờ check-out: vẫn cho đánh giá
  return now - t <= REVIEW_WINDOW_DAYS * DAY_MS;
}

// Còn sửa được đánh giá (7 ngày sau lần gửi đầu)
export function canEditReview(review, now = Date.now()) {
  const t = toMs(review?.createdAt);
  return t !== null && now - t <= REVIEW_EDIT_DAYS * DAY_MS;
}

export function shouldRemindReview(checkedOutAt, now = Date.now()) {
  const t = toMs(checkedOutAt);
  return t !== null && now - t <= REVIEW_REMIND_DAYS * DAY_MS;
}

// Ngày cuối còn sửa được, dạng dd/mm
export function editDeadlineLabel(review) {
  const t = toMs(review?.createdAt);
  if (t === null) return '';
  const d = new Date(t + REVIEW_EDIT_DAYS * DAY_MS);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// "Nguyễn Thị Lan" -> "Lan N." để hiện công khai trên trang chủ
export function shortPublicName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Khách hàng';
  if (parts.length === 1) return parts[0];
  return `${parts[parts.length - 1]} ${parts[0].charAt(0).toUpperCase()}.`;
}

/**
 * Kiểm tra nội dung khách gửi. Trả về { ok, value } hoặc { ok: false, error }.
 */
export function sanitizeReviewInput(input = {}) {
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: 'Vui lòng chọn từ 1 đến 5 sao.' };
  const tags = Array.isArray(input.tags) ? [...new Set(input.tags.filter((t) => REVIEW_TAGS.includes(t)))] : [];
  const comment = typeof input.comment === 'string' ? input.comment.trim() : '';
  if (comment.length > REVIEW_COMMENT_MAX) return { ok: false, error: `Nhận xét tối đa ${REVIEW_COMMENT_MAX} ký tự.` };
  return { ok: true, value: { rating, tags, comment, allowPublic: Boolean(input.allowPublic) } };
}
