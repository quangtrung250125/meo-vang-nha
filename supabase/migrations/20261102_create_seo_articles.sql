-- ─── Bảng lưu bài viết SEO tự động sinh từ radar từ khóa ───────────────────
-- Trạng thái: draft → review → published | rejected
CREATE TABLE IF NOT EXISTS seo_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Nội dung bài viết
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'seo',
  category_name TEXT NOT NULL DEFAULT 'SEO & Content',
  tags TEXT[] DEFAULT '{}',
  
  -- Nội dung chi tiết (JSON array giống format newsData.sections)
  sections JSONB NOT NULL DEFAULT '[]',
  doctor_note TEXT,
  
  -- SEO metadata
  target_keyword TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  seo_score INTEGER DEFAULT 0,
  
  -- Thông tin tác giả
  author TEXT NOT NULL DEFAULT 'SEO Radar AI (Mèo Vắng Nhà)',
  read_time TEXT DEFAULT '5 phút đọc',
  
  -- Trạng thái duyệt
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  
  -- Featured flag
  featured BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_note TEXT
);

-- Index tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_seo_articles_status ON seo_articles(status);
CREATE INDEX IF NOT EXISTS idx_seo_articles_keyword ON seo_articles(target_keyword);
CREATE INDEX IF NOT EXISTS idx_seo_articles_created ON seo_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_articles_slug ON seo_articles(slug);

-- RLS policies
ALTER TABLE seo_articles ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc bài viết đã publish (public)
CREATE POLICY "Public read published articles" ON seo_articles
  FOR SELECT USING (status = 'published');

-- Cho phép admin CRUD tất cả (dùng service_role hoặc anon key cho demo)
CREATE POLICY "Admin full access" ON seo_articles
  FOR ALL USING (TRUE);
