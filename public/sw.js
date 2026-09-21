/* ============================================================
   Mèo Vắng Nhà — Service Worker
   Xử lý Push Notifications ngay cả khi khách không mở web
   ============================================================ */

const CACHE_NAME = 'meo-vang-nha-v1';
const APP_ICON = '/images/logo.png';

// ── Cài đặt SW ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ── Nhận Push Event từ server ────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Mèo Vắng Nhà 🐾', body: 'Bạn có thông báo mới!', url: '/' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || APP_ICON,
      badge: APP_ICON,
      image: data.image,
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      requireInteraction: data.requireInteraction || false,
      tag: data.tag || 'meo-vang-nha',
      actions: data.actions || [
        { action: 'open', title: 'Xem ngay' },
        { action: 'close', title: 'Đóng' },
      ],
    })
  );
});

// ── Click vào thông báo ──────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Nếu tab đã mở → focus lại
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Nếu chưa có tab → mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ── Nhận message từ trang web (trigger notification thủ công) ─
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, url, tag, requireInteraction } = event.data.payload || {};
    self.registration.showNotification(title || 'Mèo Vắng Nhà 🐾', {
      body: body || 'Thông báo từ Mèo Vắng Nhà',
      icon: icon || APP_ICON,
      badge: APP_ICON,
      data: { url: url || '/' },
      vibrate: [200, 100, 200],
      tag: tag || 'meo-vang-nha',
      requireInteraction: requireInteraction || false,
    });
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
