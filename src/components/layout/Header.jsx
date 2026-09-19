import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User, Menu, LogOut, PawPrint } from 'lucide-react';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import CustomerWelcomeModal from '../CustomerWelcomeModal';

const Header = () => {
  const location = useLocation();
  const { customerProfile, saveCustomerProfile } = useCustomerProfile();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path
      ? 'text-primary font-bold'
      : 'text-gray-600 hover:text-primary font-medium';

  const displayName =
    customerProfile?.fullName || customerProfile?.name || 'Khách hàng';

  const handleLogout = () => {
    // Xoá profile khỏi localStorage
    localStorage.removeItem('meo-vang-nha-customer-profile');
    saveCustomerProfile(null);
    setShowDropdown(false);
  };

  const handleAuthSubmit = (formData) => {
    saveCustomerProfile(formData);
    setIsAuthOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <img
                src="/images/logo.png"
                alt="Mèo Vắng Nhà"
                className="h-12 w-12 object-cover rounded-xl shadow-sm border border-gray-100 group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-extrabold font-title text-text-dark tracking-tight">
                Mèo Vắng Nhà
              </span>
            </Link>

            <nav className="hidden md:flex space-x-8">
              <Link to="/" className={'text-sm tracking-wide ' + isActive('/')}>Trang chủ</Link>
              <Link to="/services" className={'text-sm tracking-wide ' + isActive('/services')}>Dịch vụ</Link>
              <Link to="/pet-profile" className={'text-sm tracking-wide ' + isActive('/pet-profile')}>Hồ sơ mèo</Link>
              <Link to="/tracking" className={'text-sm tracking-wide ' + isActive('/tracking')}>Theo dõi lưu trú</Link>
              <Link to="/booking" className={'text-sm tracking-wide ' + isActive('/booking')}>Đặt phòng</Link>
            </nav>

            <div className="hidden md:flex items-center gap-5 text-gray-500">
              <button className="hover:text-primary transition-colors" title="Tìm kiếm">
                <Search className="h-5 w-5" />
              </button>
              <button className="hover:text-primary transition-colors" title="Thông báo">
                <Bell className="h-5 w-5" />
              </button>

              {customerProfile ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-semibold text-sm hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <span>{displayName}</span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-400 truncate">
                        {customerProfile.phone || customerProfile.email || ''}
                      </div>
                      <Link
                        to="/my-booking"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary"
                      >
                        Lịch đặt của tôi
                      </Link>
                      <Link
                        to="/pet-profile"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary"
                      >
                        Hồ sơ thú cưng
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm shadow-orange-300 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Tài khoản / Đăng ký</span>
                </button>
              )}
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-2">
              {!customerProfile ? (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="text-sm font-bold text-primary px-3 py-1.5 border border-primary rounded-lg"
                >
                  Đăng nhập
                </button>
              ) : (
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="text-xs font-bold text-primary"
                >
                  {displayName}
                </button>
              )}
              <button className="text-text-dark hover:text-primary p-2">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <CustomerWelcomeModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSubmit={handleAuthSubmit}
      />
    </>
  );
};

export default Header;
