import webpush from 'web-push';
import { getSubscriptionsByUserId, getSubscriptionsByUserIds, deleteSubscriptionByEndpoint, getAllSubscriptions } from './db.js';

// Đọc VAPID keys từ biến môi trường (Vercel > Settings > Environment Variables).
// Không ghi khóa bí mật vào code: tạo cặp khóa bằng `node scripts/generate-vapid.js`.
const clean = (v) => (v && v !== 'REPLACE_ME' ? String(v).trim() : '');
const vapidPublicKey = clean(process.env.VAPID_PUBLIC_KEY) || clean(process.env.VITE_VAPID_PUBLIC_KEY);
const vapidPrivateKey = clean(process.env.VAPID_PRIVATE_KEY);
const vapidSubject = clean(process.env.VAPID_SUBJECT) || 'mailto:contact@meovangnha.com';

let vapidReady = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    vapidReady = true;
  } catch (e) {
    console.error('[WebPush] Lỗi thiết lập VAPID details:', e.message);
  }
} else {
  console.warn('[WebPush] Chưa đặt VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY: chưa gửi được thông báo đẩy.');
}

export const isPushConfigured = () => vapidReady;

export const PUSH_NOT_CONFIGURED = 'Máy chủ chưa cấu hình khóa Web Push (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).';

/**
 * Gửi push notification đến 1 subscription cụ thể
 */
export async function sendPushToSubscription(sub, payload) {
  if (!vapidReady) return { success: false, endpoint: sub.endpoint, error: PUSH_NOT_CONFIGURED };
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  const notificationPayload = JSON.stringify({
    title: payload.title || 'Mèo Vắng Nhà 🐾',
    body: payload.body || 'Bạn có thông báo mới!',
    icon: payload.icon || '/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png',
    badge: payload.badge || '/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png',
    url: payload.url || '/',
    tag: payload.tag || `mvn-${Date.now()}`,
    data: {
      url: payload.url || '/',
      timestamp: Date.now(),
      ...(payload.data || {}),
    },
  });

  try {
    const result = await webpush.sendNotification(pushSubscription, notificationPayload, {
      TTL: payload.ttl || 86400, // 24 giờ
      urgency: 'high',
    });
    return { success: true, endpoint: sub.endpoint, statusCode: result.statusCode };
  } catch (error) {
    const statusCode = error.statusCode;
    console.warn(`[WebPush] Thất bại khi gửi tới endpoint (${statusCode}):`, error.message);

    // Xóa subscription nếu đã hết hạn / không còn tồn tại, hoặc được tạo bằng khóa VAPID khác
    // (FCM: "...does not correspond to the sender ID...", Apple: VapidPkHashMismatch). Khách mở lại web sẽ tự đăng ký lại.
    const body = String(error.body || '');
    const staleKey = (statusCode === 400 || statusCode === 401 || statusCode === 403) && /correspond|VapidPkHashMismatch|mismatch/i.test(body);
    if (statusCode === 404 || statusCode === 410 || staleKey) {
      console.log(`[WebPush] Xóa subscription không dùng được (${statusCode}):`, sub.endpoint);
      await deleteSubscriptionByEndpoint(sub.endpoint);
    }

    return { success: false, endpoint: sub.endpoint, statusCode, staleRemoved: staleKey, error: `${error.message}${body ? `: ${body.slice(0, 200)}` : ''}` };
  }
}

/**
 * Gửi push notification đến tất cả thiết bị của một User
 */
export async function sendPushToUser(userId, payload) {
  const subscriptions = await getSubscriptionsByUserId(userId);

  if (!subscriptions || subscriptions.length === 0) {
    return {
      success: false,
      message: `Người dùng ${userId} chưa đăng ký nhận thông báo đẩy trên bất kỳ thiết bị nào.`,
      sentCount: 0,
      totalTargets: 0,
    };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushToSubscription(sub, payload))
  );

  const successful = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;

  return {
    success: successful > 0,
    sentCount: successful,
    totalTargets: subscriptions.length,
    details: results.map((r) => (r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })),
  };
}

/**
 * Gửi thông báo đến tất cả các thiết bị đã đăng ký
 */
export async function broadcastPush(payload) {
  const subscriptions = await getAllSubscriptions();
  if (subscriptions.length === 0) {
    return { success: false, sentCount: 0, totalTargets: 0 };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushToSubscription(sub, payload))
  );

  const successful = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;

  return {
    success: successful > 0,
    sentCount: successful,
    totalTargets: subscriptions.length,
  };
}

/**
 * Gửi tới mọi thiết bị đăng ký dưới bất kỳ mã nào của khách (mã tài khoản, số điện thoại)
 */
export async function sendPushToUserIds(userIds = [], payload) {
  const subscriptions = await getSubscriptionsByUserIds(userIds);
  if (subscriptions.length === 0) return { success: false, sentCount: 0, totalTargets: 0 };
  const results = await Promise.allSettled(subscriptions.map((sub) => sendPushToSubscription(sub, payload)));
  const ok = results.filter((r) => r.status === 'fulfilled' && r.value.success);
  const firstFail = results.map((r) => (r.status === 'fulfilled' ? r.value : { error: r.reason?.message })).find((v) => v && !v.success);
  return {
    success: ok.length > 0,
    sentCount: ok.length,
    totalTargets: subscriptions.length,
    error: ok.length ? null : firstFail?.error,
    statusCode: ok.length ? null : firstFail?.statusCode,
    staleRemoved: !ok.length && Boolean(firstFail?.staleRemoved),
  };
}

export { vapidPublicKey };
