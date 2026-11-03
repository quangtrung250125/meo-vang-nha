/**
 * Dịch vụ Quản lý Web Push Notification Client — Mèo Vắng Nhà
 */
import { supabase } from '../supabaseClient';

// Token đăng nhập Supabase: server chỉ cho đăng ký / gửi thông báo cho đúng tài khoản (Admin gửi được cho mọi khách)
export async function pushAuthHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
}

// Hàm chuyển đổi chuỗi VAPID Public Key Base64 thành Uint8Array cho PushManager
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Kiểm tra xem thiết bị / trình duyệt có hỗ trợ Web Push không
 */
export function isPushNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Lấy VAPID Public Key từ biến môi trường hoặc API
 */
export async function getVapidPublicKey() {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey) return envKey;

  try {
    const res = await fetch('/api/notifications/vapid-public-key');
    if (res.ok) {
      const data = await res.json();
      if (data?.publicKey) return data.publicKey;
    }
  } catch (err) {
    console.warn('[Push] Không thể lấy VAPID key từ API:', err);
  }

  throw new Error('Máy chủ chưa cấu hình khóa Web Push. Vui lòng báo Mèo Vắng Nhà.');
}

// Subscription cũ tạo bằng khóa khác (vd. sau khi đổi khóa VAPID) thì server không gửi tới được nữa
const sameKey = (subscription, keyBytes) => {
  const current = subscription?.options?.applicationServerKey;
  if (!current) return true;
  const a = new Uint8Array(current);
  return a.length === keyBytes.length && a.every((v, i) => v === keyBytes[i]);
};

/**
 * Lấy trạng thái đăng ký Push hiện tại
 */
export async function getPushSubscriptionStatus() {
  if (!isPushNotificationSupported()) {
    return {
      supported: false,
      permission: 'unsupported',
      isSubscribed: false,
      subscription: null,
    };
  }

  const permission = Notification.permission; // 'default' | 'granted' | 'denied'

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    return {
      supported: true,
      permission,
      isSubscribed: !!subscription && permission === 'granted',
      subscription,
    };
  } catch (error) {
    console.warn('[Push] Lỗi kiểm tra subscription:', error);
    return {
      supported: true,
      permission,
      isSubscribed: false,
      subscription: null,
    };
  }
}

/**
 * Đăng ký nhận Web Push Notification
 * @param {string} userId - ID hoặc số điện thoại của người dùng
 */
export async function subscribeToPush(userId) {
  if (!isPushNotificationSupported()) {
    throw new Error('Trình duyệt hoặc thiết bị của bạn không hỗ trợ Web Push Notification.');
  }

  // 1. Xin quyền nếu chưa cấp
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Bạn đã chặn quyền thông báo. Vui lòng vào Cài đặt trình duyệt để cho phép nhận thông báo từ Mèo Vắng Nhà.'
        : 'Quyền thông báo chưa được cấp.'
    );
  }

  // 2. Chờ Service Worker sẵn sàng
  const reg = await navigator.serviceWorker.ready;

  // 3. Lấy VAPID public key
  const publicKey = await getVapidPublicKey();
  const convertedVapidKey = urlBase64ToUint8Array(publicKey);

  // 4. Lấy hoặc tạo mới PushSubscription
  let subscription = await reg.pushManager.getSubscription();
  if (subscription && !sameKey(subscription, convertedVapidKey)) {
    await subscription.unsubscribe().catch(() => {});
    subscription = null;
  }
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
  }

  // 5. Gửi subscription lên backend lưu trữ
  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await pushAuthHeaders()) },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      userId: String(userId || 'anonymous'),
      userAgent: navigator.userAgent,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Máy chủ không thể lưu thông tin đăng ký thông báo.');
  }

  localStorage.setItem('mvn-webpush-subscribed', 'true');
  localStorage.setItem('mvn-webpush-user', String(userId || ''));

  return { success: true, subscription };
}

/**
 * Hủy đăng ký Web Push Notification
 */
export async function unsubscribeFromPush() {
  if (!isPushNotificationSupported()) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      // 1. Báo backend xóa
      try {
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      } catch (e) {
        console.warn('[Push] Lỗi gọi API unsubscribe:', e);
      }

      // 2. Hủy subscription phía client
      await subscription.unsubscribe();
    }

    localStorage.removeItem('mvn-webpush-subscribed');
    return true;
  } catch (err) {
    console.error('[Push] Lỗi khi hủy đăng ký:', err);
    throw err;
  }
}

/**
 * Gửi thông báo từ Server tới người dùng cụ thể
 */
export async function sendServerPush({ userId, title, body, url, icon, badge, tag, data }) {
  const response = await fetch('/api/notifications/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await pushAuthHeaders()) },
    body: JSON.stringify({
      userId: String(userId),
      title,
      body,
      url,
      icon,
      badge,
      tag,
      data,
    }),
  });

  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(resData.error || 'Lỗi khi gửi thông báo từ server.');
  }

  return resData;
}

/**
 * Gửi thông báo đẩy thử nghiệm thực tế từ Server tới thiết bị
 */
export async function testServerPushNotification(userId = 'demo', petName = 'Mimi') {
  return sendServerPush({
    userId,
    title: '🐱 Mèo Vắng Nhà — Cập nhật tình trạng',
    body: `Bé ${petName} đã được nhân viên cập nhật tình trạng: Bé đang ăn uống bình thường và vui vẻ!`,
    url: '/tracking',
    tag: `test-push-${Date.now()}`,
    data: {
      action: 'view_pet',
      petName,
    },
  });
}

/**
 * Khách đã cho phép thông báo từ trước: lặng lẽ gắn thiết bị này với tài khoản đang đăng nhập
 * (và tạo lại subscription nếu khóa máy chủ đã đổi). Không hỏi quyền.
 */
export async function ensurePushSubscription(userId) {
  if (!userId || !isPushNotificationSupported() || Notification.permission !== 'granted') return false;
  const key = `mvn-webpush-synced:${userId}`;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const publicKey = await getVapidPublicKey();
    const fresh = existing && sameKey(existing, urlBase64ToUint8Array(publicKey));
    if (fresh && sessionStorage.getItem(key) === existing.endpoint) return true;
    const { subscription } = await subscribeToPush(userId);
    sessionStorage.setItem(key, subscription.endpoint);
    return true;
  } catch (err) {
    console.warn('[Push] Không đồng bộ được thiết bị nhận thông báo:', err?.message || err);
    return false;
  }
}
