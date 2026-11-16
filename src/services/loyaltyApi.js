// Gọi API Khuyến mãi & Điểm thưởng (/api/marketing/loyalty?op=...) kèm token đăng nhập
import { pushAuthHeaders } from './pushNotificationService';

async function call(op, { method = 'GET', body } = {}) {
  const res = await fetch(`/api/marketing/loyalty?op=${encodeURIComponent(op)}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await pushAuthHeaders()) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !(op === 'claim-referral' && data && data.message)) {
    const err = new Error(data.error || data.message || `Lỗi máy chủ (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const fetchLoyaltyPublic = () => call('public');
export const fetchMyLoyalty = () => call('me');
export const quoteLoyaltyPromo = ({ booking, voucherCode, pointsToUse }) =>
  call('quote', { method: 'POST', body: { booking, voucherCode, pointsToUse } });
export async function checkReferralCode(code) {
  const res = await fetch(`/api/marketing/loyalty?op=check-referral&code=${encodeURIComponent(code)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error('Chưa kiểm tra được mã giới thiệu, vui lòng thử lại.');
  return data;
}
export const claimReferralCode = (code) => call('claim-referral', { method: 'POST', body: { code } });

// Admin
export const fetchLoyaltyAdmin = () => call('admin');
export const saveLoyaltyConfig = (partial) => call('config', { method: 'PUT', body: partial });
export const adjustCustomerPoints = ({ customerId, delta, reason }) =>
  call('adjust', { method: 'POST', body: { customerId, delta, reason } });

// Mã giới thiệu đến từ đường link chia sẻ (?ref=MÃ): nhớ lại để điền sẵn khi khách tạo tài khoản
const REF_KEY = 'mvn_referral_code';
export function rememberReferralFromUrl() {
  try {
    const code = new URLSearchParams(window.location.search).get('ref');
    if (code) localStorage.setItem(REF_KEY, code.trim().toUpperCase().slice(0, 20));
  } catch {
    // bỏ qua
  }
}
export function getRememberedReferral() {
  try {
    return localStorage.getItem(REF_KEY) || '';
  } catch {
    return '';
  }
}
export function clearRememberedReferral() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    // bỏ qua
  }
}
