import { test, expect, loginAs, newTestCustomer, isoDate } from './helpers';

// Nhiều khách cùng bấm "Gửi yêu cầu đặt lịch" một lúc cho cùng một phòng VIP (2 chỗ).
// Mỗi khách là một trình duyệt riêng (context riêng), dùng chung một máy chủ.

const VIDEO_DIR = process.env.MVN_DEMO_VIDEO_DIR;

const openCustomer = async (browser, fullName, demo = '') => {
  const context = await browser.newContext({
    viewport: { width: 640, height: 900 },
    ...(VIDEO_DIR ? { recordVideo: { dir: `${VIDEO_DIR}/${demo}/${fullName}`, size: { width: 640, height: 900 } } } : {}),
  });
  const page = await context.newPage();
  await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
  await page.routeWebSocket(/^wss?:\/\/(?!localhost)/, (ws) => ws.close());
  await loginAs(page, { ...newTestCustomer(), fullName });
  return { context, page, name: fullName };
};

const card = (page) => page.locator('.rounded-3xl.shadow-xl').first();
const roomButton = (page, roomId) => card(page).locator('button').filter({ hasText: new RegExp(`^\\s*${roomId}`) });

const fillStep1 = async (page, { checkIn, checkOut, cats }) => {
  const dates = page.locator('input[type=date]');
  await dates.nth(0).fill(checkIn);
  await dates.nth(1).fill(checkOut);
  await page.getByLabel('Số lượng mèo').fill(String(cats));
  await page.getByRole('button', { name: /Kiểm tra phòng/ }).click();
};

// Đi tới bước 4 (Xác nhận) với phòng roomId, chưa bấm gửi
const goToStep4 = async ({ page, name }, { roomId, checkIn, checkOut, cats = 1 }) => {
  await page.goto('/booking');
  await fillStep1(page, { checkIn, checkOut, cats });
  await roomButton(page, roomId).click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();

  await expect(card(page).getByRole('heading', { name: /Chọn gói dịch vụ/ })).toBeVisible();
  await card(page).getByText('Gói Mèo Sang Chảnh').first().click();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();

  await expect(card(page).getByRole('heading', { name: 'Thêm hồ sơ bé mèo mới' })).toBeVisible();
  const inputs = card(page).locator('input[type=text]');
  for (let i = 0; i < cats; i += 1) {
    if (i > 0) await card(page).getByRole('button', { name: /Thêm bé/ }).first().click();
    await inputs.nth(0).fill(`Mèo của ${name}${cats > 1 ? ` ${i + 1}` : ''}`);
    await inputs.nth(1).fill('2 tuổi');
    await card(page).getByRole('button', { name: 'Lưu thông tin' }).click();
  }
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(card(page).getByRole('heading', { name: /Xác nhận/ })).toBeVisible();
};

const SUCCESS = 'Đặt Lịch Thành Công!';
const FAILED = 'Đặt phòng chưa thành công';

// Tất cả cùng bấm gửi trong cùng một lúc, rồi chờ kết quả của từng người
const submitTogether = async (customers) => {
  await Promise.all(customers.map(({ page }) => card(page).getByRole('button', { name: /gửi yêu cầu/i }).click()));
  return Promise.all(customers.map(async ({ page, name }) => {
    const ok = card(page).getByRole('heading', { name: SUCCESS });
    const fail = card(page).getByText(FAILED);
    await expect(ok.or(fail)).toBeVisible({ timeout: 15000 });
    return { name, page, success: await ok.isVisible() };
  }));
};

