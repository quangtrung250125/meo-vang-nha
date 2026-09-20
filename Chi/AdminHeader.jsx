import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, User, Menu, LogOut, Repeat2, X, ShieldCheck } from 'lucide-react';
import { useCustomerProfile } from '../src/contexts/CustomerContext';
import { toast } from 'react-hot-toast';

/**
 * AdminHeader Component - Lưu tại thư mục Chi
 * Thanh Header phía trên của Giao diện Admin:
 * - Đồng bộ với Search, Bell, Account của giao diện khách hàng.
 * - Cho phép đóng mở Sidebar trên màn hình di động/tablet.
 */
const AdminHeader = ({ onToggleSidebar }) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const { authenticatedCustomer, logoutCustomer } = useCustomerProfile();

  const handleLogout = () => {
    logoutCustomer();
    setIsLogoutConfirmOpen(false);
    toast.success('Đã trở về giao diện khách hàng!');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 h-20">
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Cụm bên trái: Nút Menu mobile & Tiêu đề quản trị */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
              aria-label="Mở thanh điều hướng"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2">
              <Link to="/" className="md:hidden brand-lockup" aria-label="Mèo Vắng Nhà">
                <img 
                  src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" 
                  alt="Mèo Vắng Nhà" 
                  className="brand-logo" 
                />
              </Link>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">Mèo Vắng Nhà</span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Giao diện Admin
                </span>
              </div>
            </div>
          </div>

          {/* Cụm bên phải: Search, Bell, Tài khoản Admin & Đăng xuất */}
          <div className="flex items-center gap-3 sm:gap-4 text-gray-500">
            <button className="hover:text-primary transition-colors p-2 rounded-xl hover:bg-gray-50" title="Tìm kiếm">
              <Search className="h-5 w-5" />
            </button>
            <button className="hover:text-primary transition-colors p-2 rounded-xl hover:bg-gray-50" title="Thông báo">
              <Bell className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-sm font-bold text-text-dark">
                  {authenticatedCustomer?.fullName || 'Quản trị viên'}
                </span>
                <span className="text-xs font-medium text-primary">
                  {authenticatedCustomer?.phone || '0962606249'}
                </span>
              </div>

              <button
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-all shadow-xs"
                title="Đăng xuất khỏi Admin"
              >
                <User className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal xác nhận Đăng xuất (đồng bộ trải nghiệm giống giao diện khách hàng) */}
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
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-accent">
              <LogOut className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-dark">Đăng xuất Quản trị viên?</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Bạn có chắc muốn đăng xuất khỏi tài khoản quản trị <strong className="text-gray-700">0962606249</strong>? Hệ thống sẽ chuyển lại giao diện khách hàng thông thường.
            </p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white hover:opacity-90 transition-all shadow-md shadow-orange-200"
              >
                <LogOut className="h-4 w-4" />
                Xác nhận Đăng xuất
              </button>
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-800"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
