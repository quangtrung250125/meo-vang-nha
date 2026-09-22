import React from 'react';
import { CalendarDays, Utensils, Droplets, Smile, HeartPulse, Sparkles } from 'lucide-react';
import { useCareLog } from '../contexts/CareLogContext';

const ICON_MAP = {
  Utensils, Droplets, Smile, HeartPulse
};

const CareLogTimeline = ({ bookingId, petId }) => {
  const { getGroupedLogs } = useCareLog();
  const careLogs = getGroupedLogs(bookingId, petId);

  if (!careLogs || careLogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-text-dark mb-5 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          Nhật ký chăm sóc
        </h3>
        <p className="text-gray-500 text-sm">Chưa có nhật ký nào được ghi nhận cho bé. Bạn hãy chờ nhân viên cập nhật nhé!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-bold text-text-dark mb-5 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        Nhật ký chăm sóc
      </h3>
      <div className="space-y-6">
        {careLogs.map((day, dayIdx) => (
          <div key={dayIdx}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{day.date}</p>
            <div className="border-l-2 border-gray-100 pl-4 space-y-4">
              {day.logs.map((log, logIdx) => {
                const Icon = typeof log.icon === 'string' ? ICON_MAP[log.icon] : (log.icon || Sparkles);
                const isWatch = log.status === 'watch';
                return (
                  <div key={logIdx} className="relative flex items-start gap-3">
                    <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-white ring-2 ring-gray-100 flex items-center justify-center mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${isWatch ? 'bg-amber-400' : 'bg-primary'}`} />
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <span className="text-xs font-bold text-gray-400 font-mono">{log.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          log.type === 'eating' ? 'bg-orange-50' :
                          log.type === 'hygiene' ? 'bg-blue-50' :
                          log.type === 'mood' ? 'bg-purple-50' : 'bg-red-50'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${
                            log.type === 'eating' ? 'text-orange-400' :
                            log.type === 'hygiene' ? 'text-blue-400' :
                            log.type === 'mood' ? 'text-purple-400' : 'text-red-400'
                          }`} />
                        </div>
                        <span className="text-sm font-semibold text-text-dark">{log.label}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isWatch
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-primary-light text-primary'
                        }`}>
                          {log.tag}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{log.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareLogTimeline;
