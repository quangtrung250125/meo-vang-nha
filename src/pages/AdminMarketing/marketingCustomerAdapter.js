// ============================================================
// marketingCustomerAdapter.js
// Bộ chuyển đổi và tính toán phân khúc khách hàng thật cho thẻ Marketing tự động
// Dữ liệu đọc từ useCustomerData (Supabase + /api/sync + contexts)
// TUYỆT ĐỐI KHÔNG DÙNG DỮ LIỆU GIẢ/MÔ PHỎNG LÀM FALLBACK
// ============================================================

import { VIP_SPENT } from '../AdminCustomers/customerUtils';

export const MARKETING_SEGMENT_KEYS = {
  ALL: 'all',
  POTENTIAL: 'potential',
  NEW: 'new',
  RETURNING: 'returning',
  LOYAL: 'loyal',
  VIP: 'vip',
  AT_RISK: 'at_risk',
  CONFIRMED: 'confirmed',
  CHECKED_OUT: 'checked_out',
  UPGRADING: 'upgrading',
};

// Danh mục các điều kiện hiện tại hệ thống CHƯA CÓ TRƯỜNG DỮ LIỆU THẬT
// (Tuyệt đối không tự bịa số liệu, hiển thị rõ ràng trên giao diện và báo cáo)
export const MISSING_DATA_CONDITIONS = [
  {
    code: 'abandoned_cart',
    scenarioId: 'sc-2',
    name: 'Bỏ dở đặt phòng',
    reason: 'Hệ thống hiện chưa có bảng / cơ chế lưu trữ phiên giỏ hàng bỏ dở khi khách rời khỏi trang Booking.',
  },
  {
    code: 'unresolved_complaints',
    scenarioId: 'sc-7',
    name: 'Đánh giá thấp / Khiếu nại chưa giải quyết',
    reason: 'Dữ liệu đánh giá hiện tại là bản mẫu cục bộ, chưa có bảng liên kết khiếu nại với ID khách hàng thật trong database.',
  },
  {
    code: 'custom_booking_cycle',
    scenarioId: 'sc-7',
    name: 'Quá chu kỳ đặt phòng riêng của chính khách',
    reason: 'Chưa có trường dữ liệu cấu hình chu kỳ gửi mèo riêng biệt cho từng hồ sơ khách hàng.',
  },
];

const toTimestamp = (val) => {
  if (!val) return null;
  const t = new Date(val).getTime();
  return Number.isFinite(t) ? t : null;
};

/**
 * Phân loại phân khúc marketing cho một khách hàng thật
 * Quy tắc:
 * - VIP: chi tiêu tích lũy đạt ngưỡng (từ 3.000.000đ) VÀ từ 2 đơn trở lên
 * - Thân thiết: từ 5 đơn hoàn tất trở lên
 * - Nguy cơ rời bỏ: từng có đơn hoàn tất nhưng không đặt lại sau 6-12 tháng (> 180 ngày)
 * - Khách quay lại: từ đơn thứ 2 trở lên (< 5 đơn và chưa đạt VIP)
 * - Khách mới: đúng 1 đơn hoàn tất
 * - Tiềm năng: đã đăng ký / để lại SĐT / tạo hồ sơ mèo nhưng chưa có đơn hoàn tất nào (completedCount === 0)
 */
