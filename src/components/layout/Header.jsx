import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User, Menu } from 'lucide-react';
import { PawPrint } from 'lucide-react';
import AuthModal from '../AuthModal';

const Header = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-medium';

  return (
    <>
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center gap-2">
            <PawPrint className="h-7 w-7 text-primary" />
            <Link to="/" className="text-xl font-extrabold font-title text-text-dark tracking-tight">Mèo Vắng Nhà</Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className={`text-sm tracking-wide ${isActive('/')}`}>Trang chủ</Link>
            <Link to="/services" className={`text-sm tracking-wide ${isActive('/services')}`}>Dịch vụ</Link>
            <Link to="/pricing" className={`text-sm tracking-wide ${isActive('/pricing')}`}>Bảng giá</Link>
            <Link to="/pet-profile" className={`text-sm tracking-wide ${isActive('/pet-profile')}`}>Hồ sơ mèo</Link>
            <Link to="/booking" className={`text-sm tracking-wide ${isActive('/booking')}`}>Đặt phòng</Link>
          </nav>
          <div className="hidden md:flex items-center gap-4 text-gray-500">
            <button className="hover:text-primary transition-colors p-1" title="Tìm kiếm"><Search className="h-5 w-5" /></button>
            <button className="hover:text-primary transition-colors p-1" title="Thông báo"><Bell className="h-5 w-5" /></button>
            <button 
              onClick={() => setIsAuthModalOpen(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-orange-300"
            >
              <User className="h-4 w-4" />
              <span>Tài khoản / Đăng ký</span>
            </button>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={() => setIsAuthModalOpen(true)} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90"
            >
              <User className="h-4 w-4" />
              <span>Đăng ký</span>
            </button>
            <button className="text-text-dark hover:text-primary p-2">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Header;
