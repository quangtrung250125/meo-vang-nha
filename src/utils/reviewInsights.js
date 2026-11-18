import { REVIEW_TAGS } from './bookingReview.js';
const DAY = 24 * 60 * 60 * 1000;
export const needsReviewAttention = review => review.rating <= 2 && !review.reply?.trim();
export const approvedPublicReviews = reviews => reviews.filter(r => r.published && r.publicConsent);
export const showSampleReviews = approved => approved.length < 3;
const monthNumber = value => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'numeric' }).formatToParts(date);
  return Number(parts.find(p => p.type === 'year').value) * 12 + Number(parts.find(p => p.type === 'month').value) - 1;
};
export function reviewInsights(reviews, now = new Date()) {
  const valid = reviews.filter(r => Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
  const total = valid.length;
  const replied = valid.filter(r => r.reply?.trim()).length;
  const currentMonth = monthNumber(now);
  return {
    total, replied, average: total ? valid.reduce((sum,r) => sum + r.rating,0) / total : null,
    replyRate: total ? Math.round(replied / total * 100) : 0,
    urgent: valid.filter(needsReviewAttention),
    distribution: [5,4,3,2,1].map(stars => ({ stars, count: valid.filter(r => r.rating === stars).length })),
    months: Array.from({length:6}, (_,index) => {
      const month = currentMonth - 5 + index;
      const entries = valid.filter(r => monthNumber(r.createdAt) === month);
      return { key: month, label: String(month % 12 + 1).padStart(2,'0') + '/' + Math.floor(month / 12), count: entries.length, average: entries.length ? entries.reduce((sum,r)=>sum+r.rating,0)/entries.length : null };
    }),
    topics: REVIEW_TAGS.map(tag => {
      const entries = valid.filter(r => r.tags?.includes(tag));
      return { tag, total: entries.length, positive: entries.filter(r=>r.rating>=4).length, negative: entries.filter(r=>r.rating<=2).length, neutral: entries.filter(r=>r.rating===3).length };
    }),
  };
}
export function reviewNotifications(reviews, { isAdmin, userId, now = Date.now(), reviewsPath = '/admin/reviews', bookingsPath = '/my-booking' }) {
  const recent = value => { const age = now - Date.parse(value); return age >= 0 && age < DAY; };
  return reviews.flatMap(r => {
    if (isAdmin && recent(r.createdAt)) return [{ key: 'review-received-' + r.bookingCode + '-' + r.createdAt, bookingId: r.bookingCode, title: (r.authorName || 'Khách hàng') + ' đánh giá ' + r.rating + '★ đơn #' + r.bookingCode, desc: r.comment || 'Khách vừa gửi đánh giá kỳ lưu trú.', time: r.createdAt, path: reviewsPath + '?focus=' + encodeURIComponent(r.bookingCode), kind:'received' }];
    if (!isAdmin && r.customerId === userId && r.reply && recent(r.replyAt)) return [{ key:'review-reply-' + r.bookingCode + '-' + r.replyAt, bookingId:r.bookingCode, title:'Mèo Vắng Nhà đã trả lời đánh giá của bạn', desc:r.reply, time:r.replyAt, path:bookingsPath + '?code=' + encodeURIComponent(r.bookingCode), kind:'reply', reminder:true }];
    return [];
  });
}
