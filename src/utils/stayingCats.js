import { BOOKING_STATUS, normalizeStatusValue } from './bookingStatus';

// Một nguồn dữ liệu chung cho trang Tổng quan và Tình trạng phòng: mọi danh sách đều tính từ kho phòng
// (useRoomState().bookings — dữ liệu /api/bookings + Supabase mà trang Tình trạng phòng đang hiển thị).

export const DEFAULT_CAT_IMAGE =
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80';

// So khớp id mèo không phân biệt kiểu (số / chuỗi)
const sameId = (a, b) => a != null && b != null && String(a) === String(b);

// Các đơn trong kho phòng (kèm mã phòng), mỗi mã đơn 1 lần
function listRoomBookings(roomBookings = {}) {
  const seen = new Set();
  const result = [];
  Object.entries(roomBookings || {}).forEach(([roomId, list]) => {
    (list || []).forEach((b) => {
      const code = b?.code || b?.id;
      if (!code || seen.has(code)) return;
      seen.add(code);
      result.push({ ...b, code, roomId: b.roomId || roomId });
    });
  });
  return result;
}

/** Các đơn ĐANG Ở (Admin đã check-in, chưa check-out). */
export const getStayingBookings = (roomBookings) =>
  listRoomBookings(roomBookings).filter((b) => normalizeStatusValue(b.status) === BOOKING_STATUS.IN_HOUSE);

/** Đơn cần check-in hôm nay: chưa check-in và ngày gửi bé là hôm nay. */
export const getTodayCheckIns = (roomBookings, todayKey) =>
  listRoomBookings(roomBookings).filter(
    (b) => normalizeStatusValue(b.status) === BOOKING_STATUS.UPCOMING && b.checkIn === todayKey
  );

/** Đơn cần check-out hôm nay: đang ở và ngày đón bé là hôm nay (hoặc đã quá hạn). */
export const getTodayCheckOuts = (roomBookings, todayKey) =>
  getStayingBookings(roomBookings).filter((b) => !b.checkOut || b.checkOut <= todayKey);

/** Các bé của một đơn: theo petProfiles / petIds của đơn, hồ sơ mèo hiện tại chỉ dùng để lấy tên / ảnh mới nhất. */
export function getBookingPets(booking, petList = []) {
  const result = [];
  const add = (pet) => {
    if (!pet || pet.id == null) return;
    const idx = result.findIndex((p) => sameId(p.id, pet.id));
    if (idx >= 0) result[idx] = { ...result[idx], ...pet };
    else result.push(pet);
  };
  (booking?.petProfiles || []).forEach(add);
  (booking?.petIds || []).forEach((id) => add(petList.find((p) => sameId(p.id, id))));
  return result;
}

/**
 * Danh sách bé mèo đang lưu trú (mỗi bé một thẻ trong "Tác vụ hôm nay").
 * Đơn không có hồ sơ mèo dùng bé đại diện pet_<mã đơn> (server cũng chấp nhận id này).
 */
export function getStayingCats(roomBookings, petList = []) {
  return getStayingBookings(roomBookings).flatMap((booking) => {
    const pets = getBookingPets(booking, petList);
    const list = pets.length > 0 ? pets : [{ id: `pet_${booking.code}`, name: booking.catNames || 'Bé cưng' }];
    return list.map((pet) => ({
      id: String(pet.id),
      bookingId: booking.code,
      roomId: booking.roomId,
      room: booking.roomId,
      booking,
      catName: pet.name || 'Bé cưng',
      ownerName: booking.ownerName || booking.customerName || 'Khách hàng',
      ownerPhone: booking.ownerPhone || booking.customerPhone || '',
      customerId: booking.customerId || null,
      image: pet.imagePreview || pet.avatar || DEFAULT_CAT_IMAGE,
      rawPet: pet,
    }));
  });
}
