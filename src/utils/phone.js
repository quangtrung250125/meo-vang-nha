// Chuẩn hóa số điện thoại Việt Nam về dạng 0xxxxxxxxx (bỏ khoảng trắng, dấu, đổi +84/84 thành 0)
export const normalizeVnPhone = (raw = '') => {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.startsWith('84') && digits.length === 11 ? `0${digits.slice(2)}` : digits;
};
