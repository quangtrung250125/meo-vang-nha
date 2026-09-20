import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, User, Search, Bell, Sparkles, ChevronDown, ChevronUp,
  Crown, LogOut, FileText, Calendar, Heart, Shield, LayoutDashboard, 
  X, Repeat2, UserCheck, PawPrint
} from 'lucide-react';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useUI } from '../../contexts/UIContext';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { authenticatedCustomer, isAuthenticated, isAdmin, logoutCustomer } = useCustomerProfile();
  const { openAuth, openSearch } = useUI();

  // Current active user details (fallback to ducan demo if not set)
  const currentUser = authenticatedCustomer || {
    fullName: 'ducan',
    email: 'ducan12345atm@gmail.com',
    phone: '0901234567',
    tier: 'gold',
    points: 850,
    avatar: DEFAULT_AVATAR
  };

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
      <header className="site-header sticky top-0 z-50 bg-white border-b border-gray-100 shadow-xs">
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

            {/* Right Action Icons & User Account Menu */}
            <div className="hidden md:flex items-center gap-4 text-gray-500">
              {/* Search Button */}
              <button 
                onClick={openSearch} 
                className="hover:text-primary transition-colors p-2 rounded-full hover:bg-orange-50 cursor-pointer" 
                title="Tìm kiếm dịch vụ & tin tức"
              >
                <Search className="h-5 w-5 text-gray-600" />
              </button>

              {/* Notification Bell with Badge */}
              <div className="relative">
                <button 
                  className="hover:text-primary transition-colors p-2 rounded-full hover:bg-orange-50 cursor-pointer" 
                  title="Thông báo"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                </button>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-400 rounded-full ring-2 ring-white" />
              </div>

              {/* Admin CRM Shortcut Badge if logged in as Admin */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  title="Truy cập CRM Quản trị Doanh nghiệp"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Admin CRM</span>
                </Link>
              )}

              {/* Account Pill & Dropdown Menu */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Green-Bordered User Pill Button */}
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-[#86efac] bg-[#f0fdf4] hover:bg-[#dcfce7] transition-all shadow-xs cursor-pointer select-none"
                    aria-label="Menu tài khoản"
                  >
                    {/* User Avatar with Green Active Online Dot */}
                    <div className="relative shrink-0">
                      <img
                        src={currentUser.avatar || DEFAULT_AVATAR}
                        alt={currentUser.fullName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-emerald-300/60"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-1.5 ring-white" />
                    </div>

                    {/* Username & Tier/Points Subtitle */}
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-gray-900 leading-tight max-w-28 truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-amber-700 font-extrabold flex items-center gap-0.5 leading-none mt-0.5">
                        <span className="text-[10px]">👑</span>
                        <span>{currentUser.tier === 'diamond' ? 'Kim Cương' : 'Vàng'} • {currentUser.points || 850}đ</span>
                      </p>
                    </div>

                    {/* Chevron Arrow */}
                    {isDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 ml-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 ml-0.5" />
                    )}
                  </button>

                  {/* Dropdown Menu Modal Card */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-[28px] shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Top Profile Summary: Avatar + Name + Email */}
                      <div className="flex items-center gap-3.5 mb-4">
                        <img
                          src={currentUser.avatar || DEFAULT_AVATAR}
                          alt={currentUser.fullName}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-100 shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-extrabold text-gray-900 truncate">
                            {currentUser.fullName}
                          </h3>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {currentUser.email || (currentUser.phone ? `${currentUser.phone}@meovangnha.com` : 'ducan12345atm@gmail.com')}
                          </p>
                        </div>
                      </div>

                      {/* Tier & Points Status Row */}
                      <div className="flex items-center justify-between py-2 border-b border-gray-100 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/70 text-amber-900 font-extrabold text-xs rounded-xl border border-amber-200/40">
                          <span>👑</span>
                          <span>{currentUser.tier === 'diamond' ? 'Hạng Kim Cương' : 'Hạng Vàng'}</span>
                        </span>
                        <span className="text-[#059669] font-black text-sm">
                          {currentUser.points || 850} Điểm thưởng
                        </span>
                      </div>

                      {/* Main Menu Links */}
                      <div className="space-y-1">
                        {/* 1. Xem thông tin (Hồ sơ) */}
                        <Link
                          to="/customer-profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-gray-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] text-[#10b981] flex items-center justify-center group-hover:bg-[#d1fae5] transition shrink-0">
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-gray-800 group-hover:text-emerald-900">
                            Xem thông tin (Hồ sơ)
                          </span>
                        </Link>

                        {/* 2. Lịch đặt của tôi */}
                        <Link
                          to="/my-booking"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-gray-700 hover:bg-blue-50/70 hover:text-blue-800 transition group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center group-hover:bg-[#dbeafe] transition shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-gray-800 group-hover:text-blue-900">
                            Lịch đặt của tôi
                          </span>
                        </Link>

                        {/* 3. Hồ sơ thú cưng */}
                        <Link
                          to="/pet-profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-gray-700 hover:bg-orange-50/70 hover:text-orange-800 transition group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-[#f97316] flex items-center justify-center group-hover:bg-[#ffedd5] transition shrink-0">
                            <PawPrint className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-gray-800 group-hover:text-orange-900">
                            Hồ sơ thú cưng
                          </span>
                        </Link>

                        {/* Admin Link (if admin) */}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-purple-700 bg-purple-50 hover:bg-purple-100 transition group"
                          >
                            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                              <LayoutDashboard className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-extrabold">
                              👑 Quản trị CRM Doanh nghiệp
                            </span>
                          </Link>
                        )}
                      </div>

                      {/* Separator and Bottom Actions */}
                      <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                        {/* 4. Chuyển tài khoản */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleLogout(true);
                          }}
                          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-gray-700 hover:bg-gray-100 transition group cursor-pointer text-left"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-gray-200 transition shrink-0">
                            <Repeat2 className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-gray-800">
                            Chuyển tài khoản
                          </span>
                        </button>

                        {/* 5. Đăng xuất */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsLogoutConfirmOpen(true);
                          }}
                          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 transition group cursor-pointer text-left"
                        >
                          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition shrink-0">
                            <LogOut className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-black text-rose-600">
                            Đăng xuất
                          </span>
                        </button>
                      </div>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-300 bg-emerald-50 text-gray-800 text-xs font-semibold rounded-lg hover:bg-emerald-100"
                >
                  <User className="h-4 w-4 text-emerald-600" />
                  <span>{currentUser.fullName}</span>
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
              <Link to="/pet-profile" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/pet-profile')}`}>Hồ sơ thú cưng</Link>
              <Link to="/customer-profile" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/customer-profile')}`}>Xem thông tin (Hồ sơ)</Link>
              <Link to="/my-booking" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/my-booking')}`}>Lịch đặt của tôi</Link>
              <Link to="/booking" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/booking')}`}>Đặt phòng</Link>
              <Link to="/tracking" onClick={() => setIsMobileMenuOpen(false)} className={`block px-3 py-2 rounded-xl text-sm font-medium ${isActive('/tracking')}`}>Theo dõi lưu trú</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm font-bold text-purple-700 bg-purple-50">Quản trị CRM Doanh nghiệp</Link>
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
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
              aria-label="Đóng xác nhận"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-accent">
              <LogOut className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-text-dark">Bạn muốn làm gì?</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Bạn có chắc muốn rời tài khoản hiện tại không? Hồ sơ thú cưng và dữ liệu điểm thưởng đã lưu vẫn được bảo toàn.
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
