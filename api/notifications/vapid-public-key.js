import { vapidPublicKey } from '../lib/pushService.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Phương thức không được hỗ trợ (Method Not Allowed).' });
  }

  return res.status(200).json({
    publicKey: vapidPublicKey,
    status: 'ok',
  });
}