test.describe('Nhiều khách gửi đặt phòng cùng lúc', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  test('tổng số mèo vừa đủ chỗ trống: cả hai đều nhận được mã đặt phòng', async ({ browser }, testInfo) => {
    const offset = testInfo.project.name === 'mobile' ? 140 : 120;
    const stay = { roomId: 'VIP-01', checkIn: isoDate(offset), checkOut: isoDate(offset + 3) };
    const customers = [await openCustomer(browser, 'Chị An', 'du-cho'), await openCustomer(browser, 'Anh Bình', 'du-cho')];
    for (const c of customers) await goToStep4(c, stay);

    const results = await submitTogether(customers);
    expect(results.every((r) => r.success)).toBe(true);
    for (const { page } of results) await expect(card(page).getByText(/^MVN-\d{5}$/).first()).toBeVisible();
    if (VIDEO_DIR) await results[1].page.screenshot({ path: `${VIDEO_DIR}/1-du-cho-ca-hai-deu-nhan-ma.png` });
    await customers[0].page.waitForTimeout(1500);
    await Promise.all(customers.map(({ context }) => context.close()));
  });

  test('tổng số mèo vượt chỗ trống: người nhanh hơn nhận mã, người chậm hơn được báo và đặt lại với thông tin cũ', async ({ browser }, testInfo) => {
    const offset = testInfo.project.name === 'mobile' ? 150 : 130;
    const stay = { roomId: 'VIP-01', checkIn: isoDate(offset), checkOut: isoDate(offset + 3) };
    const customers = [
      await openCustomer(browser, 'Chị An', 'vuot-cho'),
      await openCustomer(browser, 'Anh Bình', 'vuot-cho'),
      await openCustomer(browser, 'Cô Chi', 'vuot-cho'),
    ];
    for (const c of customers) await goToStep4(c, stay);

    const results = await submitTogether(customers);
    const winners = results.filter((r) => r.success);
    const losers = results.filter((r) => !r.success);
    expect(winners).toHaveLength(2);
    expect(losers).toHaveLength(1);

    const { page } = losers[0];
    // Không có mã đặt phòng, được báo phòng vừa có khách đặt trước và thông tin vẫn giữ nguyên
    await expect(card(page).getByText(/^MVN-\d{5}$/)).toHaveCount(0);
    await expect(card(page).getByTestId('booking-conflict-reason')).toContainText('VIP-01 vừa có khách khác đặt trước bạn');
    await expect(card(page).getByText(/vẫn được giữ nguyên/)).toBeVisible();
    if (VIDEO_DIR) await card(page).getByText(FAILED).scrollIntoViewIfNeeded();
    if (VIDEO_DIR) await page.screenshot({ path: `${VIDEO_DIR}/3-nguoi-cham-hon-bi-bao.png` });
    await page.waitForTimeout(800);

    // Đặt lại: quay về bước 1, ngày & số mèo còn nguyên, phòng VIP-01 đã được cập nhật là vừa có khách đặt
    await card(page).getByRole('button', { name: /Chọn phòng khác/ }).click();
    await expect(page.locator('input[type=date]').nth(0)).toHaveValue(stay.checkIn);
    await expect(page.locator('input[type=date]').nth(1)).toHaveValue(stay.checkOut);
    await expect(card(page).getByText('Vừa có khách đặt')).toBeVisible();
    if (VIDEO_DIR) {
      await card(page).getByText('Vừa có khách đặt').scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, -250);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${VIDEO_DIR}/4-dat-lai-giu-nguyen-ngay-phong-da-cap-nhat.png` });
    }
    await page.waitForTimeout(800);
    await roomButton(page, 'VIP-02').click();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // Gói dịch vụ và bé mèo đã chọn vẫn còn, chỉ việc bấm tiếp
    await expect(card(page).getByRole('heading', { name: /Chọn gói dịch vụ/ })).toBeVisible();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await expect(card(page).getByText('(Đã chọn 1/1)')).toBeVisible();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await expect(card(page).getByRole('heading', { name: /Xác nhận/ })).toBeVisible();
    await card(page).getByRole('button', { name: /gửi yêu cầu/i }).click();
    await expect(card(page).getByRole('heading', { name: SUCCESS })).toBeVisible();
    if (VIDEO_DIR) await page.screenshot({ path: `${VIDEO_DIR}/5-dat-lai-thanh-cong.png` });
    if (VIDEO_DIR) await winners[0].page.screenshot({ path: `${VIDEO_DIR}/2-nguoi-nhanh-hon-nhan-ma.png` });
    await page.waitForTimeout(1500);

    await Promise.all(customers.map(({ context }) => context.close()));
  });
});