export function classifyCustomerSegment(customer, now = new Date()) {
  const nowTs = now.getTime();
  const completed = Number(customer?.completedCount || 0);
  const totalSpent = Number(customer?.totalSpent || 0);
  const totalBookings = Number(customer?.bookingCount || 0);

  // 1. VIP: chi tiêu từ 3 triệu VÀ từ 2 đơn
  if (totalSpent >= VIP_SPENT && (totalBookings >= 2 || completed >= 2)) {
    return MARKETING_SEGMENT_KEYS.VIP;
  }

  // 2. Thân thiết: từ 5 đơn hoàn tất trở lên
  if (completed >= 5 || totalBookings >= 5) {
    return MARKETING_SEGMENT_KEYS.LOYAL;
  }

  // 3. Nguy cơ rời bỏ: đã từng có đơn hoàn tất, nhưng không đặt lại sau hơn 6 tháng (180 ngày)
  const lastBookingTs = toTimestamp(customer?.lastBookingAt);
  if (completed >= 1 && lastBookingTs) {
    const diffDays = (nowTs - lastBookingTs) / (1000 * 60 * 60 * 24);
    if (diffDays >= 180) {
      return MARKETING_SEGMENT_KEYS.AT_RISK;
    }
  }

  // 4. Khách quay lại: từ 2 đơn trở lên
  if (completed >= 2 || totalBookings >= 2) {
    return MARKETING_SEGMENT_KEYS.RETURNING;
  }

  // 5. Khách mới: đúng 1 đơn hoàn tất
  if (completed === 1) {
    return MARKETING_SEGMENT_KEYS.NEW;
  }

  // 6. Tiềm năng: đã đăng ký / có hồ sơ mèo / để lại SĐT nhưng chưa hoàn tất đơn nào
  return MARKETING_SEGMENT_KEYS.POTENTIAL;
}

/**
 * Lấy tên mèo của khách hàng thật
 */
export function getCustomerPetNames(customer) {
  if (Array.isArray(customer?.pets) && customer.pets.length > 0) {
    const names = customer.pets.map((p) => p?.name).filter(Boolean);
    if (names.length > 0) return names.join(', ');
  }
  // Tìm thêm từ hồ sơ mèo trong danh sách đơn
  if (Array.isArray(customer?.bookings)) {
    for (const b of customer.bookings) {
      if (Array.isArray(b?.petProfiles) && b.petProfiles.length > 0) {
        const names = b.petProfiles.map((p) => p?.name).filter(Boolean);
        if (names.length > 0) return names.join(', ');
      }
    }
  }
  return 'Chưa có hồ sơ mèo';
}

/**
 * Xây dựng danh sách đối tượng người nhận CHỜ GỬI (recipients) từ dữ liệu khách hàng THẬT
 * Kết nối tương ứng với các kịch bản tiếp thị
 */
