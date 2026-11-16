// Quy tắc khách đổi phòng / đổi gói trong suốt kỳ lưu trú:
// - Lần đổi đầu tiên khách tự đổi, áp dụng ngay.
// - Lần thứ 2 và thứ 3 khách gửi yêu cầu, nhân viên chấp nhận hoặc từ chối (kèm lý do).
// - Tối đa 3 lần đổi cho một đơn, từ lần thứ 4 không đổi được nữa.
// Gia hạn ở đúng phòng & gói đang ở không tính là đổi. Gia hạn sang phòng / gói khác thì tính là 1 lần đổi.

import { getStaySegments } from './staySegments.js';

export const MAX_STAY_CHANGES = 3;
export const SELF_STAY_CHANGES = 1;

export const STAY_CHANGE_RULE_TEXT = 'Quy tắc đổi phòng / đổi gói: bạn được tự đổi 1 lần. Từ lần thứ 2, yêu cầu đổi cần nhân viên xác nhận. Mỗi đơn chỉ được đổi tối đa 3 lần trong suốt kỳ lưu trú.';

export const REQUEST_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' };

const pkgKey = (s) => s?.packageId || s?.packageName || '';
const sameRoomAndPackage = (a, b) => Boolean(a && b) && a.roomId === b.roomId && pkgKey(a) === pkgKey(b);

/**
 * Lịch mới có đổi phòng hoặc đổi gói so với lịch cũ không.
 * Những đêm đã có: phòng hoặc gói khác là đổi. Những đêm gia hạn thêm: so với chặng cuối của lịch cũ.
 */
export function isRoomOrPackageChange(oldSegments = [], newSegments = []) {
  if (!oldSegments.length) return false;
  const last = oldSegments[oldSegments.length - 1];
  return newSegments.some((s) => {
    const overlaps = oldSegments.filter((o) => o.from < s.to && s.from < o.to);
    if (overlaps.some((o) => !sameRoomAndPackage(o, s))) return true;
    // Phần nằm sau ngày đón cũ là gia hạn
    return s.to > last.to && !sameRoomAndPackage(last, s);
  });
}

/** Số lần đổi phòng / gói đã được áp dụng cho đơn (tự đổi + nhân viên đã chấp nhận) */
export const countStayChanges = (booking) => (booking?.stayChanges || []).filter((c) => c?.roomChange).length;

export const stayChangeRequestsOf = (booking) => (Array.isArray(booking?.stayChangeRequests) ? booking.stayChangeRequests : []);

export const pendingStayChangeRequest = (booking) =>
  stayChangeRequestsOf(booking).find((r) => r?.status === REQUEST_STATUS.PENDING) || null;

export const lastDecidedStayChangeRequest = (booking) =>
  [...stayChangeRequestsOf(booking)].reverse().find((r) => r?.status === REQUEST_STATUS.APPROVED || r?.status === REQUEST_STATUS.REJECTED) || null;

/**
 * Khách đổi phòng / gói lần tới thì đi theo đường nào:
 * - 'self': tự đổi ngay (lần đầu)
 * - 'request': gửi yêu cầu chờ nhân viên (lần 2, 3)
 * - 'waiting': đang có yêu cầu chờ nhân viên, chưa gửi thêm được
 * - 'blocked': đã đổi đủ 3 lần
 */
export function stayChangeQuota(booking) {
  const used = countStayChanges(booking);
  const pending = pendingStayChangeRequest(booking);
  const remaining = Math.max(0, MAX_STAY_CHANGES - used);
  let mode = 'request';
  if (used >= MAX_STAY_CHANGES) mode = 'blocked';
  else if (pending) mode = 'waiting';
  else if (used < SELF_STAY_CHANGES) mode = 'self';
  return { used, remaining, pending, mode, nextNumber: used + 1 };
}

/** Lịch mới của khách có phải đổi phòng / gói so với đơn hiện tại */
export const planIsRoomChange = (booking, segments) => isRoomOrPackageChange(getStaySegments(booking), segments || []);
