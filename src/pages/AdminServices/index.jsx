import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, LayoutGrid, CalendarClock, BarChart3, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { useServiceCatalog } from '../../contexts/ServiceCatalogContext';
import CatalogTab from './CatalogTab';
import PricingRulesTab from './PricingRulesTab';
import PerformanceTab from './PerformanceTab';
import Services from '../Services';

/**
 * AdminServices - Trang "Dịch vụ" dành cho Admin
 * - Danh mục phòng & dịch vụ: sửa giá, mô tả, sức chứa, trạng thái; thêm dịch vụ mới; gỡ / đăng lại
 * - Giá theo mùa / cuối tuần / lễ Tết & quy tắc giảm giá
 * - Hiệu suất từng dịch vụ & gợi ý upsell
 * Mọi thay đổi lưu ở Supabase (bảng service_catalog) nên trang khách cập nhật ngay.
 */
const TABS = [
  { id: 'catalog', label: 'Danh mục phòng & dịch vụ', icon: LayoutGrid },
  { id: 'pricing', label: 'Giá mùa, lễ Tết & giảm giá', icon: CalendarClock },
  { id: 'performance', label: 'Hiệu suất & upsell', icon: BarChart3 },
  { id: 'preview', label: 'Xem như khách', icon: Eye },
];

const AdminServices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'catalog';
  const catalog = useServiceCatalog();
  const { items, rules, loading, tableMissing, error, reload } = catalog;

  const goTo = (tab) => {
    setSearchParams({ tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'pricing':
        return <PricingRulesTab />;
      case 'performance':
        return <PerformanceTab />;
      case 'preview':
        return (
          <div className="rounded-3xl border-2 border-dashed border-orange-200 overflow-hidden">
            <div className="bg-orange-50 text-orange-700 text-xs font-bold px-4 py-2">
              Đây là trang Dịch vụ khách đang thấy (đã gồm mọi thay đổi admin vừa lưu)
            </div>
            <div className="bg-bg-cream">
              <Services />
            </div>
          </div>
        );
      default:
        return <CatalogTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-orange-500" />
              Dịch vụ
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Sửa giá, thông tin, gỡ / đăng dịch vụ. Lưu xong khách thấy ngay trên trang Dịch vụ và Đặt phòng.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đang đăng {items.filter((i) => i.published !== false).length}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                Đã gỡ {items.filter((i) => i.published === false).length}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Quy tắc giá đang bật {rules.filter((r) => r.active).length}
              </span>
            </div>
          </div>
          <button
            onClick={reload}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-sm transition-all"
            title="Tải lại danh mục từ Supabase"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {(tableMissing || error) && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              {tableMissing ? (
                <>
                  <p className="font-bold">Chưa có bảng service_catalog trên Supabase</p>
                  <p>Trang đang hiện bảng giá mặc định. Chạy file <code>supabase/migrations/20261102_create_service_catalog.sql</code> trong Supabase SQL Editor để lưu được thay đổi.</p>
                </>
              ) : (
                <>
                  <p className="font-bold">Không tải được danh mục từ Supabase</p>
                  <p>{error}. Đang hiện bảng giá mặc định.</p>
                </>
              )}
            </div>
          </div>
        )}

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

export default AdminServices;
