-- ============================================================
-- NHẬT KÝ CHĂM SÓC — MÈO VẮNG NHÀ
-- Mỗi lần Admin bấm "Cho ăn", "Vận động", "Dọn vệ sinh", gửi ảnh hay báo cáo ngày ở trang Tổng quan
-- là một dòng ở đây. Trang Tổng quan, Tình trạng phòng, Theo dõi lưu trú và Hồ sơ mèo của khách
-- cùng đọc bảng này nên luôn khớp nhau, và thời điểm ghi do máy chủ đặt (đúng lúc Admin bấm nút).
-- Chạy một lần trong Supabase Dashboard > SQL Editor.
-- Cần biến SUPABASE_SERVICE_ROLE_KEY trên Vercel để server ghi được bảng này.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.care_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT NOT NULL,        -- mã đơn MVN-xxxxx
    pet_id TEXT NOT NULL,              -- mã bé mèo trong đơn
    customer_id TEXT,                  -- tài khoản khách của đơn (để khách chỉ xem nhật ký của mình)
    type TEXT NOT NULL,                -- eating | mood | hygiene | health | media | report
    data JSONB NOT NULL DEFAULT '{}'::jsonb, -- nhãn, nội dung, ảnh, báo cáo ngày...
    created_by TEXT,                   -- tài khoản Admin đã bấm
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS care_logs_booking_idx ON public.care_logs (booking_code, created_at DESC);
CREATE INDEX IF NOT EXISTS care_logs_customer_idx ON public.care_logs (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS care_logs_created_idx ON public.care_logs (created_at DESC);

-- Chỉ server (service role) đọc / ghi. Khách xem nhật ký qua /api/bookings?resource=care-logs,
-- server chỉ trả về nhật ký các đơn của chính khách.
ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;
