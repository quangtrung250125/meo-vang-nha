// Số liệu trang Tổng quan (admin): tính từ đơn đặt phòng thật của khách, không còn số mẫu.
// Cùng quy tắc với trang Khách hàng: doanh thu chỉ cộng khi đơn đã check-out VÀ thanh toán đủ hóa đơn,
// và tính cho ngày gửi mèo (check-in) của đơn.

import { todayInVietnam } from './bookingDeposit.js';
import { addDays, nightsOf } from './staySegments.js';
import { CAMERA_PRICE_PER_DAY } from './bookingPricing.js';
import { bookingStage, invoiceOf, isRevenueBooking } from '../pages/AdminCustomers/customerUtils.js';

const DAY_MS = 86400000;

// Ngày 'YYYY-MM-DD' (giờ Việt Nam) từ chuỗi ngày, ISO hoặc 'dd/mm/yyyy'
export const dayOf = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const vn = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vn) return `${vn[3]}-${vn[2].padStart(2, '0')}-${vn[1].padStart(2, '0')}`;
  const t = new Date(raw);
  return Number.isNaN(t.getTime()) ? null : todayInVietnam(t);
};

const inRange = (day, { start, end }) => Boolean(day) && day >= start && day <= end;
const daysInRange = ({ start, end }) => Math.max(1, nightsOf(start, end) + 1);

/**
 * Khoảng thời gian theo bộ lọc ở trang Tổng quan và kỳ trước cùng độ dài.
 * @param {'today'|'7d'|'30d'|'quarter'|'custom'} preset
 */
export function periodOf(preset, customRange = {}, today = todayInVietnam()) {
  let start = today;
  let end = today;
  if (preset === '7d') start = addDays(today, -6);
  else if (preset === '30d') start = addDays(today, -29);
  else if (preset === 'quarter') {
    const [y, m] = today.split('-').map(Number);
    start = `${y}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, '0')}-01`;
  } else if (preset === 'custom') {
    const a = dayOf(customRange.startDate) || today;
    const b = dayOf(customRange.endDate) || today;
    [start, end] = a <= b ? [a, b] : [b, a];
  }
  const length = daysInRange({ start, end });
  const previous = { start: addDays(start, -length), end: addDays(start, -1) };
  return { current: { start, end }, previous, days: length };
}

// Ngày khách đặt đơn (để đếm số đơn, khách mới / quay lại trong kỳ)
const placedDayOf = (b) => dayOf(b.createdAt || b.created_at || b.bookedAt) || dayOf(b.checkIn);

/**
 * Tách tiền của đơn đã chốt: lưu trú (tiền phòng) và dịch vụ thêm (spa, đưa đón, camera, dịch vụ khách mua thêm).
 * Tổng luôn bằng tổng hóa đơn cuối cùng.
 */
export function revenueSplitOf(booking) {
  const invoice = invoiceOf(booking);
  const total = invoice?.total || 0;
  const cats = Math.max(1, Number(booking.cats) || (booking.petIds || []).length || 1);
  const bookedNights = Math.max(1, nightsOf(booking.originalCheckIn || booking.checkIn, booking.originalCheckOut || booking.checkOut) || 1);
  const spa = (Number(booking.selectedSpa?.price) || 0) * cats;
  const extra = Number(booking.selectedExtra?.price) || 0;
  const camera = booking.addCamera ? CAMERA_PRICE_PER_DAY * bookedNights : 0;
  const boughtLater = (invoice?.lines || []).filter((l) => l.kind === 'addon').reduce((s, l) => s + l.amount, 0);
  const addon = Math.min(total, Math.max(0, Math.min(invoice?.baseTotal || 0, spa + extra + camera) + boughtLater));
  return { total, stay: total - addon, addon, nights: invoice?.nights || bookedNights };
}

// Các đêm mèo ở khách sạn của đơn (chưa hủy): từ ngày gửi tới trước ngày đón thực tế / dự kiến
const stayNightsOf = (booking) => {
  const from = dayOf(booking.checkIn);
  if (!from) return [];
  const to = invoiceOf(booking)?.checkOut || dayOf(booking.checkOut) || addDays(from, 1);
  const n = Math.max(1, nightsOf(from, to) || 1);
  return Array.from({ length: Math.min(n, 366) }, (_, i) => addDays(from, i));
};

