import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import Footer from '../src/components/layout/Footer';
import FloatingContactButtons from './FloatingContactButtons';

/**
 * AdminLayout Component - Lưu tại thư mục Chi
 * 
 * - Bản sao hoàn hảo của giao diện khách hàng (đồng bộ nội dung các trang qua <Outlet />,
 *   sử dụng chung Footer, Logo, FloatingContactButtons, màu sắc, font chữ).
 * - Điểm khác biệt duy nhất: Thanh menu điều hướng gồm các thẻ (Trang chủ, Dịch vụ, 
 *   Khuyến mãi, Tin tức, Hồ sơ mèo, Đặt phòng) nằm dọc ở phía bên trái màn hình.
 * - Mọi thay đổi ở các trang khách hàng sẽ tự động cập nhật ngay trên giao diện admin.
 */
const AdminLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-light text-text-dark antialiased">
      {/* 1. Thanh menu điều hướng gồm 6 thẻ nằm dọc ở phía bên trái màn hình */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Nội dung bên phải: Bản sao 100% của giao diện khách hàng */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminHeader onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)} />
        
        <main className="flex-grow w-full">
          <Outlet />
        </main>

        <Footer />
        <FloatingContactButtons />
      </div>
    </div>
  );
};

export default AdminLayout;
