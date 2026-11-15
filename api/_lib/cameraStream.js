import { supabaseAdmin } from './db.js';

// ==========================================
// ĐỊA CHỈ LUỒNG CAMERA (do admin dán trong Cài đặt → Camera)
// Lưu trong bảng marketing_settings sẵn có của Supabase (id = 'camera_stream'),
// nên không cần thêm biến môi trường nào trên Vercel.
// ==========================================

const ID = 'camera_stream';
let memory = null; // dự phòng khi Supabase chưa ghi được (chỉ sống trong một lần chạy của máy chủ)

const withTimeout = (promise, ms = 5000) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase phản hồi quá chậm')), ms))]);

// Chỉ nhận link HLS https (trình duyệt trên web https không phát được link http)
export function validateStreamUrl(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return { ok: false, error: 'Chưa nhập địa chỉ luồng camera.' };
  if (value.length > 500) return { ok: false, error: 'Địa chỉ quá dài.' };
  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: 'Địa chỉ không hợp lệ.' };
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'Địa chỉ phải bắt đầu bằng https://' };
  if (url.username || url.password) return { ok: false, error: 'Địa chỉ không được chứa tài khoản hay mật khẩu.' };
  if (!url.pathname.endsWith('.m3u8')) return { ok: false, error: 'Đây phải là địa chỉ luồng HLS (đuôi .m3u8).' };
  return { ok: true, url: url.toString() };
}

export async function getCameraStreamUrl() {
  try {
    const res = await withTimeout(supabaseAdmin.from('marketing_settings').select('data').eq('id', ID).limit(1));
    if (!res.error) {
      const url = res.data?.[0]?.data?.url;
      return typeof url === 'string' && url ? url : null;
    }
    console.warn('[Camera] Supabase:', res.error.message);
  } catch (e) {
    console.warn('[Camera] Không đọc được Supabase:', e.message);
  }
  return memory;
}

// url = null / '' để xoá. Trả về { persisted } cho biết đã lưu bền vào Supabase hay chỉ lưu tạm
export async function setCameraStreamUrl(url) {
  memory = url || null;
  try {
    const res = url
      ? await withTimeout(supabaseAdmin.from('marketing_settings').upsert({ id: ID, data: { url }, updated_at: new Date().toISOString() }, { onConflict: 'id' }))
      : await withTimeout(supabaseAdmin.from('marketing_settings').delete().eq('id', ID));
    if (res.error) {
      console.warn('[Camera] Không lưu được Supabase:', res.error.message);
      return { persisted: false, error: res.error.message };
    }
    return { persisted: true };
  } catch (e) {
    console.warn('[Camera] Không lưu được Supabase:', e.message);
    return { persisted: false, error: e.message };
  }
}
