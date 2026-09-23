import { sendServerPush } from './pushNotificationService';

/**
 * Hệ thống Trigger thông báo Web Push thực tế cho các luồng nghiệp vụ của Mèo Vắng Nhà
 */

// 1. Khi đơn đặt phòng được xác nhận
export async function triggerBookingConfirmedNotification({ userId, bookingCode, petNames, roomName, checkIn }) {
  if (!userId) return null;
  return sendServerPush({
    userId,
    title: '🎉 Đơn đặt phòng đã được xác nhận!',
    body: `Đơn #${bookingCode} cho bé ${petNames || 'mèo cưng'} tại ${roomName || 'phòng khách sạn'} đã được duyệt. Ngày nhận phòng: ${checkIn}.`,
    url: '/my-booking',
    tag: `booking-confirmed-${bookingCode}`,
  }).catch((err) => console.warn('[Trigger] Không thể gửi push xác nhận đơn:', err));
}

// 2. Nhắc nhở sắp đến giờ nhận phòng (Check-in reminder)
export async function triggerBookingReminderNotification({ userId, bookingCode, petNames, time }) {
  if (!userId) return null;
  return sendServerPush({
    userId,
    title: '⏰ Nhắc lịch nhận phòng hôm nay!',
    body: `Sắp đến giờ đưa bé ${petNames || 'mèo cưng'} đến nhận phòng (${time || 'hôm nay'}). Nhân viên Mèo Vắng Nhà đã sẵn sàng đón bé!`,
    url: '/my-booking',
    tag: `booking-reminder-${bookingCode}`,
  }).catch((err) => console.warn('[Trigger] Không thể gửi push nhắc lịch:', err));
}

// 3. Nhân viên cập nhật tình trạng chăm sóc bé cưng (Nhật ký ăn uống, vệ sinh, vui chơi)
export async function triggerCareLogUpdateNotification({ userId, petName, actionTitle, detail }) {
  if (!userId) return null;
  return sendServerPush({
    userId,
    title: `🐱 ${petName}: ${actionTitle || 'Cập nhật tình trạng mới'}`,
    body: detail || `Bé ${petName} vừa được nhân viên chăm sóc và ghi nhận tình trạng mới. Nhấn để xem nhật ký!`,
    url: '/tracking',
    tag: `care-log-${Date.now()}`,
  }).catch((err) => console.warn('[Trigger] Không thể gửi push nhật ký chăm sóc:', err));
}

// 4. Có hình ảnh / video mới của bé mèo
export async function triggerMediaUpdateNotification({ userId, petName }) {
  if (!userId) return null;
  return sendServerPush({
    userId,
    title: `📸 Khoảnh khắc mới của bé ${petName}!`,
    body: `Nhân viên vừa tải lên hình ảnh đáng yêu của bé ${petName}. Vào xem ngay nào!`,
    url: '/tracking',
    tag: `media-update-${Date.now()}`,
  }).catch((err) => console.warn('[Trigger] Không thể gửi push media:', err));
}

// 5. Khi hoàn tất kỳ lưu trú (Check-out)
export async function triggerBookingCompletedNotification({ userId, bookingCode, petNames }) {
  if (!userId) return null;
  return sendServerPush({
    userId,
    title: '🏠 Bé mèo đã hoàn tất kỳ nghỉ dưỡng!',
    body: `Cảm ơn bạn đã tin tưởng Mèo Vắng Nhà để chăm sóc cho bé ${petNames || 'mèo cưng'}. Hẹn sớm gặp lại bạn và bé!`,
    url: '/customer-profile',
    tag: `booking-completed-${bookingCode}`,
  }).catch((err) => console.warn('[Trigger] Không thể gửi push hoàn tất đơn:', err));
}

/**
 * Hàm chung đa năng gửi thông báo theo chuẩn requirement 9:
 * sendNotification({ userId, title, body, url, icon })
 */
export async function sendNotification({ userId, title, body, url, icon, badge, tag, data }) {
  return sendServerPush({
    userId,
    title,
    body,
    url: url || '/',
    icon,
    badge,
    tag,
    data,
  });
}
