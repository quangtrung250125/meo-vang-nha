import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCustomerProfile } from '../contexts/CustomerContext';
import { ensurePushSubscription, isPushNotificationSupported, subscribeToPush } from '../services/pushNotificationService';
import { runMarketingNow } from '../services/marketingApi';

const DISMISS_KEY = 'mvn-push-prompt-dismissed-at';
const DISMISS_DAYS = 7;
const ADMIN_RUN_MS = 10 * 60 * 1000;

const dismissedRecently = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY)) || 0;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

/**
 * Cầu nối thông báo đẩy:
 * - Khách đã đăng nhập: gắn thiết bị đã cho phép thông báo với tài khoản, và mời bật thông báo nếu chưa bật.
 * - Admin: trong lúc trang Admin mở, cứ 10 phút nhờ máy chủ chạy các kịch bản Marketing tự động.
 */
const PushBridge = () => {
  const { authenticatedCustomer, authLoading, isAdmin } = useCustomerProfile();
  const customerId = !isAdmin ? authenticatedCustomer?.id : null;
  const [showPrompt, setShowPrompt] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading || !customerId || !isPushNotificationSupported()) {
      setShowPrompt(false);
      return undefined;
    }
    if (Notification.permission === 'granted') {
      ensurePushSubscription(customerId);
      setShowPrompt(false);
      return undefined;
    }
    if (Notification.permission === 'default' && !dismissedRecently()) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [authLoading, customerId]);

  useEffect(() => {
    if (authLoading || !isAdmin) return undefined;
    const run = () => runMarketingNow().catch(() => {});
    const first = setTimeout(run, 20000);
    const timer = setInterval(run, ADMIN_RUN_MS);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [authLoading, isAdmin]);

  if (!showPrompt) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* bỏ qua */ }
    setShowPrompt(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      await subscribeToPush(customerId);
      toast.success('Đã bật thông báo! Mèo Vắng Nhà sẽ nhắc lịch và gửi cập nhật của bé tới thiết bị này.', { icon: '🔔', duration: 5000 });
      setShowPrompt(false);
    } catch (err) {
      toast.error(err.message || 'Không bật được thông báo.');
      dismiss();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-4 right-24 sm:right-auto sm:max-w-sm z-50 bg-white border border-orange-200 shadow-xl rounded-2xl p-4 flex gap-3" data-testid="push-prompt">
      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
        <Bell className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">Bật thông báo từ Mèo Vắng Nhà?</p>
        <p className="text-xs text-gray-500 mt-0.5">Nhận nhắc lịch gửi mèo, cập nhật của bé và ưu đãi ngay trên điện thoại / máy tính, kể cả khi đã đóng web.</p>
        <div className="flex gap-2 mt-3">
          <button onClick={enable} disabled={busy} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-60">
            {busy ? 'Đang bật...' : 'Bật thông báo'}
          </button>
          <button onClick={dismiss} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 text-xs font-bold rounded-lg cursor-pointer">Để sau</button>
        </div>
      </div>
      <button onClick={dismiss} className="p-1 h-fit text-gray-300 hover:text-gray-500 cursor-pointer" aria-label="Đóng"><X className="h-4 w-4" /></button>
    </div>
  );
};

export default PushBridge;
