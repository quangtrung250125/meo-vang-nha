// Trang Báo cáo (admin): gom số liệu từ đơn đặt phòng, hóa đơn, phòng, bảng giá mùa / lễ Tết và tin marketing đã gửi.
// Doanh thu dùng chung quy tắc với trang Khách hàng / Tổng quan: chỉ đơn đã check-out và thanh toán đủ,
// tính theo tổng hóa đơn cuối, ghi nhận vào ngày gửi mèo (check-in).

import { todayInVietnam } from './bookingDeposit.js';
import { addDays, nightsOf, roomTypeOf } from './staySegments.js';
import { ruleCoversDate, computeServicePerformance } from './serviceCatalog.js';
import { stageOf } from './marketingEngine.js';
import { bookingStage, invoiceOf, isRevenueBooking, SEGMENTS } from '../pages/AdminCustomers/customerUtils.js';
import { dayOf, revenueSplitOf, computeRoomHeatmap } from './dashboardReport.js';

const DAY_MS = 86400000;
const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
export const ROOM_TYPE_LABEL = { VIP: 'Phòng VIP', VVIP: 'Phòng VVIP', DELUXE: 'Phòng Deluxe' };
export const CHANNEL_LABEL = {
  marketing: 'Tin marketing (Web Push)',
  direct: 'Khách tự đặt trên web',
};

const inRange = (day, { start, end }) => Boolean(day) && day >= start && day <= end;
const daysIn = ({ start, end }) => Math.max(1, nightsOf(start, end) + 1);
const weekdayOf = (day) => new Date(Date.parse(day)).getUTCDay();
const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);
const toTime = (v) => {
  const t = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(t) ? t : null;
};
const placedDayOf = (b) => dayOf(b.createdAt || b.created_at) || dayOf(b.checkIn);
const roomIdOf = (b) => b.roomId || b.selectedRoom?.id || '';
const monthKey = (day) => day.slice(0, 7);
export const monthLabel = (key) => `T${Number(key.slice(5, 7))}/${key.slice(0, 4)}`;

const allBookings = (customers = []) =>
  customers.flatMap((c) => (c.bookings || []).map((b) => ({ booking: b, customer: c })));

const stayDaysOf = (b) => {
  const from = dayOf(b.checkIn);
  if (!from) return [];
  const to = invoiceOf(b)?.checkOut || dayOf(b.checkOut) || addDays(from, 1);
  const n = Math.max(1, nightsOf(from, to) || 1);
  return Array.from({ length: Math.min(n, 366) }, (_, i) => addDays(from, i));
};

// Kênh của đơn: khách đặt trong 7 ngày sau khi nhận tin marketing thì tính cho tin đó, còn lại là tự đặt
export function channelOf(booking, customer, messages = []) {
  const placed = toTime(booking.createdAt || booking.created_at);
  if (!placed) return { channel: 'direct' };
  const hit = messages
    .filter((m) => m.status === 'sent' && String(m.customerId) === String(customer?.id))
    .map((m) => ({ m, at: toTime(m.createdAt) }))
    .filter(({ at }) => at && at < placed && placed - at <= 7 * DAY_MS)
    .sort((a, b) => b.at - a.at)[0];
  return hit ? { channel: 'marketing', scenarioId: hit.m.scenarioId || 'manual' } : { channel: 'direct' };
}

// Mùa / dịp của ngày gửi mèo theo bảng giá admin đã đặt (lễ Tết, mùa cao điểm); không thuộc dịp nào là ngày thường
export function seasonOf(day, rules = []) {
  const rule = rules.find((r) => (r.type === 'holiday' || r.type === 'season') && ruleCoversDate(r, day));
  return rule ? rule.name : 'Ngày thường';
}

const group = (rows, keyOf, init) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = keyOf(row);
    if (key === null || key === undefined) return;
    if (!map.has(key)) map.set(key, init(key));
    map.get(key).__rows.push(row);
  });
  return [...map.values()];
};

const sumRevenue = (rows) => rows.reduce((acc, r) => {
  acc.revenue += r.split.total;
  acc.stay += r.split.stay;
  acc.addon += r.split.addon;
  acc.nights += r.split.nights;
  acc.bookings += 1;
  return acc;
}, { revenue: 0, stay: 0, addon: 0, nights: 0, bookings: 0 });

