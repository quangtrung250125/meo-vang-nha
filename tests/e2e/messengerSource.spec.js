import { test, expect, loginAs, isoDate } from './helpers';

// Khách bấm link nhân viên gửi qua Messenger rồi đặt phòng: đơn được ghi nguồn "Đặt qua Messenger"
const bookingCard = (page) => page.locator('.rounded-3xl.shadow-xl').first();

const bookToStep4 = async (page, url, offset) => {
  await loginAs(page);
  await page.goto(url);
  const card = bookingCard(page);
  const dates = page.locator('input[type=date]');
  await dates.nth(0).fill(isoDate(offset));
  await dates.nth(1).fill(isoDate(offset + 2));
  await page.getByLabel('Số lượng mèo').fill('1');
  await page.getByRole('button', { name: /Kiểm tra phòng/ }).click();
  await card.locator('button:has-text("Còn")').first().click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await card.getByText('Gói Mèo Sang Chảnh').first().click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  const textInputs = card.locator('input[type=text]');
  await textInputs.nth(0).fill('Bé Mess');
  await textInputs.nth(1).fill('1 tuổi');
  await card.getByRole('button', { name: 'Lưu thông tin' }).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  return card;
};

const submitAndCapture = async (page, card) => {
  const request = page.waitForRequest((r) => r.url().includes('/api/bookings') && r.method() === 'POST');
  await card.getByRole('button', { name: /gửi yêu cầu/i }).click();
  const booking = (await request).postDataJSON().booking;
  await expect(card.getByRole('heading', { name: 'Đặt Lịch Thành Công!' })).toBeVisible();
  return booking;
};

test('mở web từ link Messenger rồi đặt phòng: đơn mang nguồn Messenger', async ({ page, pageErrors }, testInfo) => {
  const card = await bookToStep4(page, '/booking?src=messenger&mref=abcdef123', testInfo.project.name === 'mobile' ? 140 : 130);
  // Đã ghi nhớ nguồn khi mở link
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mvn-order-source') || 'null'));
  expect(stored).toMatchObject({ source: 'messenger', ref: 'abcdef123' });

  const booking = await submitAndCapture(page, card);
  expect(booking).toMatchObject({ orderSource: 'messenger', orderSourceRef: 'abcdef123' });
  // Đặt xong thì xóa, đơn sau (không bấm link) không bị tính nhầm
  expect(await page.evaluate(() => localStorage.getItem('mvn-order-source'))).toBeNull();
  expect(pageErrors).toEqual([]);
});

test('khách tự vào web đặt phòng: đơn không mang nguồn Messenger', async ({ page }, testInfo) => {
  const card = await bookToStep4(page, '/booking', testInfo.project.name === 'mobile' ? 150 : 145);
  const booking = await submitAndCapture(page, card);
  expect(booking.orderSource).toBeUndefined();
});
