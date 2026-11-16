import { useCallback, useEffect, useState } from 'react';
import { fetchMyReviews, REVIEWS_CHANGED_EVENT } from '../services/reviewsApi';

const REFRESH_MS = 60000;

/**
 * Đánh giá sau check-out: admin nhận mọi đánh giá, khách nhận đánh giá của mình.
 * Tải lại khi quay lại tab, mỗi phút, và ngay khi có đánh giá vừa gửi / trả lời.
 */
export default function useReviews(enabled = true) {
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetchMyReviews();
      setReviews(res.reviews || []);
      setError('');
    } catch (e) {
      setError(e.message || 'Không tải được đánh giá');
    } finally {
      setLoaded(true);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setReviews([]);
      return undefined;
    }
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener('focus', refresh);
    window.addEventListener(REVIEWS_CHANGED_EVENT, refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(REVIEWS_CHANGED_EVENT, refresh);
    };
  }, [enabled, refresh]);

  return { reviews, loaded, error, refresh };
}
