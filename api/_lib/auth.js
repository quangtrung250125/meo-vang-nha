import { supabaseAdmin } from './db.js';
import { getAdminEmails, isAdminUser } from '../../src/utils/adminAccess.js';

const defaultVerifier = async (token) => {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
};

let verifyToken = defaultVerifier;

// Cho phép test thay thế bước xác thực token Supabase
export function setTokenVerifier(fn) {
  verifyToken = fn || defaultVerifier;
}

/**
 * Lấy access token từ header Authorization: Bearer <access_token> (hoặc null).
 */
export function getBearerToken(req) {
  const header = req?.headers?.authorization || req?.headers?.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

/**
 * Đọc header Authorization: Bearer <access_token> và trả về người dùng đã xác thực.
 * @returns {Promise<{ id: string, email: string, isAdmin: boolean } | null>}
 */
export async function getRequestUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const user = await verifyToken(token);
    if (!user?.id) return null;
    const adminEmails = getAdminEmails({
      emails: process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS,
      phones: process.env.ADMIN_PHONES || process.env.VITE_ADMIN_PHONES,
    });
    return {
      id: user.id,
      email: user.email || '',
      isAdmin: isAdminUser(user, adminEmails),
    };
  } catch {
    return null;
  }
}
