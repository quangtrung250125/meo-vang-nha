import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseUrl = (rawSupabaseUrl && rawSupabaseUrl.startsWith('http') && rawSupabaseUrl !== 'REPLACE_ME')
  ? rawSupabaseUrl
  : 'https://dejcaioztgpqkvmbauat.supabase.co';

const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseKey = (rawKey && rawKey !== 'REPLACE_ME')
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlamNhaW96dGdwcWt2bWJhdWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzU3NTcsImV4cCI6MjEwNTY1MTc1N30.yZgRl-qV5mOn4JmSwt0sulfIMXIX3MDIEzS2DxSI3yc';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Bộ nhớ đệm fallback trong trường hợp DB Supabase chưa chạy migration
const memorySubscriptions = new Map();

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
      return payload;
    }
    return data?.[0] || payload;
  } catch (err) {
    console.warn('[DB Push] Không thể kết nối Supabase, fallback in-memory:', err.message);
    return payload;
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
    }
  } catch (err) {
    console.warn('[DB Push] Lỗi lấy all subs:', err.message);
  }

  memorySubscriptions.forEach((sub) => {
    if (!list.some((item) => item.endpoint === sub.endpoint)) {
      list.push(sub);
    }
  });

  return list;
}
