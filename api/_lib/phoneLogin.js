import { supabaseAdmin, hasServiceRole, createAnonClient } from './db.js';
import { phoneToAccountEmail } from '../../src/utils/adminAccess.js';
import { normalizeVnPhone } from '../../src/utils/phone.js';

export { normalizeVnPhone };

const isValidPhone = (phone) => /^0\d{9}$/.test(phone);

const defaultDeps = {
  admin: supabaseAdmin,
  canListUsers: hasServiceRole,
  signIn: async (email, password) => createAnonClient().auth.signInWithPassword({ email, password }),
};

let deps = defaultDeps;

// Cho phép test thay Supabase bằng dữ liệu giả
export function setPhoneLoginDeps(override) {
  deps = override ? { ...defaultDeps, ...override } : defaultDeps;
}

// Email của các tài khoản đã đăng ký thật với SĐT này (không gồm email ẩn tự suy ra)
async function lookupRegisteredEmails(phone) {
  const emails = new Set();

  try {
    const { data } = await deps.admin
      .from('customer_profiles')
      .select('email, phone')
      .ilike('phone', `%${phone.slice(-9)}%`);
    (data || []).forEach((row) => {
      if (row?.email && normalizeVnPhone(row.phone) === phone) emails.add(row.email.toLowerCase());
    });
  } catch (err) {
    console.warn('[PhoneLogin] Không đọc được customer_profiles:', err?.message);
  }

  if (deps.canListUsers) {
    try {
      for (let page = 1; page <= 20; page += 1) {
        const { data, error } = await deps.admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) break;
        const users = data?.users || [];
        users.forEach((user) => {
          if (user?.email && normalizeVnPhone(user.user_metadata?.phone) === phone) {
            emails.add(user.email.toLowerCase());
          }
        });
        if (users.length < 1000) break;
      }
    } catch (err) {
      console.warn('[PhoneLogin] Không đọc được danh sách tài khoản:', err?.message);
    }
  }

  return emails;
}

/**
 * Tìm tất cả email tài khoản gắn với một số điện thoại:
 * email ẩn <sđt>@meovangnha.vn, bảng customer_profiles và (nếu có service role) danh sách tài khoản Supabase.
 */
export async function findAccountEmailsByPhone(rawPhone) {
  const phone = normalizeVnPhone(rawPhone);
  if (!isValidPhone(phone)) return [];
  const emails = await lookupRegisteredEmails(phone);
  // Luôn thử email ẩn, kể cả khi server không đọc được danh sách tài khoản
  return [...new Set([phoneToAccountEmail(phone), ...emails])];
}

/**
 * Số điện thoại đã có tài khoản chưa (dùng khi đăng ký để không cho trùng SĐT).
 * Không có service role thì tài khoản chỉ có email ẩn chưa vào customer_profiles sẽ không thấy,
 * khi đó Supabase vẫn tự báo trùng nếu đăng ký lại đúng email ẩn đó.
 */
export async function isPhoneTaken(rawPhone) {
  const phone = normalizeVnPhone(rawPhone);
  if (!isValidPhone(phone)) return false;
  return (await lookupRegisteredEmails(phone)).size > 0;
}

const readBody = (req) => (req.body && typeof req.body === 'object' ? req.body : {});

/**
 * POST /api/auth/phone-login { phone, password }
 * Thử đăng nhập lần lượt với từng email gắn với SĐT, trả về phiên Supabase để trình duyệt dùng.
 * Không bao giờ trả email ra ngoài khi sai mật khẩu.
 */
export async function handlePhoneLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { phone: rawPhone, password } = readBody(req);
  const phone = normalizeVnPhone(rawPhone);
  if (!isValidPhone(phone) || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại hợp lệ và mật khẩu!' });
  }

  const emails = await findAccountEmailsByPhone(phone);
  let notConfirmed = false;

  for (const email of emails) {
    try {
      const { data, error } = await deps.signIn(email, password);
      if (!error && data?.session) {
        return res.status(200).json({
          success: true,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
        });
      }
      if (error?.message?.includes('Email not confirmed')) notConfirmed = true;
    } catch (err) {
      console.warn('[PhoneLogin] Lỗi đăng nhập:', err?.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: notConfirmed
      ? 'Tài khoản chưa được xác thực email!'
      : 'Số điện thoại hoặc mật khẩu không chính xác!',
  });
}

/**
 * POST /api/auth/phone-check { phone } → { taken }
 */
export async function handlePhoneCheck(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const phone = normalizeVnPhone(readBody(req).phone);
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ!' });
  }
  return res.status(200).json({ success: true, taken: await isPhoneTaken(phone) });
}
