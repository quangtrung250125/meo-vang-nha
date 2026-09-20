// ==========================================
// TÍNH NĂNG: LIÊN HỆ NGAY & PROFILE DOANH NGHIỆP PETHOTEL
// Thực hiện bởi: Hà (Nhánh: Hà-ngu-)
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
  Building2, 
  MessageCircle, 
  Sparkles,
  Heart,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { packagesList } from '../../mockData/servicesData';

const Services = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const filteredPackages = packagesList.filter(pkg => {
    if (activeTab === 'Tất cả' || activeTab === 'Tt c') return true;
    if (activeTab === 'Lưu trú' || activeTab === 'Lu trA') return ['p1', 'p2', 'p3'].includes(pkg.id);
    if (activeTab === 'Spa - Tắm cắt' || activeTab === 'Spa - T_m c_t') return ['p4'].includes(pkg.id);
    return false;
  });

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-primary-light pt-12 pb-24 text-center rounded-b-[3rem]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-dark font-title mb-4">Dịch vụ của chúng tôi</h1>
          <p className="text-gray-600 text-lg">Đa dạng gói dịch vụ, phù hợp với từng nhu cầu của bé mèo.</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-12 relative z-10">
        
        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-2 bg-bg-cream p-2 rounded-full shadow-sm border border-gray-100">
            {['Tất cả', 'Lưu trú', 'Spa - Tắm cắt', 'Dịch vụ khác'].map((tab, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {filteredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {filteredPackages.map((service, idx) => (
              <div key={service.id || idx} className="bg-bg-cream rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow p-4 flex flex-col group">
                <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                   <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="px-2 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-text-dark mb-2">{service.name}</h3>
                  <p className="font-bold text-gray-800 mb-2">Từ {service.priceString}/ngày</p>
                  <p className="text-gray-400 text-sm mb-6 flex-1">{service.desc}</p>
                  <button 
                    onClick={() => navigate('/booking', { state: { preSelectedPackageId: service.id } })}
                    className="block w-full text-center bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-sm shadow-accent/30"
                  >
                    Đặt ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-bg-cream rounded-3xl border border-gray-100 mb-20">
            <PawPrint className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Hiện tại chưa có dịch vụ nào trong danh mục này.</p>
          </div>
        )}

        {/* Contact Banner */}
        <div className="bg-bg-beige rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between shadow-sm">
          <div className="text-center md:text-left mb-8 md:mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full text-xs font-semibold text-primary mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Hỗ trợ & Tư vấn miễn phí 24/7
            </div>
            <h3 className="text-3xl font-bold text-text-dark font-title mb-4">Bạn cần tư vấn thêm?</h3>
            <p className="text-gray-600 mb-8 max-w-md">Xem hồ sơ năng lực doanh nghiệp hoặc liên hệ trực tiếp để được đội ngũ chuyên gia hỗ trợ cho bé mèo.</p>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-3.5 rounded-full hover:bg-accent-hover transition-all duration-200 shadow-lg shadow-accent/30 cursor-pointer active:scale-95"
            >
              <Building2 className="w-5 h-5" />
              Liên hệ ngay
            </button>
          </div>
          <div className="hidden md:flex w-64 h-64 bg-white/50 rounded-full items-center justify-center">
            <PawPrint className="w-32 h-32 text-primary opacity-20" />
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
                    <div className="text-xs text-gray-500">Zalo Hỗ Trợ Trực Tuyến</div>
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
