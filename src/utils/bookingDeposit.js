// Quy định đặt cọc: đặt trước hơn 5 ngày so với ngày gửi bé thì phải cọc 50% mới nhận mã đặt phòng.
// Dùng chung cho giao diện đặt phòng và server (api/_lib/bookingsService.js).

export const DEPOSIT_RATE = 0.5;
export const DEPOSIT_FREE_MAX_DAYS = 5;

export const PAYMENT_STATUS = {
  AWAITING_DEPOSIT: 'awaiting_deposit', // Chờ đặt cọc: giữ phòng, chưa cấp mã
  DEPOSIT_PAID: 'deposit_paid',         // Đã nhận cọc
  PAY_AT_CHECKIN: 'pay_at_checkin',     // Không cần cọc, thanh toán khi gửi/đón bé
};

// Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD
export const todayInVietnam = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);

const toUtcDay = (dateStr) => {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

// Số ngày từ ngày đặt đến ngày gửi bé (nhận phòng)
export const daysUntilCheckIn = (checkIn, todayStr = todayInVietnam()) => {
  if (!checkIn || !todayStr) return 0;
  return Math.round((toUtcDay(checkIn) - toUtcDay(todayStr)) / 86400000);
};

export function getDepositPolicy({ checkIn, total, todayStr = todayInVietnam() }) {
  const leadDays = daysUntilCheckIn(checkIn, todayStr);
  const required = leadDays > DEPOSIT_FREE_MAX_DAYS;
  return {
    leadDays,
    required,
    amount: required ? Math.round((Number(total) || 0) * DEPOSIT_RATE) : 0,
    paymentStatus: required ? PAYMENT_STATUS.AWAITING_DEPOSIT : PAYMENT_STATUS.PAY_AT_CHECKIN,
  };
}

// Đơn đã được cấp mã đặt phòng chưa (đơn cũ không có paymentStatus coi như đã có mã)
export const hasBookingCode = (booking) => booking?.paymentStatus !== PAYMENT_STATUS.AWAITING_DEPOSIT;
