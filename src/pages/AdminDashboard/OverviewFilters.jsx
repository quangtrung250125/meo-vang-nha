import React from 'react';
import { Calendar, ArrowLeftRight, Clock, ChevronDown } from 'lucide-react';

/**
 * OverviewFilters Component:
 * - Bộ lọc thời gian: Hôm nay, 7 ngày, 30 ngày, Quý này, Tùy chọn (Từ ngày - Đến ngày)
 * - Tùy chọn so sánh với kỳ trước
 */
export const TIME_PRESETS = [
  { id: 'today', label: 'Hôm nay' },
  { id: '7d', label: '7 ngày qua' },
  { id: '30d', label: '30 ngày qua' },
  { id: 'quarter', label: 'Quý này' },
  { id: 'custom', label: 'Tùy chọn' },
];

const OverviewFilters = ({
  timePreset,
  setTimePreset,
  customRange,
  setCustomRange,
  comparePrevious,
  setComparePrevious,
}) => {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
      {/* Cụm nút chọn khoảng thời gian */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 mr-1 text-gray-500 font-semibold text-xs sm:text-sm">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span>Thời gian:</span>
        </div>

        <div className="flex flex-wrap bg-gray-100/80 p-1 rounded-2xl gap-1">
          {TIME_PRESETS.map((preset) => {
            const active = timePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTimePreset(preset.id)}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-orange-600 shadow-sm shadow-orange-100 font-extrabold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tùy chọn ngày nếu chọn Custom & Toggle So sánh kỳ trước */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {timePreset === 'custom' && (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-2xl text-xs sm:text-sm">
            <span className="text-gray-400 font-medium">Từ</span>
            <input
              type="date"
              value={customRange.startDate}
              onChange={(e) => setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="bg-transparent font-semibold text-gray-700 outline-none text-xs sm:text-sm cursor-pointer"
            />
            <span className="text-gray-400 font-medium">đến</span>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(e) => setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="bg-transparent font-semibold text-gray-700 outline-none text-xs sm:text-sm cursor-pointer"
            />
          </div>
        )}

        {/* Toggle So sánh với kỳ trước */}
        <label className="flex items-center gap-2.5 cursor-pointer bg-orange-50/70 hover:bg-orange-50 border border-orange-200/60 px-3.5 py-2 rounded-2xl transition-colors">
          <input
            type="checkbox"
            checked={comparePrevious}
            onChange={(e) => setComparePrevious(e.target.checked)}
            className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer accent-orange-600"
          />
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-950 select-none">
            <ArrowLeftRight className="w-3.5 h-3.5 text-orange-600" />
            <span>So sánh kỳ trước</span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default OverviewFilters;
