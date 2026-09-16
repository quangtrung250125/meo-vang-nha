import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  PawPrint,
  CalendarCheck,
  FileText,
  CreditCard,
  LayoutDashboard,
  Utensils,
  Droplets,
  Smile,
  Video
} from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'booking' | 'tracking' | null
  const [mobileExpanded, setMobileExpanded] = useState({ booking: true, tracking: true });
  
  const navRef = useRef(null);

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname, location.search]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-medium';
    return location.pathname.startsWith(path) ? 'text-primary font-bold' : 'text-gray-600 hover:text-primary font-medium';
  };

  const isBookingActive = location.pathname.startsWith('/my-booking') || location.pathname.startsWith('/checkout');
  const isTrackingActive = location.pathname.startsWith('/tracking');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <PawPrint className="h-6 w-6" />
            </div>
            <Link to="/" className="text-xl font-extrabold font-title text-text-dark tracking-tight hover:text-primary transition-colors">
              Mèo Vắng Nhà
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav ref={navRef} className="hidden lg:flex items-center space-x-5 xl:space-x-7">
            <Link to="/" className={`text-sm tracking-wide transition-colors ${isActive('/')}`}>
              Trang chủ
            </Link>
            <Link to="/services" className={`text-sm tracking-wide transition-colors ${isActive('/services')}`}>
              Dịch vụ
            </Link>
            <Link to="/pricing" className={`text-sm tracking-wide transition-colors ${isActive('/pricing')}`}>
              Bảng giá
            </Link>
            <Link to="/pet-profile" className={`text-sm tracking-wide transition-colors ${isActive('/pet-profile')}`}>
              Hồ sơ mèo
            </Link>
            <Link to="/booking" className={`text-sm tracking-wide transition-colors ${isActive('/booking')}`}>
              Đặt phòng
            </Link>

            {/* Dropdown: Booking của tôi */}
            <div 
              className="relative"
              onMouseEnter={() => setOpenDropdown('booking')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'booking' ? null : 'booking')}
                className={`flex items-center gap-1.5 text-sm tracking-wide px-3 py-1.5 rounded-xl transition-all ${
                  isBookingActive 
                    ? 'text-primary font-bold bg-primary/10' 
                    : openDropdown === 'booking'
                    ? 'text-primary font-medium bg-gray-50'
                    : 'text-gray-600 hover:text-primary font-medium'
                }`}
                aria-expanded={openDropdown === 'booking'}
              >
                <span>Booking của tôi</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'booking' ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
              </button>

              {/* Dropdown Menu */}
              {openDropdown === 'booking' && (
                <div className="absolute top-full left-0 w-64 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 overflow-hidden ring-1 ring-black/5">
                    
                    {/* Item: Danh sách booking */}
                    <Link
                      to="/my-booking"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-bg-cream transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary-light/70 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <CalendarCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-dark group-hover:text-primary transition-colors">
                          Danh sách booking
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">Xem tất cả lịch lưu trú</div>
                      </div>
                    </Link>

                    {/* Item: Chi tiết booking */}
                    <Link
                      to="/my-booking?view=detail"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-bg-cream transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-dark group-hover:text-accent transition-colors">
                          Chi tiết booking
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">Thông tin bé & gói dịch vụ</div>
                      </div>
                    </Link>

                    {/* Item: Thanh toán */}
                    <Link
                      to="/checkout"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-bg-cream transition-colors group border-t border-gray-50 mt-1"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-secondary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-dark group-hover:text-secondary transition-colors">
                          Thanh toán
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">Hóa đơn & phương thức trả</div>
                      </div>
                    </Link>

                  </div>
                </div>
              )}
            </div>

            {/* Dropdown: Theo dõi mèo */}
            <div 
              className="relative"
              onMouseEnter={() => setOpenDropdown('tracking')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'tracking' ? null : 'tracking')}
                className={`flex items-center gap-1.5 text-sm tracking-wide px-3 py-1.5 rounded-xl transition-all ${
                  isTrackingActive 
                    ? 'text-primary font-bold bg-primary/10' 
                    : openDropdown === 'tracking'
                    ? 'text-primary font-medium bg-gray-50'
                    : 'text-gray-600 hover:text-primary font-medium'
                }`}
                aria-expanded={openDropdown === 'tracking'}
              >
                <span className="relative flex items-center gap-1.5">
                  Theo dõi mèo
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                  </span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'tracking' ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
              </button>

              {/* Dropdown Menu */}
              {openDropdown === 'tracking' && (
                <div className="absolute top-full left-0 w-64 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 overflow-hidden ring-1 ring-black/5">
                    
                    {/* Item: Tổng quan */}
                    <Link
                      to="/tracking?tab=overview"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-bg-cream transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-dark group-hover:text-primary transition-colors">
                          Tổng quan
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">Nhật ký & chỉ số hàng ngày</div>
                      </div>
                    </Link>

                    {/* Item: Ăn uống */}
                    <Link
                      to="/tracking?tab=eating"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-bg-cream transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-dark group-hover:text-amber-600 transition-colors">
                          Ăn uống
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">Khẩu phần & bữa ăn của bé</div>
                      </div>
                    </Link>

                    {/* Item: Vệ sinh */}
                    <Link
                      to="/tracking?tab=hygiene"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-bg-cream transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-dark group-hover:text-blue-600 transition-colors">
                          Vệ sinh
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">Tình trạng khay cát & đi vệ sinh</div>
                      </div>
                    </Link>

                    {/* Item: Tâm trạng */}
                    <Link
                      to="/tracking?tab=mood"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-bg-cream transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Smile className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-dark group-hover:text-purple-600 transition-colors">
                          Tâm trạng
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">Cảm xúc & mức độ thích nghi</div>
                      </div>
                    </Link>

                    {/* Item: Camera */}
                    <Link
                      to="/tracking?tab=camera"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-red-50/50 transition-colors group border-t border-gray-50 mt-1"
                    >
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative">
                        <Video className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-dark group-hover:text-red-500 transition-colors flex items-center gap-1.5">
                          Camera
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-600">Live</span>
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">Xem video phòng trực tiếp 24/7</div>
                      </div>
                    </Link>

                  </div>
                </div>
              )}
            </div>

          </nav>

          {/* Right Action Icons */}
          <div className="hidden lg:flex items-center gap-4 text-gray-500">
            <button 
              title="Tìm kiếm"
              className="p-2 rounded-xl hover:bg-gray-100 hover:text-primary transition-all cursor-pointer"
            >
              <Search className="h-5 w-5" />
            </button>
            <button 
              title="Thông báo"
              className="p-2 rounded-xl hover:bg-gray-100 hover:text-primary transition-all relative cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent"></span>
            </button>
            <Link 
              to="/my-booking" 
              title="Tài khoản & Booking"
              className="flex items-center gap-2 p-1.5 pl-3 pr-4 rounded-xl bg-gray-50 hover:bg-primary-light hover:text-primary text-text-dark transition-all border border-gray-100"
            >
              <User className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold">Tài khoản</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-text-dark hover:text-primary hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-xl animate-in slide-in-from-top duration-200 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="px-4 pt-3 pb-6 space-y-2">
            
            <Link 
              to="/" 
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${location.pathname === '/' ? 'bg-primary-light text-primary font-bold' : 'text-text-dark hover:bg-gray-50'}`}
            >
              Trang chủ
            </Link>
            <Link 
              to="/services" 
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${location.pathname.startsWith('/services') ? 'bg-primary-light text-primary font-bold' : 'text-text-dark hover:bg-gray-50'}`}
            >
              Dịch vụ
            </Link>
            <Link 
              to="/pricing" 
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${location.pathname.startsWith('/pricing') ? 'bg-primary-light text-primary font-bold' : 'text-text-dark hover:bg-gray-50'}`}
            >
              Bảng giá
            </Link>
            <Link 
              to="/pet-profile" 
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${location.pathname.startsWith('/pet-profile') ? 'bg-primary-light text-primary font-bold' : 'text-text-dark hover:bg-gray-50'}`}
            >
              Hồ sơ mèo
            </Link>
            <Link 
              to="/booking" 
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${location.pathname.startsWith('/booking') ? 'bg-primary-light text-primary font-bold' : 'text-text-dark hover:bg-gray-50'}`}
            >
              Đặt phòng
            </Link>

            {/* Mobile Accordion: Booking của tôi */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setMobileExpanded(prev => ({ ...prev, booking: !prev.booking }))}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold text-text-dark hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                  Booking của tôi
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mobileExpanded.booking ? 'rotate-180 text-primary' : ''}`} />
              </button>
              
              {mobileExpanded.booking && (
                <div className="pl-6 pr-2 py-1 space-y-1">
                  <Link
                    to="/my-booking"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-primary hover:bg-bg-cream"
                  >
                    <CalendarCheck className="w-4 h-4 text-primary" />
                    <span>Danh sách booking</span>
                  </Link>
                  <Link
                    to="/my-booking?view=detail"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-accent hover:bg-bg-cream"
                  >
                    <FileText className="w-4 h-4 text-accent" />
                    <span>Chi tiết booking</span>
                  </Link>
                  <Link
                    to="/checkout"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-secondary hover:bg-bg-cream"
                  >
                    <CreditCard className="w-4 h-4 text-secondary" />
                    <span>Thanh toán</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Accordion: Theo dõi mèo */}
            <div className="pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setMobileExpanded(prev => ({ ...prev, tracking: !prev.tracking }))}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold text-text-dark hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-accent" />
                  Theo dõi mèo
                  <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mobileExpanded.tracking ? 'rotate-180 text-primary' : ''}`} />
              </button>
              
              {mobileExpanded.tracking && (
                <div className="pl-6 pr-2 py-1 space-y-1">
                  <Link
                    to="/tracking?tab=overview"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-primary hover:bg-bg-cream"
                  >
                    <LayoutDashboard className="w-4 h-4 text-teal-600" />
                    <span>Tổng quan</span>
                  </Link>
                  <Link
                    to="/tracking?tab=eating"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-amber-600 hover:bg-bg-cream"
                  >
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>Ăn uống</span>
                  </Link>
                  <Link
                    to="/tracking?tab=hygiene"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-blue-600 hover:bg-bg-cream"
                  >
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span>Vệ sinh</span>
                  </Link>
                  <Link
                    to="/tracking?tab=mood"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-purple-600 hover:bg-bg-cream"
                  >
                    <Smile className="w-4 h-4 text-purple-600" />
                    <span>Tâm trạng</span>
                  </Link>
                  <Link
                    to="/tracking?tab=camera"
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-red-600 font-semibold hover:bg-red-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <Video className="w-4 h-4 text-red-500" />
                      <span>Camera</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">Live</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between px-4">
              <Link 
                to="/my-booking" 
                className="flex items-center gap-2 text-sm font-bold text-primary"
              >
                <User className="h-4 w-4" />
                Tài khoản của tôi
              </Link>
              <span className="text-xs text-gray-400">Hotline: 0909.123.456</span>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};

export default Header;
