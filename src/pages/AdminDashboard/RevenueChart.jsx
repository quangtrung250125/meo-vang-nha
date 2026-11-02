import React, { useState } from 'react';
import { BarChart3, TrendingUp, Sparkles, Home, ShoppingBag, Info } from 'lucide-react';

const formatMoney = (val) => {
  return `${Math.round(val || 0).toLocaleString('vi-VN')}đ`;
};

const RevenueChart = ({ chartData }) => {
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const currentSeries = chartData[viewMode] || [];

  // Tính tổng
  const totalStay = currentSeries.reduce((s, item) => s + (item.stayRevenue || 0), 0);
  const totalAddons = currentSeries.reduce((s, item) => s + (item.addonRevenue || 0), 0);
  const totalRevenue = totalStay + totalAddons;

  const stayPct = totalRevenue > 0 ? (totalStay / totalRevenue) * 100 : 0;
  const addonPct = totalRevenue > 0 ? (totalAddons / totalRevenue) * 100 : 0;

  // Tìm giá trị max để scale chiều cao cột
  const maxVal = Math.max(...currentSeries.map((d) => (d.stayRevenue || 0) + (d.addonRevenue || 0)), 1000000);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 font-title">
              Biểu đồ doanh thu
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            Tách riêng dịch vụ lưu trú (tiền phòng) và các dịch vụ cộng thêm (Spa, ăn uống, đưa đón)
          </p>
        </div>

        {/* View mode buttons: Ngày / Tuần / Tháng */}
        <div className="flex bg-gray-100/80 p-1 rounded-2xl gap-1 self-start sm:self-auto">
          {[
            { id: 'day', label: 'Theo ngày' },
            { id: 'week', label: 'Theo tuần' },
            { id: 'month', label: 'Theo tháng' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setViewMode(mode.id);
                setHoveredIndex(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === mode.id
                  ? 'bg-white text-orange-600 shadow-xs font-extrabold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tổng doanh thu</span>
          <p className="text-xl font-black text-gray-900 mt-0.5">{formatMoney(totalRevenue)}</p>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-3.5 h-3.5 rounded-md bg-orange-500 mt-1 shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Dịch vụ lưu trú</span>
              <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.2 rounded">
                {stayPct.toFixed(0)}%
              </span>
            </div>
            <p className="text-sm font-black text-orange-600 mt-0.5">{formatMoney(totalStay)}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-3.5 h-3.5 rounded-md bg-emerald-500 mt-1 shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-700">Dịch vụ thêm</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                {addonPct.toFixed(0)}%
              </span>
            </div>
            <p className="text-sm font-black text-emerald-600 mt-0.5">{formatMoney(totalAddons)}</p>
          </div>
        </div>
      </div>

      {/* Interactive Bar Chart Visualization */}
      <div className="relative pt-6 pb-2">
        {/* Tooltip khi hover */}
        {hoveredIndex !== null && currentSeries[hoveredIndex] && (
          <div
            className="absolute -top-3 z-20 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl pointer-events-none transform -translate-x-1/2 transition-all min-w-[180px]"
            style={{
              left: `${((hoveredIndex + 0.5) / currentSeries.length) * 100}%`,
            }}
          >
            <p className="font-bold text-gray-300 border-b border-gray-700 pb-1 mb-1.5">
              {currentSeries[hoveredIndex].label}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-orange-400">Lưu trú:</span>
                <span className="font-bold">{formatMoney(currentSeries[hoveredIndex].stayRevenue)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-emerald-400">Dịch vụ thêm:</span>
                <span className="font-bold">{formatMoney(currentSeries[hoveredIndex].addonRevenue)}</span>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-gray-700 font-extrabold text-white">
                <span>Tổng:</span>
                <span>{formatMoney(currentSeries[hoveredIndex].stayRevenue + currentSeries[hoveredIndex].addonRevenue)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Cột biểu đồ */}
        <div className="h-56 flex items-end gap-2 sm:gap-4 px-2 border-b border-gray-200">
          {currentSeries.map((item, idx) => {
            const stayH = ((item.stayRevenue || 0) / maxVal) * 100;
            const addonH = ((item.addonRevenue || 0) / maxVal) * 100;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.label || idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Thanh cột xếp chồng */}
                <div
                  className={`w-full max-w-[42px] flex flex-col justify-end rounded-t-xl overflow-hidden transition-all duration-200 ${
                    isHovered ? 'ring-2 ring-orange-400 scale-[1.03]' : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{ height: `${Math.min(100, Math.max(6, stayH + addonH))}%` }}
                >
                  {/* Phần Dịch vụ thêm (trên) */}
                  <div
                    className="w-full bg-emerald-500 transition-all"
                    style={{ height: `${(addonH / (stayH + addonH || 1)) * 100}%` }}
                    title={`Dịch vụ thêm: ${formatMoney(item.addonRevenue)}`}
                  />
                  {/* Phần Lưu trú (dưới) */}
                  <div
                    className="w-full bg-gradient-to-t from-orange-600 to-orange-500 transition-all"
                    style={{ height: `${(stayH / (stayH + addonH || 1)) * 100}%` }}
                    title={`Lưu trú: ${formatMoney(item.stayRevenue)}`}
                  />
                </div>

                {/* Nhãn trục X */}
                <span className="text-[10px] sm:text-xs text-gray-500 font-semibold mt-2.5 truncate max-w-full">
                  {item.shortLabel || item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
