import { upsertSubscription } from '../lib/db.js';

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

    const saved = await upsertSubscription({
      userId: userId || 'anonymous',
      endpoint,
      p256dh,
      auth,
      userAgent: userAgent || req.headers['user-agent'] || '',
    });

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
