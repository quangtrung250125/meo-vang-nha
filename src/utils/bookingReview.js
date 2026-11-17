import { BOOKING_STATUS, normalizeStatusValue } from './bookingStatus.js';
export const REVIEW_TAGS = ['Chăm sóc tận tâm', 'Phòng sạch sẽ', 'Nhân viên thân thiện', 'Nhật ký & ảnh đầy đủ', 'Giá hợp lý', 'Cần cải thiện'];
export const REVIEW_EDIT_MS = 7 * 24 * 60 * 60 * 1000;
export const isReviewEligible = b => Boolean(b) && normalizeStatusValue(b.status) === BOOKING_STATUS.COMPLETED;
export const canEditReview = (review, now = Date.now()) => !review || (Number.isFinite(Date.parse(review.createdAt)) && now >= Date.parse(review.createdAt) && now < Date.parse(review.createdAt) + REVIEW_EDIT_MS);
export const reviewUrl = b => (b.isDemo ? '/review-demo?review=' : '/my-booking?review=') + encodeURIComponent(b.code || b.id);
export function validateReview(input) {
 if (!Number.isInteger(input?.rating) || input.rating < 1 || input.rating > 5) throw Object.assign(new Error('Vui lòng chọn từ 1 đến 5 sao.'), { status: 400 });
 if (typeof input.comment !== 'string' || input.comment.length > 1000) throw Object.assign(new Error('Nhận xét tối đa 1000 ký tự.'), { status: 400 });
 if (!Array.isArray(input.tags) || input.tags.some(t => !REVIEW_TAGS.includes(t))) throw Object.assign(new Error('Nhãn nhận xét không hợp lệ.'), { status: 400 });
 if (typeof input.publicConsent !== 'boolean') throw Object.assign(new Error('Vui lòng kiểm tra lựa chọn hiển thị công khai.'), { status: 400 });
 return { rating: input.rating, comment: input.comment.trim(), tags: [...new Set(input.tags)], publicConsent: input.publicConsent };
}
export function publicReview(review) {
 const names = (review.authorName || 'Khách hàng').trim().split(/\s+/);
 return { rating: review.rating, comment: review.comment, tags: review.tags, authorName: names.map((n,i) => i === names.length-1 ? n : n[0]+'.').join(' '), petNames: review.petNames, createdAt: review.createdAt, reply: review.reply || '' };
}
