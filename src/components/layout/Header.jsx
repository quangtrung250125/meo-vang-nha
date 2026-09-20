import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, User, Menu, PawPrint, LogOut, 
  ChevronDown, UserCheck, Calendar, Receipt, 
  Repeat, Sparkles, X 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, customerProfile, openAuthModal, logout, switchAccount } = useAuth();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setShowDropdown(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  const isActive = (path) => 
    location.pathname === path 
      ? 'text-primary font-bold' 
      : 'text-gray-600 hover:text-primary font-medium';

  const displayName = customerProfile?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Khách hàng';
  const displayEmail = customerProfile?.email || user?.email || 'customer@gmail.com';
  const userTier = customerProfile?.tier || 'Vàng';
  const userPoints = customerProfile?.points || 850;

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    toast.success('Đã đăng xuất tài khoản!', {
      icon: '👋',
      style: { borderRadius: '16px', background: '#333', color: '#fff' }
    });
    navigate('/');
  };

  const handleSwitchAccount = async () => {
    setShowDropdown(false);
    await switchAccount();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-primary flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <PawPrint className="h-6 w-6" />
            </div>
            <Link to="/" className="text-xl font-extrabold font-title text-text-dark tracking-tight hover:text-primary transition-colors">
              Mèo Vàng Nhà
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className={'text-sm tracking-wide transition-colors ' + isActive('/')}>Trang chủ</Link>
            <Link to="/services" className={'text-sm tracking-wide transition-colors ' + isActive('/services')}>Dịch vụ</Link>
            <Link to="/pricing" className={'text-sm tracking-wide transition-colors ' + isActive('/pricing')}>Bảng giá</Link>
            <Link to="/pet-profile" className={'text-sm tracking-wide transition-colors ' + isActive('/pet-profile')}>Hồ sơ mèo</Link>
            <Link to="/booking" className={'text-sm tracking-wide transition-colors ' + isActive('/booking')}>Đặt phòng</Link>
          </nav>

          {/* Desktop Action Area */}
          <div className="hidden md:flex items-center gap-4 text-gray-500">
            <button className="p-2 hover:text-primary hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" title="Tìm kiếm">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 hover:text-primary hover:bg-gray-50 rounded-xl transition-colors relative cursor-pointer" title="Thông báo">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            </button>
            
            {user ? (
              /* Logged In User Dropdown Trigger */
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2.5 py-1.5 px-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 font-semibold text-xs hover:bg-emerald-100/80 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-primary text-white flex items-center justify-center font-bold text-xs shadow-inner">
                      {customerProfile?.avatar ? (
                        <img src={customerProfile.avatar} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                  </div>

                  <div className="text-left hidden lg:block">
                    <p className="text-text-dark font-bold text-xs truncate max-w-[120px]">{displayName}</p>
                    <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-0.5">
                      👑 {userTier} • {userPoints}đ
                    </span>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-primary transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* User Profile Header Card */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-emerald-50/50 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          {customerProfile?.avatar ? (
                            <img src={customerProfile.avatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-text-dark text-sm truncate">{displayName}</h4>
                          <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-emerald-100/50 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                          👑 Hạng {userTier}
                        </span>
                        <span className="font-extrabold text-primary">
                          {userPoints} Điểm thưởng
                        </span>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="py-2 px-1.5 space-y-0.5">
                      
                      {/* Xem thông tin / Hồ sơ khách hàng */}
                      <Link 
                        to="/customer-profile" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-primary transition-colors group"
                      >
                        <span className="p-1.5 bg-emerald-100/60 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                          <UserCheck className="w-3.5 h-3.5" />
                        </span>
                        <span>Xem thông tin (Hồ sơ)</span>
                      </Link>

                      {/* Lịch đặt của tôi */}
                      <Link 
                        to="/my-booking" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-primary transition-colors group"
                      >
                        <span className="p-1.5 bg-blue-100/60 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Calendar className="w-3.5 h-3.5" />
                        </span>
                        <span>Lịch đặt của tôi</span>
                      </Link>

                      {/* Hồ sơ thú cưng */}
                      <Link 
                        to="/pet-profile" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-primary transition-colors group"
                      >
                        <span className="p-1.5 bg-orange-100/60 text-orange-600 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <PawPrint className="w-3.5 h-3.5" />
                        </span>
                        <span>Hồ sơ thú cưng</span>
                      </Link>

                    </div>

                    {/* Divider */}
                    <div className="my-1 border-t border-gray-100"></div>

                    {/* Secondary Actions */}
                    <div className="py-1 px-1.5 space-y-0.5">
                      
                      {/* Chuyển tài khoản */}
                      <button 
                        onClick={handleSwitchAccount}
                        className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 hover:text-text-dark transition-colors cursor-pointer group"
                      >
                        <span className="p-1.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-gray-200 transition-colors">
                          <Repeat className="w-3.5 h-3.5" />
                        </span>
                        <span>Chuyển tài khoản</span>
                      </button>

                      {/* Đăng xuất */}
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer group"
                      >
                        <span className="p-1.5 bg-red-100/60 text-red-500 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                          <LogOut className="w-3.5 h-3.5" />
                        </span>
                        <span>Đăng xuất</span>
                      </button>

                    </div>

                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={openAuthModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-secondary transition-all shadow-md shadow-emerald-200 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Đăng Nhập / Đăng Ký</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {!user ? (
              <button 
                onClick={openAuthModal} 
                className="text-xs font-bold text-primary px-3 py-1.5 border border-primary rounded-xl cursor-pointer"
              >
                Đăng nhập
              </button>
            ) : (
              <Link 
                to="/customer-profile"
                className="flex items-center gap-1.5 text-xs font-bold text-primary bg-emerald-50 px-2.5 py-1 rounded-xl"
              >
                <span>👑 {displayName}</span>
              </Link>
            )}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-text-dark hover:text-primary p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3 animate-in fade-in duration-200">
          <nav className="flex flex-col space-y-2 pt-2 border-b border-gray-100 pb-3">
            <Link to="/" className={'text-sm py-2 px-3 rounded-xl ' + isActive('/')}>Trang chủ</Link>
            <Link to="/services" className={'text-sm py-2 px-3 rounded-xl ' + isActive('/services')}>Dịch vụ</Link>
            <Link to="/pricing" className={'text-sm py-2 px-3 rounded-xl ' + isActive('/pricing')}>Bảng giá</Link>
            <Link to="/pet-profile" className={'text-sm py-2 px-3 rounded-xl ' + isActive('/pet-profile')}>Hồ sơ mèo</Link>
            <Link to="/booking" className={'text-sm py-2 px-3 rounded-xl ' + isActive('/booking')}>Đặt phòng</Link>
          </nav>

          {user && (
            <div className="pt-2 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3">Tài khoản của bạn</p>
              <Link 
                to="/customer-profile" 
                className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-bold text-text-dark hover:bg-emerald-50 hover:text-primary"
              >
                <UserCheck className="w-4 h-4 text-primary" />
                <span>Xem thông tin (Hồ sơ khách hàng)</span>
              </Link>
              <Link 
                to="/my-booking" 
                className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-bold text-text-dark hover:bg-emerald-50 hover:text-primary"
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Lịch đặt của tôi</span>
              </Link>
              <button 
                onClick={handleSwitchAccount}
                className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100"
              >
                <Repeat className="w-4 h-4" />
                <span>Chuyển tài khoản</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;

