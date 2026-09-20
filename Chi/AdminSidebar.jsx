import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Briefcase, 
  Tag, 
  Newspaper, 
  PawPrint, 
  Calendar, 
  User, 
  LogOut, 
  X,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { useCustomerProfile } from '../src/contexts/CustomerContext';
import { toast } from 'react-hot-toast';

/**
 * AdminSidebar Component - Lưu tại thư mục Chi
 * Thanh menu điều hướng gồm 6 thẻ:
 * (Trang chủ, Dịch vụ, Khuyến mãi, Tin tức, Hồ sơ mèo, Đặt phòng)
 * nằm dọc ở phía bên trái màn hình.
 * Đồng bộ 100% Logo, màu sắc, font chữ và trải nghiệm từ giao diện khách hàng.
 */
const AdminSidebar = ({ isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const { authenticatedCustomer, logoutCustomer } = useCustomerProfile();

  // Hỗ trợ cả route /admin/... lẫn route gốc /... khi đăng nhập 0962606249
  const isDirectAdminRoute = location.pathname.startsWith('/admin');
  const basePrefix = isDirectAdminRoute ? '/admin' : '';

  const navItems = [
    { name: 'Trang chủ', path: isDirectAdminRoute ? '/admin' : '/', icon: Home },
    { name: 'Tình trạng phòng', path: `${basePrefix}/room-status`, icon: LayoutDashboard },
    { name: 'Dịch vụ', path: `${basePrefix}/services`, icon: Briefcase },
    { name: 'Khuyến mãi', path: `${basePrefix}/promotions`, icon: Tag },
    { name: 'Tin tức', path: `${basePrefix}/news`, icon: Newspaper },
    { name: 'Hồ sơ mèo', path: `${basePrefix}/pet-profile`, icon: PawPrint },
    { name: 'Đặt phòng', path: `${basePrefix}/booking`, icon: Calendar },
  ];

  const checkIsActive = (path) => {
    if (path === '/' || path === '/admin') {
      return location.pathname === '/' || location.pathname === '/admin';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    logoutCustomer();
    toast.success('Đã đăng xuất tài khoản Quản trị viên!');
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* 1. Logo Mèo Vắng Nhà giống hệt 100% Header khách hàng */}
      <div className="h-20 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
        <Link 
          to={isDirectAdminRoute ? '/admin' : '/'} 
          className="brand-lockup flex items-center gap-2" 
          aria-label="Mèo Vắng Nhà"
          onClick={() => onCloseMobile && onCloseMobile()}
        >
          <img 
            src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" 
            alt="Mèo Vắng Nhà" 
            className="brand-logo" 
          />
        </Link>
        {isMobileOpen && (
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* 2. Badge quản trị viên SĐT 0962606249 */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-100 text-primary">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <div className="text-xs font-bold leading-tight truncate">
            <span>Admin: </span>
            <span className="font-extrabold text-orange-600">{authenticatedCustomer?.phone || '0962606249'}</span>
          </div>
        </div>
      </div>

      {/* 3. Thanh menu điều hướng gồm 6 thẻ nằm dọc ở phía bên trái màn hình */}
      <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = checkIsActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onCloseMobile && onCloseMobile()}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                active
                  ? 'bg-primary text-white shadow-md shadow-orange-200'
                  : 'text-gray-600 hover:text-primary hover:bg-orange-50/60'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 4. Footer sidebar: Thông tin tài khoản & nút Đăng xuất */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/60 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-gray-800 truncate">
                {authenticatedCustomer?.fullName || 'Quản trị viên'}
              </p>
              <p className="text-[11px] text-gray-500 font-medium truncate">
                {authenticatedCustomer?.phone || '0962606249'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar cố định trên Desktop (Màn hình md trở lên) */}
      <aside className="hidden md:block w-64 bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0 z-40 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Drawer Sidebar trên thiết bị di động */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <aside className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
