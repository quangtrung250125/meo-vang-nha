import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Tag,
  Gift,
  Ticket,
  Trophy,
  Award,
  Share2,
  BarChart3,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PROMO_TABS, setRemoteSaver, formatCurrency } from './promotionsStore';
import { buildAdminLoyaltyView, buildPromoAnalytics } from '../../utils/loyalty';
import { fetchLoyaltyAdmin, saveLoyaltyConfig, adjustCustomerPoints } from '../../services/loyaltyApi';

import Tab1AllPromotions from './Tab1AllPromotions';
import Tab2Vouchers from './Tab2Vouchers';
import Tab3GiftsCombos from './Tab3GiftsCombos';
import Tab4Minigame from './Tab4Minigame';
import Tab5LoyaltyTiers from './Tab5LoyaltyTiers';
import Tab6Referral from './Tab6Referral';
import Tab7AnalyticsROI from './Tab7AnalyticsROI';

// Mapping icon cho 7 tab
const TAB_ICONS = {
  'all-promotions': Tag,
  'vouchers': Ticket,
  'gifts-combos': Gift,
  'minigame': Trophy,
  'loyalty-tiers': Award,
  'referral': Share2,
  'analytics-roi': BarChart3,
};

const AdminPromotions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabParam = searchParams.get('tab');
  const activeTab = PROMO_TABS.some((t) => t.id === currentTabParam)
    ? currentTabParam
    : 'all-promotions';

  // Dữ liệu thật từ máy chủ: cài đặt Admin đã lưu + lượt dùng mã, điểm từng khách, lượt giới thiệu
  const [promotions, setPromotions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [minigameSettings, setMinigameSettings] = useState({});
  const [minigamePrizes, setMinigamePrizes] = useState([]);
  const [loyaltyTiers, setLoyaltyTiers] = useState([]);
  const [loyaltyRules, setLoyaltyRules] = useState({});
  const [customerPoints, setCustomerPoints] = useState([]);
  const [pointsAuditLogs, setPointsAuditLogs] = useState([]);
  const [referralSettings, setReferralSettings] = useState({});
  const [referralLogs, setReferralLogs] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loadError, setLoadError] = useState('');
  // Tăng mỗi lần tải lại để các tab nhận số liệu mới
  const [dataVersion, setDataVersion] = useState(0);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadData = useCallback(async ({ silent = false } = {}) => {
    setIsRefreshing(true);
    try {
      const data = await fetchLoyaltyAdmin();
      const view = buildAdminLoyaltyView(data, window.location.origin);
      setOverview(data);
      setPromotions(view.promotions);
      setVouchers(view.vouchers);
      setGifts(view.gifts);
      setMinigameSettings(view.minigameSettings);
      setMinigamePrizes(view.minigamePrizes);
      setLoyaltyTiers(view.tiers);
      setLoyaltyRules(view.rules);
      setCustomerPoints(view.customerPoints);
      setPointsAuditLogs(view.pointsAuditLogs);
      setReferralSettings(view.referralSettings);
      setReferralLogs(view.referralLogs);
      setDataVersion((v) => v + 1);
      setLoadError('');
      setLastUpdated(new Date());
      if (!silent) toast.success('Đã làm mới dữ liệu Khuyến mãi & Điểm thưởng!');
    } catch (err) {
      setLoadError(err.message || 'Không tải được dữ liệu');
      if (!silent) toast.error(`Không tải được dữ liệu: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Các tab gọi saveToStorage(...) khi Admin sửa: lưu luôn lên máy chủ để trang khách dùng ngay
  useEffect(() => {
    setRemoteSaver(async (partial) => {
      try {
        await saveLoyaltyConfig(partial);
      } catch (err) {
        toast.error(`Chưa lưu được lên máy chủ: ${err.message}`);
      }
    });
    loadData({ silent: true });
    return () => setRemoteSaver(null);
  }, [loadData]);

  // Đơn vừa check-out / hủy ở trang khác: tải lại điểm & lượt dùng
  useEffect(() => {
    let timer = null;
    const onSync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => loadData({ silent: true }), 2000);
    };
    window.addEventListener('mvn_booking_sync', onSync);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mvn_booking_sync', onSync);
    };
  }, [loadData]);

  const handleRefreshData = () => loadData();

  // Cộng / trừ điểm thủ công cho khách (ghi vào nhật ký điểm trên máy chủ)
  const handleAdjustPoints = async ({ customerId, delta, reason }) => {
    await adjustCustomerPoints({ customerId, delta, reason });
    await loadData({ silent: true });
  };

  const analyticsData = useMemo(() => buildPromoAnalytics({
    redemptions: overview?.redemptions || [],
    promotions,
    vouchers,
    customers: overview?.customers || [],
  }), [overview, promotions, vouchers]);

  // Render nội dung từng tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'vouchers':
        return (
          <Tab2Vouchers
            vouchers={vouchers}
            setVouchers={setVouchers}
            promotions={promotions}
          />
        );
      case 'gifts-combos':
        return (
          <Tab3GiftsCombos
            gifts={gifts}
            setGifts={setGifts}
          />
        );
      case 'minigame':
        return (
          <Tab4Minigame
            minigameSettings={minigameSettings}
            setMinigameSettings={setMinigameSettings}
            minigamePrizes={minigamePrizes}
            setMinigamePrizes={setMinigamePrizes}
          />
        );
      case 'loyalty-tiers':
        return (
          <Tab5LoyaltyTiers
            loyaltyTiers={loyaltyTiers}
            setLoyaltyTiers={setLoyaltyTiers}
            loyaltyRules={loyaltyRules}
            setLoyaltyRules={setLoyaltyRules}
            customerPoints={customerPoints}
            setCustomerPoints={setCustomerPoints}
            pointsAuditLogs={pointsAuditLogs}
            setPointsAuditLogs={setPointsAuditLogs}
            onAdjustPoints={handleAdjustPoints}
          />
        );
      case 'referral':
        return (
          <Tab6Referral
            referralSettings={referralSettings}
            setReferralSettings={setReferralSettings}
            referralLogs={referralLogs}
            setReferralLogs={setReferralLogs}
          />
        );
      case 'analytics-roi':
        return (
          <Tab7AnalyticsROI
            redemptions={overview?.redemptions || []}
            customers={overview?.customers || []}
            vouchers={vouchers}
            promotions={promotions}
          />
        );
      default:
        return (
          <Tab1AllPromotions
            promotions={promotions}
            setPromotions={setPromotions}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* 1. Header Trang Quản Trị Khuyến Mãi & Điểm Thưởng */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-500" />
              Khuyến mãi & điểm thưởng
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Quản lý toàn diện các chiến dịch ưu đãi, mã giảm giá, quà tặng, minigame, tích điểm thành viên và báo cáo ROI
            </p>

            {/* Badges tóm tắt nhanh */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đang chạy: {promotions.filter((p) => p.status === 'active').length} ưu đãi
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Mã giảm giá: {vouchers.filter((v) => v.status === 'active').length} mã
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Thành viên tích điểm: {customerPoints.filter((c) => c.currentPoints > 0 || c.earnedPoints > 0).length} khách
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                Doanh thu từ đơn dùng ưu đãi (30 ngày): {formatCurrency(analyticsData.summary?.incrementalRevenue)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
            <button
              onClick={handleRefreshData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Làm mới dữ liệu từ bộ nhớ"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dải Tab Dạng Viên Thuốc (Pill Tabs - 7 tabs) */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-1.5 mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-1">
            {PROMO_TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = TAB_ICONS[tab.id] || Tag;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                      : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Nội dung Tab đang chọn */}
        <div className="transition-all duration-300" key={dataVersion}>
          {loadError && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
              Không tải được dữ liệu Khuyến mãi & Điểm thưởng từ máy chủ: {loadError}. Bấm "Làm mới" để thử lại.
            </div>
          )}
          {overview && overview.database === false && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Máy chủ chưa kết nối được bảng <strong>loyalty_store</strong> trên Supabase nên dữ liệu chỉ được giữ tạm. Chạy file SQL trong hướng dẫn để lưu lâu dài.
            </div>
          )}
          {dataVersion === 0 ? (
            <div className="py-20 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
              {loadError ? 'Chưa có dữ liệu' : 'Đang tải dữ liệu thật...'}
            </div>
          ) : renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPromotions;
