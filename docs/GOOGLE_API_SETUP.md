# 📘 Hướng Dẫn Cấu Hình Google API Cho SEO Radar (PageSpeed & Search Console)

> **Tài liệu hướng dẫn cấu hình toàn diện theo giao diện mới nhất của Google Cloud (Google Auth Platform).**  
> Dành cho lập trình viên và quản trị viên muốn tích hợp dữ liệu SEO thật vào website.

---

## 📌 Tổng quan các biến môi trường cần thiết

Trong file `.env`, bạn cần khai báo các biến sau:

```env
# 1. API Key cho Google PageSpeed Insights (đo tốc độ, điểm SEO, Mobile)
VITE_PAGESPEED_KEY=AIzaSy...

# 2. OAuth 2.0 Client ID cho Google Search Console (từ khóa, thứ hạng, clicks)
VITE_GSC_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

# 3. Domain trang web cần quét (cần là website online thật)
VITE_SITE_URL=https://meovangnha.com
```

---

## 🚀 Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Đăng nhập bằng tài khoản Google của bạn.
3. Ở thanh menu trên cùng, bấm vào danh sách dự án → chọn **New Project** (Dự án mới).
4. Nhập tên dự án (Ví dụ: `meo-vang-nha-seo`) → Bấm **Create** (Tạo).
5. Đảm bảo bạn đã chọn đúng dự án vừa tạo ở thanh điều hướng trên cùng.

---

## ⚡ Bước 2: Cấu hình Google PageSpeed Insights API

### 2.1. Bật API PageSpeed Insights
1. Vào thanh tìm kiếm trên cùng của Google Cloud Console, gõ **PageSpeed Insights API**.
   - Hoặc truy cập trực tiếp: [PageSpeed Insights API Library](https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com)
2. Bấm nút **Enable** (Bật).

### 2.2. Tạo API Key
1. Ở menu bên trái, chọn **APIs & Services** → **Credentials** (Thông tin xác thực).
2. Bấm nút **+ CREATE CREDENTIALS** ở trên cùng → chọn **API key**.
3. Google sẽ tạo ra một key dạng `AIzaSy...`. Bấm biểu tượng copy để sao chép key này.

### 2.3. Cấu hình hạn chế API Key (Quan trọng - Tránh lỗi 403 Blocked)
Mặc định hoặc khi vô tình cấu hình sai mục này, Google sẽ trả về lỗi `API_KEY_SERVICE_BLOCKED`:
1. Tại danh sách **API Keys**, bấm vào biểu tượng hình cây bút (hoặc tên API key) để chỉnh sửa.
2. **Mục 1: Application restrictions (Giới hạn ứng dụng)**:
   - Chọn **None** (để có thể gọi từ localhost và server).
3. **Mục 2: API restrictions (Giới hạn API)**:
   - **Tùy chọn A (Khuyên dùng)**: Chọn **Don't restrict key** (Không giới hạn key).
   - **Tùy chọn B**: Nếu chọn *Restrict key*, ở dropdown danh sách API bạn **bắt buộc phải tick chọn**:
     - `PageSpeed Insights API`
4. Cuộn xuống bấm **Save** (Lưu).  
   *(Lưu ý: Google có thể mất 1-3 phút để áp dụng cài đặt mới).*
5. Dán key này vào file `.env`:
   ```env
   VITE_PAGESPEED_KEY=AIzaSy...
   ```

---

## 🔍 Bước 3: Cấu hình Google Search Console OAuth 2.0 (Giao diện mới: Google Auth Platform)

Google Search Console chứa dữ liệu riêng tư của chủ sở hữu website, do đó bắt buộc phải dùng **OAuth 2.0** (xác thực người dùng) thay vì chỉ dùng API Key thông thường.

### 3.1. Bật Google Search Console API
1. Vào thanh tìm kiếm trên cùng, gõ **Google Search Console API**.
   - Hoặc truy cập: [Search Console API Library](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com)
2. Bấm nút **Enable** (Bật).

---

### 3.2. Cấu hình Màn hình đồng ý OAuth (Google Auth Platform)
Ở menu bên trái, Google hiện tại gom nhóm vào **Google Auth Platform**:

#### A. Cấu hình Branding (Thông tin ứng dụng):
1. Bấm vào menu **Branding** (ở cột trái).
2. Điền các thông tin cơ bản:
   - **App name**: `Mèo Vắng Nhà Web` (hoặc tên app của bạn).
   - **User support email**: Chọn email của bạn.
   - **Developer contact information**: Nhập email của bạn.
3. Bấm **Save and continue**.

#### B. Cấu hình Audience & Thêm Test Users (CỰC KỲ QUAN TRỌNG):
Nếu bỏ qua bước này, khi đăng nhập bạn sẽ bị lỗi:  
`Lỗi 403: access_denied - Ứng dụng này đang trong giai đoạn kiểm thử và chỉ những người kiểm thử được phê duyệt mới có thể truy cập.`

1. Ở menu bên trái, bấm vào mục **Audience** (có biểu tượng hình người 👤).
2. Cuộn chuột xuống mục **Test users** (Người dùng thử nghiệm).
3. Bấm nút **+ Add users** (hoặc Thêm người dùng).
4. Nhập chính xác địa chỉ email Google mà bạn sẽ dùng để đăng nhập vào trang web (ví dụ: `namblue28092002@gmail.com`).
5. Bấm **Save** (Lưu).

