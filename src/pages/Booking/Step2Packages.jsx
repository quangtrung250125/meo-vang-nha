import React, { useState } from 'react';
import { packagesList, promotionInfo } from '../../mockData/servicesData';
import { Flame, Check, Sparkles } from 'lucide-react';

const Step2Packages = ({ data, updateData, onNext, onPrev }) => {
  const [error, setError] = useState('');

  const handleNextClick = () => {
    if (!data.selectedPackage) {
      setError('Vui lòng chọn 1 gói dịch vụ để tiếp tục.');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h2 className="text-2xl font-bold text-text-dark font-title">2. Chọn gói dịch vụ</h2>
          <div className="inline-flex items-center gap-1.5 bg-orange-100/80 text-accent text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Ưu đãi giảm giá 10% đã kích hoạt</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          Chọn gói chăm sóc phù hợp nhất với nhu cầu của bé mèo.
        </p>
      </div>

      {/* Promo banner */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 border border-accent/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-black text-sm shrink-0">
          %
        </div>
        <div className="text-xs sm:text-sm text-gray-700">
          <span className="font-bold text-accent">Mã {promotionInfo.code}:</span> Toàn bộ gói dịch vụ đã được áp dụng chiết khấu 10% trực tiếp vào giá.
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packagesList.map((pkg) => {
          const isSelected = data.selectedPackage?.id === pkg.id;
          return (
            <div 
              key={pkg.id}
              onClick={() => {
                updateData({ selectedPackage: pkg });
                setError('');
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                isSelected 
                  ? 'border-primary bg-primary-light/40 shadow-md ring-2 ring-primary/20' 
                  : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-bg-cream'
              }`}
            >
              {/* Discount Tag */}
              {pkg.isPromo && (
                <div className="absolute -top-2.5 right-4 bg-accent text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <span>-10%</span>
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg text-text-dark">{pkg.name}</h3>
                  <div className="text-right">
                    <span className="font-black text-lg text-accent">{pkg.priceString}</span>
                    <span className="text-xs text-gray-500">{pkg.period}</span>
                  </div>
                </div>

                {pkg.originalPriceString && (
                  <div className="flex justify-between items-center text-xs mb-3">
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Tiết kiệm {pkg.savingsString}
                    </span>
                    <span className="text-gray-400 line-through">
                      {pkg.originalPriceString}
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-600 mb-4 leading-relaxed">{pkg.desc}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                {pkg.features?.slice(0, 3).map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 stroke-[2.5]" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <div className="pt-6 border-t border-gray-100 flex justify-between">
        <button 
          onClick={onPrev}
          className="bg-white border border-gray-200 text-gray-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Quay lại
        </button>
        <button 
          onClick={handleNextClick}
          disabled={!data.selectedPackage}
          className={`font-bold px-8 py-3 rounded-xl transition-all shadow-md ${
            data.selectedPackage 
              ? 'bg-primary text-white hover:bg-secondary shadow-primary/20' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
};

export default Step2Packages;
