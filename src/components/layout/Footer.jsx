import React from 'react';
import { PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-bg-beige pt-16 pb-6 mt-auto border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <PawPrint className="h-7 w-7 text-primary" />
              <h4 className="text-xl font-bold font-title text-text-dark">Mèo Vắng Nhà</h4>
            </div>
            <p className="text-gray-500 leading-relaxed max-w-sm">
              Hệ thống lưu trú và chăm sóc mèo chuyên nghiệp
            </p>
          </div>
          <div>
            <h4 className="text-text-dark font-bold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-3 text-gray-500 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Dịch vụ</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Bảng giá</Link></li>
              <li><Link to="/booking" className="hover:text-primary transition-colors">Đặt phòng</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Về chúng tôi</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-text-dark font-bold mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-3 text-gray-500 text-sm mb-6">
              <li><Link to="#" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Chính sách</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Liên hệ</Link></li>
              <li>
                <a href="tel:0904957555" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  090 495 75 55
                </a>
              </li>
            </ul>
            <h4 className="text-text-dark font-bold mb-4">Kết nối với chúng tôi</h4>
            <div className="flex flex-col gap-3">
              <a href="https://www.facebook.com/meovangnha.hotel/?_rdc=2&_rdr#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                Mèo Vắng Nhà
              </a>
              <a href="https://www.tiktok.com/@meovangnha?fbclid=IwY2xjawUN9lVwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMUhiZnIzSUlESmdvbEhyTFBzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEelTz9BtoSk3GeUiFWeY5aNZI0QFsRRHVAcDlCoQQJx89CAH8mmgR-XMXzlog_aem_O2YUs0Brx9g02i4BlRmBTA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z"/></svg>
                mèo vắng nhà
              </a>
            </div>
          </div>
        </div>
        
        <div className="bg-primary-light rounded-2xl py-4 px-6 flex justify-between items-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Mèo Vắng Nhà. All rights reserved.</p>
          <PawPrint className="h-5 w-5 text-primary opacity-50" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
