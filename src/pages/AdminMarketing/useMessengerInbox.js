import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchMessengerConversations,
  fetchMessengerThread,
  sendMessengerMessage,
  linkMessengerConversation,
} from '../../services/marketingApi';

const LIST_REFRESH_MS = 15000;
const THREAD_REFRESH_MS = 8000;

/**
 * Cuộc trò chuyện Messenger của Fanpage cho Hộp thư tập trung.
 * Danh sách tự làm mới mỗi 15 giây; cuộc trò chuyện đang mở làm mới mỗi 8 giây.
 */
export default function useMessengerInbox(openPsid = null) {
  const [conversations, setConversations] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [thread, setThread] = useState({ psid: null, messages: [], loading: false });
  const openRef = useRef(openPsid);
  openRef.current = openPsid;

  const refreshList = useCallback(async () => {
    try {
      const res = await fetchMessengerConversations();
      setConversations(res.conversations || []);
      setStatus(res.status || null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadThread = useCallback(async (psid, { quiet = false } = {}) => {
    if (!psid) return;
    if (!quiet) setThread((t) => ({ psid, messages: t.psid === psid ? t.messages : [], loading: true }));
    try {
      const res = await fetchMessengerThread(psid);
      if (openRef.current !== psid) return;
      setThread({ psid, messages: res.messages || [], loading: false });
      // Đã mở thì hết "chưa đọc"
      setConversations((list) => list.map((c) => (c.psid === psid ? { ...c, ...res.conversation, unread: 0 } : c)));
    } catch {
      if (openRef.current === psid) setThread((t) => ({ ...t, loading: false }));
    }
  }, []);

  useEffect(() => {
    refreshList();
    const timer = setInterval(refreshList, LIST_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refreshList]);

  useEffect(() => {
    if (!openPsid) return undefined;
    loadThread(openPsid);
    const timer = setInterval(() => loadThread(openPsid, { quiet: true }), THREAD_REFRESH_MS);
    return () => clearInterval(timer);
  }, [openPsid, loadThread]);

  const reply = useCallback(async (psid, text) => {
    const res = await sendMessengerMessage(psid, text);
    await Promise.all([loadThread(psid, { quiet: true }), refreshList()]);
    return res;
  }, [loadThread, refreshList]);

  const link = useCallback(async (psid, customerId) => {
    const res = await linkMessengerConversation(psid, customerId);
    setConversations((list) => list.map((c) => (c.psid === psid ? { ...c, ...res.conversation } : c)));
    return res;
  }, []);

  return { conversations, status, error, thread, reply, link, refresh: refreshList };
}
