// Quy định đặt cọc: gửi bé từ 5 ngày trở lên (tính theo số ngày gửi) thì phải cọc 50% mới nhận mã đặt phòng.
// Dùng chung cho giao diện đặt phòng, chỉnh sửa đơn và server (api/_lib/bookingsService.js).

export const DEPOSIT_RATE = 0.5;
export const DEPOSIT_MIN_STAY_DAYS = 5;

export const PAYMENT_STATUS = {
  AWAITING_DEPOSIT: 'awaiting_deposit', // Chờ đặt cọc: giữ phòng, chưa cấp mã
  AWAITING_TOP_UP: 'awaiting_deposit_topup', // Đã có mã, khách sửa đơn nên cần cọc bổ sung phần chênh lệch
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

// Số ngày gửi bé, ít nhất 1 ngày (giống cách tính tiền ở bookingPricing.countStayDays)
export const stayDaysOf = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = Math.round((toUtcDay(checkOut) - toUtcDay(checkIn)) / 86400000);
  return Number.isFinite(diff) && diff > 0 ? diff : 1;
};

export function getDepositPolicy({ checkIn, checkOut, total }) {
  const stayDays = stayDaysOf(checkIn, checkOut);
  const required = stayDays >= DEPOSIT_MIN_STAY_DAYS;
  return {
    stayDays,
    required,
    amount: required ? Math.round((Number(total) || 0) * DEPOSIT_RATE) : 0,
    paymentStatus: required ? PAYMENT_STATUS.AWAITING_DEPOSIT : PAYMENT_STATUS.PAY_AT_CHECKIN,
  };
}

// Đơn đã được cấp mã đặt phòng chưa (đơn cũ không có paymentStatus coi như đã có mã)
export const hasBookingCode = (booking) => booking?.paymentStatus !== PAYMENT_STATUS.AWAITING_DEPOSIT;

const AWAITING_STATUSES = [PAYMENT_STATUS.AWAITING_DEPOSIT, PAYMENT_STATUS.AWAITING_TOP_UP];

// Đơn đang chờ khách chuyển cọc (lần đầu hoặc cọc bổ sung)
export const isAwaitingDeposit = (booking) => AWAITING_STATUSES.includes(booking?.paymentStatus);

// Tiền cọc khách đã chuyển (đơn thanh toán đủ không tính ở đây)
export function depositReceivedOf(booking) {
  const received = Number(booking?.depositReceivedAmount) || 0;
  if (booking?.paymentStatus === PAYMENT_STATUS.DEPOSIT_PAID) return Math.max(received, Number(booking.depositAmount) || 0);
  return isAwaitingDeposit(booking) ? received : 0;
}

// Số tiền cọc khách còn phải chuyển
export const depositToTransferOf = (booking) =>
  isAwaitingDeposit(booking)
    ? Math.max(0, (Number(booking.depositAmount) || 0) - (Number(booking.depositReceivedAmount) || 0))
    : 0;

/**
 * Tiền cọc sau khi khách chỉnh sửa đơn (đổi lịch, phòng, số mèo, gói dịch vụ).
 * - Gửi từ 5 ngày: cọc 50% tổng mới. Cọc đủ thì giữ "đã cọc". Chưa đủ thì đơn đã có mã vẫn giữ mã và
 *   chờ cọc bổ sung phần chênh lệch, đơn chưa có mã tiếp tục chờ cọc (hạn 24 giờ như cũ).
 * - Dưới 5 ngày: không bắt buộc cọc, tiền cọc đã chuyển (nếu có) vẫn được trừ khi thanh toán.
 * Đơn đã thanh toán đủ thì giữ nguyên, hóa đơn tự hiện phần còn thiếu.
 */
export function getEditedDepositState({ booking, checkIn, checkOut, total }) {
  if (booking?.paymentStatus === 'Đã thanh toán') return {};
  const policy = getDepositPolicy({ checkIn, checkOut, total });
  const received = depositReceivedOf(booking);
  if (!policy.required) {
    return received > 0
      ? { depositRequired: false, depositAmount: received, depositReceivedAmount: received, paymentStatus: PAYMENT_STATUS.DEPOSIT_PAID }
      : { depositRequired: false, depositAmount: 0, paymentStatus: PAYMENT_STATUS.PAY_AT_CHECKIN };
  }
  if (received >= policy.amount) {
    return { depositRequired: true, depositAmount: received, depositReceivedAmount: received, paymentStatus: PAYMENT_STATUS.DEPOSIT_PAID };
  }
  return {
    depositRequired: true,
    depositAmount: policy.amount,
    depositReceivedAmount: received,
    paymentStatus: hasBookingCode(booking) ? PAYMENT_STATUS.AWAITING_TOP_UP : PAYMENT_STATUS.AWAITING_DEPOSIT,
  };
}

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
