import { handlePhoneLogin, handlePhoneCheck } from '../_lib/phoneLogin.js';
import { handleListCustomers, handleCreateCustomer } from '../_lib/adminCustomers.js';

// POST /api/auth/phone?action=login  { phone, password }
// POST /api/auth/phone?action=check  { phone }
// GET  /api/auth/phone?action=customers               (nhân viên: danh sách khách có tài khoản)
// POST /api/auth/phone?action=create-customer { fullName, phone, password? } (nhân viên tạo tài khoản cho khách)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = new URL(req.url, 'http://localhost').searchParams.get('action');
  if (action === 'check') return handlePhoneCheck(req, res);
  if (action === 'customers') return handleListCustomers(req, res);
  if (action === 'create-customer') return handleCreateCustomer(req, res);
  return handlePhoneLogin(req, res);
}
