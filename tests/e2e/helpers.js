import { test as base, expect } from '@playwright/test';

export const SESSION_KEY = 'meo-vang-nha-authenticated-customer';

export const TEST_CUSTOMER = {
  id: 'e2e-customer',
  customerId: 'e2e-customer',
  fullName: 'Khách E2E',
  phone: '0900000099',
  email: 'e2e@example.com',
  pets: [],
};

// Mỗi test chặn mạng ngoài (Supabase, ảnh, bản đồ) để chạy ổn định và ghi lại lỗi JavaScript
export const test = base.extend({
  pageErrors: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
    await use(errors);
  },
});

export const loginAs = async (page, customer = TEST_CUSTOMER) => {
  await page.addInitScript(([key, value]) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // trang about:blank không có localStorage
    }
  }, [SESSION_KEY, JSON.stringify(customer)]);
};

export const isoDate = (daysFromToday) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export { expect };
