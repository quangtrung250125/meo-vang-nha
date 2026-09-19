/* ============================================================
   Notification Utilities — Mèo Vắng Nhà
   ============================================================ */

/** Kiểm tra trình duyệt có hỗ trợ push notifications không */
export const isNotificationSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator;

/** Lấy trạng thái permission hiện tại */
export const getPermissionStatus = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

/** Đăng ký Service Worker */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[SW] Đăng ký thành công:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[SW] Đăng ký thất bại:', err);
    return null;
  }
};

/** Yêu cầu quyền thông báo từ người dùng */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  const result = await Notification.requestPermission();
  return result;
};

/** Gửi thông báo qua Service Worker (hoạt động cả khi tab không focus) */
export const showNotification = async (title, body, options = {}) => {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/images/logo.png',
      badge: '/images/logo.png',
      vibrate: [200, 100, 200],
      tag: options.tag || 'meo-vang-nha',
      data: { url: options.url || '/' },
      requireInteraction: options.requireInteraction || false,
      ...options,
    });
  } catch (err) {
    // Fallback: Notification API thông thường
    new Notification(title, { body, icon: '/images/logo.png' });
  }
};

/** Gửi thông báo chào mừng sau khi đăng ký thành công */
export const sendWelcomeNotifications = async (customerName = 'bạn') => {
  if (Notification.permission !== 'granted') return;

  // Thông báo ngay lập tức: Chào mừng
  await showNotification(
    '🐾 Chào mừng đến Mèo Vắng Nhà!',
    `Xin chào ${customerName}! Đặt phòng ngay để nhận ưu đãi -10% cho lần đầu.`,
    { url: '/services', tag: 'welcome' }
  );

  // Thông báo sau 5 phút: Nhắc đặt phòng
  setTimeout(async () => {
    await showNotification(
      '🏠 Còn chỗ trống hôm nay!',
      'Đặt phòng ngay để đảm bảo chỗ cho bé. Ưu đãi -10% có hạn!',
      { url: '/booking', tag: 'reminder-booking' }
    );
  }, 5 * 60 * 1000);

  // Thông báo sau 1 ngày: Ưu đãi thứ 4
  const now = new Date();
  const nextWed = new Date();
  nextWed.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7 || 7));
  nextWed.setHours(8, 0, 0, 0);
  const msUntilWed = nextWed - now;

  setTimeout(async () => {
    await showNotification(
      '🎁 Thứ Tư hôm nay — Tặng Pate Miễn Phí!',
      'Các bé lưu trú vào Thứ Tư được tặng Pate theo sở thích. Đặt phòng ngay!',
      { url: '/booking', tag: 'wed-promo', requireInteraction: true }
    );
  }, msUntilWed);
};

/** Lưu trạng thái notification vào localStorage */
export const saveNotificationPreference = (accepted) => {
  localStorage.setItem('mvn-notification-permission', accepted ? 'granted' : 'declined');
  localStorage.setItem('mvn-notification-asked', 'true');
};

/** Kiểm tra đã từng hỏi về notification chưa */
export const wasNotificationAsked = () =>
  localStorage.getItem('mvn-notification-asked') === 'true';

/** Gửi thông báo cập nhật nhật ký theo dõi mèo về điện thoại của khách */
export const sendTrackingUpdateNotification = async (petName = 'Bé cưng', actionTitle = 'Cập nhật mới', detail = '') => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  await showNotification(
    `🐾 [Theo dõi] ${petName}: ${actionTitle}`,
    detail || `Nhân viên vừa cập nhật tình trạng mới nhất của ${petName}. Nhấn để xem ngay!`,
    {
      url: '/tracking',
      tag: `tracking-${Date.now()}`,
      requireInteraction: true,
    }
  );
  return true;
};

/** Gửi thông báo mẫu test về điện thoại */
export const testPhoneNotification = async (petName = 'Miu') => {
  if (!isNotificationSupported()) {
    throw new Error('Thiết bị hoặc trình duyệt không hỗ trợ thông báo đẩy.');
  }

  let permission = Notification.permission;
  if (permission !== 'granted') {
    permission = await requestNotificationPermission();
  }

  if (permission !== 'granted') {
    throw new Error('Chưa được cấp quyền gửi thông báo trên thiết bị.');
  }

  await showNotification(
    `🐱 [Mèo Vắng Nhà] Cập nhật tình hình ${petName}!`,
    `🍽️ ${petName} vừa ăn hết phần pate cá hồi và đang ngủ trưa rất ngoan. Chạm để xem nhật ký & camera!`,
    {
      url: '/tracking',
      tag: 'test-tracking-notif',
      requireInteraction: true,
    }
  );

  return true;
};