/**
 * 1. Doanh thu: theo phòng, dịch vụ, mùa, kênh, tháng; doanh thu trên phòng khả dụng (RevPAR).
 */
export function computeRevenueReport({ customers = [], range, rules = [], items = [], messages = [], totalRooms = 11 } = {}) {
  const rows = allBookings(customers)
    .filter(({ booking }) => bookingStage(booking) !== 'cancelled' && isRevenueBooking(booking) && inRange(dayOf(booking.checkIn), range))
    .map(({ booking, customer }) => ({ booking, customer, day: dayOf(booking.checkIn), split: revenueSplitOf(booking) }));
  const total = sumRevenue(rows);
  const availableNights = Math.max(1, totalRooms) * daysIn(range);

  const byRoom = group(rows, (r) => roomTypeOf(roomIdOf(r.booking)) || 'Khác', (key) => ({ key, label: ROOM_TYPE_LABEL[key] || 'Chưa rõ phòng', __rows: [] }))
    .map(({ __rows, ...g }) => {
      const s = sumRevenue(__rows);
      return { ...g, ...s, perNight: s.nights ? s.stay / s.nights : 0, share: pct(s.revenue, total.revenue) };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const bySeason = group(rows, (r) => seasonOf(r.day, rules), (key) => ({ key, label: key, __rows: [] }))
    .map(({ __rows, ...g }) => ({ ...g, ...sumRevenue(__rows) }))
    .map((g) => ({ ...g, share: pct(g.revenue, total.revenue) }))
    .sort((a, b) => b.revenue - a.revenue);

  const byChannel = group(rows, (r) => channelOf(r.booking, r.customer, messages).channel, (key) => ({ key, label: CHANNEL_LABEL[key], __rows: [] }))
    .map(({ __rows, ...g }) => ({ ...g, ...sumRevenue(__rows) }))
    .map((g) => ({ ...g, share: pct(g.revenue, total.revenue) }))
    .sort((a, b) => b.revenue - a.revenue);

  const byMonth = group(rows, (r) => monthKey(r.day), (key) => ({ key, label: monthLabel(key), __rows: [] }))
    .map(({ __rows, ...g }) => ({ ...g, ...sumRevenue(__rows) }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const byService = computeServicePerformance(rows.map((r) => r.booking), items).services
    .filter((s) => s.sold > 0)
    .map((s) => ({ key: s.id, label: s.name, category: s.category, sold: s.sold, revenue: s.revenue }));

  return {
    ...total,
    revPar: total.stay / availableNights,
    revenuePerAvailableRoom: total.revenue / availableNights,
    availableNights,
    byRoom,
    byService,
    bySeason,
    byChannel,
    byMonth,
  };
}

/**
 * 2. Khách hàng: giá trị vòng đời (CLV), tỷ lệ giữ chân, tỷ lệ quay lại, % doanh thu theo nhóm khách.
 */
export function computeCustomerReport({ customers = [], range } = {}) {
  const booked = customers.filter((c) => (c.bookingCount || 0) > 0);
  const paying = customers.filter((c) => (c.totalSpent || 0) > 0);
  const lifetime = paying.reduce((s, c) => s + c.totalSpent, 0);

  // Giữ chân: khách có đơn ở kỳ trước cùng độ dài, kỳ này còn đặt tiếp
  const length = daysIn(range);
  const prev = { start: addDays(range.start, -length), end: addDays(range.start, -1) };
  const activeIn = (c, r) => (c.bookings || []).some((b) => bookingStage(b) !== 'cancelled' && inRange(placedDayOf(b), r));
  const prevCustomers = customers.filter((c) => activeIn(c, prev));
  const retained = prevCustomers.filter((c) => activeIn(c, range));

  // % doanh thu kỳ này theo nhóm khách (nhóm hiện tại của khách)
  const segRows = Object.keys(SEGMENTS).filter((k) => k !== 'new').map((key) => ({ key, label: SEGMENTS[key].label, customers: 0, revenue: 0 }));
  let periodRevenue = 0;
  customers.forEach((c) => {
    const revenue = (c.bookings || [])
      .filter((b) => bookingStage(b) !== 'cancelled' && isRevenueBooking(b) && inRange(dayOf(b.checkIn), range))
      .reduce((s, b) => s + revenueSplitOf(b).total, 0);
    const row = segRows.find((r) => r.key === c.segment);
    if (row && activeIn(c, range)) row.customers += 1;
    if (row) row.revenue += revenue;
    periodRevenue += revenue;
  });

  const top = [...paying].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5)
    .map((c) => ({ id: c.id, name: c.fullName, phone: c.phone, bookings: c.bookingCount, spent: c.totalSpent, segment: c.segment }));

  return {
    totalCustomers: customers.length,
    bookedCustomers: booked.length,
    clv: paying.length ? lifetime / paying.length : 0,
    payingCustomers: paying.length,
    returningRate: pct(booked.filter((c) => c.bookingCount >= 2).length, booked.length),
    retentionRate: pct(retained.length, prevCustomers.length),
    retained: retained.length,
    previousCustomers: prevCustomers.length,
    previousRange: prev,
    periodRevenue,
    bySegment: segRows.map((r) => ({ ...r, share: pct(r.revenue, periodRevenue) })),
    top,
  };
}

/**
 * 3. Vận hành: lấp phòng theo thứ trong tuần và theo tháng, thời gian lưu trú trung bình, tỷ lệ hủy kèm lý do.
 */
export function computeOperationsReport({ customers = [], range, totalRooms = 11 } = {}) {
  const rooms = Math.max(1, totalRooms);
  const list = allBookings(customers).map((x) => x.booking);
  const active = list.filter((b) => bookingStage(b) !== 'cancelled');

  const nightsByDay = new Map();
  active.forEach((b) => stayDaysOf(b).forEach((d) => {
    if (inRange(d, range)) nightsByDay.set(d, (nightsByDay.get(d) || 0) + 1);
  }));

  const days = Array.from({ length: daysIn(range) }, (_, i) => addDays(range.start, i));
  const weekday = WEEKDAYS.map((label, i) => ({ key: i, label, nights: 0, days: 0 }));
  const months = new Map();
  days.forEach((d) => {
    const w = weekday[weekdayOf(d)];
    w.days += 1;
    w.nights += nightsByDay.get(d) || 0;
    const m = months.get(monthKey(d)) || { key: monthKey(d), label: monthLabel(monthKey(d)), nights: 0, days: 0 };
    m.days += 1;
    m.nights += nightsByDay.get(d) || 0;
    months.set(m.key, m);
  });
  const withRate = (r) => ({ ...r, rate: Math.min(100, pct(r.nights, rooms * r.days)) });
  // Thứ 2 → Chủ nhật
  const byWeekday = [...weekday.slice(1), weekday[0]].filter((w) => w.days > 0).map(withRate);
  const byMonth = [...months.values()].map(withRate);

  const stays = active.filter((b) => inRange(dayOf(b.checkIn), range)).map((b) => stayDaysOf(b).length).filter((n) => n > 0);
  const placed = list.filter((b) => inRange(placedDayOf(b), range));
  const cancelled = placed.filter((b) => bookingStage(b) === 'cancelled');
  const reasons = group(cancelled, (b) => String(b.cancelReason || '').trim() || 'Không ghi lý do', (key) => ({ key, label: key, __rows: [] }))
    .map(({ __rows, ...g }) => ({ ...g, count: __rows.length, share: pct(__rows.length, cancelled.length) }))
    .sort((a, b) => b.count - a.count);

  const totalNights = [...nightsByDay.values()].reduce((s, n) => s + n, 0);
  return {
    occupancyRate: Math.min(100, pct(totalNights, rooms * days.length)),
    roomNights: totalNights,
    byWeekday,
    byMonth,
    avgStay: stays.length ? stays.reduce((s, n) => s + n, 0) / stays.length : 0,
    stays: stays.length,
    placed: placed.length,
    cancelled: cancelled.length,
    cancelRate: pct(cancelled.length, placed.length),
    reasons,
  };
}

/**
 * 4. Marketing: kênh nào mang khách chất lượng (doanh thu / khách, tỷ lệ quay lại), chiến dịch nào hiệu quả.
 */
export function computeMarketingReport({ customers = [], range, messages = [], scenarios = [] } = {}) {
  const channels = new Map(Object.keys(CHANNEL_LABEL).map((key) => [key, {
    key, label: CHANNEL_LABEL[key], bookings: 0, customers: new Set(), revenue: 0, returning: new Set(),
  }]));
  allBookings(customers).forEach(({ booking, customer }) => {
    if (stageOf(booking) === 'cancelled' || !inRange(placedDayOf(booking), range)) return;
    const row = channels.get(channelOf(booking, customer, messages).channel);
    row.bookings += 1;
    row.customers.add(customer.id);
    if ((customer.bookingCount || 0) >= 2) row.returning.add(customer.id);
    if (isRevenueBooking(booking)) row.revenue += revenueSplitOf(booking).total;
  });
  const byChannel = [...channels.values()].map((r) => ({
    key: r.key,
    label: r.label,
    bookings: r.bookings,
    customers: r.customers.size,
    revenue: r.revenue,
    revenuePerCustomer: r.customers.size ? r.revenue / r.customers.size : 0,
    returningRate: pct(r.returning.size, r.customers.size),
  }));
  const quality = [...byChannel].filter((c) => c.customers > 0).sort((a, b) => b.revenuePerCustomer - a.revenuePerCustomer)[0] || null;

  // Chiến dịch: tin gửi trong kỳ, khách đặt đơn trong 7 ngày sau khi nhận tin
  const start = Date.parse(`${range.start}T00:00:00+07:00`);
  const end = Date.parse(`${range.end}T23:59:59+07:00`);
  const sent = messages.filter((m) => m.status === 'sent' && (toTime(m.createdAt) || 0) >= start && (toTime(m.createdAt) || 0) <= end);
  const byCustomer = new Map(customers.map((c) => [String(c.id), c]));
  const groups = new Map();
  sent.forEach((m) => {
    const key = m.scenarioId || 'manual';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  });
  const nameOf = (id) => (id === 'manual' ? 'Gửi thủ công' : scenarios.find((s) => s.id === id)?.name || id);
  const campaigns = [...groups.entries()].map(([id, list]) => {
    const conv = new Map();
    list.forEach((m) => {
      const c = byCustomer.get(String(m.customerId));
      const at = toTime(m.createdAt) || 0;
      const b = (c?.bookings || []).find((x) => {
        const t = toTime(x.createdAt);
        return t && t > at && t - at <= 7 * DAY_MS && stageOf(x) !== 'cancelled';
      });
      if (b) conv.set(b.code || b.id, b);
    });
    const converted = [...conv.values()];
    return {
      key: id,
      label: nameOf(id),
      sent: list.length,
      opened: list.filter((m) => m.shownAt || m.clickedAt).length,
      clicked: list.filter((m) => m.clickedAt).length,
      converted: converted.length,
      revenue: converted.reduce((s, b) => s + (isRevenueBooking(b) ? revenueSplitOf(b).total : 0), 0),
      convertRate: pct(converted.length, list.length),
    };
  }).sort((a, b) => b.converted - a.converted || b.revenue - a.revenue || b.sent - a.sent);

  return { byChannel, quality, campaigns, best: campaigns.find((c) => c.converted > 0) || null, sent: sent.length };
}

// Các dịp cao điểm cố định ở Việt Nam (Tết âm lịch tính sẵn theo năm)
const LUNAR_NEW_YEAR = { 2026: '2026-02-17', 2027: '2027-02-06', 2028: '2028-01-26', 2029: '2029-02-13' };
export function upcomingPeaks(today = todayInVietnam(), horizonDays = 365) {
  const until = addDays(today, horizonDays);
  const year = Number(today.slice(0, 4));
  const peaks = [];
  [year, year + 1].forEach((y) => {
    if (LUNAR_NEW_YEAR[y]) peaks.push({ key: `tet-${y}`, label: `Tết Nguyên Đán ${y}`, start: addDays(LUNAR_NEW_YEAR[y], -7), end: addDays(LUNAR_NEW_YEAR[y], 6) });
    peaks.push({ key: `304-${y}`, label: `Lễ 30/4 – 1/5/${y}`, start: `${y}-04-28`, end: `${y}-05-03` });
    peaks.push({ key: `he-${y}`, label: `Hè ${y}`, start: `${y}-06-01`, end: `${y}-08-31` });
    peaks.push({ key: `29-${y}`, label: `Quốc khánh 2/9/${y}`, start: `${y}-08-30`, end: `${y}-09-03` });
    peaks.push({ key: `noel-${y}`, label: `Giáng sinh & Tết Dương lịch ${y + 1}`, start: `${y}-12-23`, end: `${y + 1}-01-02` });
  });
  return peaks
    .filter((p) => p.end >= today && p.start <= until)
    .map((p) => ({ ...p, daysUntil: Math.max(0, nightsOf(today, p.start)) }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * 5. Dự báo & gợi ý: công suất đã đặt cho các dịp cao điểm sắp tới, gợi ý tăng / giảm giá, phòng cần mở thêm.
 * @param {Record<string, object[]>} roomBookings đơn chưa kết thúc theo phòng (Tình trạng phòng)
 */
export function computeForecast({ customers = [], roomBookings = {}, maintenanceRooms = {}, rooms = [], rules = [], today = todayInVietnam(), horizonDays = 365 } = {}) {
  const map = computeRoomHeatmap(roomBookings, maintenanceRooms, rooms, { days: horizonDays + 1, today });
  const byDay = new Map(map.map((d) => [d.dateStr, d]));
  const occupancyOf = (start, end) => {
    const days = map.filter((d) => d.dateStr >= start && d.dateStr <= end);
    if (days.length === 0) return 0;
    return days.reduce((s, d) => s + d.rate, 0) / days.length;
  };
  const seasonal = rules.filter((r) => r.type === 'holiday' || r.type === 'season');
  const ruleFor = (start, end, active) => {
    const list = seasonal.filter((r) => (r.active !== false) === active);
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const hit = list.find((r) => ruleCoversDate(r, d));
      if (hit) return hit;
    }
    return null;
  };
  const revenueIn = (start, end) => allBookings(customers)
    .filter(({ booking }) => isRevenueBooking(booking) && inRange(dayOf(booking.checkIn), { start, end }))
    .reduce((s, { booking }) => s + revenueSplitOf(booking).total, 0);

  const peaks = upcomingPeaks(today, horizonDays).map((p) => {
    const occupancy = occupancyOf(p.start < today ? today : p.start, p.end);
    const from = p.start < today ? today : p.start;
    const rule = ruleFor(from, p.end, true);
    const offRule = rule ? null : ruleFor(from, p.end, false);
    const lastYear = revenueIn(addDays(p.start, -365), addDays(p.end, -365));
    const tips = [];
    if (offRule) tips.push(`Đã có "${offRule.name}" nhưng đang tắt: bật ở Dịch vụ › Giá mùa, lễ Tết nếu muốn thu phụ phí dịp này.`);
    else if (!rule) tips.push('Chưa có giá mùa / lễ Tết cho dịp này: cân nhắc thêm phụ thu ở Dịch vụ › Giá mùa, lễ Tết.');
    else tips.push(`Đang áp dụng "${rule.name}"${rule.percent ? ` (${rule.percent > 0 ? '+' : ''}${rule.percent}%)` : ''}.`);
    if (occupancy >= 70) tips.push(`Đã kín ${Math.round(occupancy)}%: có thể tăng giá thêm hoặc ngừng mã giảm giá cho dịp này.`);
    else if (p.daysUntil <= 45 && occupancy < 30) tips.push(`Còn ${p.daysUntil} ngày mà mới kín ${Math.round(occupancy)}%: gửi ưu đãi đặt sớm qua Marketing tự động.`);
    else if (p.daysUntil > 45) tips.push('Nhắc khách cũ đặt sớm khoảng 30 ngày trước dịp này.');
    return { ...p, occupancy, rule: rule?.name || null, lastYearRevenue: lastYear, tips };
  });

  // Phòng cần mở thêm: hạng phòng kín hết trong 60 ngày tới
  const types = [...new Set(rooms.map((r) => r.type))];
  const next60 = map.slice(0, 61);
  const roomTips = types.map((type) => {
    const ids = rooms.filter((r) => r.type === type).map((r) => r.id);
    const fullDays = next60.filter((d) => ids.every((id) => {
      const r = d.roomsDetail.find((x) => x.id === id);
      return r && (r.isBooked || r.isMaintenance);
    })).length;
    const avg = next60.length
      ? next60.reduce((s, d) => s + d.roomsDetail.filter((r) => ids.includes(r.id) && (r.isBooked || r.isMaintenance)).length / ids.length, 0) / next60.length * 100
      : 0;
    return { type, label: ROOM_TYPE_LABEL[type] || type, rooms: ids.length, fullDays, occupancy: avg };
  }).map((r) => ({
    ...r,
    tip: r.fullDays >= 5
      ? `Kín hết ${r.fullDays} ngày trong 60 ngày tới: cân nhắc mở thêm ${r.label.toLowerCase()} hoặc tăng giá hạng này.`
      : r.occupancy < 20
        ? 'Còn trống nhiều: gợi ý nâng hạng / ưu đãi cho hạng phòng này.'
        : 'Công suất ổn định.',
  }));

  const next30 = map.slice(0, 30);
  return {
    next30Occupancy: next30.length ? next30.reduce((s, d) => s + d.rate, 0) / next30.length : 0,
    fullDays30: next30.filter((d) => d.rate >= 100).length,
    busiest: [...next30].sort((a, b) => b.rate - a.rate)[0] || null,
    peaks,
    roomTips,
    byDay,
  };
}

/** Gom toàn bộ báo cáo cho một khoảng thời gian */
export function computeAdminReport({ customers = [], range, rules = [], items = [], messages = [], scenarios = [], roomBookings = {}, maintenanceRooms = {}, rooms = [], today = todayInVietnam() } = {}) {
  const totalRooms = rooms.length || 11;
  const operations = computeOperationsReport({ customers, range, totalRooms });
  const forecast = computeForecast({ customers, roomBookings, maintenanceRooms, rooms, rules, today });
  // Gợi ý theo ngày trong tuần: ngày vắng nhất so với trung bình
  const weekdays = operations.byWeekday.filter((w) => w.days > 0);
  const avg = weekdays.length ? weekdays.reduce((s, w) => s + w.rate, 0) / weekdays.length : 0;
  const slowest = [...weekdays].sort((a, b) => a.rate - b.rate)[0];
  const weekdayTip = slowest && avg > 0 && slowest.rate < avg * 0.7
    ? `${slowest.label} vắng nhất (${Math.round(slowest.rate)}% so với trung bình ${Math.round(avg)}%): thử giảm giá hoặc ưu đãi gửi mèo vào ${slowest.label.toLowerCase()}.`
    : null;
  return {
    range,
    revenue: computeRevenueReport({ customers, range, rules, items, messages, totalRooms }),
    customers: computeCustomerReport({ customers, range }),
    operations,
    marketing: computeMarketingReport({ customers, range, messages, scenarios }),
    forecast: { ...forecast, weekdayTip },
  };
}

// ---------- Xuất file ----------
const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const money = (n) => Math.round(Number(n) || 0);
const p1 = (n) => `${(Number(n) || 0).toFixed(1)}%`;

/** Bảng CSV (mở bằng Excel) gồm đủ 5 phần của báo cáo */
export function reportToCsv(report) {
  const { range, revenue: r, customers: c, operations: o, marketing: m, forecast: f } = report;
  const lines = [];
  const row = (...cells) => lines.push(cells.map(csvCell).join(','));
  const gap = () => lines.push('');
  row('BÁO CÁO MÈO VẮNG NHÀ', `Từ ${range.start} đến ${range.end}`);
  gap();
  row('1. DOANH THU');
  row('Tổng doanh thu (đ)', money(r.revenue));
  row('Tiền lưu trú (đ)', money(r.stay));
  row('Dịch vụ thêm (đ)', money(r.addon));
  row('Số đơn đã chốt', r.bookings);
  row('Doanh thu / phòng khả dụng (RevPAR, đ)', money(r.revPar));
  gap();
  row('Theo hạng phòng', 'Doanh thu (đ)', 'Số đơn', 'Số đêm', 'Giá TB/đêm (đ)', 'Tỷ trọng');
  r.byRoom.forEach((x) => row(x.label, money(x.revenue), x.bookings, x.nights, money(x.perNight), p1(x.share)));
  gap();
  row('Theo dịch vụ', 'Nhóm', 'Số lần bán', 'Doanh thu ước tính (đ)');
  r.byService.forEach((x) => row(x.label, x.category, x.sold, money(x.revenue)));
  gap();
  row('Theo mùa / dịp', 'Doanh thu (đ)', 'Số đơn', 'Tỷ trọng');
  r.bySeason.forEach((x) => row(x.label, money(x.revenue), x.bookings, p1(x.share)));
  gap();
  row('Theo kênh', 'Doanh thu (đ)', 'Số đơn', 'Tỷ trọng');
  r.byChannel.forEach((x) => row(x.label, money(x.revenue), x.bookings, p1(x.share)));
  gap();
  row('Theo tháng', 'Doanh thu (đ)', 'Lưu trú (đ)', 'Dịch vụ thêm (đ)', 'Số đơn');
  r.byMonth.forEach((x) => row(x.label, money(x.revenue), money(x.stay), money(x.addon), x.bookings));
  gap();
  row('2. KHÁCH HÀNG');
  row('Giá trị vòng đời TB (CLV, đ)', money(c.clv));
  row('Tỷ lệ giữ chân', p1(c.retentionRate), `${c.retained}/${c.previousCustomers} khách kỳ trước đặt tiếp`);
  row('Tỷ lệ khách quay lại', p1(c.returningRate));
  row('Nhóm khách', 'Số khách đặt trong kỳ', 'Doanh thu (đ)', '% doanh thu');
  c.bySegment.forEach((x) => row(x.label, x.customers, money(x.revenue), p1(x.share)));
  gap();
  row('3. VẬN HÀNH');
  row('Tỷ lệ lấp phòng', p1(o.occupancyRate));
  row('Thời gian lưu trú TB (đêm)', o.avgStay.toFixed(1));
  row('Tỷ lệ hủy', p1(o.cancelRate), `${o.cancelled}/${o.placed} đơn`);
  row('Thứ', 'Tỷ lệ lấp phòng');
  o.byWeekday.forEach((x) => row(x.label, p1(x.rate)));
  row('Tháng', 'Tỷ lệ lấp phòng');
  o.byMonth.forEach((x) => row(x.label, p1(x.rate)));
  row('Lý do hủy', 'Số đơn', 'Tỷ trọng');
  o.reasons.forEach((x) => row(x.label, x.count, p1(x.share)));
  gap();
  row('4. MARKETING');
  row('Kênh', 'Khách', 'Đơn', 'Doanh thu (đ)', 'Doanh thu / khách (đ)', 'Khách quay lại');
  m.byChannel.forEach((x) => row(x.label, x.customers, x.bookings, money(x.revenue), money(x.revenuePerCustomer), p1(x.returningRate)));
  row('Chiến dịch', 'Đã gửi', 'Đã xem', 'Đã bấm', 'Thành đơn', 'Tỷ lệ thành đơn', 'Doanh thu (đ)');
  m.campaigns.forEach((x) => row(x.label, x.sent, x.opened, x.clicked, x.converted, p1(x.convertRate), money(x.revenue)));
  gap();
  row('5. DỰ BÁO & GỢI Ý');
  row('Công suất đã đặt 30 ngày tới', p1(f.next30Occupancy));
  row('Dịp cao điểm', 'Từ', 'Đến', 'Còn (ngày)', 'Đã đặt', 'Doanh thu cùng kỳ năm trước (đ)', 'Gợi ý');
  f.peaks.forEach((x) => row(x.label, x.start, x.end, x.daysUntil, p1(x.occupancy), money(x.lastYearRevenue), x.tips.join(' ')));
  row('Hạng phòng', 'Số phòng', 'Ngày kín hết (60 ngày tới)', 'Công suất TB', 'Gợi ý');
  f.roomTips.forEach((x) => row(x.label, x.rooms, x.fullDays, p1(x.occupancy), x.tip));
  if (f.weekdayTip) row('Gợi ý ngày trong tuần', f.weekdayTip);
  return `﻿${lines.join('\r\n')}`;
}
