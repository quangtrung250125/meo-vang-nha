// Quy tắc xác định tài khoản Admin, dùng chung cho giao diện (src/) và server (api/).
// Admin là tài khoản Supabase có app_metadata.role = 'admin' (chỉ đặt được từ Supabase Dashboard)
// hoặc có email nằm trong danh sách ADMIN_EMAILS / VITE_ADMIN_EMAILS (phân tách bằng dấu phẩy).

export const parseAdminEmails = (raw = '') =>
  String(raw || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUser = (user, adminEmails = []) => {
  if (!user) return false;
  if (user.app_metadata?.role === 'admin') return true;
  const email = (user.email || '').trim().toLowerCase();
  return Boolean(email) && adminEmails.includes(email);
};
