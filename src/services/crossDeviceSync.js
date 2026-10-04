import { supabase } from '../supabaseClient';

const CHANNEL_NAME = 'mvn_cross_device_sync';

// Cache kênh Supabase để dùng chung toàn app
let syncChannel = null;
const listeners = new Set();

/**
 * Khởi tạo hoặc lấy kênh Realtime Broadcast
 */
export const getSyncChannel = () => {
  if (syncChannel) return syncChannel;

  try {
    syncChannel = supabase.channel(CHANNEL_NAME, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    syncChannel
      .on('broadcast', { event: 'PETS_UPDATED' }, ({ payload }) => {
        listeners.forEach((fn) => {
          try {
            fn({ type: 'PETS_UPDATED', payload });
          } catch (e) {
            console.warn('[CrossDeviceSync] Listener error:', e);
          }
        });
      })
      .on('broadcast', { event: 'PROFILE_UPDATED' }, ({ payload }) => {
        listeners.forEach((fn) => {
          try {
            fn({ type: 'PROFILE_UPDATED', payload });
          } catch (e) {
            console.warn('[CrossDeviceSync] Listener error:', e);
          }
        });
      })
      .on('broadcast', { event: 'BOOKINGS_UPDATED' }, ({ payload }) => {
        listeners.forEach((fn) => {
          try {
            fn({ type: 'BOOKINGS_UPDATED', payload });
          } catch (e) {
            console.warn('[CrossDeviceSync] Listener error:', e);
          }
        });
      })
      .on('broadcast', { event: 'REQUEST_SYNC' }, ({ payload }) => {
        listeners.forEach((fn) => {
          try {
            fn({ type: 'REQUEST_SYNC', payload });
          } catch (e) {
            console.warn('[CrossDeviceSync] Listener error:', e);
          }
        });
      })
      .on('broadcast', { event: 'FULL_SYNC_RESPONSE' }, ({ payload }) => {
        listeners.forEach((fn) => {
          try {
            fn({ type: 'FULL_SYNC_RESPONSE', payload });
          } catch (e) {
            console.warn('[CrossDeviceSync] Listener error:', e);
          }
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Khi vừa kết nối kênh, gửi yêu cầu sync để xin dữ liệu mới nhất từ các thiết bị khác
          broadcastEvent('REQUEST_SYNC', { clientTime: Date.now() });
        }
      });
  } catch (err) {
    console.warn('[CrossDeviceSync] Lỗi khởi tạo kênh Supabase:', err);
  }

  return syncChannel;
};

/**
 * Đăng ký lắng nghe sự kiện đồng bộ từ các thiết bị khác
 */
export const subscribeSyncEvents = (callback) => {
  listeners.add(callback);
  getSyncChannel();

  return () => {
    listeners.delete(callback);
  };
};

/**
 * Phát sự kiện broadcast qua Supabase Cloud WebSocket
 */
export const broadcastEvent = async (event, payload) => {
  try {
    const channel = getSyncChannel();
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  } catch (e) {
    console.warn('[CrossDeviceSync] Lỗi broadcast event:', event, e);
  }
};

/**
 * Lấy dữ liệu từ Server API (/api/sync)
 */
export const fetchServerSync = async () => {
  try {
    const res = await fetch('/api/sync', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    // API có thể không chạy nếu ở môi trường static thuần
    return null;
  }
};

/**
 * Đẩy dữ liệu lên Server API (/api/sync)
 */
export const pushServerSync = async ({ bookings, pets, profiles }) => {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookings, pets, profiles }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    return null;
  }
};
