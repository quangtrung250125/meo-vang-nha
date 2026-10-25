import { describe, expect, it } from 'vitest';
import { getAdminEmails, isAdminUser } from '../../src/utils/adminAccess';

describe('Nhận diện tài khoản admin', () => {
  const admins = getAdminEmails({ emails: 'Boss@MeoVangNha.vn', phones: '0962 606 249, 0912-345-678' });

  it('nhận admin theo số điện thoại (tài khoản đăng ký bằng SĐT)', () => {
    expect(isAdminUser({ email: '0962606249@meovangnha.vn' }, admins)).toBe(true);
    expect(isAdminUser({ email: '0912345678@meovangnha.vn' }, admins)).toBe(true);
  });

  it('nhận admin theo email, không phân biệt hoa thường', () => {
    expect(isAdminUser({ email: 'boss@meovangnha.vn' }, admins)).toBe(true);
  });

  it('nhận admin theo app_metadata.role', () => {
    expect(isAdminUser({ email: 'x@y.vn', app_metadata: { role: 'admin' } }, [])).toBe(true);
  });

  it('không tin số điện thoại khách tự khai trong user_metadata', () => {
    expect(isAdminUser({ email: 'khac@gmail.com', user_metadata: { phone: '0962606249' } }, admins)).toBe(false);
  });

  it('không có danh sách admin thì chỉ email admin chung của nhóm là admin', () => {
    expect(isAdminUser({ email: '0962606249@meovangnha.vn' }, getAdminEmails())).toBe(false);
    expect(isAdminUser({ email: 'khach@gmail.com' }, getAdminEmails())).toBe(false);
    expect(isAdminUser({ email: 'MeoVangNha@gmail.com' }, getAdminEmails())).toBe(true);
  });
});
