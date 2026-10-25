import { getSubscriptionsByUserId } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức GET.' });
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return res.status(400).json({ error: 'Thiếu tham số userId.' });
    }

    const subscriptions = await getSubscriptionsByUserId(userId);

    return res.status(200).json({
      success: true,
      userId,
      activeDeviceCount: subscriptions.length,
      devices: subscriptions.map((s) => ({
        endpoint: s.endpoint.slice(0, 30) + '...',
        userAgent: s.user_agent,
        updatedAt: s.updated_at,
      })),
    });
  } catch (error) {
    console.error('[API Status] Lỗi:', error);
    return res.status(500).json({
      error: error.message || 'Lỗi khi lấy thông tin trạng thái.',
    });
  }
}
