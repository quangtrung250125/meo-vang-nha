import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap, RefreshCw, Activity, Send, Users, DollarSign, BarChart3, MessageSquare, Clock, Calendar, Shield, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  MARKETING_TABS,
  MKT_STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  formatCurrency,
  formatPercent,
  initialScenarios,
  initialTemplates,
  initialResults,
  initialConversations,
  initialFrequency,
} from './marketingStore';
import {
  buildRealRecipients,
  buildRealScheduleItems,
} from './marketingCustomerAdapter';
import useCustomerData from '../AdminCustomers/useCustomerData';

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

  // Lấy dữ liệu khách hàng THẬT dùng chung từ hệ thống
  const { customers = [], loading, lastSyncedAt, refresh } = useCustomerData();

  // State cấu hình kịch bản, mẫu tin và giới hạn tần suất từ localStorage
  const [scenarios, setScenarios] = useState(() => loadFromStorage(MKT_STORAGE_KEYS.SCENARIOS, initialScenarios));
  const [templates, setTemplates] = useState(() => loadFromStorage(MKT_STORAGE_KEYS.TEMPLATES, initialTemplates));
  const [frequency, setFrequency] = useState(() => loadFromStorage(MKT_STORAGE_KEYS.FREQUENCY, initialFrequency));

  // Dữ liệu mô phỏng theo phạm vi giữ nguyên
  const results       = initialResults;
  const conversations = initialConversations;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(new Date());

  // Xây dựng danh sách đối tượng người nhận THẬT từ database
  const realRecipients = useMemo(() => {
    return buildRealRecipients(customers, scenarios);
  }, [customers, scenarios]);

  // Xây dựng lịch gửi sắp tới THẬT theo các kịch bản đang bật và số người nhận thật
  const realScheduleItems = useMemo(() => {
    return buildRealScheduleItems(scenarios, realRecipients);
  }, [scenarios, realRecipients]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof refresh === 'function') {
        await refresh();
      }
      setLastUpdated(new Date());
      toast.success('Đã đồng bộ và làm mới dữ liệu khách hàng thật!');
    } catch {
      toast.error('Có lỗi khi làm mới dữ liệu!');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Summary badges tính toán trực tiếp từ dữ liệu THẬT
  const enabledCount      = scenarios.filter(s => s.enabled).length;
  const totalSent30       = results.summary.sent; // [Giữ nguyên mô phỏng]
  const pendingRecipients = realRecipients.filter(r => r.status === 'pending').length;
  const campaignRevenue   = results.summary.revenue; // [Giữ nguyên mô phỏng]

  const displayTime = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('vi-VN') : lastUpdated.toLocaleTimeString('vi-VN');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return <Tab2Templates templates={templates} setTemplates={setTemplates} />;
      case 'schedule':
        return (
          <Tab3Schedule
            scheduleItems={realScheduleItems}
            recipients={realRecipients}
            loading={loading}
            onRetry={handleRefresh}
            totalCustomers={customers.length}
          />
        );
      case 'results':
        return <Tab4Results results={results} />;
      case 'inbox':
        return <Tab5Inbox conversations={conversations} />;
      case 'frequency':
        return <Tab6Frequency frequency={frequency} setFrequency={setFrequency} />;
      default:
        return (
          <Tab1Scenarios
            scenarios={scenarios}
            setScenarios={setScenarios}
            realRecipients={realRecipients}
            customers={customers}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* 1. Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Marketing tự động
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="h-3 w-3" />
                Dữ liệu khách hàng thật
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Tự động hóa việc gửi thông báo Zalo, Email, SMS và Web Push dựa trên hành vi khách hàng thật
            </p>

            {/* Badges tóm tắt */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đang bật: {enabledCount} kịch bản
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Đối tượng chờ gửi: {pendingRecipients} khách
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Khách hàng hệ thống: {customers.length} khách
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Đã gửi (30 ngày mô phỏng): {totalSent30.toLocaleString()} tin
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                Doanh thu chiến dịch (mô phỏng): {formatCurrency(campaignRevenue)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              Cập nhật lúc {displayTime}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              title="Làm mới dữ liệu khách hàng thật"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing || loading ? 'animate-spin text-orange-500' : ''}`} />
              <span>{isRefreshing || loading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tab bar */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
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
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Nội dung tab */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminMarketing;
