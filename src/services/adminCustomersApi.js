import { getAuthHeaders } from './crossDeviceSync';

// Nhân viên đặt phòng hộ khách: tìm khách đã có tài khoản / tạo tài khoản mới cho khách đến cửa hàng

export async function fetchCustomerAccounts() {
  const res = await fetch('/api/auth/phone?action=customers', { headers: { ...(await getAuthHeaders()) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || 'Không tải được danh sách khách hàng.');
  return Array.isArray(json.customers) ? json.customers : [];
}

export async function createCustomerAccount({ fullName, phone, password }) {
  const res = await fetch('/api/auth/phone?action=create-customer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify({ fullName, phone, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    return { ok: false, message: json.message || 'Không tạo được tài khoản, vui lòng thử lại.', existing: json.existing || null };
  }
  return { ok: true, customer: json.customer, password: json.password, needsConfirmation: Boolean(json.needsConfirmation) };
}
