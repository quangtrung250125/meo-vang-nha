// Gom dữ liệu từ giao diện khách hàng (hồ sơ, mèo, đơn đặt phòng) thành danh sách khách hàng cho Admin.
// Các hàm ở đây không phụ thuộc React để dễ kiểm thử.

const DONE_STATUSES = ['check-out', 'đã hoàn tất', 'hoàn tất', 'completed'];
const CANCELLED_STATUSES = ['cancelled', 'đã hủy', 'đã huỷ'];
const STAYING_STATUSES = ['đang ở', 'checked-in', 'đang lưu trú', 'staying'];

export const VIP_SPENT = 3000000;
export const VIP_BOOKINGS = 5;

export const SEGMENTS = {
  new: { label: 'Chưa đặt phòng', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  first: { label: 'Khách mới', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  returning: { label: 'Quay lại', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  vip: { label: 'VIP', cls: 'bg-orange-50 text-orange-600 border-orange-200' },
};

export const BOOKING_STAGES = {
  upcoming: { label: 'Chờ nhận', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  staying: { label: 'Đang lưu trú', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Đã hoàn tất', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  cancelled: { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const normalizePhone = (phone = '') => String(phone || '').replace(/\D/g, '');

export const bookingStage = (booking) => {
  const status = String(booking?.status || '').trim().toLowerCase();
  if (CANCELLED_STATUSES.includes(status)) return 'cancelled';
  if (DONE_STATUSES.includes(status)) return 'completed';
  if (STAYING_STATUSES.includes(status)) return 'staying';
  return 'upcoming';
};

// Khách đã thanh toán đủ hóa đơn (nút "Thanh toán ngay" ở Lịch đặt của khách ghi 'Đã thanh toán').
// Đơn mới đặt, chờ cọc hoặc mới cọc đều chưa được ghi nhận doanh thu / chi tiêu.
export const PAID_STATUS = 'Đã thanh toán';
export const isFullyPaid = (booking) => String(booking?.paymentStatus || '').trim() === PAID_STATUS;

// Đơn được ghi nhận doanh thu: đã thanh toán đủ và không bị hủy
export const isRevenueBooking = (booking) => isFullyPaid(booking) && bookingStage(booking) !== 'cancelled';

// Tháng ghi nhận doanh thu = tháng của ngày gửi mèo (check-in), dạng 'YYYY-MM'.
// VD gửi 25/10 → đón 08/11, thanh toán lúc nào cũng tính cho tháng 10.
export const revenueMonthOf = (booking) => {
  const raw = String(booking?.checkIn || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const vn = raw.match(/^\d{1,2}\/(\d{1,2})\/(\d{4})/);
  if (vn) return `${vn[2]}-${vn[1].padStart(2, '0')}`;
  return null;
};

export const formatMonth = (monthKey) => {
  if (!monthKey) return '—';
  const [y, m] = monthKey.split('-');
  return `Tháng ${Number(m)}/${y}`;
};

const toTime = (value) => {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(t) ? t : null;
};

const bookingKey = (b) => b.code || b.id;

// Gộp các bản ghi trùng nhau từ nhiều nguồn, bản sau ghi đè bản trước
const dedupe = (list, keyOf) => {
  const map = new Map();
  list.forEach((item) => {
    if (!item) return;
    const key = keyOf(item);
    if (!key) return;
    const prev = map.get(key);
    const merged = { ...prev, ...item };
    // Thanh toán đủ không thể quay lại: nguồn nào đã ghi 'Đã thanh toán' thì giữ, tránh bản cũ ở nguồn khác đè mất
    if (isFullyPaid(prev) && !isFullyPaid(item)) {
      merged.paymentStatus = prev.paymentStatus;
      if (prev.paidAt) merged.paidAt = prev.paidAt;
    }
    map.set(key, merged);
  });
  return [...map.values()];
};

export const segmentOf = (customer) => {
  const active = customer.bookingCount;
  if (active === 0) return 'new';
  if (customer.totalSpent >= VIP_SPENT || active >= VIP_BOOKINGS) return 'vip';
  if (active >= 2) return 'returning';
  return 'first';
};

/**
 * @param {{ profiles?: object[], bookings?: object[], pets?: object[], excludeIds?: string[] }} sources
 * @returns {object[]} danh sách khách hàng, mới hoạt động gần nhất đứng đầu
 */
export function buildCustomers({ profiles = [], bookings = [], pets = [], excludeIds = [] } = {}) {
  const excluded = new Set(excludeIds.filter(Boolean));
  const customers = new Map();
  const phoneIndex = new Map();

  const ensure = (id, seed = {}) => {
    if (!customers.has(id)) {
      customers.set(id, {
        id,
        fullName: '',
        phone: '',
        email: '',
        createdAt: null,
        hasAccount: false,
        pets: [],
        bookings: [],
      });
    }
    const customer = customers.get(id);
    Object.entries(seed).forEach(([key, value]) => {
      if (value && !customer[key]) customer[key] = value;
    });
    const phone = normalizePhone(customer.phone);
    if (phone && !phoneIndex.has(phone)) phoneIndex.set(phone, id);
    return customer;
  };

  // 1. Hồ sơ tài khoản khách hàng
  dedupe(profiles, (p) => p.id).forEach((p) => {
    if (excluded.has(p.id)) return;
    ensure(p.id, {
      fullName: p.fullName || p.full_name,
      phone: p.phone,
      email: p.email,
      createdAt: p.createdAt || p.created_at,
    }).hasAccount = true;
  });

  // 2. Đơn đặt phòng: theo mã khách, nếu không có thì theo số điện thoại
  dedupe(bookings, bookingKey).forEach((b) => {
    const ownerId = b.customerId || b.customer_id;
    if (ownerId && excluded.has(ownerId)) return;
    const phone = normalizePhone(b.customerPhone || b.ownerPhone || b.phone);
    const id = ownerId || (phone && phoneIndex.get(phone)) || (phone ? `phone:${phone}` : null);
    if (!id) return;
    const customer = ensure(id, {
      fullName: b.customerName || b.ownerName,
      phone: b.customerPhone || b.ownerPhone,
      email: b.customerEmail,
    });
    if (ownerId) customer.hasAccount = true;
    customer.bookings.push(b);
  });

  // 3. Hồ sơ mèo: theo chủ (ownerId), nếu không có thì theo đơn đặt phòng có bé đó
  const petOwnerFromBookings = new Map();
  customers.forEach((c) => c.bookings.forEach((b) => {
    (b.petIds || []).forEach((petId) => petOwnerFromBookings.set(String(petId), c.id));
    (b.petProfiles || []).forEach((p) => p?.id && petOwnerFromBookings.set(String(p.id), c.id));
  }));

  const bookingPets = [];
  customers.forEach((c) => c.bookings.forEach((b) => {
    (b.petProfiles || []).forEach((p) => {
      if (p?.id) bookingPets.push({ ...p, ownerId: p.ownerId || c.id });
    });
  }));

  // Hồ sơ mèo trong đơn đặt phòng là bản chụp lúc đặt, hồ sơ mèo hiện tại được ưu tiên
  dedupe([...bookingPets, ...pets], (p) => p.id && String(p.id)).forEach((pet) => {
    const ownerId = pet.ownerId || pet.user_id || petOwnerFromBookings.get(String(pet.id));
    if (!ownerId || excluded.has(ownerId)) return;
    ensure(ownerId).pets.push(pet);
  });

  const now = Date.now();
  return [...customers.values()]
    .map((c) => {
      const sortedBookings = [...c.bookings].sort(
        (a, b) => (toTime(b.createdAt || b.checkIn) || 0) - (toTime(a.createdAt || a.checkIn) || 0)
      );
      const active = sortedBookings.filter((b) => bookingStage(b) !== 'cancelled');
      const firstSeen = [c.createdAt, ...c.bookings.map((b) => b.createdAt), ...c.pets.map((p) => p.createdAt)]
        .map(toTime)
        .filter((t) => t !== null);
      const customer = {
        ...c,
        fullName: c.fullName || (c.email ? c.email.split('@')[0] : 'Khách hàng'),
        createdAt: c.createdAt || (firstSeen.length ? new Date(Math.min(...firstSeen)).toISOString() : null),
        bookings: sortedBookings,
        bookingCount: active.length,
        completedCount: active.filter((b) => bookingStage(b) === 'completed').length,
        isStaying: active.some((b) => bookingStage(b) === 'staying'),
        // Chỉ cộng các đơn khách đã thanh toán đủ
        totalSpent: active.filter(isFullyPaid).reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0),
        paidCount: active.filter(isFullyPaid).length,
        lastBookingAt: active[0]?.createdAt || active[0]?.checkIn || null,
      };
      customer.segment = segmentOf(customer);
      customer.lastActivity = Math.max(
        toTime(customer.lastBookingAt) || 0,
        toTime(customer.createdAt) || 0,
        ...c.pets.map((p) => toTime(p.updatedAt || p.createdAt) || 0)
      ) || now;
      return customer;
    })
    .sort((a, b) => b.lastActivity - a.lastActivity);
}

/**
 * Doanh thu theo tháng gửi mèo: chỉ các đơn đã thanh toán đủ, gom theo tháng của ngày check-in.
 * @returns {{ month: string, revenue: number, bookings: number }[]} tháng mới nhất đứng đầu
 */
export function computeRevenueByMonth(customers) {
  const months = new Map();
  customers.forEach((c) => c.bookings.forEach((b) => {
    if (!isRevenueBooking(b)) return;
    const month = revenueMonthOf(b);
    if (!month) return;
    const row = months.get(month) || { month, revenue: 0, bookings: 0 };
    row.revenue += Number(b.totalPrice) || 0;
    row.bookings += 1;
    months.set(month, row);
  }));
  return [...months.values()].sort((a, b) => b.month.localeCompare(a.month));
}

export function computeStats(customers, now = new Date()) {
  const monthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const booked = customers.filter((c) => c.bookingCount > 0);
  const revenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  return {
    total: customers.length,
    newLast30: customers.filter((c) => (toTime(c.createdAt) || 0) >= monthAgo).length,
    booked: booked.length,
    returning: customers.filter((c) => c.bookingCount >= 2).length,
    returningRate: booked.length ? customers.filter((c) => c.bookingCount >= 2).length / booked.length : 0,
    pets: customers.reduce((sum, c) => sum + c.pets.length, 0),
    staying: customers.filter((c) => c.isStaying).length,
    bookings: customers.reduce((sum, c) => sum + c.bookingCount, 0),
    revenue,
    paidBookings: customers.reduce((sum, c) => sum + (c.paidCount || 0), 0),
    avgSpent: booked.length ? revenue / booked.length : 0,
    revenueByMonth: computeRevenueByMonth(customers),
    segments: Object.keys(SEGMENTS).map((key) => ({
      key,
      count: customers.filter((c) => c.segment === key).length,
    })),
  };
}

export function computeFunnel(customers) {
  const steps = [
    { key: 'account', label: 'Khách hàng ghi nhận', hint: 'Đã tạo tài khoản hoặc gửi đơn', count: customers.length },
    { key: 'pet', label: 'Đã tạo hồ sơ mèo', hint: 'Có ít nhất 1 hồ sơ mèo', count: customers.filter((c) => c.pets.length > 0).length },
    { key: 'booked', label: 'Đã đặt phòng', hint: 'Hoàn thành quy trình đặt phòng', count: customers.filter((c) => c.bookingCount > 0).length },
    { key: 'completed', label: 'Đã hoàn tất lưu trú', hint: 'Có ít nhất 1 đơn đã trả mèo', count: customers.filter((c) => c.completedCount > 0).length },
    { key: 'returning', label: 'Quay lại đặt tiếp', hint: 'Từ 2 đơn trở lên', count: customers.filter((c) => c.bookingCount >= 2).length },
  ];
  return steps.map((step, i) => {
    const prev = i === 0 ? step.count : steps[i - 1].count;
    return {
      ...step,
      ofTotal: steps[0].count ? step.count / steps[0].count : 0,
      fromPrev: prev ? Math.min(1, step.count / prev) : 0,
    };
  });
}

export const formatMoney = (value) => `${Math.round(Number(value) || 0).toLocaleString('vi-VN')}đ`;

export const formatDate = (value) => {
  const t = toTime(value);
  return t === null ? '—' : new Date(t).toLocaleDateString('vi-VN');
};

export const formatPercent = (ratio) => `${Math.round((ratio || 0) * 100)}%`;

export const initialsOf = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'KH';
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
};
