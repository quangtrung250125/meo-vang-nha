import React, { useState } from 'react';
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
  CheckCheck
} from 'lucide-react';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useUI } from '../../contexts/UIContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const customerContext = useCustomerProfile?.() || {};
  const customerProfile = customerContext.customerProfile;
  const { 
    openSearch, 
    notifications, 
    unreadCount, 
    markAllNotificationsRead, 
    openPolicy 
  } = useUI();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => 
    location.pathname === path 
      ? 'text-primary font-bold border-b-2 border-primary pb-1' 
      : 'text-text-dark hover:text-primary font-medium transition-colors';

  const displayName = customerProfile?.fullName || customerProfile?.phone || 'Khách hàng';

  return (
    <>
      {/* TOP NOTIFICATION BAR (Exact match to Image 4) */}
      <div className="bg-[#cf750c] text-white text-xs md:text-sm py-2 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Clock className="w-4 h-4 text-amber-200 shrink-0" />
            <span>
              Giờ mở cửa: <strong className="underline decoration-amber-300">08:30 - 19:30</strong> (Nhận/trả ngoài giờ: <i className="text-amber-100">Cần liên hệ trước</i>)
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs">
            <a href="tel:0987654321" className="hover:text-amber-200 transition-colors flex items-center gap-1.5 font-bold">
              <Phone className="w-3.5 h-3.5" /> 0987 654 321
            </a>
            <span className="text-amber-300/60">|</span>
            <div className="flex items-center gap-3 text-sm">
              <a 
                href="https://www.facebook.com/meovangnha.hotel/?_rdc=2&_rdr#" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-amber-200 transition-transform hover:scale-110"
                title="Facebook Mèo Vắng Nhà"
              >
                <i className="fa-brands fa-facebook"></i>
              </a>
              <a 
                href="https://www.tiktok.com/@meovangnha" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-amber-200 transition-transform hover:scale-110"
                title="TikTok Mèo Vắng Nhà"
              >
                <i className="fa-brands fa-tiktok"></i>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-amber-200 transition-transform hover:scale-110"
                title="Instagram Mèo Vắng Nhà"
              >
                <i className="fa-brands fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

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
          </nav>

          {/* ACTION BUTTONS (Search, Notifications, Booking CTA, User) */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            
            {/* SEARCH BUTTON */}
            <button
              onClick={openSearch}
              className="p-2 rounded-full text-gray-500 hover:text-primary hover:bg-emerald-50 transition-colors focus:outline-none cursor-pointer"
              title="Tìm kiếm dịch vụ (Esc)"
            >
              <Search className="w-5 h-5" />
            </button>

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

            {/* USER PROFILE */}
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
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/pet-profile"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white hover:bg-secondary text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer shadow-sm shadow-emerald-200"
              >
                <User className="w-4 h-4" />
                <span>Hồ Sơ Mèo</span>
              </Link>
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
              to="/booking"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center bg-accent text-white font-bold py-3 rounded-2xl shadow-md text-sm mt-3"
            >
              Đặt lịch cho bé ngay
            </Link>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
