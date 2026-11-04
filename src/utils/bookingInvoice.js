// Hóa đơn của một đơn gửi mèo, tự tính lại mỗi khi khách cập nhật yêu cầu trên giao diện khách hàng
// (thêm dịch vụ, đổi lịch) hoặc khi Admin check-out muộn (check-out sớm không hoàn tiền). Không cần ai chỉnh tay số tiền.
// Doanh thu cuối cùng của đơn = invoice.total, chỉ ghi nhận khi đã thanh toán đủ và đã check-out.

import { todayInVietnam, depositReceivedOf } from './bookingDeposit.js';
import { baseSegmentOf, describeSegment, getStaySegments, nightsOf, sameStay, shortDate } from './staySegments.js';

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
  // Khách tự gia hạn / đổi phòng / đổi gói: lịch theo chặng, ngày đón theo đơn trước khi tự gia hạn là baseCheckOut
  const hasSegments = Array.isArray(booking.staySegments) && booking.staySegments.length > 0;
  const basePlanEnd = hasSegments ? (booking.baseCheckOut || plannedCheckOut) : plannedCheckOut;
  const bookedCheckIn = booking.originalCheckIn || checkIn;
  const bookedCheckOut = booking.originalCheckOut || basePlanEnd;
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
  // Đón muộn hơn ngày hẹn (kể cả ngày gia hạn): tính thêm những đêm ở quá hạn
  const lateCheckOut = isCompleted && checkedOutDay && toUtcDay(checkedOutDay) > toUtcDay(extendedCheckOut)
    ? checkedOutDay
    : null;
  const endDay = earlyCheckOut || lateCheckOut || extendedCheckOut;
  // Đã check-out thì ghi chú đúng hạn / sớm / muộn so với ngày hẹn đón
  const earlyNights = earlyCheckOut ? nightsBetween(checkIn, extendedCheckOut) - nightsBetween(checkIn, earlyCheckOut) : 0;
  const checkOutTiming = !isCompleted || !checkedOutDay
    ? null
    : earlyNights > 0 ? 'early' : lateCheckOut ? 'late' : 'on_time';
  const actualNights = nightsBetween(checkIn, endDay);

  const lines = [{
    key: 'base',
    kind: 'base',
    label: `Đơn đặt ban đầu (${bookedNights} đêm${cats > 1 ? ` × ${cats} bé` : ''})`,
    detail: (booking.packages || []).join(', ') || booking.selectedPackage?.name || '',
    amount: baseTotal,
  }];
  const changes = [];

  const basePlanNights = nightsBetween(checkIn, basePlanEnd);
  if (basePlanNights !== bookedNights) {
    const diff = basePlanNights - bookedNights;
    lines.push({
      key: 'reschedule',
      kind: 'reschedule',
      label: `Đổi lịch: ${diff > 0 ? 'thêm' : 'bớt'} ${Math.abs(diff)} đêm`,
      detail: `${bookedCheckIn} → ${bookedCheckOut} thành ${checkIn} → ${basePlanEnd}`,
      amount: diff * nightly,
    });
  }

  // Lịch lưu trú theo chặng: mỗi khoảng ngày ở phòng nào, gói nào. Đêm nằm trong đơn gốc mà vẫn đúng phòng & gói
  // thì đã có trong "Đơn đặt ban đầu"; đêm đổi phòng / gói thì tính chênh lệch; đêm gia hạn thì tính đủ giá chặng đó.
  const baseSeg = { ...baseSegmentOf(booking, basePlanEnd), pricePerNight: nightly };
  const segments = getStaySegments(booking);
  if (hasSegments) {
    segments.forEach((seg, i) => {
      const price = Number(seg.pricePerNight) || nightly;
      const parts = [
        { kind: 'change', from: seg.from, to: seg.to < basePlanEnd ? seg.to : basePlanEnd },
        { kind: 'extend', from: seg.from > basePlanEnd ? seg.from : basePlanEnd, to: seg.to },
      ];
      parts.forEach((part) => {
        const n = nightsOf(part.from, part.to);
        if (n <= 0) return;
        const range = `${shortDate(part.from)} – ${shortDate(part.to)}`;
        if (part.kind === 'change') {
          if (sameStay(seg, baseSeg)) return;
          const diff = price - nightly;
          lines.push({
            key: `stay-change-${i}`,
            kind: 'stay-change',
            label: `Ngày ${range}: đổi sang ${describeSegment(seg)}`,
            detail: `${n} đêm × chênh lệch ${diff.toLocaleString('vi-VN')}đ (giá mới ${price.toLocaleString('vi-VN')}đ/đêm, đã tính ${nightly.toLocaleString('vi-VN')}đ/đêm trong đơn gốc)`,
            amount: diff * n,
          });
        } else {
          lines.push({
            key: `stay-extend-${i}`,
            kind: 'stay-extend',
            label: `Gia hạn ngày ${range}: ${describeSegment(seg)}`,
            detail: `${n} đêm × ${price.toLocaleString('vi-VN')}đ`,
            amount: price * n,
          });
        }
      });
    });
  }
  (booking.stayChanges || []).forEach((c) => {
    if (c?.text) changes.push({ at: c.at, text: `Khách tự ${c.text}` });
  });
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

  if (earlyCheckOut) {
    const fewer = nightsBetween(checkIn, extendedCheckOut) - actualNights;
    if (fewer > 0) {
      lines.push({
        key: 'early',
        kind: 'early',
        label: `Trả mèo sớm: ${fewer} đêm không ở`,
        detail: `Đón ngày ${earlyCheckOut} thay vì ${extendedCheckOut} · không hoàn tiền số đêm không ở`,
        // Quy định: check-out sớm không hoàn tiền những đêm đã đặt mà không ở
        amount: 0,
      });
      changes.push({ at: booking.checkedOutAt, text: `Check-out sớm ngày ${earlyCheckOut} (hẹn đón ${extendedCheckOut}), ${fewer} đêm không ở, không hoàn tiền` });
    }
  }

  let extraNights = 0;
  if (lateCheckOut) {
    extraNights = nightsBetween(extendedCheckOut, lateCheckOut);
    // Đêm ở quá hạn tính theo giá của chặng cuối (phòng & gói khách đang dùng lúc đón)
    const lateNightly = hasSegments ? (Number(segments[segments.length - 1]?.pricePerNight) || nightly) : nightly;
    lines.push({
      key: 'late',
      kind: 'late',
      label: `Trả mèo muộn: thêm ${extraNights} đêm`,
      detail: `Đón ngày ${lateCheckOut} thay vì ${extendedCheckOut} · ${lateNightly.toLocaleString('vi-VN')}đ × ${extraNights} đêm`,
      amount: extraNights * lateNightly,
    });
    changes.push({ at: booking.checkedOutAt, text: `Check-out muộn ngày ${lateCheckOut} (hẹn đón ${extendedCheckOut}), thêm ${extraNights} đêm` });
  }
  if (checkOutTiming === 'on_time') {
    changes.push({ at: booking.checkedOutAt, text: `Check-out đúng hạn ngày ${checkedOutDay}` });
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
  // Tiền cọc đã chuyển (kể cả phần đã cọc trước khi khách sửa đơn và đang chờ cọc bổ sung)
  const depositPaid = isPaid ? 0 : depositReceivedOf(booking);
  const received = isPaid ? paidAmount : depositPaid;

  // Lịch lưu trú hiển thị trên hóa đơn: ngày a – b ở phòng nào, gói nào (cắt theo ngày đón thực tế)
  const stayPlan = segments
    .map((seg) => ({ ...seg, to: seg.to > endDay ? endDay : seg.to }))
    .filter((seg) => seg.from < seg.to)
    .map((seg) => ({
      from: seg.from,
      to: seg.to,
      nights: nightsOf(seg.from, seg.to),
      roomId: seg.roomId,
      packageName: seg.packageName,
      pricePerNight: Number(seg.pricePerNight) || nightly,
      label: `${shortDate(seg.from)} – ${shortDate(seg.to)}: ${describeSegment(seg)}`,
    }));

  return {
    code: booking.code || booking.id,
    stayPlan,
    checkIn,
    checkOut: endDay,
    plannedCheckOut: extendedCheckOut,
    checkOutTiming,
    checkOutDiffNights: earlyNights > 0 ? earlyNights : extraNights,
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

// Nhãn ghi chú check-out cho admin và khách: 'Check-out sớm 3 đêm', 'Check-out muộn 1 đêm', 'Check-out đúng hạn'
export function checkOutTimingLabel(invoice) {
  if (!invoice?.checkOutTiming) return '';
  if (invoice.checkOutTiming === 'early') return `Check-out sớm ${invoice.checkOutDiffNights} đêm`;
  if (invoice.checkOutTiming === 'late') return `Check-out muộn ${invoice.checkOutDiffNights} đêm`;
  return 'Check-out đúng hạn';
}
