/* ============================================================
   Mèo Vắng Nhà — Service Worker & Web Push Engine
   Xử lý Push Notifications ngay cả khi khách không mở web/tab
   Hỗ trợ máy tính, điện thoại Android & iOS PWA
   ============================================================ */

const CACHE_NAME = 'meo-vang-nha-v2';
const APP_ICON = '/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png';
const APP_BADGE = '/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png';

// ── Cài đặt SW ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Dọn cache cũ nếu cần
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        )
      ),
    ])
  );
});

// ── Nhận Push Event từ server ────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'Mèo Vắng Nhà 🐾',
    body: 'Bạn có thông báo mới từ khách sạn mèo!',
    icon: APP_ICON,
    badge: APP_BADGE,
    url: '/booking',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || APP_ICON,
    badge: data.badge || APP_BADGE,
    image: data.image || undefined,
    data: {
      url: data.url || data.data?.url || '/booking',
      messageId: data.data?.messageId || null,
      timestamp: Date.now(),
    },
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || `meo-vang-nha-${Date.now()}`,
    renotify: true,
    actions: data.actions || [
      { action: 'open', title: 'Xem chi tiết 🐱' },
      { action: 'close', title: 'Bỏ qua' },
    ],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'Mèo Vắng Nhà 🐾', notificationOptions),
      trackMarketing(notificationOptions.data.messageId, 'shown'),
    ])
  );
});

// Báo server khách đã thấy / đã bấm tin Marketing (để tab Kết quả đếm lượt mở, lượt bấm)
function trackMarketing(messageId, event) {
  if (!messageId) return Promise.resolve();
  return fetch('/api/marketing/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, event }),
    keepalive: true,
  }).catch(() => {});
}

// Mở đúng trang của khách khi bấm thông báo: dùng lại tab web đang mở nếu có, không thì mở tab mới
function openNotificationTarget(rawUrl) {
  const urlToOpen = new URL(rawUrl || '/', self.location.origin).href;
  return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    for (const client of windowClients) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        const navigated = 'navigate' in client ? client.navigate(urlToOpen).catch(() => null) : Promise.resolve(null);
        // Tab chưa do Service Worker quản lý thì không chuyển trang được: mở tab mới
        return navigated.then((c) => (c ? c.focus() : clients.openWindow(urlToOpen)));
      }
    }
    if (clients.openWindow) return clients.openWindow(urlToOpen);
    return null;
  });
}
self.openNotificationTarget = openNotificationTarget;

// ── Click vào thông báo ──────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const data = event.notification.data || {};
  event.waitUntil(
    Promise.all([
      openNotificationTarget(data.url || '/booking'),
      trackMarketing(data.messageId, 'click'),
    ])
  );
});

// ── Nhận message từ trang web (manual test / sync) ───────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, url, tag, requireInteraction } = event.data.payload || {};
    self.registration.showNotification(title || 'Mèo Vắng Nhà 🐾', {
      body: body || 'Thông báo từ Mèo Vắng Nhà',
      icon: icon || APP_ICON,
      badge: APP_BADGE,
      data: { url: url || '/booking' },
      vibrate: [200, 100, 200],
      tag: tag || 'meo-vang-nha',
      requireInteraction: requireInteraction || false,
    });
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
