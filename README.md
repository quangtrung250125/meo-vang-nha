 # Mèo Vắng Nhà

 Website React/Vite cho dịch vụ khách sạn, spa và đưa đón mèo. Ứng dụng dùng React Router, Tailwind CSS, Lucide icons và lưu hồ sơ/booking ở phía trình duyệt.

 ## Chạy tại máy

 Yêu cầu Node.js 20 trở lên.

 ```bash
 npm install
 npm run lint
 npm run build
 npm run dev
 ```

 Mở URL Vite hiển thị trong terminal, thường là `http://localhost:5173`.

 ## Test tự động

 ```bash
 npm run test:unit   # test logic: tính tiền, API đặt phòng, đồng bộ dữ liệu
 npx playwright install chromium   # chỉ cần chạy lần đầu
 npm run test:e2e    # mở web thật trên trình duyệt: mọi trang, luồng đặt phòng 5 bước, chặn trang admin
 npm test            # chạy cả hai
 ```

 Mỗi Pull Request trên GitHub sẽ tự chạy lint, build và toàn bộ test (`.github/workflows/ci.yml`). PR bị ❌ nghĩa là có tính năng đang lỗi, bấm vào **Details** để xem test nào hỏng. Khi thêm tính năng mới, hãy thêm test tương ứng vào `tests/unit` hoặc `tests/e2e`.

 ## Đăng nhập bằng số điện thoại hoặc email

 Khách đăng nhập được bằng **cả SĐT lẫn email** đã đăng ký, trên mọi thiết bị. Khi đăng nhập bằng SĐT, server (`/api/auth/phone`) tìm tài khoản gắn với số đó rồi đăng nhập hộ, và không bao giờ trả email ra ngoài. Mỗi SĐT chỉ đăng ký được một tài khoản.

 Để server tìm được cả các tài khoản cũ, hãy thêm biến **`SUPABASE_SERVICE_ROLE_KEY`** trên Vercel (Supabase Dashboard > Project Settings > API Keys > `service_role`). **Không** đặt tên biến bắt đầu bằng `VITE_`, vì làm vậy khoá sẽ lộ ra trình duyệt. Nếu không có khoá này, server chỉ tìm được qua bảng `customer_profiles` (tài khoản cũ sẽ được ghi vào bảng này sau lần đăng nhập đầu tiên bằng email).

 ## Tài khoản Admin

 Không còn tài khoản admin viết cứng trong code. Admin là tài khoản Supabase bình thường (đăng ký trên web), được cấp quyền theo một trong hai cách:

 1. Thêm số điện thoại vào biến môi trường `VITE_ADMIN_PHONES` (ví dụ `VITE_ADMIN_PHONES=0962606249`, nhiều số cách nhau bằng dấu phẩy) trên Vercel và trong `.env` khi chạy local, rồi deploy lại. Tài khoản đó phải được đăng ký trên web bằng số điện thoại và **để trống ô email**. Nếu Supabase đang bật xác nhận email (Authentication > Sign In / Providers > Confirm email), hãy vào Authentication > Users và xác nhận thủ công tài khoản này, vì email `...@meovangnha.vn` không nhận được thư.
 2. Hoặc thêm email của tài khoản vào biến `VITE_ADMIN_EMAILS` (nhiều email cách nhau bằng dấu phẩy).
 3. Hoặc trong Supabase Dashboard > SQL Editor chạy:
    ```sql
    update auth.users
    set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
    where email = 'email-admin@cua-ban.vn';
    ```

 Tài khoản đăng ký bằng số điện thoại (không nhập email) có email dạng `<số điện thoại>@meovangnha.vn`, nên `VITE_ADMIN_PHONES=0962606249` tương đương `VITE_ADMIN_EMAILS=0962606249@meovangnha.vn`.

 ## Đẩy lên GitHub

 ```bash
 git init
 git add .
 git commit -m "Build Meo Vang Nha pet hotel website"
 git branch -M main
 git remote add origin https://github.com/<tai-khoan>/<ten-repository>.git
 git push -u origin main
 ```

 Không commit `.env` hoặc thông tin bí mật. Nếu dùng Supabase, tạo biến môi trường trên nền tảng deploy thay vì ghi trực tiếp vào GitHub.

 ## Deploy Vercel

 1. Vào Vercel, chọn **Add New Project** và import repository GitHub.
 2. Giữ framework **Vite**; Vercel sẽ dùng `npm run build` và thư mục output `dist`.
 3. Thêm các biến môi trường Supabase giống tên trong `src/supabaseClient.js` nếu dự án cần kết nối Supabase.
 4. Nhấn **Deploy**. `vercel.json` đã cấu hình rewrite về `index.html` để các route React như `/booking` không bị lỗi 404 khi refresh.

 Mỗi lần push lên `main`, Vercel sẽ tự build và cập nhật website. Kiểm tra local bằng `npm run lint` và `npm run build` trước khi push.