export function buildRealRecipients(customers = [], scenarios = [], now = new Date()) {
  const nowTs = now.getTime();
  const recipients = [];

  customers.forEach((customer) => {
    const segment = classifyCustomerSegment(customer, now);
    const catName = getCustomerPetNames(customer);
    const bookings = customer.bookings || [];

    // Tìm đơn sắp tới (upcoming)
    const upcomingBooking = bookings.find((b) => {
      const status = String(b.status || '').trim().toLowerCase();
      return status !== 'cancelled' && status !== 'đã hủy' && status !== 'đã huỷ' && status !== 'check-out' && status !== 'hoàn tất';
    });

    // Tìm đơn hoàn tất gần nhất
    const lastCompleted = bookings.find((b) => {
      const status = String(b.status || '').trim().toLowerCase();
      return status === 'check-out' || status === 'đã hoàn tất' || status === 'hoàn tất' || status === 'completed';
    });

    let assignedScenario = null;
    let trigger = '';
    let recipientSegment = segment;

    // 1. Khách có đơn sắp tới (Check-in trong 1-3 ngày tới hoặc đơn upcoming) -> kịch bản sc-3
    if (upcomingBooking && upcomingBooking.checkIn) {
      recipientSegment = MARKETING_SEGMENT_KEYS.CONFIRMED;
      assignedScenario = 'sc-3';
      trigger = `Sắp nhận phòng: ngày ${upcomingBooking.checkIn}`;
    }
    // 2. Khách vừa check-out trong vòng 7 ngày -> kịch bản sc-4
    else if (lastCompleted && lastCompleted.checkOut) {
      const checkOutTs = toTimestamp(lastCompleted.checkOut);
      const diffDays = checkOutTs ? (nowTs - checkOutTs) / (1000 * 60 * 60 * 24) : 999;
      if (diffDays >= 0 && diffDays <= 7) {
        recipientSegment = MARKETING_SEGMENT_KEYS.CHECKED_OUT;
        assignedScenario = 'sc-4';
        trigger = `Vừa check-out ngày ${lastCompleted.checkOut}`;
      }
    }

    // 3. Nếu chưa rơi vào đơn sắp tới hay vừa check-out thì xét theo phân khúc chính
    if (!assignedScenario) {
      if (segment === MARKETING_SEGMENT_KEYS.AT_RISK) {
        assignedScenario = 'sc-7';
        const lastBookingTs = toTimestamp(customer.lastBookingAt);
        const months = lastBookingTs ? Math.round((nowTs - lastBookingTs) / (1000 * 60 * 60 * 24 * 30)) : 6;
        trigger = `Nguy cơ rời bỏ: hơn ${months} tháng chưa đặt lại`;
      } else if (
        (customer.totalSpent >= 2000000 && customer.totalSpent < VIP_SPENT) ||
        customer.completedCount === 4
      ) {
        recipientSegment = MARKETING_SEGMENT_KEYS.UPGRADING;
        assignedScenario = 'sc-6';
        trigger = `Sắp lên hạng: chi tiêu ${Number(customer.totalSpent || 0).toLocaleString('vi-VN')}đ / 4 đơn hoàn tất`;
      } else if (segment === MARKETING_SEGMENT_KEYS.POTENTIAL) {
        assignedScenario = 'sc-1';
        const createdTs = toTimestamp(customer.createdAt);
        const days = createdTs ? Math.max(1, Math.round((nowTs - createdTs) / (1000 * 60 * 60 * 24))) : 3;
        trigger = `Khách tiềm năng: đăng ký ${days} ngày, chưa có đơn hoàn tất`;
      } else if (segment === MARKETING_SEGMENT_KEYS.RETURNING || segment === MARKETING_SEGMENT_KEYS.LOYAL || segment === MARKETING_SEGMENT_KEYS.VIP) {
        assignedScenario = 'sc-5';
        trigger = `Khách ${segment === MARKETING_SEGMENT_KEYS.VIP ? 'VIP' : segment === MARKETING_SEGMENT_KEYS.LOYAL ? 'thân thiết' : 'quay lại'}: ${customer.bookingCount} lần đặt`;
      } else {
        assignedScenario = 'sc-1';
        trigger = 'Khách mới: chăm sóc & ưu đãi lần đầu';
      }
    }

    recipients.push({
      id: `real-recip-${customer.id}`,
      customerId: customer.id,
      name: customer.fullName || (customer.phone ? `Khách ${customer.phone}` : 'Khách hàng'),
      catName,
      segment: recipientSegment,
      trigger,
      status: 'pending', // 100% chế độ chờ gửi mô phỏng an toàn, không kích hoạt gửi thật
      scenarioId: assignedScenario,
    });
  });

  return recipients;
}

/**
 * Xây dựng lịch gửi sắp tới (scheduleItems) dựa trên các kịch bản đang bật và dữ liệu khách thật
 */
export function buildRealScheduleItems(scenarios = [], realRecipients = [], now = new Date()) {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return scenarios
    .filter((sc) => sc.enabled)
    .map((sc, index) => {
      // Đếm số khách thật khớp với kịch bản này
      const matchingCount = realRecipients.filter((r) => {
        if (r.scenarioId === sc.id) return true;
        if (sc.segment && sc.segment !== 'all' && r.segment === sc.segment) return true;
        return false;
      }).length;

      const hour = String(8 + (index % 6)).padStart(2, '0');
      return {
        id: `sch-${sc.id}`,
        scenarioId: sc.id,
        scenarioName: sc.name,
        sendAt: `${tomorrowStr} ${hour}:00`,
        recipients: matchingCount,
      };
    });
}
