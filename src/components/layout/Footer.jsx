import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Clock, Phone, Mail, MapPin, ChevronRight, Navigation } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

const Footer = () => {
  const { openPolicy } = useUI();

  return (
    <>
      <div className="bg-[#cf750c] text-white text-sm py-3 px-4 font-medium border-t border-amber-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Clock className="w-5 h-5 text-amber-200 shrink-0" />
            <span>
              Giờ mở cửa: <strong className="underline decoration-amber-300 text-base">08:30 - 19:30</strong> <span className="hidden sm:inline">(Nhận/trả ngoài giờ: <i className="text-amber-100">Cần liên hệ trước</i>)</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-amber-100 italic text-sm font-normal">
            Hân hạnh phục vụ các bé và gia đình!
          </div>
        </div>
      </div>
      <footer id="footer" className="bg-[#2d1a0e] text-amber-100/90 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-amber-900/60">
          
          {/* COL 1: STORE INFO & OPERATING HOURS */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#e88914] rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md">
                <PawPrint className="w-6 h-6 fill-current" />
              </div>
              <span className="text-xl font-black text-white font-title tracking-tight uppercase">MÈO VẮNG NHÀ</span>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed max-w-xs">
              Nơi cung cấp dịch vụ khách sạn nghỉ dưỡng & chăm sóc làm đẹp chuẩn 5 sao dành riêng cho cún miêu cưng.
            </p>
            
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white">Thời gian hoạt động:</p>
                  <p className="text-amber-200">08:30 - 19:30 hàng ngày</p>
                  <div className="mt-2 px-3 py-1.5 bg-[#422513] border border-amber-700/50 text-amber-200 rounded-lg text-[11px] leading-snug">
                    <i className="fa-solid fa-bell mr-1 text-amber-400"></i> Có nhận đón/trả ngoài giờ <i>(Cần liên hệ trước)</i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COL 2: CHÍNH SÁCH & QUY ĐỊNH */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 border-l-4 border-[#e88914] pl-3">
              Chính Sách & Quy Định
            </h3>
            <ul className="space-y-3 text-xs">
              <li>
                <button 
                  onClick={() => openPolicy('points')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-2 text-amber-100 text-left cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Chính sách đổi điểm thưởng</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => openPolicy('membership')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-2 text-amber-100 text-left cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Chương trình thành viên (theo chi tiêu)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => openPolicy('privacy')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-2 text-amber-100 text-left cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Chính sách bảo mật thông tin</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => openPolicy('terms')}
                  className="hover:text-amber-300 transition-colors flex items-center gap-2 text-amber-100 text-left cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Điều khoản sử dụng dịch vụ</span>
                </button>
              </li>
            </ul>
          </div>

          {/* COL 3: ĐỊA CHỈ & LIÊN HỆ */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 border-l-4 border-[#e88914] pl-3">
              Địa Chỉ & Liên Hệ
            </h3>
            <ul className="space-y-3.5 text-xs text-amber-100">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span className="leading-relaxed">123 Đường Mèo Vàng, Phường Khương Trung, Quận Thanh Xuân, Hà Nội</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="tel:0987654321" className="hover:text-white font-bold text-amber-300">
                  0987.654.321 (Hotline/Zalo)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>meovangnha.pet@gmail.com</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a 
                href="https://www.facebook.com/meovangnha.hotel/?_rdc=2&_rdr#" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-[#422513] hover:bg-[#e88914] text-amber-200 hover:text-white flex items-center justify-center transition-colors"
                title="Facebook"
              >
                <i className="fa-brands fa-facebook-f text-sm"></i>
              </a>
              <a 
                href="https://www.tiktok.com/@meovangnha" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-[#422513] hover:bg-[#e88914] text-amber-200 hover:text-white flex items-center justify-center transition-colors"
                title="TikTok"
              >
                <i className="fa-brands fa-tiktok text-sm"></i>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-[#422513] hover:bg-[#e88914] text-amber-200 hover:text-white flex items-center justify-center transition-colors"
                title="Instagram"
              >
                <i className="fa-brands fa-instagram text-sm"></i>
              </a>
            </div>
          </div>

          {/* COL 4: GOOGLE MAPS EMBED */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 border-l-4 border-[#e88914] pl-3">
              Bản Đồ Chỉ Đường
            </h3>
            <div className="rounded-2xl overflow-hidden border border-amber-900 shadow-md h-36 bg-[#1a0e07] relative">
              <iframe 
                title="Google Maps Location Mèo Vắng Nhà"
                className="w-full h-full border-0 grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.6963473111815!2d105.8150000!3d21.0040000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDAwJzE0LjQiTiAxMDXCsDQ4JzU0LjAiRQ!5e0!3m2!1svi!2s!4v1620000000000!5m2!1svi!2s" 
                allowFullScreen="" 
                loading="lazy"
              />
            </div>
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-amber-400 hover:text-amber-300 hover:underline font-medium"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Mở ứng dụng Google Maps chỉ đường</span>
            </a>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-6 text-center text-xs text-amber-300/60">
          <p>© 2026 Mèo Vắng Nhà Pet Hotel & Care. Bản quyền thuộc về Mèo Vắng Nhà. Tối ưu hóa trên mọi thiết bị.</p>
        </div>
      </div>
      </footer>
    </>
  );
};

export default Footer;
