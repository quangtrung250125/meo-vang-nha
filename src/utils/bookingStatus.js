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

/**
 * Chuẩn hóa trạng thái đơn đặt phòng từ dữ liệu cũ hoặc mới
 */
export const getBookingStatus = (booking) => {
  if (!booking) return BOOKING_STATUS.UPCOMING;

  if (booking.status && BOOKING_STATUS[booking.status]) {
    return booking.status;
  }

  // Tương thích ngược với các chuỗi trạng thái cũ
  if (booking.status === 'Đang lưu trú' || booking.dynamicStatus === 'Đang lưu trú') {
    return BOOKING_STATUS.IN_HOUSE;
  }
  if (booking.status === 'Đã hoàn tất' || booking.status === 'Đã hoàn thành' || booking.dynamicStatus === 'Đã hoàn tất') {
    return BOOKING_STATUS.COMPLETED;
  }
  if (booking.status === 'Đã hủy' || booking.dynamicStatus === 'Đã hủy') {
    return BOOKING_STATUS.CANCELLED;
  }
  if (booking.status === 'Chờ khách xác nhận') {
    return BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL;
  }

  // Fallback tính theo ngày nếu đơn hàng cũ chưa có trường status
  if (booking.checkIn && booking.checkOut) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inDate = new Date(booking.checkIn);
    inDate.setHours(0, 0, 0, 0);

    const outDate = new Date(booking.checkOut);
    outDate.setHours(23, 59, 59, 999);

    if (today < inDate) return BOOKING_STATUS.UPCOMING;
    if (today >= inDate && today <= outDate) return BOOKING_STATUS.IN_HOUSE;
    if (today > outDate) return BOOKING_STATUS.COMPLETED;
  }

  return BOOKING_STATUS.UPCOMING;
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
