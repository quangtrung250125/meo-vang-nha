-- ============================================================
-- KHUYẾN MÃI & ĐIỂM THƯỞNG — MÈO VẮNG NHÀ
-- Lưu cài đặt trang Admin "Khuyến mãi & Điểm thưởng" (mã giảm giá, chiến dịch, hạng, quy tắc điểm, giới thiệu bạn bè),
-- tài khoản điểm + mã giới thiệu của từng khách, nhật ký cộng / trừ điểm, lượt dùng mã trên từng đơn
-- và lượt giới thiệu bạn bè.
-- Chạy một lần trong Supabase Dashboard > SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.loyalty_store (
    id TEXT PRIMARY KEY,               -- 'config' | 'account:<id khách>' | 'refcode:<MÃ>' | 'earn:<mã đơn>' | 'redemption:<mã đơn>' | 'referral:<id khách B>' ...
    kind TEXT NOT NULL,                -- 'config' | 'account' | 'refcode' | 'ledger' | 'redemption' | 'referral'
    user_id TEXT,                      -- khách sở hữu dòng này (với 'referral' là người giới thiệu)
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_store_kind ON public.loyalty_store(kind);
CREATE INDEX IF NOT EXISTS idx_loyalty_store_kind_user ON public.loyalty_store(kind, user_id);

-- Chỉ máy chủ (service role) đọc / ghi; trình duyệt đi qua /api/marketing/loyalty đã kiểm tra đăng nhập và quyền Admin.
-- Không tạo policy nào: khách không tự sửa điểm của mình được.
ALTER TABLE public.loyalty_store ENABLE ROW LEVEL SECURITY;
