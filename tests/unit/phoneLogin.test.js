import { afterEach, describe, expect, it } from 'vitest';
import {
  findAccountEmailsByPhone,
  handlePhoneCheck,
  handlePhoneLogin,
  normalizeVnPhone,
  setPhoneLoginDeps,
} from '../../api/lib/phoneLogin.js';

// Tài khoản giả trên "Supabase": email -> { password, phone }
const ACCOUNTS = {
  'lan@gmail.com': { password: 'matkhau-lan', phone: '0912 345 678' },
  '0987654321@meovangnha.vn': { password: 'matkhau-sdt', phone: '0987654321' },
  'cu@gmail.com': { password: 'matkhau-cu', phone: '+84 933 111 222' },
};

const mockDeps = ({ profiles = [], canListUsers = true } = {}) => ({
  canListUsers,
  admin: {
    from: () => ({
      select: () => ({
        ilike: async () => ({ data: profiles }),
      }),
    }),
    auth: {
      admin: {
        listUsers: async () => ({
          data: { users: Object.entries(ACCOUNTS).map(([email, a]) => ({ email, user_metadata: { phone: a.phone } })) },
        }),
      },
    },
  },
  signIn: async (email, password) =>
    ACCOUNTS[email]?.password === password
      ? { data: { session: { access_token: `at-${email}`, refresh_token: `rt-${email}` } }, error: null }
      : { data: {}, error: { message: 'Invalid login credentials' } },
});

const call = async (handler, body) => {
  const res = {
    statusCode: 200,
    payload: undefined,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.payload = obj; return this; },
  };
  await handler({ method: 'POST', body }, res);
  return res;
};

afterEach(() => setPhoneLoginDeps(null));

describe('Chuẩn hóa số điện thoại', () => {
  it.each([
    ['0912 345 678', '0912345678'],
    ['+84 912 345 678', '0912345678'],
    ['84912345678', '0912345678'],
    ['0912.345.678', '0912345678'],
  ])('%s -> %s', (raw, expected) => {
    expect(normalizeVnPhone(raw)).toBe(expected);
  });
});

describe('Đăng nhập bằng số điện thoại trên mọi thiết bị', () => {
  it('khách đăng ký có email thật vẫn đăng nhập được bằng SĐT', async () => {
    setPhoneLoginDeps(mockDeps());
    const res = await call(handlePhoneLogin, { phone: '0912345678', password: 'matkhau-lan' });
    expect(res.statusCode).toBe(200);
    expect(res.payload.session.access_token).toBe('at-lan@gmail.com');
  });

  it('khách đăng ký chỉ bằng SĐT đăng nhập được', async () => {
    setPhoneLoginDeps(mockDeps());
    const res = await call(handlePhoneLogin, { phone: '0987 654 321', password: 'matkhau-sdt' });
    expect(res.statusCode).toBe(200);
  });

  it('nhập SĐT dạng +84 vẫn khớp tài khoản lưu dạng khác', async () => {
    setPhoneLoginDeps(mockDeps());
    const res = await call(handlePhoneLogin, { phone: '0933111222', password: 'matkhau-cu' });
    expect(res.statusCode).toBe(200);
  });

  it('không có service role vẫn tìm được qua bảng customer_profiles', async () => {
    setPhoneLoginDeps(mockDeps({ canListUsers: false, profiles: [{ email: 'lan@gmail.com', phone: '0912345678' }] }));
    const res = await call(handlePhoneLogin, { phone: '0912345678', password: 'matkhau-lan' });
    expect(res.statusCode).toBe(200);
  });

  it('sai mật khẩu thì báo lỗi và không lộ email', async () => {
    setPhoneLoginDeps(mockDeps());
    const res = await call(handlePhoneLogin, { phone: '0912345678', password: 'sai' });
    expect(res.statusCode).toBe(401);
    expect(JSON.stringify(res.payload)).not.toContain('lan@gmail.com');
  });

  it('SĐT không hợp lệ bị từ chối', async () => {
    setPhoneLoginDeps(mockDeps());
    const res = await call(handlePhoneLogin, { phone: '123', password: 'x' });
    expect(res.statusCode).toBe(400);
  });

  it('luôn thử cả email ẩn của SĐT', async () => {
    setPhoneLoginDeps(mockDeps({ canListUsers: false }));
    expect(await findAccountEmailsByPhone('0900000000')).toEqual(['0900000000@meovangnha.vn']);
  });
});

describe('Không cho đăng ký trùng số điện thoại', () => {
  it('báo SĐT đã dùng', async () => {
    setPhoneLoginDeps(mockDeps());
    const res = await call(handlePhoneCheck, { phone: '+84912345678' });
    expect(res.payload.taken).toBe(true);
  });

  it('SĐT mới thì cho đăng ký', async () => {
    setPhoneLoginDeps(mockDeps());
    const res = await call(handlePhoneCheck, { phone: '0901234567' });
    expect(res.payload.taken).toBe(false);
  });
});
