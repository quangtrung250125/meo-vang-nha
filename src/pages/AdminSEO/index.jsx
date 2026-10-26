import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  FileText,
  Search,
  Loader2,
  WifiOff,
} from 'lucide-react';
import {
  SITE_SCORE      as MOCK_SCORE,
  RADAR_SCORES    as MOCK_RADAR,
  SEO_SUMMARY     as MOCK_SUMMARY,
  SEO_PAGES       as MOCK_PAGES,
  RADAR_LABELS,
  scoreColor,
} from './seoData';
import { fetchSEOData, hasPSIKey } from '../../services/seoService';
import SeoScoreCard   from './SeoScoreCard';
import SeoRadarChart  from './SeoRadarChart';
import SeoIssuesList  from './SeoIssuesList';
import SeoPageTable   from './SeoPageTable';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Tổng quan',       icon: Radio },
  { id: 'issues',    label: 'Vấn đề',           icon: AlertCircle },
  { id: 'pages',     label: 'Phân tích trang',  icon: FileText },
  { id: 'keywords',  label: 'Từ khóa',          icon: Search },
];

// ─── Summary Badge ────────────────────────────────────────────────────────────
const SummaryBadge = ({ icon: Icon, label, value, iconColor, bg, border }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${bg} ${border}`}>
    <Icon className={`h-4 w-4 ${iconColor}`} />
    <span className="text-xs font-semibold text-gray-600">{label}:</span>
    <span className="text-xs font-black text-gray-800">{value}</span>
  </div>
);

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

const OverviewSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
      <Skeleton className="h-36 w-36 rounded-full mx-auto" />
      <Skeleton className="h-4 w-32 mx-auto" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center">
      <Skeleton className="h-64 w-64 rounded-full" />
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  </div>
);

// ─── Progress Bar (khi đang quét từng trang) ─────────────────────────────────
const ScanProgress = ({ done, total }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl border border-orange-200 p-6 text-center">
      <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto mb-3" />
      <p className="font-bold text-gray-700 mb-1">Đang quét {done}/{total} trang…</p>
      <p className="text-xs text-gray-400 mb-4">
        Gọi Google PageSpeed Insights API, có thể mất 20–40 giây
      </p>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">{pct}%</p>
    </div>
  );
};

// ─── Dimension card ───────────────────────────────────────────────────────────
const DimCard = ({ label, score }) => {
  const col = scoreColor(score);
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${col.border} ${col.bg}`}>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: col.hex }} />
        </div>
        <span className={`text-sm font-extrabold ${col.text} w-8 text-right`}>{score}</span>
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ siteScore, radarScores }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <SeoScoreCard score={siteScore} />
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
      <h3 className="font-bold text-gray-700 text-sm mb-4 self-start">Biểu đồ radar SEO</h3>
      <SeoRadarChart scores={radarScores} size={300} />
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3">
      <h3 className="font-bold text-gray-700 text-sm mb-1">Chi tiết theo danh mục</h3>
      {Object.entries(radarScores).map(([key, val]) => (
        <DimCard key={key} label={RADAR_LABELS[key]} score={val} />
      ))}
    </div>
  </div>
);

