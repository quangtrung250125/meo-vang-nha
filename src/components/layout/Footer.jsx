import React from 'react';
import { MapPin, Clock, Phone, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const ADDRESS = 'Số 14 ngõ Hàng Bột, Cát Linh, Đống Đa, Hanoi, Vietnam, 11500';
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`;

const Footer = () => {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_1fr_1.4fr] gap-8 lg:gap-10 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-3">
                <img src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" alt="Mèo Vắng Nhà" className="footer-logo" />
              </div>
              <p className="text-sm text-amber-200/70 leading-relaxed max-w-xs">
                Hệ thống lưu trú, spa và chăm sóc mèo chuyên nghiệp tiêu chuẩn 5 sao tại Hà Nội.
              </p>
            </div>
            <div>
              <h4 className="text-amber-400 font-bold mb-3 uppercase tracking-wider text-xs">Liên kết nhanh</h4>
              <ul className="space-y-2 text-amber-200/80 text-sm">
                <li><Link to="/" className="hover:text-amber-400 transition-colors">Trang chủ</Link></li>
                <li><Link to="/services" className="hover:text-amber-400 transition-colors">Dịch vụ</Link></li>
                <li><Link to="/pricing" className="hover:text-amber-400 transition-colors">Bảng giá</Link></li>
                <li><Link to="/promotions" className="hover:text-amber-400 transition-colors">Khuyến mãi 🔥</Link></li>
                <li><Link to="/news" className="hover:text-amber-400 transition-colors">Tin tức & Cẩm nang</Link></li>
                <li><Link to="/booking" className="hover:text-amber-400 transition-colors">Đặt phòng</Link></li>
                <li><Link to="/tracking" className="hover:text-amber-400 transition-colors">Theo dõi lưu trú</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-amber-400 font-bold mb-3 uppercase tracking-wider text-xs">Hỗ trợ & kết nối</h4>
              <ul className="space-y-2 text-amber-200/80 text-sm">
                <li>
                  <a href="tel:0904957555" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                    <Phone className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    090 495 75 55
                  </a>
                </li>
              </ul>
              <div className="flex items-center gap-4 mt-4">
                <a href="https://www.facebook.com/meovangnha.hotel/?_rdc=2&_rdr#" target="_blank" rel="noopener noreferrer" className="text-amber-200/60 hover:text-amber-400 transition-colors" title="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://www.tiktok.com/@meovangnha" target="_blank" rel="noopener noreferrer" className="text-amber-200/60 hover:text-amber-400 transition-colors" title="TikTok">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-amber-400 font-bold mb-3 uppercase tracking-wider text-xs">Địa chỉ</h4>
              <a
                href={MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-amber-200/80 text-sm leading-relaxed hover:text-amber-400 transition-colors mb-3"
              >
                <MapPin className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{ADDRESS}</span>
              </a>
              <div className="overflow-hidden rounded-xl border border-amber-800/40 bg-black/20 shadow-sm">
                <iframe
                  title="Bản đồ Mèo Vắng Nhà"
                  src={MAP_EMBED_URL}
                  className="h-28 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-amber-900/60 pt-6 flex flex-col sm:flex-row justify-between items-center text-amber-200/60 text-xs gap-3">
            <p>&copy; {new Date().getFullYear()} Mèo Vắng Nhà Hotel & Spa. Tất cả quyền được bảo lưu.</p>
            <p>Thiết kế cho những bé cưng hạnh phúc nhất 🐾</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
