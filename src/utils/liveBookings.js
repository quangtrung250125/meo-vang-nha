// Đồng bộ đơn trong trình duyệt (Lịch đặt của khách) với kho phòng trên server (/api/bookings, tải lại mỗi 2 giây).
// Admin đổi đơn ở máy khác (đề xuất hủy / đổi lịch, Check-in, Check-out, xác nhận cọc) thì khách chỉ chắc chắn
// nhận được qua đây: kênh broadcast chỉ tới khi khách đang mở web, còn Supabase có thể chưa kịp ghi.

import { isClosedStatus } from './bookingStatus.js';

// Đơn vừa sửa trên máy này thì tạm chưa lấy theo server (server có thể chưa kịp nhận thay đổi)
export const LOCAL_FRESH_MS = 5000;

// Trường Admin / server đổi mà trang khách cần thấy ngay
const LIVE_FIELDS = [
  'status', 'checkedInAt',
  'paymentStatus', 'depositAmount', 'depositRequired', 'depositDueAt', 'depositReceivedAmount', 'depositPaidAt',
];

// Khách chỉnh sửa đơn ở máy khác: Admin (và các máy khác của khách) nhận đơn mới + thông báo chỉnh sửa
const EDIT_FIELDS = [
  'checkIn', 'checkOut', 'originalCheckIn', 'originalCheckOut', 'rescheduledAt',
  'roomId', 'selectedRoom', 'cats', 'petIds', 'petProfiles', 'catNames',
  'packages', 'selectedPackage', 'selectedLodging', 'selectedSpa', 'selectedExtra', 'hasCamera', 'addCamera',
  'totalPrice', 'totalAmount', 'baseTotalPrice', 'pricingAdjustments', 'editedAt', 'lastEditSummary',
];

// Đơn đã kết thúc (Check-out / hủy) server không còn giữ trong kho phòng, chỉ trả về các trường này
export const CLOSED_FIELDS = ['status', 'cancelReason', 'cancelledAt', 'cancelledBy', 'checkedOutAt', 'checkOutNote'];

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const timeOf = (iso) => {
  const t = Date.parse(iso || '');
  return Number.isNaN(t) ? 0 : t;
};

/**
 * So đơn trong trình duyệt với bản mới nhất trên server.
 * @param {object} local đơn trong "Lịch đặt" của trình duyệt
 * @param {{ live?: object, closed?: object, now?: number }} server bản trong kho phòng, hoặc bản đã kết thúc
 * @returns {object|null} các trường cần cập nhật, null nếu đã khớp
 */
export function getLiveBookingUpdates(local, { live = null, closed = null, now = Date.now() } = {}) {
  if (!local || (!live && !closed)) return null;
  if (isClosedStatus(local.status)) return null;
  if (now - timeOf(local.updatedAt) < LOCAL_FRESH_MS) return null;

  const updates = {};
  if (closed) {
    CLOSED_FIELDS.forEach((key) => {
      if (closed[key] !== undefined && !same(local[key], closed[key])) updates[key] = closed[key];
    });
    if (local.pending_changes) updates.pending_changes = null;
  } else {
    LIVE_FIELDS.forEach((key) => {
      if (live[key] === undefined || same(local[key], live[key])) return;
      // Khách thanh toán đủ được ghi riêng ở trình duyệt, không để trạng thái cọc trên server đè lại
      if (key === 'paymentStatus' && local.paymentStatus === 'Đã thanh toán') return;
      updates[key] = live[key];
    });
    if ('pending_changes' in live && !same(local.pending_changes, live.pending_changes)) {
      updates.pending_changes = live.pending_changes ?? null;
    }
    // Chỉ lấy nội dung chỉnh sửa khi bản trên server được sửa sau bản trong trình duyệt
    if (live.editedAt && timeOf(live.editedAt) > timeOf(local.editedAt)) {
      EDIT_FIELDS.forEach((key) => {
        if (live[key] !== undefined && !same(local[key], live[key])) updates[key] = live[key];
      });
    }
  }
  return Object.keys(updates).length > 0 ? updates : null;
}

/**
 * Đề xuất Admin đang chờ khách: lấy theo bản cập nhật sau cùng giữa "Lịch đặt" và kho phòng.
 * Lịch đặt không có đề xuất mà kho phòng có thì chỉ bỏ khi lịch đặt được cập nhật sau lúc gửi đề xuất
 * (khách đã trả lời hoặc admin đã rút lại), để bản cũ trong trình duyệt không xóa mất đề xuất mới.
 */
export function latestPendingChanges(historyBooking, roomBooking) {
  const fromHistory = historyBooking?.pending_changes || null;
  const fromRoom = roomBooking?.pending_changes || null;
  if (fromHistory || !fromRoom) return fromHistory;
  return timeOf(historyBooking?.updatedAt) > timeOf(fromRoom.timestamp) ? null : fromRoom;
}
