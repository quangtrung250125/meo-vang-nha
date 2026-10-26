import { describe, expect, it } from 'vitest';
import { buildVietQrPayload, crc16, isPaymentAccountReady } from '../../src/utils/vietqr';

describe('Mã QR chuyển khoản VietQR', () => {
  it('tính CRC16-CCITT đúng chuẩn', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('điền số tiền và nội dung chuyển khoản là mã đặt phòng', () => {
    const payload = buildVietQrPayload({ bankBin: '970436', accountNumber: '0123456789', amount: 894000, memo: 'MVN-12345' });
    expect(payload.startsWith('000201010212')).toBe(true);
    expect(payload).toContain('0006970436');
    expect(payload).toContain('01100123456789');
    expect(payload).toContain('5406894000');
    expect(payload).toContain('62130809MVN-12345');
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });

  it('chưa có số tài khoản thì chưa tạo QR', () => {
    expect(isPaymentAccountReady({ bankBin: '', accountNumber: '' })).toBe(false);
    expect(isPaymentAccountReady({ bankBin: '970436', accountNumber: '0123456789' })).toBe(true);
  });
});
