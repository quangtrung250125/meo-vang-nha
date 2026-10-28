import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  Globe,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { SEO_PAGES, KEYWORDS, scoreColor } from './seoData';
import {
  requestGSCToken,
  getSavedGSCToken,
  clearGSCToken,
  fetchGSCSites,
  fetchGSCKeywords,
  getGSCClientId,
} from '../../services/gscService';

// ─── Status Icon ──────────────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  if (status === 'ok') return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-rose-500" />;
};

// ─── Speed Badge ──────────────────────────────────────────────────────────────
const SpeedBadge = ({ speed }) => {
  const col = scoreColor(speed);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${col.bg} ${col.text} border ${col.border}`}>
      {speed}
    </span>
  );
};

// ─── Score Bar ────────────────────────────────────────────────────────────────
const ScoreBar = ({ score }) => {
  const col = scoreColor(score);
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: col.hex }}
        />
      </div>
      <span className={`text-xs font-extrabold shrink-0 ${col.text}`}>{score}</span>
    </div>
  );
};

// ─── Keyword Trend ────────────────────────────────────────────────────────────
const TrendIcon = ({ trend, change }) => {
  if (trend === 'up') return (
    <span className="flex items-center gap-0.5 text-emerald-600 font-bold text-xs">
      <TrendingUp className="h-3.5 w-3.5" />+{change}
    </span>
  );
  if (trend === 'down') return (
    <span className="flex items-center gap-0.5 text-rose-500 font-bold text-xs">
      <TrendingDown className="h-3.5 w-3.5" />{change}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-gray-400 font-bold text-xs">
      <Minus className="h-3.5 w-3.5" />0
    </span>
  );
};

// ─── Pages Table ─────────────────────────────────────────────────────────────
const PagesTable = ({ pages = SEO_PAGES }) => {
  const [sortBy, setSortBy] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sorted = [...pages].sort((a, b) => {
    const va = a[sortBy] ?? 0;
    const vb = b[sortBy] ?? 0;
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const SortBtn = ({ col, label }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 font-bold text-gray-500 uppercase tracking-wider text-xs hover:text-gray-800 transition-colors cursor-pointer"
    >
      {label}
      {sortBy === col
        ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
        : <span className="h-3 w-3" />}
    </button>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3"><SortBtn col="name" label="Trang" /></th>
            <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">URL</th>
            <th className="text-left px-4 py-3"><SortBtn col="score" label="Điểm SEO" /></th>
            <th className="text-center px-3 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Title</th>
            <th className="text-center px-3 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Meta</th>
            <th className="text-center px-3 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">H1</th>
            <th className="text-left px-3 py-3"><SortBtn col="speed" label="Tốc độ" /></th>
            <th className="text-center px-3 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">Index</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map(page => (
            <tr key={page.id} className="hover:bg-orange-50/30 transition-colors">
              <td className="px-4 py-3.5">
                <span className="font-bold text-sm text-gray-800">{page.name}</span>
              </td>
              <td className="px-4 py-3.5">
                <span className="text-xs font-mono text-gray-500">{page.url}</span>
              </td>
              <td className="px-4 py-3.5">
                <ScoreBar score={page.score} />
              </td>
              <td className="px-3 py-3.5 text-center">
                <div className="flex justify-center">
                  <StatusIcon status={page.title.status} />
                </div>
              </td>
              <td className="px-3 py-3.5 text-center">
                <div className="flex justify-center">
                  <StatusIcon status={page.meta.status} />
                </div>
              </td>
              <td className="px-3 py-3.5 text-center">
                <div className="flex justify-center">
                  <StatusIcon status={page.h1.status} />
                </div>
              </td>
              <td className="px-3 py-3.5">
                <SpeedBadge speed={page.speed} />
              </td>
              <td className="px-3 py-3.5 text-center">
                {page.indexable
                  ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                  : <XCircle className="h-4 w-4 text-rose-400 mx-auto" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Keywords Table with Google Search Console OAuth ─────────────────────────
const KeywordsTable = () => {
  const clientId = getGSCClientId();
  const [token, setToken] = useState(() => getSavedGSCToken());
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(() => sessionStorage.getItem('gsc_selected_site') || '');
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMock, setShowMock] = useState(false);

  // Tải danh sách website đã xác minh khi có token
  const loadSites = useCallback(async (authToken) => {
    try {
      setLoading(true);
      setError('');
      const siteList = await fetchGSCSites(authToken);
      setSites(siteList);

      if (siteList.length > 0) {
        // Tự động chọn site phù hợp hoặc site đầu tiên
        const preferred = siteList.find(s => s.siteUrl.includes('meovangnha')) || siteList[0];
        const siteUrl = preferred.siteUrl;
        setSelectedSite(siteUrl);
        sessionStorage.setItem('gsc_selected_site', siteUrl);
      } else {
        setError('Tài khoản Google này chưa có trang web (Property) nào được xác minh trong Search Console.');
      }
    } catch (err) {
      console.error('[GSC] loadSites error:', err);
      if (err.message?.includes('401') || err.message?.includes('token')) {
        clearGSCToken();
        setToken(null);
      }
      setError(err.message || 'Lỗi kết nối Search Console');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải từ khóa thật của site đã chọn
  const loadKeywords = useCallback(async (authToken, siteUrl) => {
    if (!authToken || !siteUrl) return;
    try {
      setLoading(true);
      setError('');
      const data = await fetchGSCKeywords(authToken, siteUrl, 28);
      setKeywords(data);
    } catch (err) {
      console.error('[GSC] loadKeywords error:', err);
      setError(err.message || 'Lỗi tải dữ liệu từ khóa');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tự động nạp khi đã có token
  useEffect(() => {
    if (token) {
      if (!sites.length) {
        loadSites(token);
      } else if (selectedSite) {
        loadKeywords(token, selectedSite);
      }
    }
  }, [token, selectedSite, sites.length, loadSites, loadKeywords]);

  // Xử lý đăng nhập Google
  const handleConnect = async () => {
    try {
      setAuthLoading(true);
      setError('');
      const newToken = await requestGSCToken();
      setToken(newToken);
      setShowMock(false);
    } catch (err) {
      console.error('[GSC] OAuth failed:', err);
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setAuthLoading(false);
    }
  };

  // Đăng xuất / ngắt kết nối
  const handleDisconnect = () => {
    clearGSCToken();
    setToken(null);
    setSites([]);
    setSelectedSite('');
    setKeywords([]);
  };

  // Tính tổng số liệu khi có từ khóa thật
  const totalClicks = keywords.reduce((s, k) => s + (k.clicks || 0), 0);
  const totalImpr = keywords.reduce((s, k) => s + (k.impressions || 0), 0);
  const avgCtr = totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(1) : 0;
  const avgPos = keywords.length > 0
    ? (keywords.reduce((s, k) => s + (k.rank || 0), 0) / keywords.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Banner kết nối Search Console ── */}
      <div className="bg-gradient-to-r from-orange-50 via-white to-amber-50 rounded-2xl border border-orange-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-gray-800 text-sm">Google Search Console</h4>
                {token ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-3 w-3" /> Đã kết nối
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    Chưa kết nối
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-xl">
                {token
                  ? 'Đang đồng bộ dữ liệu thứ hạng, click và lượt hiển thị thực tế từ Google Search.'
                  : 'Đăng nhập tài khoản Google quản trị website để nạp từ khóa và thứ hạng thật.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {token ? (
              <>
                {sites.length > 0 && (
                  <select
                    value={selectedSite}
                    onChange={(e) => {
                      setSelectedSite(e.target.value);
                      sessionStorage.setItem('gsc_selected_site', e.target.value);
                    }}
                    className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {sites.map((s) => (
                      <option key={s.siteUrl} value={s.siteUrl}>
                        {s.siteUrl}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => loadKeywords(token, selectedSite)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
                  Làm mới
                </button>
                <button
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shadow-sm"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Ngắt kết nối
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConnect}
                  disabled={authLoading || !clientId}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xác thực…
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Kết nối Google Search Console
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowMock(!showMock)}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {showMock ? 'Ẩn mẫu' : 'Xem dữ liệu mẫu'}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {!clientId && (
          <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Chưa thấy <code>VITE_GSC_CLIENT_ID</code> trong file <code>.env</code>. Vui lòng cấu hình OAuth Client ID.</span>
          </div>
        )}
      </div>

      {/* ── Thống kê tổng quan khi đã kết nối ── */}
      {token && keywords.length > 0 && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Tổng Clicks (28 ngày)</p>
            <p className="text-xl font-black text-gray-800 mt-1">{totalClicks.toLocaleString('vi-VN')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Lượt hiển thị</p>
            <p className="text-xl font-black text-gray-800 mt-1">{totalImpr.toLocaleString('vi-VN')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">CTR trung bình</p>
            <p className="text-xl font-black text-orange-600 mt-1">{avgCtr}%</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Vị trí trung bình</p>
            <p className="text-xl font-black text-emerald-600 mt-1">#{avgPos}</p>
          </div>
        </div>
      )}

      {/* ── Bảng hiển thị từ khóa ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">Đang tải dữ liệu từ Google Search Console…</p>
        </div>
      ) : token && keywords.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Từ khóa (Query)</th>
                <th className="text-center px-4 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Vị trí TB</th>
                <th className="text-right px-4 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Số Clicks</th>
                <th className="text-right px-4 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Lượt hiển thị</th>
                <th className="text-right px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {keywords.map((kw) => (
                <tr key={kw.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold text-gray-800">{kw.keyword}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-block text-xs font-black px-2.5 py-0.5 rounded-full ${kw.rank <= 3
                          ? 'bg-emerald-100 text-emerald-700'
                          : kw.rank <= 10
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      #{kw.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-extrabold text-sm text-gray-800">
                    {kw.clicks.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-sm text-gray-600">
                    {kw.impressions.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-xs text-orange-600">
                    {kw.ctr}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : token && !keywords.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-700">Chưa có dữ liệu tìm kiếm cho trang này</p>
          <p className="text-xs text-gray-400 mt-1">Trang web cần có lượt hiển thị tìm kiếm tự nhiên trên Google trong 28 ngày qua.</p>
        </div>
      ) : (
        /* ── Hiển thị bảng Mock Data khi chưa kết nối ── */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Đang hiển thị dữ liệu mẫu (Mock data)
            </span>
            <span className="text-xs text-gray-400">Kết nối Search Console để xem từ khóa thật</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Từ khóa</th>
                  <th className="text-center px-4 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Thứ hạng</th>
                  <th className="text-right px-4 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Volume/tháng</th>
                  <th className="text-center px-4 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wider">Xu hướng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {KEYWORDS.map((kw) => (
                  <tr key={kw.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-gray-800">{kw.keyword}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block text-xs font-black px-2.5 py-0.5 rounded-full ${kw.rank <= 3
                            ? 'bg-emerald-100 text-emerald-700'
                            : kw.rank <= 10
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        #{kw.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-700">{kw.volume.toLocaleString('vi-VN')}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center">
                        <TrendIcon trend={kw.trend} change={kw.change} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


// ─── Export ───────────────────────────────────────────────────────────────────
const SeoPageTable = ({ activeView, pages }) => {
  if (activeView === 'keywords') return <KeywordsTable />;
  return <PagesTable pages={pages} />;
};

export default SeoPageTable;