#### C. Cấu hình Scopes (Quyền truy cập API):
1. Ở menu bên trái, bấm vào **Data Access**.
2. Bấm **Add or remove scopes** (Thêm hoặc xóa phạm vi).
3. Tìm và tick chọn scope:
   - `.../auth/webmasters.readonly` (Xem dữ liệu Google Search Console cho các trang web được quản trị).
4. Bấm **Update** rồi bấm **Save**.

---

### 3.3. Tạo OAuth 2.0 Client ID
1. Ở menu bên trái, chọn mục **Clients** (hoặc vào **APIs & Services** → **Credentials**).
2. Bấm nút **+ CREATE CREDENTIALS** → chọn **OAuth client ID**.
3. Điền các trường:
   - **Application type**: Chọn **Web application**.
   - **Name**: `Mèo Vắng Nhà Client`.
   - **Authorized JavaScript origins** (Nguồn gốc JavaScript được ủy quyền - **Bắt buộc**):
     - Bấm **+ ADD URI** và nhập:
       ```
       http://localhost:5173
       ```
     - *(Nếu có domain thật hoặc link deploy Vercel, bấm tiếp + ADD URI và thêm vào, ví dụ: `https://meovangnha.com`)*.
   - **Authorized redirect URIs**: Để trống hoặc điền giống mục JavaScript origins.
4. Bấm **CREATE** (Tạo).
5. Một popup hiện ra hiển thị **Your Client ID** (chuỗi dài dạng `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`).
6. Copy chuỗi Client ID này và dán vào file `.env`:
   ```env
   VITE_GSC_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```

---

## 🌐 Bước 4: Đăng ký Website trên Google Search Console

Để tài khoản Google của bạn có dữ liệu từ khóa trả về cho ứng dụng:

1. Dùng tài khoản Google (đã thêm vào Test Users ở Bước 3.2) truy cập vào:  
   👉 [Google Search Console](https://search.google.com/search-console)
2. Bấm vào danh sách Property ở góc trên bên trái → chọn **+ Thêm trang web (+ Add Property)**.
3. Chọn một trong 2 hình thức:
   - **Tiền tố URL (URL prefix)** *(Khuyên dùng, dễ nhất)*:  
     Nhập địa chỉ web, ví dụ: `https://meovangnha.com`
   - **Miền (Domain)**:  
     Nhập `meovangnha.com` (cần thêm bản ghi DNS TXT vào nhà cung cấp tên miền).
4. **Xác minh quyền sở hữu**:
   - Google hỗ trợ xác minh qua: Thẻ HTML (`<meta name="google-site-verification" ...>`), tệp HTML tải lên host, Google Analytics, hoặc DNS.
5. Sau khi xác minh thành công, website sẽ xuất hiện trong danh sách Properties của bạn.

> 💡 **Mẹo**: Nếu website thuộc tài khoản Google khác, bạn chỉ cần dùng tài khoản đó vào Search Console → **Cài đặt (Settings)** → **Người dùng và quyền (Users & permissions)** → **Thêm người dùng** → nhập email của bạn vào là xong!

---

## 🛠️ Bảng Khắc Phục Các Lỗi Thường Gặp (Troubleshooting)

| Tình huống / Mã lỗi | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **`403: API_KEY_SERVICE_BLOCKED`** | API Key bị giới hạn dịch vụ trong Google Cloud Console. | Vào Credentials → bấm sửa API key → mục **API restrictions** chọn **Don't restrict key** (hoặc tick thêm `PageSpeed Insights API`). |
| **`403: access_denied (meo chưa hoàn tất xác minh...)`** | Ứng dụng ở trạng thái Testing, email đăng nhập chưa được cấp quyền test. | Vào Google Cloud → **Audience** → cuộn xuống **Test users** → bấm **+ Add users** và thêm email vào. |
| **`Lỗi: Chưa có Property nào được xác minh trong Search Console`** | Tài khoản Google đăng nhập thành công nhưng chưa thêm website vào Google Search Console. | Vào [Google Search Console](https://search.google.com/search-console) bấm **Add Property** và xác minh tên miền web. |
| **Điểm PageSpeed toàn là `0` kèm icon `⚠`** | `VITE_SITE_URL` trỏ vào tên miền chưa có thật trên Internet (Google bot bị `ERR_CONNECTION_FAILED`). | Google PageSpeed chạy từ cloud nên không quét được `localhost`. Cần cập nhật `VITE_SITE_URL` thành link web đã deploy online thật (Vercel, Netlify hoặc domain thật). |
| **`Failed to fetch` khi đăng nhập hệ thống** | `VITE_SUPABASE_URL` trong file `.env` trỏ vào URL không tồn tại. | Đảm bảo `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trong `.env` trỏ đúng vào Supabase project đang hoạt động. |

---

## 🎯 Kiểm Tra Lại Sau Khi Cấu Hình

1. Khởi động lại dev server:
   ```bash
   npm run dev
   ```
2. Truy cập: `http://localhost:5173/seo`
3. Ở tab **Tổng quan** / **Phân tích trang**: Bấm nút **"Quét lại"** → Thấy badge xanh **Live**.
4. Ở tab **Từ khóa**: Bấm **"Kết nối Google Search Console"** → Đăng nhập popup → Thấy bảng từ khóa, clicks và vị trí trung bình thật từ Google!
