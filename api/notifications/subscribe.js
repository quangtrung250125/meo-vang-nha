import { upsertSubscription } from '../_lib/db.js';
import { checkPushAccess } from '../_lib/pushAccess.js';
import { saveContact } from '../_lib/marketingDb.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { subscription, userId, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        error: 'Dữ liệu subscription không hợp lệ. Cần có endpoint và keys (p256dh, auth).',
      });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return res.status(400).json({
        error: 'Thiếu khóa mã hóa p256dh hoặc auth trong subscription.',
      });
    }

    const access = await checkPushAccess(req, userId);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    const saved = await upsertSubscription({
      userId: userId || 'anonymous',
      endpoint,
      p256dh,
      auth,
      userAgent: userAgent || req.headers['user-agent'] || '',
    });

    // Ghi lại họ tên / SĐT của khách để trang Marketing hiển thị đúng
    await saveContact(access.user).catch(() => {});

    // Trên Vercel, không lưu được vào Supabase thì thiết bị chỉ được nhớ tạm trên một máy chủ và sẽ mất: báo lỗi rõ.
    // Chạy thử trên máy (không có Vercel) vẫn dùng bộ nhớ tạm như trước.
    if (saved?.persisted === false && process.env.VERCEL) {
      console.error('[API Subscribe] Không lưu được thiết bị vào push_subscriptions:', saved.dbError);
      return res.status(503).json({
        error: 'Máy chủ chưa lưu được thiết bị nhận thông báo (thiếu bảng push_subscriptions trên Supabase). Vui lòng báo Mèo Vắng Nhà.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đăng ký Web Push Notification thành công!',
      data: saved,
    });
  } catch (error) {
    console.error('[API Subscribe] Lỗi:', error);
    return res.status(500).json({
      error: error.message || 'Lỗi máy chủ khi đăng ký thông báo đẩy.',
    });
  }
}
