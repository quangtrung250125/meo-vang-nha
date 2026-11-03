-- ============================================================
-- KHOÁ ĐẶT PHÒNG — MÈO VẮNG NHÀ
-- Khi nhiều khách bấm "Gửi yêu cầu đặt lịch" cùng lúc, mỗi yêu cầu có thể chạy trên
-- một máy chủ Vercel khác nhau. Bảng này giữ một dòng khoá duy nhất: máy chủ nào chèn
-- được dòng trước thì kiểm tra chỗ trống và ghi đơn trước, các máy khác chờ tới lượt.
-- Nhờ vậy tổng số mèo không bao giờ vượt sức chứa phòng.
-- Chạy một lần trong Supabase Dashboard > SQL Editor.
-- Cần biến SUPABASE_SERVICE_ROLE_KEY trên Vercel để server ghi được bảng này.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.booking_locks (
    name TEXT PRIMARY KEY,             -- luôn là 'bookings'
    holder TEXT NOT NULL,              -- mã ngẫu nhiên của yêu cầu đang giữ khoá
    expires_at TIMESTAMPTZ NOT NULL,   -- quá hạn thì máy khác được xoá khoá (máy giữ khoá bị tắt giữa chừng)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Chỉ server (service role) được đụng tới bảng khoá, khách không đọc / ghi được
ALTER TABLE public.booking_locks ENABLE ROW LEVEL SECURITY;
