import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Star, Send } from 'lucide-react';
import { submitReview } from '../services/reviewsApi';
import { REVIEW_TAGS, REVIEW_COMMENT_MAX, REVIEW_EDIT_DAYS } from '../utils/reviewRules';

const STAR_LABELS = ['', 'Rất tệ', 'Chưa tốt', 'Tạm ổn', 'Hài lòng', 'Tuyệt vời'];

export const bookingPetNames = (booking) =>
  (booking?.petProfiles || []).map((p) => p?.name).filter(Boolean).join(', ')
  || booking?.catNames || booking?.petName || 'mèo cưng';

export const bookingRoomName = (booking) =>
  booking?.selectedRoom?.name || booking?.roomName || booking?.roomId || '';

/**
 * Hộp đánh giá kỳ nghỉ sau check-out: số sao (bắt buộc), thẻ chọn nhanh, nhận xét, đồng ý hiện trên trang chủ.
 * `existing` có giá trị thì đang sửa đánh giá đã gửi.
 */
const ReviewModal = ({ isOpen, onClose, booking, existing, customerName }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [allowPublic, setAllowPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRating(existing?.rating || 0);
    setTags(existing?.tags || []);
    setComment(existing?.comment || '');
    setAllowPublic(existing ? Boolean(existing.allowPublic) : true);
    setHover(0);
  }, [isOpen, existing]);

  if (!isOpen || !booking) return null;

  const code = booking.code || booking.id;
  const pets = bookingPetNames(booking);
  const shown = hover || rating;

  const toggleTag = (t) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Bạn chọn số sao giúp tụi mình nhé.');
      return;
    }
    setSaving(true);
    try {
      await submitReview({
        bookingCode: code,
        rating,
        tags,
        comment,
        allowPublic,
        petNames: pets,
        roomName: bookingRoomName(booking),
        customerName,
      });
      toast.success(existing ? 'Đã cập nhật đánh giá. Cảm ơn bạn!' : 'Cảm ơn bạn đã đánh giá kỳ nghỉ của bé! 💛');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Chưa gửi được đánh giá, bạn thử lại nhé.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Đánh giá kỳ nghỉ"
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold font-title">{existing ? 'Sửa đánh giá' : 'Đánh giá kỳ nghỉ của bé'}</h3>
          <p className="text-xs text-amber-50 mt-1">Đơn #{code} • Bé {pets}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-center">
            <div className="flex justify-center gap-1.5" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-label={`${s} sao`}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star className={`w-9 h-9 ${s <= shown ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold text-amber-600 h-5 mt-1">{STAR_LABELS[shown]}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Điều bạn thấy rõ nhất</p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${on ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="review-comment" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nhận xét (không bắt buộc)
            </label>
            <textarea
              id="review-comment"
              rows={4}
              maxLength={REVIEW_COMMENT_MAX}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bé ăn ngủ thế nào, nhân viên chăm ra sao..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
            />
            <p className="text-right text-[11px] text-gray-400">{comment.length}/{REVIEW_COMMENT_MAX}</p>
          </div>

          <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={allowPublic} onChange={(e) => setAllowPublic(e.target.checked)} className="mt-0.5 w-4 h-4 accent-amber-500" />
            <span>Đồng ý cho hiển thị đánh giá trên trang chủ (chỉ hiện tên rút gọn, sau khi Mèo Vắng Nhà duyệt)</span>
          </label>

          <p className="text-xs text-gray-400">Mỗi đơn đánh giá một lần, sửa được trong {REVIEW_EDIT_DAYS} ngày sau khi gửi.</p>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">
              Để sau
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-amber-200 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              {saving ? 'Đang gửi...' : existing ? 'Lưu đánh giá' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
