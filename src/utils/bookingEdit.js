// Khách chỉnh sửa đơn ở "Lịch đặt của tôi": đổi mèo, lịch, phòng, gói dịch vụ.
// Giá mới tính giống hệt bước 4 lúc đặt phòng (bookingPricing), tiền cọc theo bookingDeposit.

import { calculateBookingPrice, countStayDays } from './bookingPricing.js';
import { formatDateRange } from './bookingStatus.js';

export const EDIT_SECTIONS = {
  PETS: 'pets',
  DATES: 'dates',
  ROOM: 'room',
  PACKAGES: 'packages',
};

// 'VVIP-02' -> 'VVIP'
export const roomTypeOf = (room) =>
  String(room?.type || room?.id || room || '').split('-')[0].toUpperCase() || 'VIP';

// Gói lưu trú có áp dụng cho hạng phòng không (gói không ghi hạng phòng thì áp dụng mọi phòng)
export const lodgingFitsRoom = (pkg, roomType) => !pkg?.forRoomTypes || pkg.forRoomTypes.includes(roomType);

const money = (n) => `${(Number(n) || 0).toLocaleString('vi-VN')}đ`;
const namesOf = (pets) => (pets || []).map((p) => p?.name).filter(Boolean).join(', ');
const sameIds = (a = [], b = []) => [...a].sort().join('|') === [...b].sort().join('|');

/**
 * Tính lại đơn sau khi chỉnh sửa.
 * @param {object} booking đơn hiện tại
 * @param {object} draft { pets, checkIn, checkOut, room: { id, type }, lodging, spa, extra } (lodging đã tính giá theo phòng)
 * @param {object} [options] { pricingRules } quy tắc giá admin đang bật (cuối tuần, lễ Tết...)
 * @returns {{ changes: object, pricing: object, days: number, summary: string[] }}
 */
export function buildBookingEdit(booking, draft, { pricingRules = [] } = {}) {
  const pets = draft.pets || [];
  const cats = Math.max(1, pets.length || Number(booking.cats) || 1);
  const days = countStayDays(draft.checkIn, draft.checkOut);
  const addCamera = Boolean(booking.addCamera);
  const pricing = calculateBookingPrice({
    lodging: draft.lodging,
    spa: draft.spa || null,
    extra: draft.extra || null,
    days,
    cats,
    checkIn: draft.checkIn,
    pricingRules,
    // Đơn cũ chưa ghi lại thì coi như đã áp dụng ưu đãi (mặc định khi đặt phòng)
    couponApplied: booking.couponApplied !== false,
    addCamera,
  });

  const changes = {
    cats,
    petIds: pets.map((p) => p.id).filter(Boolean),
    petProfiles: pets,
    catNames: namesOf(pets),
    checkIn: draft.checkIn,
    checkOut: draft.checkOut,
    roomId: draft.room?.id,
    selectedRoom: draft.room,
    packages: [draft.lodging?.name, draft.spa?.name, draft.extra?.name].filter(Boolean),
    selectedPackage: draft.lodging,
    selectedLodging: draft.lodging,
    selectedSpa: draft.spa || null,
    selectedExtra: draft.extra || null,
    hasCamera: pricing.cameraIncluded || addCamera,
    addCamera: !pricing.cameraIncluded && addCamera,
    totalPrice: pricing.total,
    totalAmount: pricing.total,
    pricingAdjustments: pricing.ruleAdjustments,
    ...(booking.baseTotalPrice !== undefined ? { baseTotalPrice: pricing.total } : {}),
  };

  return { changes, pricing, days, summary: summarizeBookingEdit(booking, changes) };
}

/**
 * Tóm tắt thay đổi (hiện cho khách ở bước xem lại và gửi Admin trong thông báo).
 */
export function summarizeBookingEdit(booking, changes) {
  const lines = [];
  const oldPetIds = booking.petIds?.length ? booking.petIds : (booking.petProfiles || []).map((p) => p.id);
  const oldCats = Number(booking.cats) || oldPetIds.length || 1;
  if (changes.cats !== oldCats || !sameIds(oldPetIds, changes.petIds)) {
    const oldNames = booking.catNames || namesOf(booking.petProfiles) || `${oldCats} bé`;
    lines.push(`Mèo: ${oldNames} → ${changes.catNames || `${changes.cats} bé`} (${changes.cats} bé)`);
  }
  if (changes.checkIn !== booking.checkIn || changes.checkOut !== booking.checkOut) {
    lines.push(`Lịch: ${formatDateRange(booking.checkIn, booking.checkOut)} → ${formatDateRange(changes.checkIn, changes.checkOut)}`);
  }
  const oldRoom = booking.roomId || booking.selectedRoom?.id;
  if (changes.roomId && changes.roomId !== oldRoom) {
    lines.push(`Phòng: ${oldRoom || '—'} → ${changes.roomId}`);
  }
  const oldPackages = (booking.packages?.length ? booking.packages : [booking.selectedPackage?.name]).filter(Boolean);
  if (oldPackages.join(' + ') !== changes.packages.join(' + ')) {
    lines.push(`Gói dịch vụ: ${oldPackages.join(' + ') || '—'} → ${changes.packages.join(' + ')}`);
  }
  const oldTotal = Number(booking.totalPrice ?? booking.totalAmount) || 0;
  if (lines.length > 0 && oldTotal !== changes.totalPrice) {
    lines.push(`Tiền dịch vụ: ${money(oldTotal)} → ${money(changes.totalPrice)}`);
  }
  return lines;
}
