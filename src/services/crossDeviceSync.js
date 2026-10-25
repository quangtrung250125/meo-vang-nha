import { supabase } from '../supabaseClient';

const CHANNEL_NAME = 'mvn_cross_device_sync';

const SYNC_EVENTS = ['PETS_UPDATED', 'PROFILE_UPDATED', 'BOOKINGS_UPDATED', 'REQUEST_SYNC', 'FULL_SYNC_RESPONSE'];

// Cache kênh Supabase để dùng chung toàn app
let syncChannel = null;
const listeners = new Set();

// Tài khoản đang đăng nhập trên thiết bị này (CustomerContext cập nhật sau khi Supabase xác thực)
let syncIdentity = { userId: null, isAdmin: false };

export const setSyncIdentity = ({ userId = null, isAdmin = false } = {}) => {
  syncIdentity = { userId, isAdmin: Boolean(isAdmin) };
};

/**
 * Lọc dữ liệu nhận từ thiết bị khác: khách chỉ nhận mèo, đơn và hồ sơ của chính mình.
 * Trả về null nếu không còn gì để xử lý.
 */
export const scopeIncomingPayload = (type, payload, identity = syncIdentity) => {
  if (!payload || identity.isAdmin) return payload;
  if (type === 'REQUEST_SYNC') return payload;

  const { userId } = identity;
  if (!userId) return null;

  if (type === 'PROFILE_UPDATED') {
    return payload.profile?.id === userId ? payload : null;
  }

  const scoped = { ...payload };
  if (Array.isArray(payload.pets)) {
    scoped.pets = payload.pets.filter((pet) => pet?.ownerId === userId);
  }
  if (Array.isArray(payload.bookings)) {
    scoped.bookings = payload.bookings.filter((booking) => booking?.customerId === userId);
  }
  return scoped;
};

/**
 * Dữ liệu gửi đi: khách chỉ gửi mèo/đơn của chính mình, gắn kèm ownerId để thiết bị khác lọc được.
 */
export const scopeOutgoingPayload = (payload, identity = syncIdentity) => {
  if (!payload || identity.isAdmin) return payload;
  const { userId } = identity;
  const scoped = { ...payload };
  if (Array.isArray(payload.pets)) {
    scoped.pets = userId
      ? payload.pets
          .filter((pet) => pet && (!pet.ownerId || pet.ownerId === userId))
          .map((pet) => ({ ...pet, ownerId: userId }))
      : [];
  }
  if (Array.isArray(payload.bookings)) {
    scoped.bookings = userId ? payload.bookings.filter((b) => b?.customerId === userId) : [];
  }
  if (payload.profile && payload.profile.id !== userId) {
    return null;
  }
  return scoped;
};

const dispatchSyncEvent = (type, rawPayload) => {
  const payload = scopeIncomingPayload(type, rawPayload);
  if (!payload) return;
  listeners.forEach((fn) => {
    try {
      fn({ type, payload });
    } catch (e) {
      console.warn('[CrossDeviceSync] Listener error:', e);
    }
  });
};

const getAuthHeaders = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
};

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

    syncChannel = SYNC_EVENTS.reduce(
      (channel, type) => channel.on('broadcast', { event: type }, ({ payload }) => dispatchSyncEvent(type, payload)),
      syncChannel
    );

    syncChannel
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
export const broadcastEvent = async (event, rawPayload) => {
  try {
    const payload = scopeOutgoingPayload(rawPayload);
    if (!payload) return;
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

export { getAuthHeaders };

/**
 * Lấy dữ liệu từ Server API (/api/sync)
 */
export const fetchServerSync = async () => {
  try {
    const res = await fetch('/api/sync', {
      method: 'GET',
      headers: { 'Accept': 'application/json', ...(await getAuthHeaders()) },
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
  if (!syncIdentity.userId) return null;
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ bookings, pets, profiles }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    return null;
  }
};
