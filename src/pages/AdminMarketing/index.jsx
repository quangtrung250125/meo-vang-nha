import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap, RefreshCw, Activity, Send, Users, DollarSign, BarChart3, MessageSquare, Clock, Calendar, Shield } from 'lucide-react';
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
  initialScheduleItems,
  initialRecipients,
  initialResults,
  initialConversations,
  initialFrequency,
} from './marketingStore';

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

  // State từ localStorage
  const [scenarios,  setScenarios]  = useState(() => loadFromStorage(MKT_STORAGE_KEYS.SCENARIOS,  initialScenarios));
  const [templates,  setTemplates]  = useState(() => loadFromStorage(MKT_STORAGE_KEYS.TEMPLATES,  initialTemplates));
  const [frequency,  setFrequency]  = useState(() => loadFromStorage(MKT_STORAGE_KEYS.FREQUENCY,  initialFrequency));

  // Dữ liệu mẫu (CẢNH BÁO: chưa nối API thật)
  const scheduleItems   = initialScheduleItems;
  const recipients      = initialRecipients;
  const results         = initialResults;
  const conversations   = initialConversations;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(new Date());

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setScenarios(loadFromStorage(MKT_STORAGE_KEYS.SCENARIOS, initialScenarios));
      setTemplates(loadFromStorage(MKT_STORAGE_KEYS.TEMPLATES, initialTemplates));
      setFrequency(loadFromStorage(MKT_STORAGE_KEYS.FREQUENCY, initialFrequency));
      setLastUpdated(new Date());
      setIsRefreshing(false);
      toast.success('Đã làm mới dữ liệu Marketing tự động!');
    }, 400);
  };

  // Summary badges
  const enabledCount     = scenarios.filter(s => s.enabled).length;
  const totalSent30      = results.summary.sent;
  const pendingRecipients = recipients.filter(r => r.status === 'pending').length;
  const campaignRevenue   = results.summary.revenue;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':  return <Tab2Templates templates={templates} setTemplates={setTemplates} />;
      case 'schedule':   return <Tab3Schedule scheduleItems={scheduleItems} recipients={recipients} />;
      case 'results':    return <Tab4Results results={results} />;
      case 'inbox':      return <Tab5Inbox conversations={conversations} />;
      case 'frequency':  return <Tab6Frequency frequency={frequency} setFrequency={setFrequency} />;
      default:           return <Tab1Scenarios scenarios={scenarios} setScenarios={setScenarios} />;
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
              Tự động hóa việc gửi thông báo Zalo, Email, SMS và Web Push dựa trên hành vi khách hàng
            </p>

            {/* Badges tóm tắt */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đang bật: {enabledCount} kịch bản
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Đã gửi (30 ngày): {totalSent30.toLocaleString()} tin
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Đối tượng chờ gửi: {pendingRecipients} khách
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                Doanh thu từ chiến dịch: {formatCurrency(campaignRevenue)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
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
    </div>
  );
};

export default AdminMarketing;
