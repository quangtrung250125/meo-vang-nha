import { handleSepayWebhook } from '../_lib/bookingsService.js';

// SePay gọi vào đây mỗi khi tài khoản ngân hàng của shop có giao dịch
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return handleSepayWebhook(req, res);
}
