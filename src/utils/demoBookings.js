// Mã các đơn mẫu từng được nạp sẵn vào trình duyệt để kiểm thử (không tồn tại trên server).
// Dùng chung cho giao diện và server (api/_lib) để lọc bỏ khỏi mọi nguồn dữ liệu
// và không cấp trùng mã này cho đơn thật.
export const DEMO_BOOKING_IDS = ['MVN-88219', 'MVN-95104', 'MVN-73412', 'MVN-61208', 'MVN-50913'];

export const isDemoBooking = (booking) =>
  Boolean(booking) && (DEMO_BOOKING_IDS.includes(booking.id) || DEMO_BOOKING_IDS.includes(booking.code));

export const withoutDemoBookings = (list) =>
  Array.isArray(list) ? list.filter((b) => !isDemoBooking(b)) : list;
