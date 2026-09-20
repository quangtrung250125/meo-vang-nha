import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, User, Search, Bell, Sparkles, ChevronDown, 
  Crown, LogOut, FileText, Calendar, Heart, Shield, LayoutDashboard, X, Repeat2
} from 'lucide-react';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useUI } from '../../contexts/UIContext';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { authenticatedCustomer, isAuthenticated, isAdmin, logoutCustomer } = useCustomerProfile();
  const { openAuth, openSearch } = useUI();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => {
    return location.pathname === path 
      ? 'text-primary font-bold border-b-2 border-primary pb-1' 
      : 'text-text-dark hover:text-primary transition-colors pb-1';
  };

  const handleLogout = (switchAccount = false) => {
    logoutCustomer();
    setIsLogoutConfirmOpen(false);
    setIsDropdownOpen(false);
    if (switchAccount) openAuth();
  };

  return (
    <>
      <header className="site-header sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <Link to="/" className="brand-lockup flex items-center gap-3" aria-label="Mèo Vắng Nhà">
                <img 
                  src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" 
                  alt="Mèo Vắng Nhà" 
                  className="brand-logo h-12 w-auto object-contain" 
                />
              </Link>
            </div>

            {/* Main Navigation */}
            <nav className="hidden md:flex space-x-7 items-center">
              <Link to="/" className={`text-sm tracking-wide ${isActive('/')}`}>Trang chủ</Link>
              <Link to="/services" className={`text-sm tracking-wide ${isActive('/services')}`}>Dịch vụ</Link>
              <Link to="/pricing" className={`text-sm tracking-wide ${isActive('/pricing')}`}>Bảng giá</Link>
              <Link to="/promotions" className={`text-sm tracking-wide flex items-center gap-1 ${isActive('/promotions')}`}>
                <span>Khuyến mãi</span>
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase animate-pulse">HOT</span>
              </Link>
              <Link to="/news" className={`text-sm tracking-wide ${isActive('/news')}`}>Cẩm nang & Tin tức</Link>
              <Link to="/pet-profile" className={`text-sm tracking-wide ${isActive('/pet-profile')}`}>Hồ sơ mèo</Link>
              <Link to="/booking" className={`text-sm tracking-wide ${isActive('/booking')}`}>Đặt phòng</Link>
              <Link to="/tracking" className={`text-sm tracking-wide ${isActive('/tracking')}`}>Theo dõi lưu trú</Link>
            </nav>

            {/* Right Action Icons & User Menu */}
            <div className="hidden md:flex items-center gap-4 text-gray-500">
              <button 
                onClick={openSearch} 
                className="hover:text-primary transition-colors p-2 rounded-full hover:bg-orange-50 cursor-pointer" 
                title="Tìm kiếm dịch vụ & tin tức"
              >
                <Search className="h-5 w-5" />
              </button>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  title="Truy cập CRM Quản trị Doanh nghiệp"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Admin CRM</span>
                </Link>
              )}

              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 transition shadow-sm cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                      {authenticatedCustomer?.fullName?.charAt(0) || '👑'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-gray-800 leading-tight max-w-28 truncate">
                        {authenticatedCustomer?.fullName || authenticatedCustomer?.phone}
                      </p>
                      <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span>{authenticatedCustomer?.tier === 'diamond' ? 'Kim Cương' : authenticatedCustomer?.tier === 'gold' ? 'Hạng Vàng' : 'Hạng Bạc'}</span>
                        <span>• {authenticatedCustomer?.points || 850}đ</span>
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Account Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/60 mb-1">
                        <p className="text-xs text-amber-800 font-semibold">Tài khoản thành viên</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{authenticatedCustomer?.fullName || 'Khách Hàng Thân Thiết'}</p>
                        <p className="text-xs text-gray-500 font-mono">{authenticatedCustomer?.phone}</p>
                      </div>

                      <Link
                        to="/customer-profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary transition"
                      >
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>Hồ sơ khách hàng & Thẻ VIP</span>
                      </Link>

                      <Link
                        to="/pet-profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary transition"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Hồ sơ mèo cưng</span>
                      </Link>

                      <Link
                        to="/my-booking"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary transition"
                      >
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>Lịch sử đặt phòng</span>
                      </Link>

                      <Link
                        to="/tracking"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-primary transition"
                      >
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span>Theo dõi lưu trú</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          <span>Hệ thống CRM Admin</span>
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsLogoutConfirmOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={openAuth}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-[#cf750c] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-300 active:scale-95 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Tài khoản / Đăng ký</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin" className="px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">CRM</Link>
              )}
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
                  onClick={openAuth}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90"
                >
                  <User className="h-4 w-4" />
                  <span>Đăng ký</span>
                </button>
              )}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-text-dark hover:text-primary p-2 cursor-pointer"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation List */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/')}`}>Trang chủ</Link>
              <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/services')}`}>Dịch vụ</Link>
              <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/pricing')}`}>Bảng giá</Link>
              <Link to="/promotions" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/promotions')}`}>Khuyến mãi 🔥</Link>
              <Link to="/news" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/news')}`}>Cẩm nang & Tin tức</Link>
              <Link to="/pet-profile" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/pet-profile')}`}>Hồ sơ mèo</Link>
              <Link to="/customer-profile" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/customer-profile')}`}>Hồ sơ khách hàng VIP</Link>
              <Link to="/booking" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/booking')}`}>Đặt phòng</Link>
              <Link to="/tracking" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/tracking')}`}>Theo dõi lưu trú</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm font-bold text-purple-700 bg-purple-50">Quản trị CRM Admin</Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Logout / Switch Account Confirm Modal */}
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
              Bạn có chắc muốn rời tài khoản hiện tại không? Hồ sơ mèo và dữ liệu điểm VIP đã lưu vẫn được bảo toàn.
            </p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => handleLogout(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white hover:opacity-90 cursor-pointer"
              >
                <Repeat2 className="h-4 w-4" />
                Chuyển đổi tài khoản
              </button>
              <button
                type="button"
                onClick={() => handleLogout(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
