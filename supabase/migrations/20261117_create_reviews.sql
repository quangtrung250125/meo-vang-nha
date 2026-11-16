-- ============================================================
-- ĐÁNH GIÁ SAU CHECK-OUT — MÈO VẮNG NHÀ
-- Mỗi đơn đã check-out được khách đánh giá một lần (sửa được trong 7 ngày,
-- gửi trong 30 ngày sau check-out). Admin trả lời và duyệt hiển thị trên trang chủ.
-- Chạy một lần trong Supabase Dashboard > SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT NOT NULL UNIQUE,          -- mỗi đơn chỉ có một đánh giá
    customer_id TEXT NOT NULL,
    customer_name TEXT,
    pet_names TEXT,
    room_name TEXT,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    tags TEXT[] NOT NULL DEFAULT '{}',
    comment TEXT CHECK (char_length(comment) <= 1000),
    allow_public BOOLEAN NOT NULL DEFAULT false, -- khách đồng ý cho hiện trên trang chủ
    is_public BOOLEAN NOT NULL DEFAULT false,    -- admin đã duyệt hiển thị
    admin_reply TEXT,
    replied_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_public ON public.reviews(is_public) WHERE is_public;

-- Chỉ máy chủ (service role) đọc / ghi; trình duyệt đi qua /api/marketing/reviews đã kiểm tra quyền.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
