import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  Menu, 
  X, 
  PawPrint, 
  LogOut, 
  Clock, 
  Phone, 
  Gift, 
  DoorOpen, 
  Sparkles, 
  CalendarCheck, 
  CheckCheck,
  Repeat2
} from 'lucide-react';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useUI } from '../../contexts/UIContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customerProfile, logoutCustomer } = useCustomerProfile();
  const { 
    openSearch, 
    notifications, 
    unreadCount, 
    markAllNotificationsRead, 
    openPolicy,
    openAuth
  } = useUI();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showPromoBar, setShowPromoBar] = useState(true);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const searchInputRef = useRef(null);

  const handleLogout = (switchAccount = false) => {
    if (logoutCustomer) logoutCustomer();
    setIsLogoutConfirmOpen(false);
    if (switchAccount) openAuth();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (path) => 
    location.pathname === path 
      ? 'text-primary font-bold border-b-2 border-primary pb-1' 
      : 'text-text-dark hover:text-primary font-medium transition-colors';

  const displayName = customerProfile?.fullName || customerProfile?.phone || 'Khách hàng';

  return (
    <>
      {/* PROMO TOP BAR */}
      {showPromoBar && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white text-xs md:text-sm py-2 px-4 font-bold relative overflow-hidden group">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2 overflow-hidden text-center sm:text-left mx-auto sm:mx-0 w-full sm:w-auto">
              <span className="bg-white text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider animate-pulse shadow-sm shrink-0">Tin Nổi Bật</span>
              <span className="truncate max-w-full font-medium">🔥 CHƯƠNG TRÌNH ĐANG CHẠY: Ưu đãi giảm 20% gói Spa Thảo Dược & Tặng Voucher 100k cho thành viên mới!</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-5 text-xs">
                <a href="tel:0987654321" className="hover:text-amber-200 transition-colors flex items-center gap-1.5 font-bold">
                  <Phone className="w-3.5 h-3.5" /> 0987 654 321
                </a>
                <span className="text-amber-300/60">|</span>
                <div className="flex items-center gap-3 text-sm">
                  <a href="https://www.facebook.com/meovangnha.hotel/?_rdc=2&_rdr#" target="_blank" rel="noreferrer" className="hover:text-amber-200 transition-transform hover:scale-110"><i className="fa-brands fa-facebook"></i></a>
                  <a href="https://www.tiktok.com/@meovangnha" target="_blank" rel="noreferrer" className="hover:text-amber-200 transition-transform hover:scale-110"><i className="fa-brands fa-tiktok"></i></a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-amber-200 transition-transform hover:scale-110"><i className="fa-brands fa-instagram"></i></a>
                </div>
              </div>
              <button onClick={() => setShowPromoBar(false)} className="text-white/80 hover:text-white ml-2 text-xs shrink-0 cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300" id="mainHeader">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
              <PawPrint className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-text-dark block leading-none font-title">
                Mèo Vắng Nhà
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                Hotel & Pet Care Spa
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center space-x-7 font-medium text-sm">
            <Link to="/" className={isActive('/')}>Trang chủ</Link>
            <Link to="/services" className={isActive('/services')}>Dịch vụ</Link>
            <Link to="/pet-profile" className={isActive('/pet-profile')}>Hồ sơ mèo</Link>
            <button 
              onClick={() => openPolicy('membership')}
              className="text-text-dark hover:text-primary font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Tích Điểm VIP</span>
            </button>
            <Link to="/booking" className={isActive('/booking')}>Đặt phòng</Link>
            <Link to="/tracking" className={isActive('/tracking')}>Theo dõi</Link>
          </nav>

          {/* ACTION BUTTONS (Search, Notifications, Booking CTA, User) */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            
            {/* SEARCH BAR (Desktop) & BUTTON (Mobile) */}
            <div className="flex items-center">
              {/* Mobile Search Button */}
              <button
                onClick={openSearch}
                className="md:hidden p-2 rounded-full text-gray-500 hover:text-primary hover:bg-emerald-50 transition-colors focus:outline-none cursor-pointer"
                title="Tìm kiếm dịch vụ (Esc)"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Desktop Search Bar */}
              <div className="hidden md:block relative w-64 lg:w-80">
                <div className="relative">
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="🔍 Tìm phòng, spa, ưu đãi... (Bấm '/' để tìm)" 
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="w-full bg-amber-50/60 text-sm border border-amber-200 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition duration-200"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                </div>

                {/* Quick Search Results Dropdown */}
                {isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-amber-100 p-4 z-50 text-sm">
                    <p className="text-xs font-semibold text-gray-400 mb-2">🔥 Từ khóa tìm kiếm phổ biến:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer">Khuyến mãi tích điểm</button>
                      <button className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer">Sky-View Condo</button>
                      <button className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer">Tắm bọt thảo dược</button>
                      <button className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer">Đưa đón tận nhà</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* NOTIFICATION BUTTON & POPOVER */}
            <div className="relative">
              <button
                onClick={() => setShowNotifPopover(!showNotifPopover)}
                className="p-2 rounded-full text-gray-500 hover:text-primary hover:bg-emerald-50 transition-colors focus:outline-none relative cursor-pointer"
                title="Thông báo mới"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATION POPOVER */}
              {showNotifPopover && (
                <div 
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 bg-emerald-50/70 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-text-dark text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" /> Thông Báo Mới
                    </h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setShowNotifPopover(false);
                          if (item.type === 'gift') openPolicy('membership');
                          else navigate('/services');
                        }}
                        className={`p-4 hover:bg-emerald-50/40 transition-colors cursor-pointer flex gap-3 ${
                          item.unread ? 'bg-emerald-50/20' : 'opacity-60'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${item.iconColor}`}>
                          {item.type === 'gift' && <Gift className="w-4 h-4" />}
                          {item.type === 'room' && <DoorOpen className="w-4 h-4" />}
                          {item.type === 'spa' && <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 leading-snug">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1.5 block">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 text-center bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowNotifPopover(false);
                        openPolicy('points');
                      }}
                      className="text-xs font-bold text-primary hover:text-secondary cursor-pointer"
                    >
                      Xem chi tiết chính sách ưu đãi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BOOKING CTA BUTTON */}
            <Link
              to="/booking"
              className="hidden lg:inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <CalendarCheck className="w-4 h-4" /> Đặt Phòng Ngay
            </Link>

            {customerProfile ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px]">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">{displayName}</span>
                </button>

                {showDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-400 truncate">
                      {customerProfile.phone || customerProfile.fullName}
                    </div>
                    <Link
                      to="/my-booking"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-primary font-medium"
                    >
                      Lịch đặt của tôi
                    </Link>
                    <Link
                      to="/pet-profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-primary font-medium"
                    >
                      Hồ sơ thú cưng
                    </Link>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setIsLogoutConfirmOpen(true);
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuth}
                className="bg-[#00B16A] hover:bg-[#009458] text-white px-4 sm:px-5 py-2.5 rounded-full font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm shrink-0 cursor-pointer"
              >
                <User className="w-4 h-4 text-base" />
                <span className="hidden sm:inline">Tài khoản / Đăng ký</span>
                <span className="sm:hidden">Tài khoản</span>
              </button>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-text-dark hover:text-primary focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-bold text-primary py-2 border-b border-gray-50 text-sm"
            >
              Trang chủ
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-text-dark font-medium py-2 border-b border-gray-50 text-sm"
            >
              Dịch vụ
            </Link>
            <Link
              to="/pet-profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-text-dark font-medium py-2 border-b border-gray-50 text-sm"
            >
              Hồ sơ thú cưng
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openPolicy('membership');
              }}
              className="w-full text-left text-text-dark font-medium py-2 border-b border-gray-50 text-sm flex items-center justify-between"
            >
              <span>Chương trình tích điểm VIP</span>
              <Sparkles className="w-4 h-4 text-accent" />
            </button>
            <Link
              to="/tracking"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-text-dark font-medium py-2 border-b border-gray-50 text-sm"
            >
              Theo dõi
            </Link>
            <Link
              to="/booking"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center bg-accent text-white font-bold py-3 rounded-2xl shadow-md text-sm mt-3"
            >
              Đặt lịch cho bé ngay
            </Link>
          </div>
        )}
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
    </>
  );
};

export default Header;
