import React from 'react';
import { PawPrint, Globe, Camera, MessageCircle } from 'lucide-react';
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
              <li><span className="flex items-center gap-2"><span className="text-primary font-medium">Hotline:</span> 0123 456 789</span></li>
              <li><span className="flex items-center gap-2"><span className="text-primary font-medium">Zalo:</span> 0123 456 789</span></li>
            </ul>
            <h4 className="text-text-dark font-bold mb-4">Kết nối với chúng tôi</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Globe className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Camera className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><MessageCircle className="h-5 w-5" /></a>
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
