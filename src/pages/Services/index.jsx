// ==========================================
// TÍNH NĂNG: LIÊN HỆ NGAY & PROFILE DOANH NGHIỆP PETHOTEL + ƯU ĐÃI GIẢM GIÁ 10%
// ==========================================

import React, { useState } from 'react';
import { 
  PawPrint, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Award, 
  X, 
  CheckCircle, 
  CheckCircle2,
  Building2, 
  MessageCircle, 
  Sparkles,
  Heart,
  Globe,
  Tag,
  Check,
  Copy,
  Flame,
  ArrowRight,
  HeartHandshake,
  Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { packagesList, promotionInfo } from '../../mockData/servicesData';

const Services = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [copied, setCopied] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-accent/20 active:scale-95 cursor-pointer"
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
                    className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/35 active:scale-[0.98] cursor-pointer"
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

        {/* Contact Banner & Business Profile Action */}
        <div className="bg-bg-beige rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between shadow-sm border border-gray-200/60">
          <div className="text-center md:text-left mb-8 md:mb-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/80 rounded-full text-xs font-semibold text-primary mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Hỗ trợ & Tư vấn miễn phí 24/7
            </div>
            <h3 className="text-3xl font-bold text-text-dark font-title mb-4">Bạn cần tư vấn dịch vụ phù hợp?</h3>
            <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
              Xem hồ sơ năng lực doanh nghiệp hoặc liên hệ trực tiếp để được đội ngũ chuyên gia hỗ trợ và giữ ưu đãi 10% cho bé mèo.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-3.5 rounded-full hover:bg-accent-hover transition-all duration-200 shadow-lg shadow-accent/30 cursor-pointer active:scale-95"
              >
                <Building2 className="w-5 h-5" />
                Liên hệ ngay (Hồ sơ)
              </button>
              <button 
                onClick={() => navigate('/booking')}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold px-6 py-3.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                Đặt lịch giữ ưu đãi 10%
              </button>
            </div>
          </div>
          <div className="hidden md:flex w-56 h-56 bg-white/60 rounded-full items-center justify-center border-4 border-white/80 shadow-inner">
            <PawPrint className="w-28 h-28 text-primary opacity-25" />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODAL: PROFILE DOANH NGHIỆP PETHOTEL (BẢN DEMO)        */}
      {/* ======================================================== */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsProfileOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-br from-primary to-secondary text-white p-6 md:p-8 rounded-t-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
                <PawPrint className="w-48 h-48 text-white" />
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>PROFILE DOANH NGHIỆP (BẢN DEMO)</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md flex-shrink-0">
                  <PawPrint className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold font-title text-white">MÈO VẮNG NHÀ - PETHOTEL</h2>
                  <p className="text-white/90 text-sm mt-0.5">Khách sạn & Dịch vụ Chăm sóc Mèo Cưng Chuẩn 5 Sao</p>
                </div>
              </div>
            </div>

            {/* Body Modal */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Giới thiệu ngắn */}
              <div className="bg-bg-cream rounded-2xl p-4 border border-gray-100">
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong className="text-primary font-semibold">PetHotel Mèo Vắng Nhà</strong> là thương hiệu tiên phong cung cấp hệ sinh thái lưu trú, spa nghỉ dưỡng và theo dõi camera 24/7 độc quyền cho mèo cưng. Chúng tôi mang đến sự an tâm tuyệt đối cho ba mẹ khi bận rộn hoặc đi công tác xa.
                </p>
              </div>

              {/* Thông số ấn tượng */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-primary-light/50 p-3 rounded-2xl border border-primary/20">
                  <div className="text-2xl font-black text-primary">5+</div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Năm kinh nghiệm</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200">
                  <div className="text-2xl font-black text-accent">12.000+</div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Bé mèo đã chăm sóc</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <div className="text-2xl font-black text-secondary">99.8%</div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Phụ huynh hài lòng</div>
                </div>
              </div>

              {/* Chi tiết pháp lý & Doanh nghiệp */}
              <div className="border border-gray-100 rounded-2xl p-5 space-y-3.5 bg-white shadow-sm">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Thông tin pháp nhân
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Tên doanh nghiệp:</span>
                    <span className="font-semibold text-text-dark">Công Ty TNHH Dịch Vụ Thú Cưng Mèo Vắng Nhà</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Mã số thuế / GPKD:</span>
                    <span className="font-semibold text-text-dark">0317892345 (Sở KH&ĐT TP.HCM)</span>
                  </div>
                </div>
              </div>

              {/* Hệ thống chi nhánh & Hotline */}
              <div className="border border-gray-100 rounded-2xl p-5 space-y-3.5 bg-white shadow-sm">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Địa chỉ & Trụ sở
                </h4>
                
                <div className="space-y-2.5 text-sm text-gray-700">
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-xs rounded mt-0.5 flex-shrink-0">CN1 - Trụ sở chính</span>
                    <span>123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 bg-accent/10 text-accent font-bold text-xs rounded mt-0.5 flex-shrink-0">CN2 - Hà Nội</span>
                    <span>456 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, TP. Hà Nội</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-bold text-xs rounded mt-0.5 flex-shrink-0">CN3 - Đà Nẵng</span>
                    <span>78 Đường Trần Phú, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng</span>
                  </div>
                </div>
              </div>

              {/* Kênh liên hệ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Hotline Tư Vấn 24/7</div>
                    <a href="tel:1900888666" className="font-bold text-primary hover:underline text-base">1900 888 666</a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Zalo Hỗ Trực Tuyến</div>
                    <div className="font-bold text-text-dark text-base">0988.123.456</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Hòm Thư Điện Tử</div>
                    <div className="font-semibold text-text-dark text-sm">hotro@meovangnha.vn</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Giờ Mở Cửa Đón Boss</div>
                    <div className="font-semibold text-text-dark text-sm">07:30 - 21:00 (Hàng ngày)</div>
                  </div>
                </div>
              </div>

              {/* Cam kết chất lượng 5 sao */}
              <div className="bg-primary-light/40 rounded-2xl p-4 border border-primary/20 space-y-2">
                <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Cam kết chất lượng từ Mèo Vắng Nhà
                </div>
                <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                  <li>Trang bị Camera Full HD 24/7 kết nối trực tiếp đến điện thoại ba mẹ.</li>
                  <li>Bác sĩ thú y trực tiếp thăm khám sức khỏe tổng quát khi nhận và trả mèo.</li>
                  <li>Phòng máy lạnh 24/24, hệ thống khử mùi UV và máy lọc khí chuyên dụng.</li>
                  <li>100% thức ăn nhập khẩu cao cấp (Royal Canin, Ciao Churu, Pate tươi).</li>
                </ul>
              </div>
            </div>

            {/* Footer Modal Action Buttons */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex flex-col sm:flex-row gap-3 items-center justify-between">
              <span className="text-xs text-gray-400 italic">
                * Đây là profile mẫu demo của doanh nghiệp PetHotel
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors text-sm cursor-pointer"
                >
                  Đóng
                </button>
                <a
                  href="tel:1900888666"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-secondary transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                  Gọi 1900 888 666
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
