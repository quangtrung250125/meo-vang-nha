// Quy tắc xác định tài khoản Admin, dùng chung cho giao diện (src/) và server (api/).
// Admin là tài khoản Supabase có app_metadata.role = 'admin' (chỉ đặt được từ Supabase Dashboard)
// hoặc có email nằm trong danh sách ADMIN_EMAILS / VITE_ADMIN_EMAILS (phân tách bằng dấu phẩy),
// hoặc đăng ký bằng số điện thoại nằm trong ADMIN_PHONES / VITE_ADMIN_PHONES.

import { normalizeVnPhone } from './phone.js';

export const parseAdminEmails = (raw = '') =>
  String(raw || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

// Tài khoản đăng ký bằng số điện thoại có email dạng <số điện thoại>@meovangnha.vn,
// email này là duy nhất trên Supabase nên dùng được để nhận diện admin theo SĐT
export const phoneToAccountEmail = (phone = '') => {
  const digits = normalizeVnPhone(phone);
  return digits ? `${digits}@meovangnha.vn` : '';
};

export const parseAdminPhones = (raw = '') =>
  String(raw || '')
    .split(',')
    .map(phoneToAccountEmail)
    .filter(Boolean);

export const getAdminEmails = ({ emails = '', phones = '' } = {}) => [
  ...parseAdminEmails(emails),
  ...parseAdminPhones(phones),
];

export const isAdminUser = (user, adminEmails = []) => {
  if (!user) return false;
  if (user.app_metadata?.role === 'admin') return true;
  const email = (user.email || '').trim().toLowerCase();
  return Boolean(email) && adminEmails.includes(email);
};
