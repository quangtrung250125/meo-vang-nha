import { sendPushToUser, broadcastPush } from '../lib/pushService.js';

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
    const { userId, title, body: contentBody, url, icon, badge, tag, data, broadcast } = body;

    const payload = {
      title: title || 'Mèo Vắng Nhà 🐾',
      body: contentBody || 'Bạn có thông báo mới từ khách sạn mèo!',
      url: url || '/',
      icon: icon || '/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png',
      badge: badge || '/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png',
      tag: tag || `mvn-${Date.now()}`,
      data: data || {},
    };

    if (broadcast) {
      const result = await broadcastPush(payload);
      return res.status(200).json({
        success: result.success,
        message: `Đã gửi thông báo đến ${result.sentCount}/${result.totalTargets} thiết bị.`,
        sentCount: result.sentCount,
        totalTargets: result.totalTargets,
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'Cần cung cấp userId của người nhận thông báo.',
      });
    }

    const result = await sendPushToUser(userId, payload);

    return res.status(200).json({
      success: result.success,
      message: result.message || `Đã gửi thông báo tới ${result.sentCount}/${result.totalTargets} thiết bị của user.`,
      sentCount: result.sentCount,
      totalTargets: result.totalTargets,
      details: result.details,
    });
  } catch (error) {
    console.error('[API Send] Lỗi:', error);
    return res.status(500).json({
      error: error.message || 'Lỗi khi gửi thông báo đẩy.',
    });
  }
}
