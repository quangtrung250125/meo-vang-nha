import { test, expect, loginAs, isoDate } from './helpers';

const bookingCard = (page) => page.locator('.rounded-3xl.shadow-xl').first();

const fillStep1 = async (page, { checkIn, checkOut, cats = 1 }) => {
  const dates = page.locator('input[type=date]');
  await dates.nth(0).fill(checkIn);
  await dates.nth(1).fill(checkOut);
  await page.getByLabel('Số lượng mèo').fill(String(cats));
  await page.getByRole('button', { name: /Kiểm tra phòng/ }).click();
};

test.describe('Đặt phòng', () => {
  test('chưa đăng nhập thì được yêu cầu đăng nhập', async ({ page }) => {
    await page.goto('/booking');
    await expect(page.getByRole('heading', { name: 'Đăng nhập để đặt phòng' })).toBeVisible();
  });

  test('không cho chọn ngày đã qua', async ({ page }) => {
    await loginAs(page);
    await page.goto('/booking');
    await fillStep1(page, { checkIn: isoDate(-5), checkOut: isoDate(-2) });
    await expect(page.getByText('Ngày gửi bé không được trước hôm nay.')).toBeVisible();
  });

  test('ngày đón phải sau ngày gửi', async ({ page }) => {
    await loginAs(page);
    await page.goto('/booking');
    await fillStep1(page, { checkIn: isoDate(10), checkOut: isoDate(8) });
    await expect(page.getByText('Ngày đón bé phải sau ngày gửi bé.')).toBeVisible();
  });

  test('3 bé thì không còn hiện phòng VIP (tối đa 2 bé)', async ({ page }) => {
    await loginAs(page);
    await page.goto('/booking');
    await fillStep1(page, { checkIn: isoDate(20), checkOut: isoDate(22), cats: 3 });
    await expect(page.getByText('Hạng VVIP')).toBeVisible();
    await expect(page.getByText('Hạng VIP', { exact: true })).toHaveCount(0);
  });

  // Đi từ bước 1 đến bước 4 với gói Sang Chảnh (405.000đ cho 1 bé × 3 ngày) rồi gửi đơn
  const bookUntilStep5 = async (page, offset) => {
    await loginAs(page);
    await page.goto('/booking');
    const card = bookingCard(page);

    // Bước 1: ngày & phòng
    await fillStep1(page, { checkIn: isoDate(offset), checkOut: isoDate(offset + 3) });
    await card.locator('button:has-text("Còn")').first().click();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // Bước 2: gói dịch vụ
    await expect(card.getByRole('heading', { name: /Chọn gói dịch vụ/ })).toBeVisible();
    await card.getByText('Gói Mèo Sang Chảnh').first().click();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // Bước 3: khách chưa có mèo nên form thêm bé mở sẵn; bé vừa lưu được chọn tự động
    await expect(card.getByRole('heading', { name: 'Thêm hồ sơ bé mèo mới' })).toBeVisible();
    const textInputs = card.locator('input[type=text]');
    await textInputs.nth(0).fill('Bé E2E');
    await textInputs.nth(1).fill('2 tuổi');
    await card.getByRole('button', { name: 'Lưu thông tin' }).click();
    await expect(card.getByText('(Đã chọn 1/1)')).toBeVisible();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // Bước 4: gói Sang Chảnh đã có camera nên không bị tính thêm tiền camera
    await expect(card.getByRole('heading', { name: /Xác nhận/ })).toBeVisible();
    await expect(card.getByText('Đã gồm trong gói')).toBeVisible();
    await expect(card.getByText('405,000đ').last()).toBeVisible();
    return card;
  };

  test('đặt trước hơn 5 ngày thì giữ phòng và chờ cọc 50% mới có mã', async ({ page, pageErrors }, testInfo) => {
    // Mỗi project dùng ngày khác nhau để không tranh phòng của nhau
    const card = await bookUntilStep5(page, testInfo.project.name === 'mobile' ? 100 : 90);
    await expect(card.getByText('Cần đặt cọc 50% để nhận mã đặt phòng')).toBeVisible();
    await card.getByRole('button', { name: /giữ phòng & đặt cọc/i }).click();

    // Bước 5: giữ phòng, chưa có mã đặt phòng, không bị tải lại trang về bước 1
    await expect(card.getByRole('heading', { name: 'Đã Giữ Phòng, Chờ Đặt Cọc' })).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(card.getByRole('heading', { name: 'Đã Giữ Phòng, Chờ Đặt Cọc' })).toBeVisible();
    await expect(card.getByText('QUÉT MÃ ĐỂ ĐẶT CỌC 50%')).toBeVisible();
    await expect(card.getByText('202,500đ')).toBeVisible();
    await expect(card.getByText(/^COC MVN-\d{5}$/)).toBeVisible();
    await expect(card.getByText('Sẽ hiện tại đây ngay khi Mèo Vàng Nhà nhận được tiền cọc.')).toBeVisible();
    expect(pageErrors).toEqual([]);

    // Đơn xuất hiện ở "Lịch của tôi" với nhãn chờ cọc
    await page.goto('/my-booking');
    await expect(page.getByText('Bé E2E').first()).toBeVisible();
    await expect(page.getByText('Chờ đặt cọc').first()).toBeVisible();

    // "Theo dõi lưu trú" hiện đúng là đơn sắp tới, không phải đang lưu trú
    await page.goto('/tracking');
    await expect(page.getByText('Sắp tới', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Còn \d+ ngày đến ngày gửi bé/)).toBeVisible();
  });

  test('đặt sát ngày (≤ 5 ngày) thì không cần cọc và nhận mã ngay', async ({ page, pageErrors }, testInfo) => {
    const card = await bookUntilStep5(page, testInfo.project.name === 'mobile' ? 4 : 2);
    await expect(card.getByText('Không cần đặt cọc trước').first()).toBeVisible();
    await card.getByRole('button', { name: /gửi yêu cầu/i }).click();

    await expect(card.getByRole('heading', { name: 'Đặt Lịch Thành Công!' })).toBeVisible();
    await expect(card.getByText(/^MVN-\d{5}$/).first()).toBeVisible();
    await expect(card.getByText('Không cần đặt cọc trước, bạn thanh toán khi hoàn thành dịch vụ.')).toBeVisible();
    await expect(card.getByText(/QUÉT MÃ ĐỂ/)).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
});
