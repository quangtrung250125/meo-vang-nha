import webpush from 'web-push';
import { getSubscriptionsByUserId, deleteSubscriptionByEndpoint, getAllSubscriptions } from './db.js';

// Đọc VAPID keys từ biến môi trường
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || 'BIFjndgx1UmNHma3w9XK_jqJiFqnn8ggjuVC2SGu_OSkq6LsMmbs2iIYDQdOfcT3sWinLcWmKHUrxxJAnRsSdsc';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'ZtkZal8alBdQ-b3ZGBn9KVYbhM9Fm2FRXYKTZhRyaJ0';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@meovangnha.com';

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (e) {
  console.error('[WebPush] Lỗi thiết lập VAPID details:', e.message);
}

/**
 * Gửi push notification đến 1 subscription cụ thể
 */
export async function sendPushToSubscription(sub, payload) {
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

    // Xóa subscription nếu đã hết hạn hoặc không còn tồn tại trên Push Service
    if (statusCode === 404 || statusCode === 410) {
      console.log(`[WebPush] Xóa subscription hết hạn (${statusCode}):`, sub.endpoint);
      await deleteSubscriptionByEndpoint(sub.endpoint);
    }

    return { success: false, endpoint: sub.endpoint, statusCode, error: error.message };
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

export { vapidPublicKey };
