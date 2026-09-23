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
    self.registration.showNotification(data.title || 'Mèo Vắng Nhà 🐾', notificationOptions)
  );
});

// ── Click vào thông báo ──────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const rawUrl = event.notification.data?.url || '/booking';
  const urlToOpen = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Nếu tab đã mở thuộc cùng origin → focus & chuyển trang
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      // 2. Nếu chưa có tab nào mở → mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
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
