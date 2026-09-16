import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User, Menu } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-medium';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
            <img 
              src="/images/logo.png" 
              alt="Mèo Vắng Nhà" 
              className="h-12 w-12 object-cover rounded-xl shadow-sm border border-gray-100 group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-extrabold font-title text-text-dark tracking-tight">Mèo Vắng Nhà</span>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className={`text-sm tracking-wide ${isActive('/')}`}>Trang chủ</Link>
            <Link to="/services" className={`text-sm tracking-wide ${isActive('/services')}`}>Dịch vụ</Link>
            <Link to="/pricing" className={`text-sm tracking-wide ${isActive('/pricing')}`}>Bảng giá</Link>
            <Link to="/pet-profile" className={`text-sm tracking-wide ${isActive('/pet-profile')}`}>Hồ sơ mèo</Link>
            <Link to="/booking" className={`text-sm tracking-wide ${isActive('/booking')}`}>Đặt phòng</Link>
          </nav>
          <div className="hidden md:flex items-center gap-5 text-gray-500">
            <button className="hover:text-primary transition-colors"><Search className="h-5 w-5" /></button>
            <button className="hover:text-primary transition-colors"><Bell className="h-5 w-5" /></button>
            <Link to="/my-booking" className="hover:text-primary transition-colors"><User className="h-5 w-5" /></Link>
          </div>
          <div className="md:hidden flex items-center">
            <button className="text-text-dark hover:text-primary">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
