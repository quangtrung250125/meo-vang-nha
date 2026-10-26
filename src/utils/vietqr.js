// Tạo nội dung mã QR chuyển khoản theo chuẩn VietQR (EMVCo của NAPAS),
// quét được bằng mọi app ngân hàng Việt Nam

const field = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`;

export const crc16 = (text) => {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

// Nội dung chuyển khoản chỉ nên có chữ không dấu, số và khoảng trắng
const cleanMemo = (memo) => String(memo || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .replace(/[^A-Za-z0-9 -]/g, '').slice(0, 25);

export const isPaymentAccountReady = (account) => Boolean(
  account && /^\d{6}$/.test(account.bankBin || '') && account.accountNumber,
);

export function buildVietQrPayload({ bankBin, accountNumber, amount, memo }) {
  const merchant = field('00', 'A000000727')
    + field('01', field('00', bankBin) + field('01', String(accountNumber)))
    + field('02', 'QRIBFTTA');
  const roundedAmount = Math.round(Number(amount) || 0);
  const note = cleanMemo(memo);

  const payload = field('00', '01')
    + field('01', roundedAmount > 0 ? '12' : '11')
    + field('38', merchant)
    + field('53', '704')
    + (roundedAmount > 0 ? field('54', String(roundedAmount)) : '')
    + field('58', 'VN')
    + (note ? field('62', field('08', note)) : '')
    + '6304';
  return payload + crc16(payload);
}
