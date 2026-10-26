import { test, expect, loginAs } from './helpers';

const PUBLIC_ROUTES = ['/', '/services', '/promotions', '/news', '/booking', '/pet-profile', '/customer-profile', '/my-booking', '/tracking', '/checkout'];

test.describe('Các trang mở được, không lỗi JavaScript', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`khách vãng lai mở ${route}`, async ({ page, pageErrors }) => {
      await page.goto(route);
      await expect(page.locator('body')).not.toBeEmpty();
      await page.waitForTimeout(500);
      expect(pageErrors).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'trang bị tràn ngang').toBeLessThanOrEqual(1);
    });
  }

  for (const route of PUBLIC_ROUTES) {
    test(`khách đã đăng nhập mở ${route}`, async ({ page, pageErrors }) => {
      await loginAs(page);
      await page.goto(route);
      await expect(page.locator('body')).not.toBeEmpty();
      await page.waitForTimeout(500);
      expect(pageErrors).toEqual([]);
    });
  }

  test('đường dẫn không tồn tại hiện trang 404', async ({ page }) => {
    await page.goto('/khong-ton-tai');
    await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
  });

  test('/pricing chuyển sang /services', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveURL(/\/services$/);
  });
});

test.describe('Bảo vệ trang quản trị', () => {
  for (const route of ['/admin', '/admin/room-status', '/admin/settings', '/room-status', '/reviews', '/settings']) {
    test(`khách vãng lai không vào được ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText('Giao diện Admin')).toHaveCount(0);
    });
  }

  test('giả mạo phiên admin trong localStorage không có tác dụng', async ({ page }) => {
    await loginAs(page, { id: 'admin-0962606249', fullName: 'Quản trị viên', phone: '0962606249', role: 'admin' });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Giao diện Admin')).toHaveCount(0);
  });

  test('khách thường có số điện thoại admin cũng không vào được', async ({ page }) => {
    await loginAs(page, { id: 'u-1', fullName: 'Ai đó', phone: '0962606249' });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
  });
});
