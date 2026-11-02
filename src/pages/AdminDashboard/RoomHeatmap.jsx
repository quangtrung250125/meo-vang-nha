import React, { useState } from 'react';
import { Calendar, Flame, ChevronRight, BedDouble, Check, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ROOM_CONFIG } from '../../../Chi/RoomStateContext';

/**
 * Xác định màu sắc theo tỷ lệ lấp đầy
 */
const getHeatColor = (rate) => {
  if (rate === 0) return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
  if (rate < 40) return 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
  if (rate < 75) return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
  if (rate < 100) return 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200';
  return 'bg-purple-600 text-white border-purple-700 shadow-sm font-extrabold hover:bg-purple-700'; // 100% Kín
};

const RoomHeatmap = ({ heatmapData }) => {
  const location = useLocation();
  const isDirectAdminRoute = location.pathname.startsWith('/admin');
  const roomStatusPath = isDirectAdminRoute ? '/admin/room-status' : '/room-status';

  const [daysCount, setDaysCount] = useState(14); // 14 hoặc 30 ngày
  const [selectedDay, setSelectedDay] = useState(null);

  const displayList = heatmapData.slice(0, daysCount);

  // Thống kê nhanh
  const fullDays = displayList.filter((d) => d.rate >= 100).length;
  const highOccupancyDays = displayList.filter((d) => d.rate >= 75 && d.rate < 100).length;
  const avgOccupancy =
    displayList.length > 0
      ? displayList.reduce((sum, d) => sum + d.rate, 0) / displayList.length
      : 0;

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 font-title">
              Công suất phòng {daysCount} ngày tới
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              Bản đồ nhiệt
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Dự báo tỷ lệ phòng kín/trống từ hôm nay để điều tiết giá phòng & marketing kịp thời
          </p>
        </div>

        {/* Chuyển đổi 14 / 30 ngày & Link sang Tình trạng phòng */}
        <div className="flex items-center gap-2.5">
          <div className="flex bg-gray-100/80 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setDaysCount(14)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                daysCount === 14 ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              14 ngày
            </button>
            <button
              onClick={() => setDaysCount(30)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                daysCount === 30 ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30 ngày
            </button>
          </div>

          <Link
            to={roomStatusPath}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Sơ đồ phòng <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tóm tắt nhanh */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 text-center">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase">Công suất TB</span>
          <p className="text-base sm:text-lg font-black text-orange-600">{avgOccupancy.toFixed(0)}%</p>
        </div>
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase">Ngày kín 100%</span>
          <p className="text-base sm:text-lg font-black text-purple-600">{fullDays} ngày</p>
        </div>
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase">Ngày cao điểm (&gt;75%)</span>
          <p className="text-base sm:text-lg font-black text-rose-600">{highOccupancyDays} ngày</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {displayList.map((day) => {
          const colorClass = getHeatColor(day.rate);
          const isSelected = selectedDay?.dateStr === day.dateStr;

          return (
            <div
              key={day.dateStr}
              onClick={() => setSelectedDay(day)}
              className={`border rounded-2xl p-2.5 sm:p-3 text-center cursor-pointer transition-all duration-200 relative group ${colorClass} ${
                isSelected ? 'ring-2 ring-orange-500 scale-105 z-10' : ''
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{day.dayName}</p>
              <p className="text-xs sm:text-sm font-extrabold mt-0.5">{day.displayDate}</p>
              <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] font-black">
                <span>{day.occupied}/{day.total}</span>
                <span className="text-[9px] opacity-75">({day.rate.toFixed(0)}%)</span>
              </div>
              {day.rate >= 100 && (
                <span className="inline-block mt-1 text-[9px] font-extrabold bg-purple-900/30 text-white px-1.5 py-0.2 rounded-full">
                  KÍN
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Chú giải nhiệt & Chi tiết ngày được chọn */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Chú giải màu */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 flex-wrap">
          <span className="font-semibold text-gray-400">Nhiệt độ:</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Trống</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 font-bold">1-39%</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">40-74%</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">75-99%</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold">100% Kín</span>
        </div>

        <Link
          to={roomStatusPath}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline shrink-0"
        >
          Mở trang Tình trạng phòng →
        </Link>
      </div>

      {/* Modal / Popup xem chi tiết ô ngày khi được click */}
      {selectedDay && (
        <div className="mt-4 p-4 rounded-2xl bg-orange-50/80 border border-orange-200/80 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-bold text-orange-950">
                Chi tiết ngày {selectedDay.dayName}, {selectedDay.displayDate}
              </h4>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-orange-700 hover:text-orange-950 font-bold"
            >
              Đóng ✕
            </button>
          </div>
          <p className="text-xs text-orange-900 leading-relaxed">
            Đã đặt: <b>{selectedDay.occupied}</b> / {selectedDay.total} phòng (công suất {selectedDay.rate.toFixed(0)}%). 
            Còn trống: <b>{selectedDay.total - selectedDay.occupied}</b> phòng.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedDay.roomsDetail?.map((r) => (
              <span
                key={r.id}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                  r.isBooked
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                {r.id}: {r.isBooked ? 'Đã đặt' : 'Trống'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomHeatmap;
