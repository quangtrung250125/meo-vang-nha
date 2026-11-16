// Nhân viên đặt phòng hộ khách đến cửa hàng.
// - Khách đã có tài khoản: đơn tạo ra ở trạng thái "chờ khách xác nhận" (pending_changes.type = CONFIRM_BOOKING),
//   vẫn giữ chỗ trong phòng để không bị người khác đặt mất, nhưng chưa Check-in được và chưa tính doanh thu.
//   Khách bấm Xác nhận thì đơn mới được ghi nhận, bấm Từ chối thì đơn bị hủy.
// - Khách mới: nhân viên tạo tài khoản ngay tại quầy rồi đặt luôn, đơn được ghi nhận ngay (khách đang có mặt).

import { PROPOSAL_TYPE } from './bookingStatus.js';

// Khách có 24 giờ để xác nhận đơn nhân viên đặt hộ, quá hạn thì nhân viên được hủy để trả phòng
export const CONFIRM_DEADLINE_HOURS = 24;

export const isAwaitingCustomerConfirm = (booking) =>
  booking?.pending_changes?.type === PROPOSAL_TYPE.CONFIRM_BOOKING;

export const isConfirmOverdue = (booking, now = Date.now()) => {
  if (!isAwaitingCustomerConfirm(booking)) return false;
  const due = Date.parse(booking.pending_changes.dueAt || '');
  return Number.isFinite(due) && now > due;
};

/**
 * Yêu cầu khách xác nhận đơn nhân viên vừa đặt hộ (lưu vào booking.pending_changes).
 */
export function buildConfirmRequest({ staffName = '', now = new Date() } = {}) {
  const timestamp = now.toISOString();
  return {
    type: PROPOSAL_TYPE.CONFIRM_BOOKING,
    proposedBy: 'admin',
    staffName: String(staffName || '').slice(0, 80),
    reason: 'Nhân viên Mèo Vắng Nhà đã đặt phòng giúp bạn tại cửa hàng. Vui lòng kiểm tra và xác nhận để đơn được ghi nhận.',
    timestamp,
    dueAt: new Date(now.getTime() + CONFIRM_DEADLINE_HOURS * 3600 * 1000).toISOString(),
  };
}

// Dữ liệu đơn nhân viên đặt hộ: ghi chủ đơn là khách đã chọn, không phải tài khoản nhân viên
export function assistedOwnerFields(customer, { staffName = '', isNewAccount = false } = {}) {
  if (!customer) return {};
  return {
    ownerName: customer.fullName || 'Khách hàng',
    ownerPhone: customer.phone || '',
    customerName: customer.fullName || 'Khách hàng',
    customerPhone: customer.phone || '',
    customerEmail: customer.email || '',
    customerId: customer.id,
    bookedByStaff: {
      name: String(staffName || '').slice(0, 80),
      at: new Date().toISOString(),
      newAccount: Boolean(isNewAccount),
    },
  };
}
