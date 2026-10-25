import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Check, X, ShieldAlert } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/notificationService';

const NotificationBar = () => {
  const [permission, setPermission] = useState('default');
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
  }, []);

  if (!isNotificationSupported() || dismissed) return null;

  const handleEnable = async () => {
    setLoading(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setLoading(false);
  };

  if (permission === 'granted') {
    return (
      <div className="mb-6 flex items-center justify-between gap-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold animate-in fade-in">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Thông báo web đang bật — Thiết bị của bạn sẽ nhận thông báo đẩy tức thì khi đặt phòng hoặc có biến động.</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-emerald-600 hover:text-emerald-900 p-1"
          aria-label="Đóng"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="mb-6 flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Thông báo đang bị tắt trên trình duyệt. Bạn có thể bật lại trong cài đặt trang web để nhận thông báo phòng về điện thoại & máy tính.</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-900 p-1"
          aria-label="Đóng"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-200/90 rounded-2xl text-orange-950 text-xs shadow-xs animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Bell className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-orange-900 text-xs sm:text-sm">Bật nhận thông báo trên điện thoại &amp; máy tính</p>
          <p className="text-orange-700 text-xs mt-0.5">
            Nhận thông báo đẩy tức thì khi đặt lịch thành công hoặc phòng vừa có khách khác đặt trước.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>{loading ? 'Đang bật...' : 'Bật thông báo ngay'}</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-orange-100/50 transition-colors"
          title="Bỏ qua"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationBar;
