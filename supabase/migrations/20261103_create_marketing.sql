-- ============================================================
-- MARKETING TỰ ĐỘNG — MÈO VẮNG NHÀ
-- Lưu cài đặt (kịch bản, mẫu tin, giới hạn tần suất), lượt "bỏ dở đặt phòng"
-- và nhật ký từng thông báo Web Push đã gửi.
-- Chạy một lần trong Supabase Dashboard > SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketing_settings (
    id TEXT PRIMARY KEY,               -- 'config' hoặc 'draft:<mã khách>'
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dedupe_key TEXT,                   -- kịch bản + khách + lần kích hoạt, để không gửi trùng
    customer_id TEXT,
    customer_name TEXT,
    scenario_id TEXT,
    template_id TEXT,
    source TEXT NOT NULL DEFAULT 'manual',   -- 'auto' | 'manual'
    channel TEXT NOT NULL DEFAULT 'webpush',
    title TEXT,
    body TEXT,
    url TEXT,
    status TEXT NOT NULL,              -- 'sent' | 'no_device' | 'failed'
    device_count INT DEFAULT 0,
    error TEXT,
    sent_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    shown_at TIMESTAMPTZ,              -- thông báo đã hiện trên thiết bị của khách
    clicked_at TIMESTAMPTZ             -- khách đã bấm vào thông báo
);

CREATE INDEX IF NOT EXISTS idx_mkt_messages_created ON public.marketing_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_messages_customer ON public.marketing_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_mkt_messages_dedupe ON public.marketing_messages(dedupe_key);

-- Chỉ máy chủ (service role) đọc / ghi; trình duyệt đi qua /api/marketing/* đã kiểm tra quyền Admin.
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_messages ENABLE ROW LEVEL SECURITY;
