-- ─── Danh mục dịch vụ do admin quản lý (trang Dịch vụ) ─────────────────────
-- Mỗi dòng ghi đè 1 phần của bản mặc định trong code (src/mockData):
--   kind = 'item' : 1 dịch vụ / gói (id trùng id gói cũ như 'p1', 'spa1'... hoặc id mới 'svc-...')
--   kind = 'room' : 1 hạng phòng (id = 'VIP' | 'VVIP' | 'DELUXE')
--   kind = 'rule' : 1 quy tắc giá (cuối tuần, theo mùa, lễ Tết, giảm giá)
-- Bảng trống thì web hiện y như bản mặc định trong code.
-- Chạy file này 1 lần trong Supabase Dashboard > SQL Editor.

CREATE TABLE IF NOT EXISTS public.service_catalog (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('item', 'room', 'rule')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_service_catalog_kind ON public.service_catalog(kind);

-- Danh sách tài khoản được sửa danh mục (ngoài tài khoản có app_metadata.role = 'admin').
-- Tài khoản đăng ký bằng SĐT có email dạng <SĐT>@meovangnha.vn, ví dụ 0962606249@meovangnha.vn
CREATE TABLE IF NOT EXISTS public.service_catalog_admins (
  email TEXT PRIMARY KEY
);
INSERT INTO public.service_catalog_admins (email) VALUES
  ('meovangnha@gmail.com'),
  ('0962606249@meovangnha.vn')
ON CONFLICT (email) DO NOTHING;
ALTER TABLE public.service_catalog_admins ENABLE ROW LEVEL SECURITY;
-- Không tạo policy cho bảng này: chỉ đọc/sửa được từ Dashboard, trình duyệt không xem được.

CREATE OR REPLACE FUNCTION public.is_service_catalog_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.service_catalog_admins a
      WHERE lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    );
$$;

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Ai cũng đọc được (khách cần thấy giá, dịch vụ đang đăng)
DROP POLICY IF EXISTS "service_catalog_read_all" ON public.service_catalog;
CREATE POLICY "service_catalog_read_all" ON public.service_catalog
  FOR SELECT USING (TRUE);

-- Chỉ admin được thêm / sửa / xoá
DROP POLICY IF EXISTS "service_catalog_admin_insert" ON public.service_catalog;
CREATE POLICY "service_catalog_admin_insert" ON public.service_catalog
  FOR INSERT WITH CHECK (public.is_service_catalog_admin());

DROP POLICY IF EXISTS "service_catalog_admin_update" ON public.service_catalog;
CREATE POLICY "service_catalog_admin_update" ON public.service_catalog
  FOR UPDATE USING (public.is_service_catalog_admin()) WITH CHECK (public.is_service_catalog_admin());

DROP POLICY IF EXISTS "service_catalog_admin_delete" ON public.service_catalog;
CREATE POLICY "service_catalog_admin_delete" ON public.service_catalog
  FOR DELETE USING (public.is_service_catalog_admin());

-- Bật Realtime để admin sửa xong là trang khách cập nhật ngay, không cần tải lại
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'service_catalog'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_catalog;
  END IF;
END $$;
