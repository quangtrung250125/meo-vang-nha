import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap, RefreshCw, Send, MessageSquare, Calendar, BarChart3, Shield, AlertTriangle, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MARKETING_TABS, formatCurrency } from './marketingStore';
import useMarketingData from './useMarketingData';
import ManualSendModal from './ManualSendModal';

import Tab1Scenarios from './Tab1Scenarios';
import Tab2Templates from './Tab2Templates';
import Tab3Schedule  from './Tab3Schedule';
import Tab4Results   from './Tab4Results';
import Tab5Inbox     from './Tab5Inbox';
import Tab6Frequency from './Tab6Frequency';

const TAB_ICONS = {
  scenarios:  Zap,
  templates:  MessageSquare,
  schedule:   Calendar,
  results:    BarChart3,
  inbox:      MessageSquare,
  frequency:  Shield,
};

const AdminMarketing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');
  const activeTab  = MARKETING_TABS.some(t => t.id === currentTab) ? currentTab : 'scenarios';

  const data = useMarketingData();
  const { scenarios, templates, frequency, saveConfig, evaluation, resultsFor, customers, deviceCountOf, status, lastUpdated, send } = data;

  const [isRefreshing, setIsRefreshing] = useState(false);
  // Hộp gửi thủ công: { customerIds, templateId } hoặc null
  const [manual, setManual] = useState(null);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await data.refresh();
    setIsRefreshing(false);
    toast.success('Đã làm mới dữ liệu Marketing tự động!');
  };

  const openManual = (opts = {}) => setManual({ customerIds: opts.customerIds || [], templateId: opts.templateId || '' });

  // Summary badges
  const enabledCount     = scenarios.filter(s => s.enabled).length;
  const results30        = resultsFor(30);
  const pendingCount     = evaluation.due.length + evaluation.blocked.length;
  const pushCustomers    = customers.filter(c => deviceCountOf(c) > 0).length;

  const shared = { ...data, openManual };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':  return <Tab2Templates templates={templates} saveConfig={saveConfig} customers={customers} openManual={openManual} />;
      case 'schedule':   return <Tab3Schedule {...shared} />;
      case 'results':    return <Tab4Results resultsFor={resultsFor} />;
      case 'inbox':      return <Tab5Inbox {...shared} />;
      case 'frequency':  return <Tab6Frequency frequency={frequency} saveConfig={saveConfig} />;
      default:           return <Tab1Scenarios {...shared} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* 1. Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Marketing tự động
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Tự động gửi thông báo Web Push tới điện thoại / máy tính của khách theo hành vi, hoặc gửi thủ công ngay
            </p>

            {/* Badges tóm tắt */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đang bật: {enabledCount} kịch bản
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Đã gửi (30 ngày): {results30.summary.sent.toLocaleString()} tin
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Đối tượng chờ gửi: {pendingCount} tin
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 inline-flex items-center gap-1">
                <Bell className="h-3 w-3" /> Đã bật thông báo: {pushCustomers}/{customers.length} khách
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                Doanh thu từ chiến dịch: {formatCurrency(results30.summary.revenue)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
            <button onClick={() => openManual()} data-testid="open-manual-send"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              <Send className="h-4 w-4" />
              <span>Gửi tin thủ công</span>
            </button>
            <button onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Làm mới dữ liệu">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tab bar */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        {status.pushConfigured === false && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span><b>Chưa gửi được thông báo:</b> máy chủ chưa có khóa Web Push. Cần thêm biến VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY trên Vercel rồi deploy lại.</span>
          </div>
        )}
        {status.vapid?.keyMismatch && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-700" data-testid="vapid-mismatch-banner">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="min-w-0">
              <b>Khóa Web Push trên Vercel bị lệch:</b> VAPID_PUBLIC_KEY không khớp với VAPID_PRIVATE_KEY nên trước đây dịch vụ thông báo từ chối (mã 403). Máy chủ đã tự dùng khóa đúng; khách chỉ cần mở lại web (đã đăng nhập) là nhận được thông báo. Để gọn, nên sửa VAPID_PUBLIC_KEY và VITE_VAPID_PUBLIC_KEY trên Vercel thành:
              <code className="block mt-1 px-2 py-1 bg-white/70 rounded break-all select-all font-mono text-[11px]">{status.vapid.publicKey}</code>
            </span>
          </div>
        )}
        {status.subscriptionStore?.ok === false && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span><b>Máy chủ chưa lưu được thiết bị khách bật thông báo:</b> {status.subscriptionStore.error} Vì vậy khách đã bật vẫn hiện "Chưa bật". Chạy file supabase/migrations/20260923_create_push_subscriptions.sql trong Supabase SQL Editor, sau đó khách mở lại web (đã đăng nhập) là thiết bị tự được lưu lại.</span>
          </div>
        )}
        {status.serviceRole === false && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Máy chủ chưa có SUPABASE_SERVICE_ROLE_KEY nên chưa đọc được họ tên, SĐT của mọi tài khoản khách. Khách sẽ hiện đúng tên sau khi bật thông báo, hoặc thêm biến này trên Vercel để hiện tất cả.</span>
          </div>
        )}
        {status.database === false && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Chưa tạo bảng Marketing trên Supabase nên cài đặt và nhật ký tin chỉ lưu tạm. Chạy file supabase/migrations/20261103_create_marketing.sql trong Supabase SQL Editor.</span>
          </div>
        )}
        {status.error && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Không tải được cài đặt từ máy chủ ({status.error}). Đang dùng cài đặt lưu trên trình duyệt này.</span>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-1.5 mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-1">
            {MARKETING_TABS.map(tab => {
              const active = activeTab === tab.id;
              const Icon = TAB_ICONS[tab.id] || Zap;
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

        {/* 3. Nội dung tab */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>

      {manual && (
        <ManualSendModal
          customers={customers}
          templates={templates}
          deviceCountOf={deviceCountOf}
          initialSelected={manual.customerIds}
          initialTemplateId={manual.templateId}
          onSend={(list) => send(list, 'manual')}
          onClose={() => setManual(null)}
        />
      )}
    </div>
  );
};

export default AdminMarketing;
