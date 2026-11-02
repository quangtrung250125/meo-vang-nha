import React, { useState, useEffect, useCallback } from 'react';
import {
  PenSquare,
  Sparkles,
  Send,
  Eye,
  Check,
  X,
  FileEdit,
  Loader2,
  AlertTriangle,
  Trash2,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  BookOpen,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Tag,
  Globe,
  Copy,
  ExternalLink,
  Database,
} from 'lucide-react';
import {
  fetchAllArticles,
  createArticle,
  updateArticle,
  submitForReview,
  publishArticle,
  rejectArticle,
  deleteArticle,
  generateArticleFromKeyword,
  getIsTableAvailable,
} from '../../services/articleService';
import { KEYWORDS } from './seoData';

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: {
    label: 'Bản nháp',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
    icon: FileEdit,
  },
  review: {
    label: 'Chờ duyệt',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  published: {
    label: 'Đã xuất bản',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Bị từ chối',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    icon: XCircle,
  },
};

const STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'draft', label: 'Bản nháp' },
  { id: 'review', label: 'Chờ duyệt' },
  { id: 'published', label: 'Đã xuất bản' },
  { id: 'rejected', label: 'Từ chối' },
];

export const SQL_CREATE_TABLE_SCRIPT = `-- 1. Bảng lưu bài viết SEO tự động
CREATE TABLE IF NOT EXISTS seo_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'seo',
  category_name TEXT NOT NULL DEFAULT 'SEO & Content',
  tags TEXT[] DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '[]',
  doctor_note TEXT,
  target_keyword TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  seo_score INTEGER DEFAULT 0,
  author TEXT NOT NULL DEFAULT 'SEO Radar AI (Mèo Vắng Nhà)',
  read_time TEXT DEFAULT '5 phút đọc',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_note TEXT
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_seo_articles_status ON seo_articles(status);
CREATE INDEX IF NOT EXISTS idx_seo_articles_keyword ON seo_articles(target_keyword);
CREATE INDEX IF NOT EXISTS idx_seo_articles_created ON seo_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_articles_slug ON seo_articles(slug);

-- 3. Row Level Security (RLS)
ALTER TABLE seo_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published articles" ON seo_articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admin full access" ON seo_articles
  FOR ALL USING (TRUE);`;

// ─── Keyword Suggestion Card ─────────────────────────────────────────────────
const KeywordSuggestion = ({ keyword, onGenerate, generating }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
          <Search className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{keyword.keyword}</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
            <span>Hạng #{keyword.rank}</span>
            <span>•</span>
            <span>{(keyword.volume || keyword.impressions || 0).toLocaleString('vi-VN')} lượt/tháng</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onGenerate(keyword)}
        disabled={generating}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-sm shadow-orange-200 hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        Viết bài
      </button>
    </div>
  );
};

