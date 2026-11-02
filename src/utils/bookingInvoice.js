// Hóa đơn của một đơn gửi mèo, tự tính lại mỗi khi khách cập nhật yêu cầu trên giao diện khách hàng
// (thêm dịch vụ, đổi lịch) hoặc khi Admin check-out sớm. Không cần ai chỉnh tay số tiền.
// Doanh thu cuối cùng của đơn = invoice.total, chỉ ghi nhận khi đã thanh toán đủ và đã check-out.

import { todayInVietnam } from './bookingDeposit.js';

const PAID_LABEL = 'Đã thanh toán';
const COMPLETED = ['check-out', 'đã hoàn tất', 'hoàn tất', 'completed', 'đã hoàn thành'];
const CANCELLED = ['cancelled', 'đã hủy', 'đã huỷ'];

const toUtcDay = (dateStr) => {
  const [y, m, d] = String(dateStr || '').slice(0, 10).split('-').map(Number);
  return y && m && d ? Date.UTC(y, m - 1, d) : NaN;
};

// Số đêm giữa 2 ngày YYYY-MM-DD (ít nhất 1 đêm, giống cách tính khi đặt phòng)
export const nightsBetween = (from, to) => {
  const diff = Math.round((toUtcDay(to) - toUtcDay(from)) / 86400000);
  return Number.isFinite(diff) && diff > 0 ? diff : 1;
};

// '+15.000đ/ngày' -> 15000; 'Tư vấn' -> null (chưa có giá)
export const parseAddonPrice = (price) => {
  if (typeof price === 'number') return price;
  const digits = String(price || '').replace(/\D/g, '');
  return digits ? Number(digits) : null;
};

const isoDay = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const t = new Date(value);
  return Number.isNaN(t.getTime()) ? null : todayInVietnam(t);
};

const statusOf = (booking) => String(booking?.status || '').trim().toLowerCase();

/**
 * @param {object} booking đơn đặt phòng
 * @param {object} [addonCatalog] danh mục dịch vụ thêm (ADDONS ở components/ServiceManagement) để tra tên/giá
 *   cho các yêu cầu cũ chưa lưu sẵn giá
 */
