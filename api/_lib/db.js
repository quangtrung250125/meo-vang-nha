import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseUrl = (rawSupabaseUrl && rawSupabaseUrl.startsWith('http') && rawSupabaseUrl !== 'REPLACE_ME')
  ? rawSupabaseUrl
  : 'https://dejcaioztgpqkvmbauat.supabase.co';

const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseKey = (rawKey && rawKey !== 'REPLACE_ME')
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlamNhaW96dGdwcWt2bWJhdWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzU3NTcsImV4cCI6MjEwNTY1MTc1N30.yZgRl-qV5mOn4JmSwt0sulfIMXIX3MDIEzS2DxSI3yc';

// Có service role key thì server đọc được danh sách tài khoản (cần cho đăng nhập bằng SĐT trên mọi thiết bị)
export const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'REPLACE_ME');

const rawAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const anonKey = (rawAnonKey && rawAnonKey !== 'REPLACE_ME') ? rawAnonKey : supabaseKey;

// Client dùng quyền khách (anon) để đăng nhập thay người dùng, không giữ phiên trên server
export const createAnonClient = () => createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Client mang token của chính người gửi request: Supabase áp RLS theo tài khoản đó
// (khách chỉ đọc / sửa được đơn của mình). Dùng khi server không có service role key.
export const createUserClient = (accessToken) => createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${accessToken}` } },
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Bộ nhớ đệm fallback trong trường hợp DB Supabase chưa chạy migration
const memorySubscriptions = new Map();

// Lỗi gần nhất khi đọc / ghi bảng push_subscriptions (vd. chưa tạo bảng): thiết bị chỉ được nhớ tạm, sẽ mất
let lastSubscriptionDbError = null;
export const getSubscriptionDbError = () => lastSubscriptionDbError;

/**
 * Lưu hoặc cập nhật Subscription của thiết bị
 */
export async function upsertSubscription({ userId, endpoint, p256dh, auth, userAgent }) {
  if (!endpoint || !p256dh || !auth) {
    throw new Error('Thiếu thông tin endpoint hoặc keys của subscription.');
  }

  const payload = {
    user_id: String(userId || 'anonymous'),
    endpoint,
    p256dh,
    auth,
    user_agent: userAgent || '',
    updated_at: new Date().toISOString(),
  };

  // Lưu vào in-memory fallback
  memorySubscriptions.set(endpoint, payload);

  try {
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' })
      .select();

    if (error) {
      console.warn('[DB Push] Cảnh báo Supabase upsert (sử dụng in-memory fallback):', error.message);
      lastSubscriptionDbError = error.message;
      return { ...payload, persisted: false, dbError: error.message };
    }
    lastSubscriptionDbError = null;
    return { ...(data?.[0] || payload), persisted: true };
  } catch (err) {
    console.warn('[DB Push] Không thể kết nối Supabase, fallback in-memory:', err.message);
    lastSubscriptionDbError = err.message;
    return { ...payload, persisted: false, dbError: err.message };
  }
}

/**
 * Xóa subscription theo endpoint (khi user tắt thông báo hoặc push trả về 410 Gone)
 */
export async function deleteSubscriptionByEndpoint(endpoint) {
  if (!endpoint) return false;

  memorySubscriptions.delete(endpoint);

  try {
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.warn('[DB Push] Lỗi xóa subscription:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('[DB Push] Lỗi khi xóa:', err.message);
    return true;
  }
}

/**
 * Lấy danh sách subscriptions theo userId
 */
export async function getSubscriptionsByUserId(userId) {
  const normalizedId = String(userId || '');
  let list = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', normalizedId);

    if (!error && Array.isArray(data) && data.length > 0) {
      list = data;
    }
  } catch (err) {
    console.warn('[DB Push] Lỗi đọc từ Supabase:', err.message);
  }

  // Kết hợp với in-memory fallback
  memorySubscriptions.forEach((sub) => {
    if (sub.user_id === normalizedId && !list.some((item) => item.endpoint === sub.endpoint)) {
      list.push(sub);
    }
  });

  return list;
}

/**
 * Lấy toàn bộ subscriptions (cho broadcast nếu cần)
 */
export async function getAllSubscriptions() {
  let list = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*');

    if (!error && Array.isArray(data)) {
      list = data;
      lastSubscriptionDbError = null;
    } else if (error) {
      lastSubscriptionDbError = error.message;
    }
  } catch (err) {
    console.warn('[DB Push] Lỗi lấy all subs:', err.message);
    lastSubscriptionDbError = err.message;
  }

  memorySubscriptions.forEach((sub) => {
    if (!list.some((item) => item.endpoint === sub.endpoint)) {
      list.push(sub);
    }
  });

  return list;
}

/**
 * Lấy subscriptions của nhiều mã người dùng một lúc (mã tài khoản, số điện thoại…), bỏ trùng theo endpoint
 */
export async function getSubscriptionsByUserIds(userIds = []) {
  const ids = [...new Set((userIds || []).map((id) => String(id || '')).filter(Boolean))];
  if (ids.length === 0) return [];
  const byEndpoint = new Map();

  try {
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', ids);
    if (!error && Array.isArray(data)) data.forEach((sub) => byEndpoint.set(sub.endpoint, sub));
  } catch (err) {
    console.warn('[DB Push] Lỗi đọc từ Supabase:', err.message);
  }

  memorySubscriptions.forEach((sub) => {
    if (ids.includes(sub.user_id) && !byEndpoint.has(sub.endpoint)) byEndpoint.set(sub.endpoint, sub);
  });

  return [...byEndpoint.values()];
}

/**
 * Số thiết bị đã bật thông báo theo từng mã người dùng: { [user_id]: số thiết bị }
 */
export async function countSubscriptionsByUser() {
  const all = await getAllSubscriptions();
  return all.reduce((acc, sub) => {
    const id = String(sub.user_id || '');
    if (id) acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
}
