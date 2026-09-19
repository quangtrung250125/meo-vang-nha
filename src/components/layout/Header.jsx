import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User, Menu, LogOut, Repeat2, X } from 'lucide-react';
import AuthModal from '../AuthModal';
import { useCustomerProfile } from '../../contexts/CustomerContext';

const Header = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const { authenticatedCustomer, isAuthenticated, logoutCustomer } = useCustomerProfile();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-medium';

  const handleLogout = (switchAccount = false) => {
    logoutCustomer();
    setIsLogoutConfirmOpen(false);
    if (switchAccount) setIsAuthModalOpen(true);
  };

  return (
    <>
    <header className="site-header sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="brand-lockup" aria-label="Mèo Vắng Nhà">
              <img src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" alt="Mèo Vắng Nhà" className="brand-logo" />
            </Link>
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
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="max-w-32 truncate text-sm font-semibold text-text-dark" title={authenticatedCustomer?.fullName}>
                  {authenticatedCustomer?.fullName || authenticatedCustomer?.phone}
                </span>
                <button
                  onClick={() => setIsLogoutConfirmOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-all"
                >
                  <User className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-orange-300"
              >
                <User className="h-4 w-4" />
                <span>Tài khoản / Đăng ký</span>
              </button>
            )}
          </div>
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                <span>Thoát</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90"
              >
                <User className="h-4 w-4" />
                <span>Đăng ký</span>
              </button>
            )}
            <button className="text-text-dark hover:text-primary p-2">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
      {isLogoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsLogoutConfirmOpen(false);
          }}
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Đóng xác nhận"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-accent">
              <LogOut className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-text-dark">Bạn muốn làm gì?</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Bạn có chắc muốn rời tài khoản hiện tại không? Hồ sơ và dữ liệu đã lưu sẽ không bị xóa.
            </p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => handleLogout(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white hover:opacity-90"
              >
                <Repeat2 className="h-4 w-4" />
                Chuyển đổi tài khoản
              </button>
              <button
                type="button"
                onClick={() => handleLogout(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Header;
