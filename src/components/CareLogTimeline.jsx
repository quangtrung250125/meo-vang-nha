import React, { useState } from 'react';
import { CalendarDays, Utensils, Droplets, Smile, HeartPulse, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { useCareLog } from '../contexts/CareLogContext';

const ICON_MAP = {
  Utensils, Droplets, Smile, HeartPulse
};

const CareLogTimeline = ({ bookingId, petId }) => {
  const { getGroupedLogs } = useCareLog();
  const [filterType, setFilterType] = useState('all'); // 'all', 'eating', 'mood', 'hygiene', 'health'
  
  const careLogs = getGroupedLogs(bookingId, petId);

  // Lọc theo loại hoạt động nếu có chọn
  const filteredGroups = careLogs.map(group => {
    if (filterType === 'all') return group;
    const matchingLogs = group.logs.filter(l => l.type === filterType);
    return {
      ...group,
      logs: matchingLogs
    };
  }).filter(group => group.logs.length > 0);

  if (!careLogs || careLogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-text-dark flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Nhật ký chăm sóc
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-light text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Đồng bộ trực tiếp
          </span>
        </div>
        <div className="text-center py-8 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
          <p className="text-2xl mb-2">🐾</p>
          <p className="font-semibold text-gray-700 text-sm mb-1">Chưa có nhật ký nào cho bé hôm nay</p>
          <p className="text-gray-500 text-xs max-w-sm mx-auto">
            Nhân viên chăm sóc sẽ cập nhật tình hình sau mỗi bữa ăn, giờ vận động và vệ sinh của bé!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-text-dark flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Nhật ký chăm sóc lưu trú
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Được cập nhật trực tiếp bởi nhân viên chăm sóc</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Đang kết nối Realtime
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filterType === 'all' 
              ? 'bg-primary text-white shadow-sm shadow-primary/25' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilterType('eating')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
            filterType === 'eating' 
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25' 
              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" /> Bữa ăn
        </button>
        <button
          onClick={() => setFilterType('mood')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
            filterType === 'mood' 
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/25' 
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          <Smile className="w-3.5 h-3.5" /> Vui chơi
        </button>
        <button
          onClick={() => setFilterType('hygiene')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
            filterType === 'hygiene' 
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25' 
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" /> Vệ sinh
        </button>
        <button
          onClick={() => setFilterType('health')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
            filterType === 'health' 
              ? 'bg-red-500 text-white shadow-sm shadow-red-500/25' 
              : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" /> Sức khỏe
        </button>
      </div>

      {/* Timeline List */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-xs bg-gray-50 rounded-xl">
          Không có nhật ký nào thuộc danh mục này.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((day, dayIdx) => (
            <div key={dayIdx}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{day.date}</p>
              <div className="border-l-2 border-gray-100 pl-4 space-y-4">
                {day.logs.map((log, logIdx) => {
                  const Icon = typeof log.icon === 'string' ? ICON_MAP[log.icon] : (log.icon || Sparkles);
                  const isWatch = log.status === 'watch';
                  const isLatest = dayIdx === 0 && logIdx === 0;

                  return (
                    <div key={log.id || logIdx} className="relative flex items-start gap-3 group">
                      <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-white ring-2 ring-gray-100 flex items-center justify-center mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${isWatch ? 'bg-amber-400' : 'bg-primary'}`} />
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <span className="text-xs font-bold text-gray-400 font-mono">{log.time}</span>
                      </div>
                      <div className="flex-1 min-w-0 bg-gray-50/70 hover:bg-gray-50 p-3 rounded-xl transition-colors border border-gray-100/70">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            log.type === 'eating' ? 'bg-orange-100' :
                            log.type === 'hygiene' ? 'bg-blue-100' :
                            log.type === 'mood' ? 'bg-purple-100' : 'bg-red-100'
                          }`}>
                            <Icon className={`w-3.5 h-3.5 ${
                              log.type === 'eating' ? 'text-orange-600' :
                              log.type === 'hygiene' ? 'text-blue-600' :
                              log.type === 'mood' ? 'text-purple-600' : 'text-red-600'
                            }`} />
                          </div>
                          <span className="text-sm font-bold text-text-dark">{log.label}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isWatch
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-primary-light text-primary'
                          }`}>
                            {log.tag}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] font-extrabold uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md tracking-wider">
                              Mới nhất
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{log.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareLogTimeline;

