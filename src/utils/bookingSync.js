// ─── Đọc một dòng bảng `bookings` (Supabase) thành đơn đặt phòng, giống hệt cách server đọc (api/_lib/bookingsDb.js)
// Mã đơn MVN-xxxxx luôn là id/code của đơn, id uuid của dòng giữ ở dbId -> mọi trình duyệt dùng chung một khóa
export const bookingFromDbRow = (row) => ({
  ...(row?.data || {}),
  id: row?.data?.id || row?.code || row?.id,
  code: row?.code || row?.data?.code || row?.data?.id || row?.id,
  dbId: row?.id,
  customerId: row?.data?.customerId || row?.customer_id || null,
  createdAt: row?.data?.createdAt || row?.created_at,
  updatedAt: row?.data?.updatedAt || row?.updated_at || row?.data?.createdAt || row?.created_at,
});

export const bookingKey = (b) => b?.code || b?.id || null;
const bookingTime = (b) => {
  const t = b?.updatedAt || b?.extendedAt || b?.createdAt || '';
  const n = t ? new Date(t).getTime() : 0;
  return Number.isNaN(n) ? 0 : n;
};

// Một mã đơn có thể có nhiều dòng trong bảng bookings -> chỉ giữ 1 đơn / mã (bản cập nhật mới nhất)
export const dedupeBookingsByCode = (list) => {
  const map = new Map();
  for (const b of list || []) {
    const key = bookingKey(b);
    if (!key) continue;
    const existing = map.get(key);
    if (!existing || bookingTime(b) >= bookingTime(existing)) map.set(key, b);
  }
  return Array.from(map.values());
};

// Đơn vừa tạo trên máy này nhưng có thể chưa kịp ghi lên Supabase -> giữ tạm trong vài phút
const PENDING_WRITE_MS = 10 * 60 * 1000;

/**
 * Danh sách đơn khi đã đăng nhập: bảng `bookings` trên Supabase là nguồn chuẩn duy nhất.
 * Trước đây danh sách = gộp (localStorage + server tạm + Supabase) và không bao giờ bỏ đơn nào,
 * nên mỗi trình duyệt giữ một bộ đơn cũ khác nhau (vd. 20 đơn ở máy này, 18 đơn ở máy kia).
 * - Đơn có trên Supabase: lấy dữ liệu Supabase (bổ sung trường còn thiếu từ server sync nếu có)
 * - Đơn chỉ có ở trình duyệt này: bỏ, trừ đơn vừa tạo trong 10 phút (đang chờ ghi lên Supabase)
 */
export const buildAuthoritativeBookings = (localList, dbBookings, serverBookings = [], now = Date.now()) => {
  const db = dedupeBookingsByCode(dbBookings);
  const serverByKey = new Map((serverBookings || []).map((b) => [bookingKey(b), b]));
  const dbKeys = new Set(db.map(bookingKey));

  const fromDb = db.map((b) => {
    const extra = serverByKey.get(bookingKey(b));
    return extra ? { ...extra, ...b } : b;
  });

  const pendingLocal = dedupeBookingsByCode(
    (localList || []).filter((b) => {
      const key = bookingKey(b);
      if (!key || dbKeys.has(key)) return false;
      const created = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return created && now - created < PENDING_WRITE_MS;
    })
  );

  return [...pendingLocal, ...fromDb].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
};
