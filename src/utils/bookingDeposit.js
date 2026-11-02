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

// Khách phải chuyển cọc trong 24 giờ kể từ lúc đặt phòng
export const DEPOSIT_DEADLINE_HOURS = 24;

// Hạn chuyển cọc của đơn (ISO). Đơn cũ chưa có depositDueAt thì tính từ lúc tạo đơn.
export function getDepositDueAt(booking) {
  if (!booking) return null;
  if (booking.depositDueAt) return booking.depositDueAt;
  const created = Date.parse(booking.createdAt || '');
  if (Number.isNaN(created)) return null;
  return new Date(created + DEPOSIT_DEADLINE_HOURS * 3600 * 1000).toISOString();
}

// Đơn chờ cọc đã quá hạn 24 giờ mà chưa nhận đủ cọc
export function isDepositOverdue(booking, now = Date.now()) {
  if (booking?.paymentStatus !== PAYMENT_STATUS.AWAITING_DEPOSIT) return false;
  const due = Date.parse(getDepositDueAt(booking) || '');
  return !Number.isNaN(due) && now >= due;
}

// Giờ:phút ngày/tháng/năm theo giờ Việt Nam, vd "14:30 03/11/2026"
export function formatVietnamDateTime(iso) {
  const t = Date.parse(iso || '');
  if (Number.isNaN(t)) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', hour12: false,
  }).formatToParts(new Date(t));
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('hour')}:${get('minute')} ${get('day')}/${get('month')}/${get('year')}`;
}
