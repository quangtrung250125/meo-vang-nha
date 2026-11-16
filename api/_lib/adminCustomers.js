import { randomInt } from 'crypto';
import { supabaseAdmin, hasServiceRole, createAnonClient, createUserClient } from './db.js';
import { getRequestUser, getBearerToken } from './auth.js';
import { isPhoneTaken } from './phoneLogin.js';
import { phoneToAccountEmail } from '../../src/utils/adminAccess.js';
import { normalizeVnPhone } from '../../src/utils/phone.js';

// Nhân viên đặt phòng hộ khách đến cửa hàng: tìm khách đã có tài khoản, hoặc tạo nhanh tài khoản cho khách mới.
// Dùng chung hàm /api/auth/phone (Vercel gói miễn phí giới hạn số hàm API).

const isValidPhone = (phone) => /^0\d{9}$/.test(phone);

const defaultDeps = {
  admin: supabaseAdmin,
  canManageUsers: hasServiceRole,
  userClient: createUserClient,
  signUp: async (email, password, data) => createAnonClient().auth.signUp({ email, password, options: { data } }),
  phoneTaken: isPhoneTaken,
};

let deps = defaultDeps;

// Cho phép test / bản chạy thử thay Supabase bằng dữ liệu giả
export function setAdminCustomerDeps(override) {
  deps = override ? { ...defaultDeps, ...override } : defaultDeps;
}

const toCustomer = (row) => ({
  id: row.id,
  fullName: String(row.full_name || row.fullName || '').trim(),
  phone: normalizeVnPhone(row.phone || ''),
  email: row.email || '',
  createdAt: row.created_at || row.createdAt || null,
});

const phoneFromHiddenEmail = (email = '') => /^(\d{9,12})@meovangnha\.vn$/i.exec(email)?.[1] || '';

/**
 * Danh sách khách có tài khoản: bảng customer_profiles, bổ sung tài khoản Supabase (nếu có service role key).
 */
export async function listCustomerAccounts(accessToken) {
  const byId = new Map();

  try {
    const client = deps.canManageUsers || !accessToken ? deps.admin : deps.userClient(accessToken);
    const { data } = await client.from('customer_profiles').select('*');
    (data || []).forEach((row) => {
      if (row?.id) byId.set(row.id, toCustomer(row));
    });
  } catch (err) {
    console.warn('[AdminCustomers] Không đọc được customer_profiles:', err?.message);
  }

  if (deps.canManageUsers) {
    try {
      for (let page = 1; page <= 20; page += 1) {
        const { data, error } = await deps.admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) break;
        const users = data?.users || [];
        users.forEach((u) => {
          const meta = u.user_metadata || {};
          const existing = byId.get(u.id) || {};
          byId.set(u.id, {
            id: u.id,
            fullName: existing.fullName || String(meta.full_name || meta.fullName || meta.name || '').trim(),
            phone: existing.phone || normalizeVnPhone(meta.phone || u.phone || phoneFromHiddenEmail(u.email)),
            email: existing.email || u.email || '',
            createdAt: existing.createdAt || u.created_at || null,
          });
        });
        if (users.length < 1000) break;
      }
    } catch (err) {
      console.warn('[AdminCustomers] Không đọc được danh sách tài khoản:', err?.message);
    }
  }

  return [...byId.values()]
    .filter((c) => c.id && (c.phone || c.email))
    .sort((a, b) => (a.fullName || a.phone).localeCompare(b.fullName || b.phone, 'vi'));
}

// Mật khẩu tạm 6 số để nhân viên đưa cho khách, khách đổi lại sau khi đăng nhập
export const generateTempPassword = () => String(randomInt(100000, 1000000));

/**
 * Tạo tài khoản khách bằng SĐT (giống khách tự đăng ký bằng SĐT: email ẩn <sđt>@meovangnha.vn).
 * @returns {{ ok: true, customer, password } | { ok: false, status, message }}
 */
