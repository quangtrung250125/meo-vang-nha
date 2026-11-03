import { getRequestUser } from './auth.js';

const digits = (v) => String(v || '').replace(/\D/g, '');

// Các mã thông báo một tài khoản được dùng: mã tài khoản và số điện thoại (tài khoản SĐT có email <sđt>@meovangnha.vn)
export const ownPushIds = (user) => {
  if (!user) return [];
  const ids = [String(user.id)];
  const phoneMatch = /^(\d{9,12})@meovangnha\.vn$/i.exec(user.email || '');
  if (phoneMatch) ids.push(phoneMatch[1]);
  return ids;
};

/**
 * Kiểm tra người gửi request có được dùng mã thông báo `userId` không.
 * Admin được gửi cho mọi khách; khách chỉ được đăng ký / gửi cho chính mình.
 * @returns {Promise<{ ok: true, user } | { ok: false, status: number, error: string }>}
 */
export async function checkPushAccess(req, userId) {
  const user = await getRequestUser(req);
  if (!user) return { ok: false, status: 401, error: 'Cần đăng nhập để dùng thông báo đẩy.' };
  if (user.isAdmin) return { ok: true, user };
  const target = String(userId || '');
  const own = ownPushIds(user);
  if (own.includes(target) || (digits(target) && own.includes(digits(target)))) return { ok: true, user };
  return { ok: false, status: 403, error: 'Chỉ được dùng thông báo đẩy cho tài khoản của chính bạn.' };
}
