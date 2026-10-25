import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, BarChart3, Filter, List, UserRound, RefreshCw } from 'lucide-react';
import useCustomerData from './useCustomerData';
import StatsTab from './StatsTab';
import FunnelTab from './FunnelTab';
import CustomerListTab from './CustomerListTab';
import CustomerProfileTab from './CustomerProfileTab';

/**
 * AdminCustomers - Trang "Khách hàng" dành cho Admin
 * Gồm 4 mục con theo sitemap: Thẻ số liệu, Phễu chuyển đổi, Danh sách khách hàng, Hồ sơ khách hàng.
 * Dữ liệu lấy từ hồ sơ, hồ sơ mèo và đơn đặt phòng mà khách tạo ở giao diện khách hàng.
 */
const TABS = [
  { id: 'stats', label: 'Thẻ số liệu', icon: BarChart3 },
  { id: 'funnel', label: 'Phễu chuyển đổi', icon: Filter },
  { id: 'list', label: 'Danh sách khách hàng', icon: List },
  { id: 'profile', label: 'Hồ sơ khách hàng', icon: UserRound },
];

const AdminCustomers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'stats';
  const selectedId = searchParams.get('id');
  const { customers, loading, lastSyncedAt, refresh } = useCustomerData();

  const goTo = (tab, id) => {
    const next = { tab };
    if (id) next.id = id;
    else if (tab === 'profile' && selectedId) next.id = selectedId;
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openProfile = (id) => goTo('profile', id);

  const renderTab = () => {
    switch (activeTab) {
      case 'funnel':
        return <FunnelTab customers={customers} onOpenList={() => goTo('list')} />;
      case 'list':
        return <CustomerListTab customers={customers} onOpenProfile={openProfile} />;
      case 'profile':
        return (
          <CustomerProfileTab
            customers={customers}
            selectedId={selectedId}
            onSelect={openProfile}
            onBack={() => goTo('list')}
          />
        );
      default:
        return <StatsTab customers={customers} onOpenProfile={openProfile} onOpenList={() => goTo('list')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Tiêu đề trang, cùng kiểu với trang Tình trạng phòng */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Khách hàng
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Theo dõi khách hàng, hồ sơ mèo và lịch sử đặt phòng được đồng bộ từ giao diện khách hàng
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Khách hàng {customers.length}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                Hồ sơ mèo {customers.reduce((sum, c) => sum + c.pets.length, 0)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-600 border border-gray-200">
                Đơn đặt phòng {customers.reduce((sum, c) => sum + c.bookingCount, 0)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">
              {lastSyncedAt ? `Cập nhật lúc ${lastSyncedAt.toLocaleTimeString('vi-VN')}` : 'Đang đồng bộ...'}
            </span>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Tải lại dữ liệu khách hàng"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Thanh mục con */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => goTo(id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                    active
                      ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {renderTab()}
      </div>
    </div>
  );
};

export default AdminCustomers;
