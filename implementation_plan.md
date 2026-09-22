# Kế hoạch xây dựng Giao diện (UI) dự án "Mèo Vắng Nhà"

Dự án sẽ được phát triển theo mô hình Single Page Application (SPA) với ReactJS, sử dụng Tailwind CSS để thiết kế giao diện theo phong cách pastel thân thiện, bo góc mềm mại.

## Phân tích yêu cầu
1. **Cài đặt & Cấu hình**: Tích hợp Tailwind CSS vào dự án Vite hiện tại.
2. **Layout & Routing**: Chuyển đổi `Header`, `Footer`, `MainLayout` sang sử dụng Tailwind CSS. Định tuyến (Router) cho 7 trang chính.
3. **Phát triển 7 Trang UI (Tĩnh)**:
   - **Trang chủ (`/`)**: Hero banner, Dịch vụ nổi bật, Ưu điểm doanh nghiệp, Đánh giá khách hàng.
   - **Trang Dịch vụ (`/services`)**: Lưới hiển thị danh sách dịch vụ, chi tiết tĩnh và nút "Đặt ngay".
   - **Trang Bảng giá (`/pricing`)**: Thẻ (Card) Gói lưu trú, Gói spa, Gói khác, FAQ.
   - **Trang Đặt phòng (`/booking`)**: Mô phỏng UI 4 bước (Chọn ngày -> Chọn gói -> Kiểm tra -> Xác nhận).
   - **Trang Hồ sơ mèo (`/pet-profile`)**: Form UI tĩnh (Cơ bản, Sức khỏe, Thói quen, Tính cách, Yêu cầu).
   - **Trang Booking của tôi (`/my-booking`)**: Danh sách thẻ booking tĩnh, chi tiết, trạng thái thanh toán, nút sang màn hình theo dõi.
   - **Trang Theo dõi bé (`/tracking`)**: Dashboard tĩnh (Tổng quan, Ăn uống, Vệ sinh, Tâm trạng, giả lập Camera).

## Đề xuất Màu sắc (Tone Pastel)
- **Hồng đào (Peach/Rose)**: Màu chủ đạo cho các nút bấm chính, điểm nhấn (vd: `bg-rose-400`, `text-rose-500`).
- **Xanh mint nhạt (Teal/Emerald)**: Màu phụ trợ cho các tag, viền, hoặc nền nhạt (vd: `bg-teal-100`, `text-teal-700`).
- **Vàng cam (Orange/Amber)**: Dùng cho các cảnh báo, đánh giá sao, hoặc icon nổi bật (vd: `text-amber-400`).
- **Nền tổng thể**: Trắng hoặc xám rất nhạt (`bg-gray-50`) kết hợp các khối nền trắng bo góc to (`rounded-2xl`, `rounded-3xl`) và đổ bóng mềm (`shadow-sm`, `shadow-md`).

## Các thay đổi dự kiến (Files)

### 1. Cấu hình Tailwind
- `[NEW] tailwind.config.js`
- `[NEW] postcss.config.js`
- `[MODIFY] src/index.css` (hoặc `main.css`)

### 2. Cấu trúc Routing & Layout
- `[MODIFY] src/App.jsx` (Thêm Route cho 7 trang)
- `[MODIFY] src/layouts/MainLayout.jsx` (Sửa thành Tailwind CSS)
- `[MODIFY] src/components/layout/Header.jsx` (Sửa thành Tailwind CSS)
- `[MODIFY] src/components/layout/Footer.jsx` (Sửa thành Tailwind CSS)
- `[DELETE] src/layouts/MainLayout.css` (Không cần thiết nữa vì dùng Tailwind)

### 3. Các Trang (Pages)
- `[MODIFY] src/pages/Home/index.jsx`
- `[NEW] src/pages/Services/index.jsx`
- `[NEW] src/pages/Pricing/index.jsx`
- `[NEW] src/pages/Booking/index.jsx`
- `[NEW] src/pages/PetProfile/index.jsx`
- `[NEW] src/pages/MyBooking/index.jsx`
- `[NEW] src/pages/Tracking/index.jsx`

## User Review Required
> [!IMPORTANT]
> - Bạn có đồng ý với bảng màu pastel và các thư viện sẽ sử dụng (Tailwind CSS) không?
> - Các icon tạm thời tôi sẽ dùng text giả hoặc các ký tự emoji/SVG cơ bản, bạn có muốn sử dụng thư viện icon nào cụ thể không (như `lucide-react` hoặc `react-icons`)? (Tôi khuyến nghị dùng `lucide-react` cho phong cách hiện đại).
> 
> Xin hãy xem qua kế hoạch trên và phản hồi nếu bạn muốn thay đổi bất cứ điều gì. Nếu bạn đồng ý, hãy nói "Tiếp tục", tôi sẽ tiến hành cài đặt và code toàn bộ giao diện!
