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
