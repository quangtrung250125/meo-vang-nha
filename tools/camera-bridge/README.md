# Cầu nối camera Imou tại nhà → web

Công cụ này chạy trên **một máy tính Windows ở nhà, cùng Wi-Fi với camera**. Nó lấy hình từ camera (RTSP) và đưa ra internet để trang Theo dõi lưu trú phát được. Mã an toàn của camera **chỉ nằm trong file `go2rtc.yaml` trên máy này**, không lên GitHub, không lên Vercel.

## Dùng lần đầu
1. Giải nén thư mục này ra máy (ví dụ vào Desktop), **bấm đôi `bat-camera.bat`**.
2. Lần đầu nó tự tải công cụ (khoảng 2 phút, cần Internet). Nếu Windows hỏi quyền, chọn cho phép.
3. Nhập **địa chỉ IP camera** (ví dụ `192.168.1.12`) và **mã an toàn** (tem dưới đáy camera, lúc gõ sẽ bị ẩn).
4. Khi hiện khung **CAMERA DANG CHAY** kèm một địa chỉ dạng `https://….trycloudflare.com/api/stream.m3u8?src=camera` (đã sao chép sẵn), vào web → **Admin → Cài đặt → Camera**, dán địa chỉ rồi bấm **Lưu**.
5. Giữ cửa sổ mở khi cần xem camera. Bấm **Enter** trong cửa sổ để tắt.

## Nếu bước tải công cụ bị lỗi mạng
Tải thủ công bằng trình duyệt rồi bỏ vào thư mục `bin` (tạo nếu chưa có), chạy lại `bat-camera.bat` là nó bỏ qua phần đã có:
- Node.js: https://nodejs.org/dist/v22.12.0/node-v22.12.0-win-x64.zip → giải nén, lấy file `node.exe` bỏ vào `bin`
- go2rtc: https://github.com/AlexxIT/go2rtc/releases/latest/download/go2rtc_win64.zip → giải nén, lấy `go2rtc.exe` bỏ vào `bin`
- cloudflared: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe → đổi tên thành `cloudflared.exe` bỏ vào `bin`

## Những lần sau
Bấm đôi `bat-camera.bat`, **dán địa chỉ mới** vào trang Admin (địa chỉ Cloudflare bản miễn phí đổi mỗi lần bật). Không phải nhập lại IP và mã.

## Nếu có lỗi
- "CANH BAO: chua mo duoc hinh": sai IP hoặc mã an toàn, hoặc máy không cùng Wi-Fi với camera. Xoá file `go2rtc.yaml` rồi chạy lại để nhập lại.
- Địa chỉ camera (IP) có thể đổi khi router khởi động lại. Nếu hình mất, kiểm tra lại IP bằng app Fing.
- Hình đen trên web nhưng VLC xem được: camera đang phát chuẩn nén H.265, trình duyệt không phát được. Báo lại để chuyển sang luồng khác.

## An toàn
- `proxy.js` chỉ cho đi qua đường dẫn phát video, chặn trang cấu hình của go2rtc (nơi có thể lộ mã an toàn).
- Ai có địa chỉ `trycloudflare.com` đều xem được hình, nên chỉ dán địa chỉ vào trang Admin, đừng đăng ở nơi khác. Web chỉ đưa địa chỉ này cho khách có đơn đang lưu trú.
