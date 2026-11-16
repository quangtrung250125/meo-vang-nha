// Gọi API đánh giá sau check-out (/api/marketing/reviews) kèm token đăng nhập
import { pushAuthHeaders } from './pushNotificationService';

const URL = '/api/marketing/reviews';
export const REVIEWS_CHANGED_EVENT = 'mvn-reviews-changed';

async function call({ method = 'GET', body, query = '' } = {}) {
  const res = await fetch(`${URL}${query}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await pushAuthHeaders()) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Lỗi máy chủ (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const announce = () => {
  try {
    window.dispatchEvent(new Event(REVIEWS_CHANGED_EVENT));
  } catch {
    // bỏ qua
  }
};

export const fetchMyReviews = () => call();
export const fetchPublicReviews = () => call({ query: '?scope=public' });

export async function submitReview(payload) {
  const data = await call({ method: 'POST', body: payload });
  announce();
  return data;
}

export async function updateReviewAsAdmin(payload) {
  const data = await call({ method: 'PUT', body: payload });
  announce();
  return data;
}
