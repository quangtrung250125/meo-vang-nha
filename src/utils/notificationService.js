/**
 * Notification Service for Mèo Vắng Nhà
 * Supports Web Notification API across Mobile (Chrome/Safari) and Desktop.
 */

// Play Web Audio chime (no external mp3 dependency)
export const playNotificationSound = (type = 'success') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'conflict' || type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.setValueAtTime(260, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    }
  } catch (e) {
    // AudioContext blocked or not supported
  }
};

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playNotificationSound('success');
      sendWebNotification('🎉 Đã bật thông báo!', {
        body: 'Bạn sẽ nhận được thông báo tức thì trên điện thoại và máy tính khi có cập nhật đặt phòng hoặc trạng thái của bé mèo.',
      });
    }
    return permission;
  } catch (e) {
    console.warn('Lỗi xin quyền thông báo:', e);
    return 'denied';
  }
};

export const sendWebNotification = (title, options = {}) => {
  const soundType = options.type || (title.includes('⚠️') ? 'conflict' : 'success');
  playNotificationSound(soundType);

  if (!isNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    const notifPayload = {
      icon: '/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png',
      badge: '/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png',
      vibrate: [200, 100, 200],
      tag: options.tag || 'mvn-alert',
      renotify: true,
      data: { url: options.url || '/booking' },
      ...options,
    };

    try {
      const notif = new Notification(title, notifPayload);
      notif.onclick = () => {
        window.focus();
        if (options.url) window.location.href = options.url;
        notif.close();
      };
    } catch (err) {
      // In mobile Chrome/Edge, try through Service Worker if present
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(title, notifPayload);
          })
          .catch(() => {});
      }
    }
  }
};
