import { sendPushToUser } from './pushService.js';
async function send(userId, payload) {
  if (!userId || !process.env.VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY === 'REPLACE_ME') return { success:false, reason:'not_configured' };
  return sendPushToUser(userId, payload);
}
export const notifyReviewReply = review => send(review.customerId, {
  title:'Mèo Vắng Nhà đã trả lời đánh giá của bạn', body:review.reply,
  url:'/my-booking?code=' + encodeURIComponent(review.bookingCode), tag:'review-reply-' + review.bookingCode,
});
export const notifyReviewInvitation = booking => send(booking.customerId || booking.customer_id || booking.customerPhone || booking.ownerPhone, {
  title:'Mời bạn đánh giá kỳ nghỉ của bé!',
  body:'Bé ' + (booking.catNames || booking.petProfiles?.map(p=>p.name).join(', ') || 'mèo cưng') + ' đã hoàn tất kỳ lưu trú. Chia sẻ trải nghiệm với Mèo Vắng Nhà nhé!',
  url:'/my-booking?review=' + encodeURIComponent(booking.code || booking.id), tag:'booking-completed-' + (booking.code || booking.id),
});
