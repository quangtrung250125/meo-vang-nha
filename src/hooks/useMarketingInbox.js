import { useCallback, useEffect, useState } from 'react';
import { fetchMarketingInbox } from '../services/marketingApi';

const REFRESH_MS = 60000;
const seenKey = (userId) => `mvn-inbox-seen:${userId}`;
const readSeen = (userId) => {
  try {
    return localStorage.getItem(seenKey(userId)) || '';
  } catch {
    return '';
  }
};

/**
 * Tin Admin gửi cho khách qua Marketing tự động (Web Push), lưu trên máy chủ nên thiết bị nào cũng xem lại được.
 * Tin mới hơn lần mở chuông gần nhất được tính là chưa xem.
 */
export default function useMarketingInbox(userId) {
  const [messages, setMessages] = useState([]);
  const [seenAt, setSeenAt] = useState(() => (userId ? readSeen(userId) : ''));

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetchMarketingInbox();
      setMessages(res.messages || []);
    } catch {
      // chưa đăng nhập / mất mạng: giữ danh sách cũ
    }
  }, [userId]);

  useEffect(() => {
    setSeenAt(userId ? readSeen(userId) : '');
    if (!userId) {
      setMessages([]);
      return undefined;
    }
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    const onFocus = () => refresh();
    const onSwMessage = (e) => { if (e.data?.type === 'mvn-push-received') refresh(); };
    window.addEventListener('focus', onFocus);
    navigator.serviceWorker?.addEventListener?.('message', onSwMessage);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      navigator.serviceWorker?.removeEventListener?.('message', onSwMessage);
    };
  }, [userId, refresh]);

  const markAllSeen = useCallback(() => {
    if (!userId || !messages.length) return;
    const latest = messages[0].createdAt;
    if (!latest || latest <= seenAt) return;
    setSeenAt(latest);
    try {
      localStorage.setItem(seenKey(userId), latest);
    } catch {
      // bỏ qua
    }
  }, [userId, messages, seenAt]);

  const isUnread = useCallback((m) => Boolean(m.createdAt && m.createdAt > seenAt && !m.clickedAt), [seenAt]);

  return { messages, isUnread, markAllSeen, refresh };
}