export async function createCustomerAccount({ fullName, phone: rawPhone, password }, accessToken) {
  const name = String(fullName || '').trim().slice(0, 80);
  const phone = normalizeVnPhone(rawPhone);
  if (!name) return { ok: false, status: 400, message: 'Vui lòng nhập họ tên khách hàng.' };
  if (!isValidPhone(phone)) return { ok: false, status: 400, message: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).' };
  const pass = String(password || '').trim() || generateTempPassword();
  if (pass.length < 6) return { ok: false, status: 400, message: 'Mật khẩu cần ít nhất 6 ký tự.' };

  if (await deps.phoneTaken(phone)) {
    const existing = (await listCustomerAccounts(accessToken)).find((c) => c.phone === phone) || null;
    return {
      ok: false,
      status: 409,
      message: 'Số điện thoại này đã có tài khoản. Hãy chọn khách trong danh sách.',
      existing,
    };
  }

  const email = phoneToAccountEmail(phone);
  const metadata = { full_name: name, phone };
  let userId = null;
  let session = null;

  if (deps.canManageUsers) {
    const { data, error } = await deps.admin.auth.admin.createUser({
      email,
      password: pass,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) {
      const taken = /already|registered|exists/i.test(error.message || '');
      return { ok: false, status: taken ? 409 : 400, message: taken ? 'Số điện thoại này đã có tài khoản.' : `Không tạo được tài khoản: ${error.message}` };
    }
    userId = data?.user?.id || null;
  } else {
    // Không có service role key: đăng ký như khách tự đăng ký
    const { data, error } = await deps.signUp(email, pass, metadata);
    if (error) {
      const taken = /already|registered|exists/i.test(error.message || '');
      return { ok: false, status: taken ? 409 : 400, message: taken ? 'Số điện thoại này đã có tài khoản.' : `Không tạo được tài khoản: ${error.message}` };
    }
    userId = data?.user?.id || null;
    session = data?.session || null;
  }
  if (!userId) return { ok: false, status: 500, message: 'Không tạo được tài khoản, vui lòng thử lại.' };

  // Ghi hồ sơ để đăng nhập bằng SĐT ở mọi thiết bị và hiện trong trang Khách hàng
  const row = { id: userId, full_name: name, phone, email };
  try {
    const client = deps.canManageUsers
      ? deps.admin
      : deps.userClient(session?.access_token || accessToken);
    const { error } = await client.from('customer_profiles').upsert(row);
    if (error) console.warn('[AdminCustomers] Chưa ghi được customer_profiles:', error.message);
  } catch (err) {
    console.warn('[AdminCustomers] Chưa ghi được customer_profiles:', err?.message);
  }

  return {
    ok: true,
    customer: { id: userId, fullName: name, phone, email, createdAt: new Date().toISOString() },
    password: pass,
    // Supabase đang bật xác nhận email thì tài khoản tạo bằng đăng ký thường chưa đăng nhập được ngay
    needsConfirmation: !deps.canManageUsers && !session,
  };
}

const readBody = (req) => (req.body && typeof req.body === 'object' ? req.body : {});

async function requireAdmin(req, res) {
  const user = await getRequestUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập tài khoản quản trị.' });
    return null;
  }
  if (!user.isAdmin) {
    res.status(403).json({ success: false, message: 'Chỉ nhân viên mới được đặt phòng hộ khách.' });
    return null;
  }
  return user;
}

// GET|POST /api/auth/phone?action=customers
export async function handleListCustomers(req, res) {
  if (!(await requireAdmin(req, res))) return;
  const customers = await listCustomerAccounts(getBearerToken(req));
  return res.status(200).json({ success: true, customers });
}

// POST /api/auth/phone?action=create-customer { fullName, phone, password? }
export async function handleCreateCustomer(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  if (!(await requireAdmin(req, res))) return;
  const result = await createCustomerAccount(readBody(req), getBearerToken(req));
  if (!result.ok) {
    return res.status(result.status).json({ success: false, message: result.message, existing: result.existing || null });
  }
  return res.status(200).json({ success: true, customer: result.customer, password: result.password, needsConfirmation: result.needsConfirmation });
}
