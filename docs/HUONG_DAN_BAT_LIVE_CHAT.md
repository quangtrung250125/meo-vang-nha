# Hướng dẫn bật Live chat cho Mèo Vàng Nhà

Tài liệu dành cho người quản trị Supabase và Vercel của Mèo Vàng Nhà. Tính năng cho phép khách nhắn ngay trên website và nhân viên trả lời trong **Admin → Marketing → Hộp thư tập trung → Live chat**.

## 1. Tạo bảng và view trên Supabase

1. Mở Supabase Dashboard và chọn project mà website Mèo Vàng Nhà đang dùng. Đối chiếu mã project trong URL Supabase với biến `SUPABASE_URL` hoặc `VITE_SUPABASE_URL` của bản Production trên Vercel.
2. Vào **SQL Editor → New query**, dán toàn bộ khối SQL bên dưới và bấm **Run**. Đây là nội dung migration `supabase/migrations/20261118_create_live_chat.sql`. Chạy một lần cho mỗi môi trường. Nếu nhóm đã áp dụng migration qua quy trình triển khai, chuyển thẳng sang truy vấn kiểm tra bên dưới.
3. Nếu SQL Editor báo lỗi, gửi lại nội dung lỗi và số dòng cho nhóm phát triển.

```sql
create table public.live_chat_messages (
  id bigint generated always as identity primary key,
  thread_id text not null check (thread_id ~ '^[0-9a-f]{64}$'),
  sender text not null check (sender in ('guest', 'staff')),
  request_id uuid not null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (thread_id, sender, request_id)
);

create index live_chat_messages_thread_latest_idx
  on public.live_chat_messages (thread_id, id desc);

alter table public.live_chat_messages enable row level security;
revoke all on public.live_chat_messages from public, anon, authenticated;
grant select, insert on public.live_chat_messages to service_role;
grant usage on sequence public.live_chat_messages_id_seq to service_role;

create view public.live_chat_inbox with (security_invoker = true) as
select distinct on (thread_id) thread_id, sender, body, created_at, id
from public.live_chat_messages
order by thread_id, id desc;

revoke all on public.live_chat_inbox from public, anon, authenticated;
grant select on public.live_chat_inbox to service_role;
```

Mở một query mới và chạy truy vấn kiểm tra sau:

```sql
select
  to_regclass('public.live_chat_messages') as messages_table,
  to_regclass('public.live_chat_inbox') as inbox_view;
```

Cả hai cột cần hiện tên đối tượng. Migration bật RLS và cấp quyền truy cập cho API phía máy chủ. Website tự lấy tin mới khoảng 3 giây một lần khi hộp chat đang mở, nên có thể bỏ qua phần cấu hình Supabase Realtime.

## 2. Kiểm tra cấu hình Vercel và triển khai

1. Trong project website trên Vercel, vào **Settings → Environment Variables**. Kiểm tra môi trường **Production** đã có biến `SUPABASE_SERVICE_ROLE_KEY` của đúng project Supabase.
2. Nếu biến đã được cấu hình đúng, dùng giá trị hiện có. Nếu còn thiếu, người có quyền vào **Supabase → Settings → API Keys** để lấy khóa `service_role` theo cấu hình hiện tại của backend, rồi nhập trực tiếp vào Vercel. Giữ khóa ở phía máy chủ và dùng đúng tên biến ở trên. Tránh đưa khóa vào tin nhắn, tài liệu, Git hoặc biến có tiền tố `VITE_`.
3. Triển khai commit có tính năng Live chat lên Production. Nếu vừa sửa biến môi trường, tạo deployment mới để áp dụng giá trị đó.

## 3. Kiểm tra hai chiều trên website

1. Mở website trong cửa sổ ẩn danh. Bấm **Chat với nhân viên** cạnh Messenger và Zalo rồi gửi một tin thử.
2. Mở website trong cửa sổ thường. Đăng nhập bằng tài khoản Admin và vào **Marketing → Hộp thư tập trung → Live chat**. Chọn cuộc trò chuyện mới và gửi phản hồi.
3. Quay lại cửa sổ ẩn danh. Sau vài giây, phản hồi cần xuất hiện trong hộp chat. Tải lại trang, mở lại chat và kiểm tra cả hai tin còn hiển thị.
4. Nếu thấy **Chat trực tuyến đang tạm gián đoạn**, kiểm tra lại kết quả truy vấn SQL, project Supabase của bản Production, biến môi trường và nhật ký API trên Vercel. Nếu thiếu nút chat hoặc mục Live chat, kiểm tra commit của deployment đang chạy.

## Tài liệu tham khảo

- [Supabase SQL Editor](https://supabase.com/docs/guides/api/quickstart?database-method=sql)
- [Quản lý khóa API Supabase](https://supabase.com/docs/guides/getting-started/api-keys)
