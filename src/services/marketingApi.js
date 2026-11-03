// Gọi API Marketing tự động (/api/marketing/*) kèm token đăng nhập của Admin
import { pushAuthHeaders } from './pushNotificationService';

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api/marketing/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await pushAuthHeaders()) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Lỗi máy chủ (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const fetchMarketingSettings = () => call('settings');
export const saveMarketingSettings = (config) => call('settings', { method: 'PUT', body: config });
export const fetchMarketingMessages = (days = 120) => call(`messages?days=${days}`);
export const fetchMarketingAudience = () => call('audience');
export const sendMarketingMessages = (messages, source = 'manual') => call('send', { method: 'POST', body: { messages, source } });
export const runMarketingNow = () => call('run', { method: 'POST' });

// Khách đang đặt phòng dở (cho kịch bản "Bỏ dở đặt phòng"); không chặn luồng đặt phòng nếu lỗi
export async function trackBookingDraft(event, { step, phone } = {}) {
  try {
    const headers = await pushAuthHeaders();
    if (!headers.Authorization) return;
    await fetch('/api/marketing/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ event, step, phone }),
      keepalive: true,
    });
  } catch {
    // bỏ qua
  }
}

// Tóm tắt kết quả gửi cho thông báo trên màn hình
export const describeSendResults = (results = []) => {
  const count = (s) => results.filter((r) => r.status === s).length;
  const parts = [];
  if (count('sent')) parts.push(`${count('sent')} khách đã nhận`);
  if (count('no_device')) parts.push(`${count('no_device')} khách chưa bật thông báo`);
  if (count('limited')) parts.push(`${count('limited')} khách vướng giới hạn tần suất`);
  if (count('duplicate')) parts.push(`${count('duplicate')} tin đã gửi trước đó`);
  if (count('failed')) parts.push(`${count('failed')} khách gửi lỗi`);
  if (count('deferred')) parts.push(`${count('deferred')} tin dời lại vì giờ yên lặng`);
  return parts.join(', ') || 'Không có tin nào được gửi';
};