const diffOf = (current, previous) => {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Chỉ số của một khoảng thời gian.
 * @param {object[]} customers danh sách khách (useCustomerData), mỗi khách có bookings đã gộp trùng
 */
export function computePeriodMetrics(customers = [], range, { totalRooms = 11 } = {}) {
  let revenue = 0;
  let stayRevenue = 0;
  let soldNightsForAdr = 0;
  let placed = 0;
  let cancelled = 0;
  let roomNights = 0;
  let newCustomers = 0;
  let returningCustomers = 0;
  let revenueBookings = 0;

  customers.forEach((c) => {
    const bookings = c.bookings || [];
    const active = bookings.filter((b) => bookingStage(b) !== 'cancelled');

    bookings.forEach((b) => {
      const isCancelled = bookingStage(b) === 'cancelled';
      if (inRange(placedDayOf(b), range)) {
        placed += 1;
        if (isCancelled) cancelled += 1;
      }
      if (isCancelled) return;
      roomNights += stayNightsOf(b).filter((d) => inRange(d, range)).length;
      if (isRevenueBooking(b) && inRange(dayOf(b.checkIn), range)) {
        const split = revenueSplitOf(b);
        revenue += split.total;
        stayRevenue += split.stay;
        soldNightsForAdr += split.nights;
        revenueBookings += 1;
      }
    });

    // Khách mới: đơn đầu tiên (không tính đơn hủy) đặt trong kỳ; quay lại: đặt trong kỳ và đã có đơn trước đó
    const placedDays = active.map(placedDayOf).filter(Boolean).sort();
    if (placedDays.length === 0) return;
    const inPeriod = placedDays.filter((d) => inRange(d, range));
    if (inPeriod.length === 0) return;
    if (inRange(placedDays[0], range)) newCustomers += 1;
    else returningCustomers += 1;
  });

  const capacity = Math.max(1, totalRooms) * daysInRange(range);
  return {
    revenue,
    revenueBookings,
    bookingCount: placed - cancelled,
    occupancyRate: Math.min(100, (roomNights / capacity) * 100),
    roomNights,
    adr: soldNightsForAdr ? stayRevenue / soldNightsForAdr : 0,
    newCustomers,
    returningCustomers,
    cancelRate: placed ? (cancelled / placed) * 100 : 0,
  };
}

/**
 * Thẻ số liệu trang Tổng quan: kỳ đang xem so với kỳ trước.
 */
export function computeDashboardKpis(customers = [], { preset = '30d', customRange, today = todayInVietnam(), totalRooms = 11 } = {}) {
  const period = periodOf(preset, customRange, today);
  const cur = computePeriodMetrics(customers, period.current, { totalRooms });
  const prev = computePeriodMetrics(customers, period.previous, { totalRooms });
  const pick = (key) => ({ current: cur[key], previous: prev[key], diff: diffOf(cur[key], prev[key]) });
  return {
    period,
    revenueBookings: cur.revenueBookings,
    revenue: pick('revenue'),
    bookingCount: pick('bookingCount'),
    occupancyRate: pick('occupancyRate'),
    adr: pick('adr'),
    newCustomers: pick('newCustomers'),
    returningCustomers: pick('returningCustomers'),
    cancelRate: pick('cancelRate'),
  };
}

const shortDate = (day) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/**
 * Biểu đồ doanh thu: 7 ngày gần nhất, 4 tuần gần nhất, 6 tháng gần nhất (tính cả hôm nay / tháng này).
 * Mỗi cột tách tiền lưu trú và dịch vụ thêm của các đơn đã chốt, theo ngày gửi mèo.
 */
export function computeRevenueSeries(customers = [], today = todayInVietnam()) {
  const rows = [];
  customers.forEach((c) => (c.bookings || []).forEach((b) => {
    if (bookingStage(b) === 'cancelled' || !isRevenueBooking(b)) return;
    const day = dayOf(b.checkIn);
    if (day) rows.push({ day, ...revenueSplitOf(b) });
  }));
  const sum = (range) => rows.filter((r) => inRange(r.day, range)).reduce(
    (acc, r) => ({ stayRevenue: acc.stayRevenue + r.stay, addonRevenue: acc.addonRevenue + r.addon, bookings: acc.bookings + 1 }),
    { stayRevenue: 0, addonRevenue: 0, bookings: 0 }
  );

  const day = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    const weekday = WEEKDAY[new Date(Date.parse(d) + 0).getUTCDay()];
    return { label: `${i === 6 ? 'Hôm nay' : weekday} (${shortDate(d)})`, shortLabel: shortDate(d), ...sum({ start: d, end: d }) };
  });

  const week = Array.from({ length: 4 }, (_, i) => {
    const end = addDays(today, -7 * (3 - i));
    const start = addDays(end, -6);
    return {
      label: `${i === 3 ? 'Tuần này' : `Tuần ${i + 1}`} (${shortDate(start)} – ${shortDate(end)})`,
      shortLabel: `${shortDate(start)}–${shortDate(end)}`,
      ...sum({ start, end }),
    };
  });

  const [y, m] = today.split('-').map(Number);
  const month = Array.from({ length: 6 }, (_, i) => {
    const first = new Date(Date.UTC(y, m - 1 - (5 - i), 1));
    const next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1));
    const start = first.toISOString().slice(0, 10);
    const end = new Date(next.getTime() - DAY_MS).toISOString().slice(0, 10);
    const mm = first.getUTCMonth() + 1;
    return { label: `T${mm}/${first.getUTCFullYear()}`, shortLabel: `T${mm}`, ...sum({ start, end }) };
  });

  return { day, week, month };
}

/**
 * Bản đồ nhiệt công suất phòng từ hôm nay: phòng có đơn chưa kết thúc phủ ngày đó, hoặc phòng đang bảo trì.
 * @param {Record<string, object[]>} roomBookings đơn theo phòng (Tình trạng phòng)
 */
export function computeRoomHeatmap(roomBookings = {}, maintenanceRooms = {}, rooms = [], { days = 30, today = todayInVietnam() } = {}) {
  const totalRooms = rooms.length || 1;
  return Array.from({ length: days }, (_, i) => {
    const dateStr = addDays(today, i);
    const roomsDetail = rooms.map((room) => {
      const isMaintenance = Boolean(maintenanceRooms[room.id]);
      const isBooked = (roomBookings[room.id] || []).some((b) => {
        if (!b || bookingStage(b) === 'cancelled' || bookingStage(b) === 'completed') return false;
        const from = dayOf(b.checkIn);
        const to = dayOf(b.checkOut);
        return Boolean(from && to) && dateStr >= from && dateStr <= to;
      });
      return { id: room.id, isBooked, isMaintenance };
    });
    const occupied = roomsDetail.filter((r) => r.isBooked || r.isMaintenance).length;
    const weekday = WEEKDAY[new Date(Date.parse(dateStr)).getUTCDay()];
    return {
      dateStr,
      displayDate: shortDate(dateStr),
      dayName: i === 0 ? 'Hôm nay' : weekday,
      occupied,
      total: totalRooms,
      rate: (occupied / totalRooms) * 100,
      roomsDetail,
    };
  });
}
