import { getRequestUser, getBearerToken } from '../_lib/auth.js';
import { findViewableInHouseBooking } from '../_lib/bookingsService.js';
import { getImouConfig, getImouLiveStream, describeImouError } from '../_lib/imouService.js';

// GET /api/camera/live?code=<mã đơn>
// Trả link xem trực tiếp camera Imou của phòng mà bé đang ở. Chỉ khách của đơn (hoặc admin) xem được,
// và chỉ khi đơn đang ở trạng thái "đang ở".
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const config = getImouConfig();
  // Chế độ DEMO (bật mặc định vì chưa có camera thật): đặt IMOU_DEMO_CAMERA=0 để chuyển sang camera Imou thật
  const demo = process.env.IMOU_DEMO_CAMERA !== '0';
  if (!config.configured && !config.testHls && !demo) {
    return res.status(200).json({ success: false, code: 'NOT_CONFIGURED', message: describeImouError('NOT_CONFIGURED') });
  }

  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để xem camera.' });

  const url = new URL(req.url, 'http://localhost');
  const code = url.searchParams.get('code') || req.query?.code;
  const booking = await findViewableInHouseBooking(code, user, getBearerToken(req));
  if (!booking) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Camera chỉ mở khi bé đang lưu trú tại Mèo Vắng Nhà.' });
  }

  if (demo) {
    // Mặc định ẩn nhãn "Hình minh hoạ"; đặt IMOU_DEMO_HIDE_LABEL=0 để hiện lại nhãn
    return res.status(200).json({ success: true, demo: true, hideLabel: process.env.IMOU_DEMO_HIDE_LABEL !== '0' });
  }

  try {
    const stream = await getImouLiveStream({ roomId: booking.roomId || booking.selectedRoom?.id });
    return res.status(200).json({ success: true, hls: stream.hls, cover: stream.cover, test: Boolean(stream.test) });
  } catch (e) {
    console.warn('[Imou] Lỗi lấy link camera:', e.code, e.message);
    return res.status(200).json({ success: false, code: e.code || 'ERROR', detail: String(e.message || '').slice(0, 200), message: describeImouError(e.code) });
  }
}