// ─── Article Preview Modal ────────────────────────────────────────────────────
const ArticlePreviewModal = ({ article, onClose, onPublish, onReject, onSubmitReview, onDelete }) => {
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  if (!article) return null;
  const statusCfg = STATUS_CONFIG[article.status];

  const handleAction = async (action, ...args) => {
    setActionLoading(action);
    try {
      if (action === 'publish') await onPublish(article.id);
      else if (action === 'reject') await onReject(article.id, rejectNote);
      else if (action === 'review') await onSubmitReview(article.id);
      else if (action === 'delete') await onDelete(article.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading('');
    }
  };

  const sections = Array.isArray(article.sections) ? article.sections : 
    (typeof article.sections === 'string' ? JSON.parse(article.sections) : []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-400">{article.read_time || '5 phút đọc'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {article.cover_image && (
            <div className="rounded-2xl overflow-hidden aspect-[16/9] max-h-72 w-full bg-gray-100 shadow-inner">
              <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight mb-3">
              {article.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pb-4 border-b border-gray-100">
              <span className="font-medium flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-orange-400" />
                Từ khóa: <strong className="text-orange-600">{article.target_keyword}</strong>
              </span>
              <span>•</span>
              <span>SEO Score: <strong className={article.seo_score >= 80 ? 'text-emerald-600' : article.seo_score >= 60 ? 'text-amber-600' : 'text-rose-600'}>{article.seo_score}</strong></span>
              <span>•</span>
              <span>{article.author}</span>
            </div>
          </div>

          {article.excerpt && (
            <p className="text-base text-gray-700 italic bg-orange-50/50 p-4 rounded-2xl border-l-4 border-orange-400">
              "{article.excerpt}"
            </p>
          )}

          <div className="space-y-6 text-gray-800 text-sm leading-relaxed">
            {sections.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                  {sec.heading}
                </h3>
                <div className="whitespace-pre-line text-gray-600 pl-2">{sec.content}</div>
              </div>
            ))}
          </div>

          {article.doctor_note && (
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle className="w-4 h-4" />
                Ghi chú từ Bác sĩ Thú y
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
                {article.doctor_note}
              </p>
            </div>
          )}

          {article.tags && article.tags.length > 0 && (
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1 mr-2">
                <Tag className="w-3.5 h-3.5" /> Tags:
              </span>
              {article.tags.map((tag, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Reject form */}
          {showRejectForm && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-rose-700">Lý do từ chối bài viết:</p>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Nhập lý do từ chối (tùy chọn)..."
                className="w-full p-3 rounded-xl border border-rose-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('reject')}
                  disabled={actionLoading === 'reject'}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === 'reject' ? 'Đang xử lý…' : 'Xác nhận từ chối'}
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Review note (if rejected) */}
          {article.status === 'rejected' && article.review_note && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-rose-700 mb-1">Lý do từ chối:</p>
              <p className="text-sm text-rose-600">{article.review_note}</p>
              {article.reviewed_by && (
                <p className="text-xs text-rose-400 mt-2">Bởi: {article.reviewed_by}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('delete')}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {article.status === 'draft' && (
              <button
                onClick={() => handleAction('review')}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-amber-200"
              >
                {actionLoading === 'review' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Gửi duyệt
              </button>
            )}

            {article.status === 'review' && (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Từ chối
                </button>
                <button
                  onClick={() => handleAction('publish')}
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-emerald-200"
                >
                  {actionLoading === 'publish' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Duyệt & Xuất bản
                </button>
              </>
            )}

            {(article.status === 'rejected' || article.status === 'published') && (
              <button
                onClick={() => handleAction('review')}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-amber-200"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {article.status === 'published' ? 'Gỡ xuống & Duyệt lại' : 'Gửi duyệt lại'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Article Card ─────────────────────────────────────────────────────────────
const ArticleCard = ({ article, onPreview }) => {
  const statusCfg = STATUS_CONFIG[article.status];
  const StatusIcon = statusCfg.icon;
  const sections = Array.isArray(article.sections) ? article.sections :
    (typeof article.sections === 'string' ? JSON.parse(article.sections) : []);
  const sectionCount = sections.length;

  const dateStr = article.created_at
    ? new Date(article.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div
      onClick={() => onPreview(article)}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        {article.cover_image && (
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 hidden sm:block">
            <img src={article.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Status + Keyword */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
              🎯 {article.target_keyword}
            </span>
            {article.seo_score > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                article.seo_score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                article.seo_score >= 60 ? 'bg-amber-50 text-amber-700' :
                'bg-rose-50 text-rose-700'
              }`}>
                SEO: {article.seo_score}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-orange-600 transition-colors mb-1.5">
            {article.title}
          </h4>

          {/* Meta */}
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>{dateStr}</span>
            <span>•</span>
            <span>{sectionCount} phần</span>
            <span>•</span>
            <span>{article.read_time || '5 phút đọc'}</span>
          </div>
        </div>

        {/* Arrow */}
        <div className="shrink-0 text-gray-300 group-hover:text-orange-500 transition-colors self-center">
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SeoContentWriter = ({ gscKeywords = [] }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  const [previewArticle, setPreviewArticle] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [copiedSql, setCopiedSql] = useState(false);

  // Kết hợp từ khóa GSC thật + mock data
  const allKeywords = gscKeywords.length > 0 ? gscKeywords : KEYWORDS;

  // Load articles
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAllArticles();
      setArticles(data);
      setIsSupabaseConnected(getIsTableAvailable());
    } catch (err) {
      console.error('[SEO Content] Load articles error:', err);
      setIsSupabaseConnected(getIsTableAvailable());
      setError(err.message || 'Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_CREATE_TABLE_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Generate article from keyword
  const handleGenerate = async (keyword) => {
    const kw = typeof keyword === 'string' ? keyword : keyword.keyword;
    setGenerating(kw);
    setError('');

    try {
      const articleData = generateArticleFromKeyword(kw, keyword);
      const created = await createArticle(articleData);
      setArticles(prev => [created, ...prev]);
      setPreviewArticle(created);
    } catch (err) {
      console.error('[SEO Content] Generate error:', err);
      setError(err.message || 'Không thể tạo bài viết. Kiểm tra kết nối Supabase.');
    } finally {
      setGenerating('');
    }
  };

  // Custom keyword generate
  const handleCustomGenerate = (e) => {
    e.preventDefault();
    if (!customKeyword.trim()) return;
    handleGenerate(customKeyword.trim());
    setCustomKeyword('');
  };

  // Actions
  const handlePublish = async (id) => {
    await publishArticle(id);
    setArticles(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'published', published_at: new Date().toISOString() } : a)
    );
  };

  const handleReject = async (id, note) => {
    await rejectArticle(id, note);
    setArticles(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'rejected', review_note: note } : a)
    );
  };

  const handleSubmitReview = async (id) => {
    await submitForReview(id);
    setArticles(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'review' } : a)
    );
  };

  const handleDelete = async (id) => {
    await deleteArticle(id);
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  // Filter
  const filteredArticles = statusFilter === 'all'
    ? articles
    : articles.filter(a => a.status === statusFilter);

  // Counts
  const counts = {
    all: articles.length,
    draft: articles.filter(a => a.status === 'draft').length,
    review: articles.filter(a => a.status === 'review').length,
    published: articles.filter(a => a.status === 'published').length,
    rejected: articles.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* ── Supabase Setup Banner (khi bảng chưa tạo) ── */}
      {!isSupabaseConnected && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  Bảng 'seo_articles' chưa được khởi tạo trên Supabase
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 font-semibold text-amber-800">
                    Đang lưu trữ tạm LocalStorage
                  </span>
                </h4>
                <p className="text-xs text-amber-800/80 mt-1">
                  Mọi thao tác tạo, chỉnh sửa, duyệt và đăng bài hiện vẫn <strong>hoạt động bình thường</strong> trên trình duyệt của bạn. Để đồng bộ dữ liệu vĩnh viễn lên Supabase, vui lòng chạy lệnh SQL tạo bảng.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100/50 shadow-sm transition-all cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã sao chép SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép SQL</span>
                  </>
                )}
              </button>

              <a
                href="https://supabase.com/dashboard/project/dejcaioztgpqkvmbauat/sql/new"
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold hover:from-amber-700 hover:to-orange-700 shadow-sm shadow-orange-200 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở SQL Editor</span>
              </a>

              <button
                type="button"
                onClick={loadArticles}
                title="Kiểm tra lại kết nối Supabase"
                className="p-2 rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/50 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyword Suggestions (Top half) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Tạo bài viết SEO từ từ khóa
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Chọn từ khóa tiềm năng để hệ thống tự động viết bài chuẩn SEO. Bài viết sẽ ở trạng thái nháp để bạn duyệt.
            </p>
          </div>
        </div>

        {/* Custom keyword input */}
        <form onSubmit={handleCustomGenerate} className="flex gap-2 mb-5">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="Nhập từ khóa bất kỳ: nuôi mèo lần đầu, cát đậu nành, mèo bị sổ mũi..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            />
          </div>
          <button
            type="submit"
            disabled={!customKeyword.trim() || !!generating}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-sm shadow-orange-200 hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating === customKeyword.trim() ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PenSquare className="h-4 w-4" />
            )}
            Viết bài
          </button>
        </form>

        {/* Keyword grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allKeywords.slice(0, 8).map((kw, i) => (
            <KeywordSuggestion
              key={kw.id || i}
              keyword={kw}
              onGenerate={handleGenerate}
              generating={generating === kw.keyword}
            />
          ))}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700 flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Articles List (Bottom half) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-orange-500" />
            Quản lý bài viết SEO
            <span className="text-xs font-semibold text-gray-400">({articles.length} bài)</span>
          </h3>
          <button
            onClick={loadArticles}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {STATUS_TABS.map(tab => {
            const active = statusFilter === tab.id;
            const cfg = STATUS_CONFIG[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Đang tải danh sách bài viết…</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <PenSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-600">Chưa có bài viết nào{statusFilter !== 'all' ? ` ở trạng thái "${STATUS_TABS.find(t => t.id === statusFilter)?.label}"` : ''}</p>
            <p className="text-xs text-gray-400 mt-1">
              Chọn một từ khóa ở trên để hệ thống tự động viết bài chuẩn SEO
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                onPreview={setPreviewArticle}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {previewArticle && (
        <ArticlePreviewModal
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
          onPublish={handlePublish}
          onReject={handleReject}
          onSubmitReview={handleSubmitReview}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default SeoContentWriter;
