import { pushAuthHeaders } from './pushNotificationService';

export function getGuestChatKey() {
  const name = 'mvn_live_chat_key';
  const saved = localStorage.getItem(name);
  if (/^[a-f0-9]{64}$/.test(saved || '')) return saved;
  const key = Array.from(crypto.getRandomValues(new Uint8Array(32)),
    (byte) => byte.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(name, key);
  return key;
}

export async function requestLiveChat({ guestKey, threadId, message, signal }) {
  const action = guestKey ? 'live-chat' : 'live-chat-inbox';
  const query = threadId ? `?thread=${encodeURIComponent(threadId)}` : '';
  const access = guestKey ? { 'X-Chat-Key': guestKey } : await pushAuthHeaders();
  const response = await fetch(`/api/marketing/${action}${query}`, {
    method: message ? 'POST' : 'GET',
    signal,
    headers: { 'Content-Type': 'application/json', ...access },
    body: message ? JSON.stringify(message) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Không kết nối được với chat trực tuyến.');
  return data;
}