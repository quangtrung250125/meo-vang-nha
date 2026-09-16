import React, { useState } from 'react';
import { PawPrint, Tag, Sparkles, Check, Copy, CheckCircle2, Flame, ArrowRight, ShieldCheck, HeartHandshake, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { packagesList, promotionInfo } from '../../mockData/servicesData';

const Services = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(promotionInfo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const tabs = [
    { label: 'Tất cả', value: 'Tất cả' },
    { label: '🔥 Ưu đãi 10%', value: 'Ưu đãi 10%', isSpecial: true },
    { label: 'Lưu trú', value: 'Lưu trú' },
    { label: 'Spa - Tắm cắt', value: 'Spa - Tắm cắt' },
    { label: 'Dịch vụ khác', value: 'Dịch vụ khác' },
  ];

  const filteredPackages = packagesList.filter(pkg => {
    if (activeTab === 'Tất cả') return true;
    if (activeTab === 'Ưu đãi 10%') return pkg.isPromo;
    return pkg.category === activeTab;
  });

  return (
    <div className="w-full bg-[#FAF8F5]/60 min-h-screen">
      {/* Header with Title & Intro */}
      <section className="bg-gradient-to-b from-primary-light via-primary-light/60 to-transparent pt-12 pb-20 text-center relative overflow-hidden">
        <div className="absolute top-6 left-10 text-primary/10 -rotate-12 pointer-events-none">
          <PawPrint size={120} />
        </div>
        <div className="absolute bottom-4 right-10 text-primary/10 rotate-12 pointer-events-none">
          <PawPrint size={140} />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-primary/20 text-primary font-bold text-xs uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            Dịch vụ chăm sóc mèo chuẩn 5 sao
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-dark font-title mb-4 tracking-tight">
            Danh Mục Dịch Vụ
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Tận tâm từng khoảnh khắc — Đa dạng gói dịch vụ từ lưu trú, spa tắm tỉa đến chăm sóc đặc biệt cho bé mèo của bạn.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 -mt-10 relative z-10">
        
        {/* Special 10% Discount Promotion Banner */}
        <div className="mb-10 bg-gradient-to-r from-[#FFF4E5] via-[#FFF9F0] to-[#E8F8F0] border-2 border-accent/30 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-accent/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4 text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-accent to-[#FF7B47] text-white flex flex-col items-center justify-center shrink-0 shadow-lg shadow-accent/30">
                <Percent className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                <span className="text-xs sm:text-sm font-extrabold tracking-tight">10% OFF</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-accent text-white font-bold text-xs px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    Ưu đãi giới hạn
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                    {promotionInfo.expiryDate}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-dark font-title">
                  {promotionInfo.title}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  {promotionInfo.subtitle}
                </p>
              </div>
            </div>

            {/* Voucher Code Box */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 bg-white/90 backdrop-blur p-2.5 sm:p-3 rounded-2xl border border-orange-200/80 shadow-sm">
              <div className="text-center sm:text-left px-3">
                <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">Mã khuyến mãi</span>
                <span className="font-mono text-lg font-black text-accent tracking-widest">{promotionInfo.code}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-accent/20 active:scale-95"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép mã</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-10 overflow-x-auto pb-2 scrollbar-none">
          <div className="inline-flex space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-200/80">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.value;
              return (
                <button 
                  key={tab.value} 
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-5 sm:px-7 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSelected 
                      ? tab.isSpecial 
                        ? 'bg-gradient-to-r from-accent to-[#FF7B47] text-white shadow-md shadow-accent/30 scale-105' 
                        : 'bg-primary text-white shadow-md shadow-primary/25 scale-105'
                      : tab.isSpecial 
                        ? 'text-accent hover:bg-orange-50 font-bold border border-dashed border-accent/40' 
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Services Grid */}
        {filteredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {filteredPackages.map((service, idx) => (
              <div 
                key={service.id || idx} 
                className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative"
              >
                {/* 10% Discount Floating Badge */}
                {service.isPromo && (
                  <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-accent to-[#FF7B47] text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                    <span>ƯU ĐÃI GIẢM 10%</span>
                  </div>
                )}

                {/* Category Pill */}
                <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur text-gray-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  {service.category}
                </div>

                {/* Service Image */}
                <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                   <img 
                    src={service.image} 
                    alt={service.name} 
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out" 
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
                   
                   {/* Saving Tag Bottom-Right of Image */}
                  {service.isPromo && (
                    <div className="absolute bottom-3 right-3 bg-emerald-600/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm shadow">
                      Tiết kiệm {service.savingsString}
                    </div>
                  )}
                </div>

                {/* Service Content */}
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-text-dark mb-2 font-title group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    
                    {/* Pricing Section with 10% Discount Display */}
                    <div className="bg-bg-cream rounded-2xl p-3.5 mb-4 border border-orange-100/70">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-accent font-title">
                          {service.priceString}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">
                          {service.period}
                        </span>
                        
                        {/* Original Strikethrough Price */}
                        {service.originalPriceString && (
                          <span className="text-sm text-gray-400 line-through font-medium ml-auto">
                            {service.originalPriceString}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-emerald-600 font-semibold">
                        <span>✓ Đã áp dụng giảm 10%</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200/50">
                          -10%
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">
                      {service.desc}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2.5 mb-6 pt-2 border-t border-gray-100">
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Tiện ích đi kèm:</p>
                      {service.features?.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-primary shrink-0 stroke-[2.5]" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={() => navigate('/booking', { state: { preSelectedPackageId: service.id } })}
                    className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/35 active:scale-[0.98]"
                  >
                    <span>Đặt phòng với ưu đãi 10%</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mb-20">
            <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600">Chưa có dịch vụ nào trong danh mục này</h3>
            <p className="text-gray-400 text-sm mt-1">Vui lòng chọn danh mục khác để xem thêm dịch vụ.</p>
          </div>
        )}

        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-text-dark">Cam kết giá minh bạch</h4>
              <p className="text-xs text-gray-500 mt-0.5">Không phát sinh phụ phí ẩn, ưu đãi 10% áp dụng trực tiếp.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-accent flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-text-dark">Chăm sóc chuẩn y khoa</h4>
              <p className="text-xs text-gray-500 mt-0.5">Đội ngũ kỹ thuật viên giàu kinh nghiệm, camera 24/7.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-text-dark">Tích điểm đổi quà</h4>
              <p className="text-xs text-gray-500 mt-0.5">Nhận thêm quà tặng và ưu đãi cho lần gửi tiếp theo.</p>
            </div>
          </div>
        </div>

        {/* Contact Banner */}
        <div className="bg-gradient-to-r from-bg-beige to-[#EDE8DE] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between border border-gray-200/60 shadow-sm">
          <div className="text-center md:text-left mb-8 md:mb-0">
            <div className="inline-block bg-accent/20 text-accent font-bold text-xs px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              Tư vấn 24/7
            </div>
            <h3 className="text-3xl font-bold text-text-dark font-title mb-4">Bạn cần tư vấn dịch vụ phù hợp?</h3>
            <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
              Hãy để lại thông tin hoặc liên hệ hotline để nhận tư vấn miễn phí và giữ mã giảm giá 10% cho bé.
            </p>
            <button 
              onClick={() => navigate('/booking')}
              className="bg-accent text-white font-bold px-8 py-4 rounded-2xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/30 active:scale-95"
            >
              Đặt lịch giữ ưu đãi ngay
            </button>
          </div>
          <div className="hidden md:flex w-56 h-56 bg-white/60 rounded-full items-center justify-center border-4 border-white/80 shadow-inner">
            <PawPrint className="w-28 h-28 text-primary opacity-25" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
