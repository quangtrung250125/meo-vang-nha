-- ============================================================
-- BẢNG LƯU TRỮ WEB PUSH SUBSCRIPTIONS — MÈO VẮNG NHÀ
-- Chạy script này trong Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chỉ mục tối ưu tốc độ tra cứu theo user_id và endpoint
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON public.push_subscriptions(endpoint);

-- Bật Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy cho phép service_role và anon/authenticated ghi và đọc
CREATE POLICY "Allow public read-write for subscriptions" ON public.push_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);