// ─── Error Banner ─────────────────────────────────────────────────────────────
const ErrorBanner = ({ message, onRetry }) => (
  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4">
    <WifiOff className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="font-bold text-rose-700 text-sm">Không thể lấy dữ liệu thật</p>
      <p className="text-xs text-rose-600 mt-0.5 break-words">{message}</p>
      <p className="text-xs text-rose-500 mt-1">Đang hiển thị dữ liệu mẫu (mock data)</p>
    </div>
    <button
      onClick={onRetry}
      className="shrink-0 px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
    >
      Thử lại
    </button>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminSEO = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Data state
  const [siteScore,   setSiteScore]   = useState(MOCK_SCORE);
  const [radarScores, setRadarScores] = useState(MOCK_RADAR);
  const [pages,       setPages]       = useState(MOCK_PAGES);
  const [summary,     setSummary]     = useState(MOCK_SUMMARY);
  const [issues,      setIssues]      = useState([]);

  // Fetch state
  const [status,    setStatus]    = useState('idle');   // 'idle' | 'loading' | 'done' | 'error'
  const [progress,  setProgress]  = useState({ done: 0, total: 6 });
  const [errorMsg,  setErrorMsg]  = useState('');
  const [usingMock, setUsingMock] = useState(true);
  const [lastScanned, setLastScanned] = useState(MOCK_SUMMARY.lastScanned);

  const scan = useCallback(async () => {
    if (!hasPSIKey()) {
      setErrorMsg('Chưa có VITE_PAGESPEED_KEY trong .env');
      setStatus('error');
      setUsingMock(true);
      return;
    }

    setStatus('loading');
    setProgress({ done: 0, total: 6 });
    setErrorMsg('');

    try {
      const data = await fetchSEOData((done, total) =>
        setProgress({ done, total })
      );

      setSiteScore(data.siteScore);
      setRadarScores(data.radarScores);
      setPages(data.pages);
      setSummary(data.summary);
      setIssues(data.issues || []);
      setLastScanned(data.summary.lastScanned);
      setUsingMock(false);
      setStatus('done');
    } catch (err) {
      console.error('[SEO] fetchSEOData failed:', err);
      setErrorMsg(err.message || 'Lỗi không xác định');
      setUsingMock(true);
      setStatus('error');
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => { scan(); }, [scan]);

  const isLoading = status === 'loading';
  const col = scoreColor(siteScore);

  const renderContent = () => {
    if (isLoading) {
      if (activeTab === 'overview') return <ScanProgress done={progress.done} total={progress.total} />;
      return <OverviewSkeleton />;
    }
    switch (activeTab) {
      case 'overview': return <OverviewTab siteScore={siteScore} radarScores={radarScores} />;
      case 'issues':   return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-5 text-base flex items-center gap-2">
            Danh sách vấn đề SEO
            {!usingMock && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                ✓ Dữ liệu thật
              </span>
            )}
          </h3>
          <SeoIssuesList issues={issues} />
        </div>
      );
      case 'pages': return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-5 text-base flex items-center gap-2">
            Phân tích SEO từng trang
            {!usingMock && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                ✓ Dữ liệu thật
              </span>
            )}
          </h3>
          <SeoPageTable activeView="pages" pages={pages} />
        </div>
      );
      case 'keywords': return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-5 text-base">Theo dõi từ khóa mục tiêu</h3>
          <SeoPageTable activeView="keywords" />
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              <Radio className="h-5 w-5 text-orange-500" />
              SEO Radar
              {usingMock && status !== 'loading' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 ml-1">
                  Mock data
                </span>
              )}
              {!usingMock && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 ml-1">
                  Live
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Phân tích và theo dõi trạng thái SEO toàn diện của website Mèo Vắng Nhà
            </p>

            {/* Summary badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <SummaryBadge icon={CheckCircle} label="Trang tốt"  value={`${summary.pagesOk}/${summary.pagesTotal}`} iconColor="text-emerald-500" bg="bg-emerald-50" border="border-emerald-200" />
              <SummaryBadge icon={AlertCircle} label="Lỗi"        value={summary.errors}      iconColor="text-rose-500"    bg="bg-rose-50"    border="border-rose-200" />
              <SummaryBadge icon={AlertTriangle} label="Cảnh báo" value={summary.warnings}    iconColor="text-amber-500"   bg="bg-amber-50"   border="border-amber-200" />
              <SummaryBadge icon={Lightbulb}   label="Đề xuất"    value={summary.suggestions} iconColor="text-sky-500"     bg="bg-sky-50"     border="border-sky-200" />
              <span className={`px-3 py-1.5 rounded-xl border text-xs font-black ${col.bg} ${col.border} ${col.text}`}>
                Điểm tổng: {isLoading ? '…' : `${siteScore}/100`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:inline">
              {isLoading ? 'Đang quét…' : `Quét lúc ${lastScanned}`}
            </span>
            <button
              id="seo-rescan-btn"
              onClick={scan}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-sm shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />}
              {isLoading ? `${progress.done}/${progress.total}` : 'Quét lại'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-1.5 mb-4 overflow-x-auto">
          <div className="flex min-w-max gap-1">
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              const Icon   = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`seo-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'issues' && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      active ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {summary.errors + summary.warnings}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error banner */}
        {status === 'error' && (
          <div className="mb-4">
            <ErrorBanner message={errorMsg} onRetry={scan} />
          </div>
        )}

        {/* ── Content ── */}
        <div className="transition-all duration-300">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminSEO;
