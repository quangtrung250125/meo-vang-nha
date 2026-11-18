import { isReviewEligible, canEditReview, validateReview, publicReview } from '../../src/utils/bookingReview.js';
export function createReviewService({ store, findBooking, notifyReply = async () => {}, now = () => new Date().toISOString() }) {
 const fail = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };
 return {
  async list(user) { if (!user) fail('Vui lòng đăng nhập.',401); return store.list(user.isAdmin ? null : user.id); },
  async published() { return (await store.published()).filter(r => r.published && r.publicConsent).map(publicReview); },
  async submit(user, code, input) {
   if (!user) fail('Vui lòng đăng nhập.',401);
   if (user.isAdmin) fail('Chỉ khách hàng đặt phòng được đánh giá.',403);
   const booking = await findBooking(code);
   if (!booking || booking.customerId !== user.id) fail('Không tìm thấy đơn của bạn.',404);
   if (!isReviewEligible(booking)) fail('Bạn chỉ có thể đánh giá sau khi check out.',409);
   const fields = validateReview(input), previous = await store.find(code), at = now();
   if (previous && (previous.customerId !== user.id || !canEditReview(previous,Date.parse(at)))) fail('Đã hết thời hạn sửa đánh giá 7 ngày.',409);
   const review = { ...previous, ...fields, bookingCode: code, customerId: user.id,
    authorName: user.fullName || booking.ownerName || 'Khách hàng',
    petNames: booking.petProfiles?.map(p=>p.name).join(', ') || booking.catNames || 'Bé mèo',
    roomName: booking.selectedRoom?.name || booking.roomId || '',
    createdAt: previous?.createdAt || at, updatedAt: at, ...(previous ? { editedAt:at } : {}), published: false,
   };
   await store.save(review,previous); return review;
  },
  async moderate(user, code, input) {
   if (!user) fail('Vui lòng đăng nhập.',401);
   if (!user.isAdmin) fail('Chỉ quản trị viên được xử lý đánh giá.',403);
   const previous = await store.find(code); if (!previous) fail('Không tìm thấy đánh giá.',404);
   const changes = {};
   if (Object.hasOwn(input,'reply')) { if (typeof input.reply !== 'string' || !input.reply.trim() || input.reply.length > 2000) fail('Phản hồi phải có nội dung, tối đa 2000 ký tự.'); changes.reply=input.reply.trim(); changes.replyAt=changes.reply === previous.reply ? previous.replyAt : now(); }
   if (Object.hasOwn(input,'published')) { if (typeof input.published !== 'boolean') fail('Trạng thái không hợp lệ.'); if(input.published && !previous.publicConsent) fail('Khách chưa đồng ý hiển thị trên trang chủ.',409); changes.published=input.published; }
   if (!Object.keys(changes).length) fail('Chưa có thay đổi.');
   const review={...previous,...changes,updatedAt:now()};
   await store.save(review,previous);
   if (changes.reply && changes.reply !== previous.reply) {
    try { await notifyReply(review); } catch (error) { console.warn('[Reviews] Reply saved; notification failed:',error.message); }
   }
   return review;
  },
 };
}
