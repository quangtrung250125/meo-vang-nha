// Lịch lưu trú theo từng chặng của một đơn: khách tự gia hạn, đổi phòng, đổi gói, nâng hạng
// mà không cần chờ nhân viên duyệt. Mỗi chặng ghi rõ ngày nào ở phòng nào, dùng gói nào và giá mỗi đêm,
// để vừa tính chỗ trống của từng phòng theo ngày, vừa tính hóa đơn theo đúng từng khoảng ngày.
//
// Chặng: { from, to, roomId, roomType, packageId, packageName, pricePerNight }
//   from: ngày bắt đầu (đêm đầu tiên), to: ngày rời chặng (không tính đêm này), dạng YYYY-MM-DD
//   pricePerNight: giá 1 đêm cho cả đơn (đã nhân số bé)
// Đơn chưa có staySegments thì coi như 1 chặng: checkIn → checkOut, phòng và gói lúc đặt.

const DAY_MS = 86400000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toUtc = (dateStr) => {
  if (!DATE_RE.test(String(dateStr || ''))) return NaN;
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const isDateStr = (value) => Number.isFinite(toUtc(value));

export const addDays = (dateStr, days) => {
  const t = toUtc(dateStr);
  if (!Number.isFinite(t)) return '';
  return new Date(t + days * DAY_MS).toISOString().slice(0, 10);
};

export const nightsOf = (from, to) => {
  const diff = Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
};

// 'VVIP-02' -> 'VVIP'
export const roomTypeOf = (roomId) => String(roomId || '').split('-')[0].toUpperCase() || '';

export const homeRoomIdOf = (booking) => booking?.roomId || booking?.selectedRoom?.id || '';

const catsOf = (booking) => Math.max(1, Number(booking?.cats) || (booking?.petIds || []).length || 1);

// Giá 1 đêm (cả đơn) của gói lúc đặt — giống cách hóa đơn tính
export function bookedNightly(booking) {
  const lodgingPrice = Number(booking?.selectedLodging?.price || booking?.selectedPackage?.price) || 0;
  if (lodgingPrice > 0) return lodgingPrice * catsOf(booking);
  const baseTotal = Number(booking?.baseTotalPrice ?? booking?.totalPrice) || 0;
  const nights = nightsOf(booking?.originalCheckIn || booking?.checkIn, booking?.originalCheckOut || booking?.baseCheckOut || booking?.checkOut) || 1;
  return Math.round(baseTotal / nights);
}

// Chặng gốc của đơn (phòng & gói lúc đặt)
export function baseSegmentOf(booking, to = booking?.checkOut) {
  const pkg = booking?.selectedLodging || booking?.selectedPackage || {};
  const roomId = homeRoomIdOf(booking);
  return {
    from: booking?.checkIn,
    to,
    roomId,
    roomType: roomTypeOf(roomId),
    packageId: pkg.id || '',
    packageName: pkg.name || (booking?.packages || [])[0] || '',
    pricePerNight: bookedNightly(booking),
  };
}

const isValidSegment = (s) => s && isDateStr(s.from) && isDateStr(s.to) && s.from < s.to && s.roomId;

/** Các chặng lưu trú của đơn, sắp theo ngày */
export function getStaySegments(booking) {
  if (!booking) return [];
  const list = Array.isArray(booking.staySegments) ? booking.staySegments.filter(isValidSegment) : [];
  if (list.length > 0) return [...list].sort((a, b) => a.from.localeCompare(b.from));
  if (!isDateStr(booking.checkIn) || !isDateStr(booking.checkOut)) return [];
  return [baseSegmentOf(booking)];
}

/** Chặng đang áp dụng vào một ngày (mặc định: hôm nay). Đơn chưa tới thì lấy chặng đầu, đã qua thì chặng cuối. */
export function segmentOnDate(booking, dateStr) {
  const segments = getStaySegments(booking);
  if (segments.length === 0) return null;
  return segments.find((s) => s.from <= dateStr && dateStr < s.to)
    || (dateStr < segments[0].from ? segments[0] : segments[segments.length - 1]);
}

export const sameStay = (a, b) => a.roomId === b.roomId && (a.packageId || a.packageName) === (b.packageId || b.packageName)
  && Number(a.pricePerNight) === Number(b.pricePerNight);

// Gộp các chặng liền nhau giống hệt nhau (cùng phòng, cùng gói, cùng giá)
export function mergeSegments(segments) {
  const out = [];
  [...segments].sort((a, b) => a.from.localeCompare(b.from)).forEach((s) => {
    const last = out[out.length - 1];
    if (last && last.to === s.from && sameStay(last, s)) last.to = s.to;
    else out.push({ ...s });
  });
  return out;
}

/**
 * Áp một thay đổi của khách vào lịch lưu trú: từ ngày `from` đến `to` ở phòng / gói mới.
 * - Gia hạn: from = ngày đón cũ, to = ngày đón mới.
 * - Đổi phòng / gói / nâng hạng: from = ngày bắt đầu đổi, to = ngày đón.
 * Trả về { segments, checkIn, checkOut }.
 */
export function applyStayChange(booking, change) {
  const current = getStaySegments(booking);
  const next = { ...change, roomType: change.roomType || roomTypeOf(change.roomId) };
  const kept = [];
  current.forEach((s) => {
    if (s.to <= next.from || s.from >= next.to) { kept.push({ ...s }); return; }
    if (s.from < next.from) kept.push({ ...s, to: next.from });
    if (s.to > next.to) kept.push({ ...s, from: next.to });
  });
  const segments = mergeSegments([...kept, next]);
  return {
    segments,
    checkIn: segments[0].from,
    checkOut: segments[segments.length - 1].to,
  };
}

const isClosed = (status) => ['check-out', 'Đã hoàn tất', 'hoàn tất', 'cancelled', 'Đã hủy', 'Đã huỷ', 'COMPLETED', 'CANCELLED']
  .includes(String(status || '').trim());

/**
 * Danh sách "lượt ở" trong một phòng để tính chỗ trống theo ngày.
 * Đơn không có chặng thì giữ nguyên như trước (nằm trong danh sách phòng của nó).
 * Đơn có chặng thì chỉ tính những ngày nó thật sự ở phòng này, kể cả khi đơn được lưu ở phòng khác.
 * Mỗi lượt giữ tham chiếu đơn gốc ở `_booking` và phòng gốc ở `_homeRoomId`.
 */
export function stayEntriesForRoom(roomId, allBookingsByRoom = {}) {
  const entries = [];
  const seen = new Set();
  Object.entries(allBookingsByRoom || {}).forEach(([homeRoomId, list]) => {
    (list || []).forEach((b) => {
      if (!b) return;
      const key = b.code || b.id;
      const hasSegments = Array.isArray(b.staySegments) && b.staySegments.some(isValidSegment);
      if (!hasSegments) {
        if (homeRoomId === roomId) entries.push(b);
        return;
      }
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      const segments = getStaySegments(b);
      const end = segments[segments.length - 1].to;
      segments.forEach((s) => {
        if (s.roomId !== roomId) return;
        entries.push({
          ...b,
          checkIn: s.from,
          checkOut: s.to,
          // Chặng kết thúc giữa kỳ lưu trú: ngày `to` bé đã chuyển phòng, không còn ở phòng này
          _movesOutOn: s.to < end ? s.to : null,
          _booking: b,
          _homeRoomId: homeRoomId,
          _segment: s,
        });
      });
    });
  });
  return entries;
}

/** Số bé cao nhất đang ở một phòng trong mỗi đêm của khoảng [from, to), bỏ qua các đơn trong excludeCodes */
export function peakCatsInRoom(roomId, allBookingsByRoom, from, to, excludeCodes = []) {
  const entries = stayEntriesForRoom(roomId, allBookingsByRoom).filter((b) =>
    !isClosed(b.status) && !String(b.code || '').includes('BK')
    && !excludeCodes.includes(b.code) && !excludeCodes.includes(b.id));
  let peak = 0;
  for (let d = from; d && d < to; d = addDays(d, 1)) {
    const cats = entries.reduce((sum, b) => (b.checkIn <= d && d < b.checkOut ? sum + (Number(b.cats) || 1) : sum), 0);
    if (cats > peak) peak = cats;
  }
  return peak;
}

/**
 * Các phòng còn đủ chỗ cho đơn trong khoảng [from, to) (không tính chính đơn đó), nhóm theo hạng.
 * rooms: [{ id, type, capacity }]
 */
export function findRoomsWithSpace({ rooms, allBookingsByRoom, from, to, cats, excludeCodes = [], maintenance = {} }) {
  return rooms
    .filter((r) => !maintenance[r.id] && r.capacity >= cats)
    .map((r) => {
      const occupied = peakCatsInRoom(r.id, allBookingsByRoom, from, to, excludeCodes);
      return { ...r, occupied, remaining: Math.max(0, r.capacity - occupied) };
    })
    .filter((r) => r.remaining >= cats);
}

/** Giá 1 đêm/bé của gói lưu trú ở một hạng phòng (giống bước 2 lúc đặt: giá gói + phụ phí phòng sau giảm) */
export function packageNightlyPrice(pkg, roomType, roomSurcharges = {}) {
  if (!pkg) return 0;
  const surcharge = Number(roomSurcharges?.[roomType]) || 0;
  const basePrice = Number(pkg.basePrice ?? pkg.price) || 0;
  const pct = pkg.discountPercent ?? 10;
  return basePrice + Math.round(surcharge * (1 - pct / 100));
}

/**
 * Kiểm tra lịch lưu trú mới khách gửi lên (server dùng). Trả về chuỗi lỗi hoặc null.
 * - Liền mạch từ ngày gửi bé tới ngày đón mới, không rút ngắn ngày đón
 * - Không sửa những đêm đã qua
 * - Phòng tồn tại, đủ sức chứa, còn đủ chỗ ở mọi đêm thay đổi
 */
export function validateStayPlan({ booking, segments, rooms, allBookingsByRoom, todayStr }) {
  if (!Array.isArray(segments) || segments.length === 0 || segments.length > 30) return 'Lịch lưu trú không hợp lệ.';
  const sorted = [...segments].sort((a, b) => String(a.from).localeCompare(String(b.from)));
  if (!sorted.every(isValidSegment)) return 'Lịch lưu trú không hợp lệ.';
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].from !== sorted[i - 1].to) return 'Các khoảng ngày lưu trú phải liền nhau.';
  }
  const cats = catsOf(booking);
  const before = getStaySegments(booking);
  const oldEnd = before.length ? before[before.length - 1].to : booking.checkOut;
  const newEnd = sorted[sorted.length - 1].to;
  if (sorted[0].from !== booking.checkIn) return 'Ngày gửi bé không được thay đổi ở đây.';
  if (newEnd < oldEnd) return 'Không thể rút ngắn ngày đón tại đây, vui lòng liên hệ nhân viên.';
  if (nightsOf(oldEnd, newEnd) > 60) return 'Chỉ được gia hạn tối đa 60 ngày mỗi lần.';

  const stayOn = (list, d) => list.find((s) => s.from <= d && d < s.to) || null;
  const excludeCodes = [booking.code, booking.id].filter(Boolean);
  for (const s of sorted) {
    const room = rooms.find((r) => r.id === s.roomId);
    if (!room) return `Không tìm thấy phòng ${s.roomId}.`;
    if (cats > room.capacity) return `Phòng ${room.id} chỉ chứa tối đa ${room.capacity} bé.`;
    const price = Number(s.pricePerNight);
    if (!Number.isFinite(price) || price <= 0) return 'Giá phòng không hợp lệ.';
    // Gói và hạng phòng đã có trong đơn thì giá phải giữ như cũ
    const known = before.find((o) => roomTypeOf(o.roomId) === roomTypeOf(s.roomId)
      && (o.packageId || o.packageName) === (s.packageId || s.packageName));
    if (known && Number(known.pricePerNight) !== price) return 'Giá phòng không khớp với gói đã đặt.';

    for (let d = s.from; d < s.to; d = addDays(d, 1)) {
      const old = stayOn(before, d);
      const changed = !old || old.roomId !== s.roomId || !sameStay(old, s);
      if (!changed) continue;
      if (todayStr && d < todayStr) return 'Không thể thay đổi những ngày đã qua.';
      if (old && old.roomId === s.roomId) continue; // cùng phòng, chỉ đổi gói
      const occupied = peakCatsInRoom(s.roomId, allBookingsByRoom, d, addDays(d, 1), excludeCodes);
      if (occupied + cats > room.capacity) {
        return `Phòng ${s.roomId} không còn đủ chỗ ngày ${d}. Vui lòng chọn phòng khác.`;
      }
    }
  }
  return null;
}

// '2026-11-05' -> '05/11'
export const shortDate = (dateStr) => (isDateStr(dateStr) ? `${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}` : '');

export const describeSegment = (s) => [s.roomId ? `Phòng ${s.roomId}` : '', s.packageName].filter(Boolean).join(' · ');
