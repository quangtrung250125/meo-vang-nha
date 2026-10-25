import { test, expect, loginAs, TEST_CUSTOMER } from './helpers';

const ME = { ...TEST_CUSTOMER, id: 'e2e-customer', customerId: 'e2e-customer' };
const OTHER = { ...TEST_CUSTOMER, id: 'e2e-other', customerId: 'e2e-other', fullName: 'Khách Khác', phone: '0900000088' };

const seedPets = async (page) => {
  await page.addInitScript(([mine, legacy]) => {
    try {
      window.localStorage.setItem('petList:e2e-customer', mine);
      window.localStorage.setItem('petList', legacy);
    } catch {
      // trang about:blank không có localStorage
    }
  }, [
    JSON.stringify([{ id: 'pet-mine', name: 'BeCuaToi', ownerId: 'e2e-customer' }]),
    JSON.stringify([{ id: 'pet-legacy', name: 'BeNhaKhac', ownerId: 'e2e-other' }]),
  ]);
};

test.describe('Hồ sơ mèo tách riêng theo tài khoản', () => {
  test('khách chỉ thấy mèo của mình', async ({ page, pageErrors }) => {
    await seedPets(page);
    await loginAs(page, ME);
    await page.goto('/pet-profile');
    await expect(page.getByText('BeCuaToi').first()).toBeVisible();
    await expect(page.getByText('BeNhaKhac')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('tài khoản khác trên cùng trình duyệt không thấy mèo của khách trước', async ({ page }) => {
    await seedPets(page);
    await loginAs(page, OTHER);
    await page.goto('/pet-profile');
    await page.waitForTimeout(500);
    await expect(page.getByText('BeCuaToi')).toHaveCount(0);
    await expect(page.getByText('BeNhaKhac').first()).toBeVisible();
  });
});

test('khách vãng lai không vào được /admin/customers', async ({ page }) => {
  await page.goto('/admin/customers');
  await expect(page).toHaveURL(/\/$/);
});
