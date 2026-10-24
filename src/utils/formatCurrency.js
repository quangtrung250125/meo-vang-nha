export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    const parsed = Number(amount);
    if (isNaN(parsed)) return '0đ';
    amount = parsed;
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default formatCurrency;
