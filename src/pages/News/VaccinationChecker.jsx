import React, { useState } from 'react';
import { Syringe, ShieldCheck, AlertCircle, Info, Calendar, HeartPulse } from 'lucide-react';
import { vaccinationScheduleData } from '../../mockData/newsData';

const ageOptions = [
  { id: 'under-2-months', label: '< 2 Tháng' },
  { id: '2-months', label: '2 Tháng Tuổi' },
  { id: '3-months', label: '3 Tháng Tuổi' },
  { id: '4-months', label: '4 Tháng Tuổi' },
  { id: 'adult', label: 'Mèo Trưởng Thành (> 1 Năm)' }
];

const VaccinationChecker = () => {
  const [selectedAge, setSelectedAge] = useState('2-months');
  const currentData = vaccinationScheduleData[selectedAge];

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <HeartPulse className="w-3.5 h-3.5" />
            Công cụ tra cứu thú y
          </div>
          <h3 className="text-2xl font-bold font-title text-text-dark flex items-center gap-2">
            <Syringe className="w-6 h-6 text-primary" />
            Tra Cứu Lịch Tiêm Phòng Cho Mèo
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Chọn độ tuổi hiện tại của bé mèo để nhận phác đồ tiêm vắc-xin và lưu ý chăm sóc chuẩn y khoa.
          </p>
        </div>

        {/* Badge tiêm chủng */}
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Chuẩn Hiệp hội Thú y WSAVA</span>
        </div>
      </div>

      {/* Selector Buttons */}
      <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-bg-cream rounded-2xl border border-gray-100">
        {ageOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelectedAge(option.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              selectedAge === option.id
                ? 'bg-primary text-white shadow-sm shadow-primary/20 scale-[1.02]'
                : 'text-gray-600 hover:text-primary hover:bg-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Schedule Details */}
      {currentData && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Giai đoạn</span>
            <span className="text-sm font-bold text-text-dark flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-accent" />
              {currentData.stage}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {currentData.vaccines.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-bg-cream border border-gray-100 flex flex-col justify-between hover:border-emerald-200 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-text-dark text-sm leading-snug">{item.name}</h4>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.status.includes('Bắt buộc')
                          ? 'bg-rose-100 text-rose-700'
                          : item.status.includes('Khuyến nghị')
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Lời khuyên bác sĩ */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 mt-4">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold text-amber-950 block mb-0.5">Lời khuyên từ Bác sĩ Thú y Mèo Vắng Nhà:</span>
              {currentData.vetAdvice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinationChecker;
