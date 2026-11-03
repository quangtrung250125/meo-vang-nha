import { handleMarketing } from '../_lib/marketingService.js';

// Một hàm cho mọi API Marketing tự động (gói Vercel Hobby giới hạn số hàm):
// /api/marketing/settings | send | messages | audience | track | run
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const fromPath = String(req.url || '').split('?')[0].split('/').filter(Boolean).pop();
  const action = req.query?.action || fromPath;
  try {
    return await handleMarketing(req, res, action);
  } catch (error) {
    console.error('[API Marketing] Lỗi:', error);
    return res.status(500).json({ error: error.message || 'Lỗi máy chủ Marketing tự động.' });
  }
}
