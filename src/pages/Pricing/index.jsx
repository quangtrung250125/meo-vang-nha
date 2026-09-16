import React, { useState } from 'react';
import { Check, ChevronDown, Flame, Percent, Sparkles, ArrowRight, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { packagesList, promotionInfo } from '../../mockData/servicesData';

const Pricing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [openFaq, setOpenFaq] = useState(null);

  const tabs = [
    { label: 'Tất cả', value: 'Tất cả' },
    { label: '🔥 Ưu đãi 10% lần 2', value: 'Ưu đãi 10%', isSpecial: true },
    { label: 'Lưu trú', value: 'Lưu trú' },
    { label: 'Spa - Tắm cắt', value: 'Spa - Tắm cắt' },
    { label: 'Dịch vụ khác', value: 'Dịch vụ khác' },
  ];

  const filteredPackages = packagesList.filter(pkg => {
    if (activeTab === 'Tất cả') return true;
    if (activeTab === 'Ưu đãi 10%') return pkg.isPromo;
    return pkg.category === activeTab;
  });

  const faqs = [
    {
      q: 'Chương trình ưu đãi giảm giá 10% lần 2 áp dụng như thế nào?',
      a: 'Chương trình giảm 10% tri ân được áp dụng tự động cho toàn bộ dịch vụ lưu trú, spa và tiện ích ngay từ lần thứ 2 bạn đặt dịch vụ tại Mèo Vắng Nhà (hoặc khi áp dụng mã THANTHIET10).'
    },
    {
      q: 'Làm thế nào để kiểm tra mình đã được giảm 10% lần 2 chưa?',
      a: 'Hệ thống tự động ghi nhận số lần đặt của bạn qua lịch sử booking. Khi vào trang dịch vụ hoặc bước thanh toán, giá giảm 10% sẽ được khấu trừ trực tiếp.'
    },
    {
      q: 'Có cần đặt cọc trước khi đưa bé đến không?',
      a: 'Để giữ phòng và giữ nguyên mức giá ưu đãi 10%, bạn chỉ cần đặt trước một khoản cọc nhỏ qua hệ thống trực tuyến.'
    },
    {
      q: 'Thời gian nhận và trả bé mèo như thế nào?',
      a: 'Khách sạn hoạt động từ 7:30 đến 21:00 hàng ngày. Bạn có thể linh hoạt đưa đón bé trong khung giờ này.'
    },
    {
      q: 'Khách sạn có hỗ trợ chăm sóc mèo có chế độ ăn/uống thuốc đặc biệt không?',
      a: 'Có, các bé mèo cần uống thuốc, có khẩu phần kiêng hoặc cần chăm sóc y tế đều được đội ngũ chuyên viên theo dõi và phục vụ tận tâm.'
    }
  ];

  return (
    <div className="w-full bg-[#FAF8F5]/60 min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-primary-light via-primary-light/60 to-transparent pt-12 pb-20 text-center relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-primary/20 text-primary font-bold text-xs uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            Bảng giá minh bạch - Tri ân khách hàng
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-dark font-title mb-4">
            Bảng Giá Dịch Vụ
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Đang áp dụng ưu đãi <strong className="text-accent">giảm ngay 10%</strong> cho khách hàng sử dụng dịch vụ từ lần thứ 2 trở đi.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 -mt-10 relative z-10">
        
        {/* Banner Alert 10% Off */}
        <div className="mb-10 bg-gradient-to-r from-emerald-50 via-white to-orange-50 border border-primary/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-dark">
                Mức giá ưu đãi (đã giảm 10%) áp dụng tự động cho lần sử dụng dịch vụ thứ 2.
              </p>
              <p className="text-xs text-gray-500">
                Mã tri ân: <span className="font-bold text-accent">{promotionInfo.code}</span> — Kích hoạt ngay khi đặt lịch trực tuyến.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/booking')}
            className="shrink-0 bg-primary hover:bg-secondary text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Đặt lịch ngay
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center sm:justify-start mb-10 overflow-x-auto pb-2 scrollbar-none">
          <div className="inline-flex space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-200/80">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.value;
              return (
                <button 
                  key={tab.value} 
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-5 sm:px-7 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
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

        {/* Pricing Cards Grid */}
        {filteredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {filteredPackages.map((plan, idx) => (
              <div 
                key={plan.id || idx} 
                className={`bg-white border-2 ${plan.isBestChoice ? 'border-accent shadow-lg ring-2 ring-accent/20' : 'border-gray-200/80'} rounded-3xl p-6 flex flex-col shadow-sm hover:shadow-xl transition-all relative group`}
              >
                {/* 10% Discount Badge */}
                {plan.isPromo && (
                  <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-accent to-[#FF7B47] text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>LẦN 2: GIẢM 10%</span>
                  </div>
                )}

                {plan.isBestChoice && (
                  <div className="absolute -top-3.5 right-6 bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                    KHUYÊN DÙNG
                  </div>
                )}

                <div className="border-b border-gray-100 pb-6 mb-6 mt-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {plan.category}
                  </span>
                  <h3 className="text-2xl font-bold text-text-dark mb-3 font-title">{plan.name}</h3>
                  
                  {/* Price info */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-accent">{plan.priceString}</span>
                    <span className="text-gray-500 text-sm font-medium">{plan.period}</span>
                    
                    {plan.originalPriceString && (
                      <span className="text-sm text-gray-400 line-through ml-auto font-medium">
                        {plan.originalPriceString}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-100">
                    <span>Tiết kiệm: {plan.savingsString} ở lần 2</span>
                  </div>

                  <p className="text-gray-500 text-xs mt-3 leading-relaxed">
                    {plan.desc}
                  </p>
                </div>
                
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => navigate('/booking', { state: { preSelectedPackageId: plan.id } })}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-2xl transition-all shadow-md mt-auto active:scale-98 cursor-pointer ${
                    plan.isBestChoice 
                      ? 'bg-accent hover:bg-accent-hover text-white shadow-accent/25 hover:shadow-accent/40' 
                      : 'bg-primary hover:bg-secondary text-white shadow-primary/20 hover:shadow-primary/30'
                  }`}
                >
                  <span>Đặt ngay với giá ưu đãi lần 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 mb-20">
            <p className="text-gray-500 font-medium">Hiện tại chưa có gói dịch vụ nào trong danh mục này.</p>
          </div>
        )}

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-text-dark font-title mb-2">Câu hỏi thường gặp</h2>
            <p className="text-gray-500 text-sm">Giải đáp mọi thắc mắc về dịch vụ và chương trình ưu đãi giảm 10% khi đặt từ lần 2.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className={`border rounded-2xl bg-white transition-all overflow-hidden ${isOpen ? 'border-primary shadow-sm' : 'border-gray-200/80 hover:border-gray-300'}`}
                >
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex justify-between items-center gap-4 focus:outline-none cursor-pointer"
                  >
                    <h4 className="font-bold text-text-dark text-base">{faq.q}</h4>
                    <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </section>
    </div>
  );
};

export default Pricing;
