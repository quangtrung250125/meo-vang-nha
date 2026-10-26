// ==========================================
// ĐỊNH NGHĨA BẢNG TRẠNG THÁI CHUẨN ĐƠN ĐẶT (BOOKING STATUS ENUMS)
// ==========================================

export const BOOKING_STATUS = {
  UPCOMING: 'UPCOMING',                             // Sắp tới (mặc định sau khi tạo, chưa check-in)
  IN_HOUSE: 'IN_HOUSE',                             // Đang lưu trú (Admin đã Check-in)
  COMPLETED: 'COMPLETED',                           // Đã hoàn thành (Admin đã Check-out)
  CANCELLED: 'CANCELLED',                           // Đã hủy (Khách hủy hoặc Admin hủy sau xác nhận)
  PENDING_CUSTOMER_APPROVAL: 'PENDING_CUSTOMER_APPROVAL', // Chờ khách xác nhận (Admin đề xuất thay đổi/hủy)
};

export const REALTIME_CHANNEL = 'meo_vang_nha_realtime_sync';

export const BOOKING_STATUS_CONFIG = {
  [BOOKING_STATUS.UPCOMING]: {
    key: BOOKING_STATUS.UPCOMING,
    label: 'Sắp tới',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    dotClass: 'bg-amber-500',
    description: 'Đơn đặt đã được xác nhận, đang chờ ngày nhận bé (Check-in).'
  },
  [BOOKING_STATUS.IN_HOUSE]: {
    key: BOOKING_STATUS.IN_HOUSE,
    label: 'Đang lưu trú',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    dotClass: 'bg-emerald-500',
    description: 'Bé đang nghỉ dưỡng tại khách sạn. Bạn có thể theo dõi Camera 24/7.'
  },
  [BOOKING_STATUS.COMPLETED]: {
    key: BOOKING_STATUS.COMPLETED,
    label: 'Đã hoàn thành',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    dotClass: 'bg-blue-500',
    description: 'Kỳ lưu trú đã kết thúc, bé đã được bàn giao về với gia đình.'
  },
  [BOOKING_STATUS.CANCELLED]: {
    key: BOOKING_STATUS.CANCELLED,
    label: 'Đã hủy',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    dotClass: 'bg-rose-500',
    description: 'Đơn đặt lịch đã bị hủy bỏ.'
  },
  [BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL]: {
    key: BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL,
    label: 'Chờ khách xác nhận',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-300 ring-2 ring-purple-400/20 animate-pulse',
    dotClass: 'bg-purple-500',
    description: 'Admin đã gửi đề xuất thay đổi hoặc hủy đơn. Đang chờ khách hàng xác nhận.'
  }
};

// ==========================================
// GIÁ TRỊ TRẠNG THÁI LƯU TRỮ (dùng chung cho Tình trạng phòng, server /api/bookings,
// Supabase và Lịch đặt của khách) — chỉ Admin Check-in/Check-out hoặc Hủy mới đổi được
// ==========================================
export const STORED_STATUS = {
  UPCOMING: 'check-in',   // Sắp tới: chờ Admin bấm Check-in
  IN_HOUSE: 'đang ở',     // Đang lưu trú
  COMPLETED: 'check-out', // Đã hoàn thành
  CANCELLED: 'cancelled', // Đã hủy
};

// Loại đề xuất Admin gửi khách (lưu trong booking.pending_changes)
export const PROPOSAL_TYPE = {
  RESCHEDULE: 'RESCHEDULE', // Đổi lịch nhận/trả
  CANCEL: 'CANCEL',         // Hủy đơn
  UPDATE: 'UPDATE',         // Thay đổi gói dịch vụ / ghi chú đơn
};

export const PROPOSAL_LABEL = {
  [PROPOSAL_TYPE.RESCHEDULE]: 'Đổi lịch',
  [PROPOSAL_TYPE.CANCEL]: 'Hủy đơn',
  [PROPOSAL_TYPE.UPDATE]: 'Thay đổi đơn',
};

/**
 * Chuẩn hóa riêng giá trị status (không xét đề xuất đang chờ)
 */
export const normalizeStatusValue = (status) => {
  if (status && BOOKING_STATUS[status]) return status;
  if (status === 'Đang lưu trú' || status === 'đang ở') return BOOKING_STATUS.IN_HOUSE;
  if (['Đã hoàn tất', 'Đã hoàn thành', 'hoàn tất', 'check-out'].includes(status)) return BOOKING_STATUS.COMPLETED;
  if (status === 'Đã hủy' || status === 'cancelled') return BOOKING_STATUS.CANCELLED;
  if (status === 'Chờ khách xác nhận') return BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL;
  // 'check-in', 'Sắp tới' hoặc chưa có status: luôn là Sắp tới cho tới khi Admin Check-in
  return BOOKING_STATUS.UPCOMING;
};

/**
 * Đơn đã kết thúc (hoàn thành hoặc đã hủy) -> không còn chiếm phòng
 */
export const isClosedStatus = (status) => {
  const normalized = normalizeStatusValue(status);
  return normalized === BOOKING_STATUS.COMPLETED || normalized === BOOKING_STATUS.CANCELLED;
};

/**
 * Trạng thái hiển thị của đơn: nếu Admin đang có đề xuất chờ khách duyệt
 * thì hiển thị "Chờ khách xác nhận", ngược lại theo status lưu trữ.
 */
export const getBookingStatus = (booking) => {
  if (!booking) return BOOKING_STATUS.UPCOMING;

  const base = normalizeStatusValue(booking.status);
  if (booking.pending_changes && base !== BOOKING_STATUS.COMPLETED && base !== BOOKING_STATUS.CANCELLED) {
    return BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL;
  }
  if (base === BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL) {
    // Dữ liệu cũ: status PENDING nhưng đã mất pending_changes -> quay về trạng thái trước
    return normalizeStatusValue(booking.previous_status);
  }
  return base;
};

/**
 * Định dạng khoảng ngày Check-in - Check-out dạng DD/MM/YYYY
 */
export const formatDateRange = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '';
  const format = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return d;
  };
  return `${format(checkIn)} - ${format(checkOut)}`;
};

/**
 * Định dạng một ngày riêng lẻ dạng DD/MM/YYYY
 */
export const formatDateSingle = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};
