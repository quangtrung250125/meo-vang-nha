import { deleteSubscriptionByEndpoint } from '../lib/db.js';

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
    const { endpoint } = body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Cần cung cấp endpoint để hủy đăng ký.' });
    }

    await deleteSubscriptionByEndpoint(endpoint);

    return res.status(200).json({
      success: true,
      message: 'Đã hủy đăng ký nhận thông báo đẩy thành công.',
    });
  } catch (error) {
    console.error('[API Unsubscribe] Lỗi:', error);
    return res.status(500).json({
      error: error.message || 'Lỗi khi hủy đăng ký nhận thông báo.',
    });
  }
}
