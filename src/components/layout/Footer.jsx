import React from 'react';
import { MapPin, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';

const ADDRESS = 'Số 14 ngõ Hàng Bột, Cát Linh, Đống Đa, Hanoi, Vietnam, 11500';
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`;

const Footer = () => {
  return (
    <footer className="bg-bg-beige pt-16 pb-6 mt-auto border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_1fr_1.4fr] gap-8 lg:gap-10 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-3">
              <img src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" alt="Mèo Vắng Nhà" className="footer-logo" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">Hệ thống lưu trú và chăm sóc mèo chuyên nghiệp.</p>
          </div>
          <div>
            <h4 className="text-text-dark font-bold mb-3">Liên kết nhanh</h4>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Dịch vụ</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Bảng giá</Link></li>
              <li><Link to="/booking" className="hover:text-primary transition-colors">Đặt phòng</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-text-dark font-bold mb-3">Hỗ trợ & kết nối</h4>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li><Link to="#" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Chính sách</Link></li>
              <li>
                <a href="tel:0904957555" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  090 495 75 55
                </a>
              </li>
            </ul>
            <div className="flex items-center gap-4 mt-3">
              <a href="https://www.facebook.com/meovangnha.hotel/?_rdc=2&_rdr#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@meovangnha?fbclid=IwY2xjawUN9lVwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMUhiZnIzSUlESmdvbEhyTFBzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEelTz9BtoSk3GeUiFWeY5aNZI0QFsRRHVAcDlCoQQJx89CAH8mmgR-XMXzlog_aem_O2YUs0Brx9g02i4BlRmBTA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-text-dark font-bold mb-3">Địa chỉ</h4>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-gray-500 text-sm leading-relaxed hover:text-primary transition-colors"
            >
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span>{ADDRESS}</span>
            </a>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <iframe
                title="Bản đồ Mèo Vắng Nhà"
                src={MAP_EMBED_URL}
                className="h-32 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="bg-primary-light rounded-2xl py-4 px-6 flex justify-between items-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Mèo Vắng Nhà. All rights reserved.</p>
          <img src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" alt="Mèo Vắng Nhà" className="footer-mark" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