export function buildInvoice(booking, addonCatalog = {}) {
  if (!booking) return null;
  const baseTotal = Number(booking.baseTotalPrice ?? booking.totalPrice) || 0;
  const checkIn = booking.checkIn;
  const plannedCheckOut = booking.checkOut;
  const bookedCheckIn = booking.originalCheckIn || checkIn;
  const bookedCheckOut = booking.originalCheckOut || plannedCheckOut;
  const bookedNights = nightsBetween(bookedCheckIn, bookedCheckOut);

  // Giá phòng 1 đêm (cho tất cả các bé) để tính thêm/bớt khi đổi lịch hoặc trả mèo sớm
  const cats = Math.max(1, Number(booking.cats) || (booking.petIds || []).length || 1);
  const lodgingPrice = Number(booking.selectedLodging?.price || booking.selectedPackage?.price) || 0;
  const nightly = lodgingPrice > 0 ? lodgingPrice * cats : Math.round(baseTotal / bookedNights);

  // Khách xin gia hạn ở trang Theo dõi lưu trú: ngày đón dự kiến lùi lại (trừ khi Admin từ chối)
  const extensions = (booking.extensions || []).filter((e) => e && e.status !== 'rejected');
  const extendedCheckOut = extensions
    .map((e) => e.newCheckOut)
    .filter(Boolean)
    .reduce((latest, d) => (toUtcDay(d) > toUtcDay(latest) ? d : latest), plannedCheckOut);

  const isCompleted = COMPLETED.includes(statusOf(booking));
  const checkedOutDay = isoDay(booking.checkedOutAt);
  const earlyCheckOut = isCompleted && checkedOutDay && checkIn && toUtcDay(checkedOutDay) < toUtcDay(extendedCheckOut)
    ? checkedOutDay
    : null;
  const endDay = earlyCheckOut || extendedCheckOut;
  const actualNights = nightsBetween(checkIn, endDay);

  const lines = [{
    key: 'base',
    kind: 'base',
    label: `Đơn đặt ban đầu (${bookedNights} đêm${cats > 1 ? ` × ${cats} bé` : ''})`,
    detail: (booking.packages || []).join(', ') || booking.selectedPackage?.name || '',
    amount: baseTotal,
  }];
  const changes = [];

  const plannedNights = nightsBetween(checkIn, plannedCheckOut);
  if (plannedNights !== bookedNights) {
    const diff = plannedNights - bookedNights;
    lines.push({
      key: 'reschedule',
      kind: 'reschedule',
      label: `Đổi lịch: ${diff > 0 ? 'thêm' : 'bớt'} ${Math.abs(diff)} đêm`,
      detail: `${bookedCheckIn} → ${bookedCheckOut} thành ${checkIn} → ${plannedCheckOut}`,
      amount: diff * nightly,
    });
  }
  if (booking.rescheduledAt) {
    changes.push({ at: booking.rescheduledAt, text: `Đổi lịch gửi mèo sang ${checkIn} → ${plannedCheckOut}` });
  }

  (booking.extensions || []).forEach((ext) => {
    if (!ext) return;
    const status = ext.status || 'pending';
    changes.push({
      at: ext.timestamp,
      text: `Khách xin gia hạn ${ext.days} ngày (đón ngày ${ext.newCheckOut})${status === 'rejected' ? ' (Admin đã từ chối)' : status === 'pending' ? ' (chờ Admin duyệt)' : ''}${ext.note ? `: ${ext.note}` : ''}`,
    });
    if (status === 'rejected') return;
    const days = Number(ext.days) || 0;
    const perDay = Number(ext.pricePerDay) || nightly;
    lines.push({
      key: `extend-${ext.id}`,
      kind: 'extend',
      label: `Gia hạn thêm ${days} ngày`,
      detail: `${perDay.toLocaleString('vi-VN')}đ × ${days} ngày · đón ngày ${ext.newCheckOut}${status === 'pending' && !isCompleted ? ' · chờ Admin duyệt' : ''}`,
      amount: Number(ext.amount) || perDay * days,
      pending: status === 'pending' && !isCompleted,
    });
  });

  const extendedNights = Math.max(0, nightsBetween(checkIn, extendedCheckOut) - plannedNights);
  const lastExt = extensions[extensions.length - 1];
  const extPerDay = Number(lastExt?.pricePerDay) || nightly;
  const refundForNights = (n) => {
    const fromExtension = Math.min(n, extendedNights);
    return fromExtension * extPerDay + (n - fromExtension) * nightly;
  };

  if (earlyCheckOut) {
    const fewer = nightsBetween(checkIn, extendedCheckOut) - actualNights;
    if (fewer > 0) {
      lines.push({
        key: 'early',
        kind: 'early',
        label: `Trả mèo sớm: bớt ${fewer} đêm`,
        detail: `Đón ngày ${earlyCheckOut} thay vì ${extendedCheckOut}`,
        // Những đêm bớt đi nằm trong phần gia hạn thì hoàn theo giá gia hạn, còn lại theo giá phòng
        amount: -refundForNights(fewer),
      });
      changes.push({ at: booking.checkedOutAt, text: `Check-out sớm ngày ${earlyCheckOut}` });
    }
  }

  (booking.addons || []).forEach((addon) => {
    const def = addonCatalog[addon.type];
    const option = def?.options?.find((o) => o.value === addon.option);
    const title = addon.title || def?.title || 'Dịch vụ thêm';
    const optionLabel = addon.label || option?.label || addon.option || '';
    const requestedAt = addon.timestamp || addon.requestedAt;
    const status = addon.status || 'pending';
    changes.push({
      at: requestedAt,
      text: `Khách yêu cầu "${title}: ${optionLabel}"${status === 'rejected' ? ' (Admin đã từ chối)' : status === 'pending' ? ' (chờ Admin duyệt)' : ''}`,
    });
    if (status === 'rejected') return;

    const perDay = parseAddonPrice(addon.price ?? option?.price);
    // Tính từ ngày khách yêu cầu (không sớm hơn ngày gửi mèo) đến ngày đón thực tế
    const startDay = [isoDay(requestedAt), checkIn].filter(Boolean).sort().pop();
    const days = nightsBetween(startDay, endDay);
    lines.push({
      key: `addon-${addon.id}`,
      kind: 'addon',
      label: `${title}: ${optionLabel}`,
      detail: perDay === null
        ? 'Chưa có giá, nhân viên báo giá sau'
        : `${perDay.toLocaleString('vi-VN')}đ × ${days} ngày${status === 'pending' && !isCompleted ? ' · chờ Admin duyệt' : ''}`,
      amount: perDay === null ? 0 : perDay * days,
      pending: status === 'pending' && !isCompleted,
    });
  });

  if (booking.specialNote) {
    changes.push({ at: booking.noteUpdatedAt, text: `Yêu cầu đặc biệt: ${booking.specialNote}` });
  }
  changes.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));

  const total = Math.max(0, lines.reduce((sum, l) => sum + l.amount, 0));
  const isPaid = String(booking.paymentStatus || '').trim() === PAID_LABEL;
  // Đơn cũ đã thanh toán nhưng chưa lưu số tiền: coi như đã trả đủ
  const paidAmount = isPaid ? Number(booking.paidAmount ?? total) || 0 : 0;
  const depositPaid = !isPaid && booking.paymentStatus === 'deposit_paid' ? Number(booking.depositAmount) || 0 : 0;
  const received = isPaid ? paidAmount : depositPaid;

  return {
    code: booking.code || booking.id,
    checkIn,
    checkOut: endDay,
    nights: actualNights,
    nightly,
    lines,
    changes,
    total,
    baseTotal,
    paidAmount,
    depositPaid,
    received,
    outstanding: Math.max(0, total - received),
    isPaidInFull: isPaid && paidAmount >= total,
    isCompleted,
    isCancelled: CANCELLED.includes(statusOf(booking)),
  };
}
