import { handlePhoneLogin, handlePhoneCheck } from '../lib/phoneLogin.js';

// POST /api/auth/phone?action=login  { phone, password }
// POST /api/auth/phone?action=check  { phone }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = new URL(req.url, 'http://localhost').searchParams.get('action');
  if (action === 'check') return handlePhoneCheck(req, res);
  return handlePhoneLogin(req, res);
}
