import { getRequestUser, getBearerToken } from './auth.js';
import { findCheckedOutBookingForUser } from './bookingsService.js';
import { listReviews, listReviewsForCustomer, listPublicReviews, getReviewByBooking, saveReview, isReviewsDbReady } from './reviewsDb.js';
import { isPushConfigured, sendPushToUserIds } from './pushService.js';
import { sanitizeReviewInput, isWithinReviewWindow, canEditReview, shortPublicName, REVIEW_WINDOW_DAYS, REVIEW_EDIT_DAYS } from '../../src/utils/reviewRules.js';

// API đánh giá sau check-out, nằm trong hàm /api/marketing/[action] (gói Vercel Hobby giới hạn 12 hàm):
// GET  /api/marketing/reviews?scope=public  -> đánh giá admin đã duyệt hiển thị (không cần đăng nhập)
// GET  /api/marketing/reviews               -> admin: mọi đánh giá; khách: đánh giá của mình
// POST /api/marketing/reviews               -> khách gửi / sửa đánh giá cho đơn đã check-out
// PUT  /api/marketing/reviews               -> admin trả lời / duyệt hiển thị

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Bản công khai: không có mã khách, tên rút gọn
const toPublic = (r) => ({
  id: r.id,
  name: shortPublicName(r.customerName),
  petNames: r.petNames,
  roomName: r.roomName,
  rating: r.rating,
  tags: r.tags,
  comment: r.comment,
  adminReply: r.adminReply,
  createdAt: r.createdAt,
});

async function handleList(req, res) {
  if (req.query?.scope === 'public' || /[?&]scope=public/.test(req.url || '')) {
    const list = await listPublicReviews(12);
    return res.status(200).json({ reviews: list.map(toPublic) });
  }
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Cần đăng nhập để xem đánh giá.' });
  const reviews = user.isAdmin ? await listReviews() : await listReviewsForCustomer(user.id);
  return res.status(200).json({ reviews, dbReady: isReviewsDbReady() });
}

async function handleSubmit(req, res) {
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Vui lòng đăng nhập để đánh giá.' });
  if (user.isAdmin) return res.status(403).json({ error: 'Tài khoản quản trị không gửi đánh giá.' });

  const body = req.body || {};
  const bookingCode = text(body.bookingCode, 40);
  if (!bookingCode) return res.status(400).json({ error: 'Thiếu mã đơn.' });
  const input = sanitizeReviewInput(body);
  if (!input.ok) return res.status(400).json({ error: input.error });

  const booking = await findCheckedOutBookingForUser(bookingCode, user, getBearerToken(req));
  if (!booking) return res.status(403).json({ error: 'Chỉ đánh giá được đơn của bạn sau khi đã check-out.' });

  const existing = await getReviewByBooking(bookingCode);
  if (existing) {
    if (existing.customerId !== user.id) return res.status(403).json({ error: 'Đơn này đã được đánh giá.' });
    if (!canEditReview(existing)) return res.status(409).json({ error: `Đánh giá chỉ sửa được trong ${REVIEW_EDIT_DAYS} ngày sau khi gửi.` });
  } else if (!isWithinReviewWindow(booking.checkedOutAt)) {
    return res.status(409).json({ error: `Đã quá ${REVIEW_WINDOW_DAYS} ngày sau check-out, không thể đánh giá đơn này nữa.` });
  }

  const review = await saveReview({
    ...existing,
    bookingCode,
    customerId: user.id,
    customerName: existing?.customerName || text(body.customerName, 80) || user.fullName || '',
    petNames: text(body.petNames, 120) || existing?.petNames || '',
    roomName: text(body.roomName, 60) || existing?.roomName || '',
    checkedOutAt: booking.checkedOutAt || existing?.checkedOutAt || null,
    ...input.value,
    // Khách bỏ đồng ý thì gỡ khỏi trang chủ; sửa nội dung thì admin duyệt lại
    isPublic: Boolean(existing?.isPublic && input.value.allowPublic
      && existing.comment === input.value.comment && existing.rating === input.value.rating),
  });
  return res.status(existing ? 200 : 201).json({ review, dbReady: isReviewsDbReady() });
}

async function handleAdminUpdate(req, res) {
  const user = await getRequestUser(req);
  if (!user?.isAdmin) return res.status(403).json({ error: 'Chỉ quản trị viên được trả lời / duyệt đánh giá.' });
  const body = req.body || {};
  const existing = await getReviewByBooking(text(body.bookingCode, 40));
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy đánh giá.' });

  const next = { ...existing };
  let newReply = false;
  if (typeof body.adminReply === 'string') {
    const reply = text(body.adminReply, 1000);
    newReply = Boolean(reply) && reply !== existing.adminReply;
    next.adminReply = reply;
    next.repliedAt = reply ? new Date().toISOString() : null;
  }
  if (typeof body.isPublic === 'boolean') {
    if (body.isPublic && !existing.allowPublic) return res.status(400).json({ error: 'Khách chưa đồng ý hiển thị đánh giá này công khai.' });
    next.isPublic = body.isPublic;
  }
  const review = await saveReview(next);

  let push = null;
  if (newReply && isPushConfigured()) {
    push = await sendPushToUserIds([review.customerId], {
      title: '💬 Mèo Vắng Nhà đã trả lời đánh giá của bạn',
      body: review.adminReply.slice(0, 140),
      url: `/my-booking?review=${encodeURIComponent(review.bookingCode)}`,
      tag: `review-reply-${review.bookingCode}`,
      data: { bookingCode: review.bookingCode },
    }).catch(() => null);
  }
  return res.status(200).json({ review, pushSent: Boolean(push?.success) });
}

export async function handleReviews(req, res) {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleSubmit(req, res);
  if (req.method === 'PUT') return handleAdminUpdate(req, res);
  return res.status(405).json({ error: 'Phương thức không hỗ trợ.' });
}
