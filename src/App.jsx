import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { AdminLayout, RoomStatusPage } from '../Chi';
import Home from './pages/Home';
import Services from './pages/Services';
import Booking from './pages/Booking';
import PetProfile from './pages/PetProfile';
import MyBooking from './pages/MyBooking';
import Tracking from './pages/Tracking';
import Checkout from './pages/Checkout';
import Promotions from './pages/Promotions';
import News from './pages/News';
import { PetProvider } from './contexts/PetContext';
import { CustomerProvider, useCustomerProfile } from './contexts/CustomerContext';
import { BookingHistoryProvider } from './contexts/BookingHistoryContext';
import { UIProvider } from './contexts/UIContext';
import { RoomStateProvider } from './contexts/RoomStateContext';
import { Toaster } from 'react-hot-toast';

function AppRoutes() {
  const { isAdmin } = useCustomerProfile();

  // Danh sách các route trang con dùng chung 100% giữa Khách hàng và Admin
  const sharedRoutes = (
    <>
      <Route index element={<Home />} />
      <Route path="services" element={<Services />} />
      <Route path="promotions" element={<Promotions />} />
      <Route path="news" element={<News />} />
      <Route path="booking" element={<Booking />} />
      <Route path="pet-profile" element={<PetProfile />} />
      <Route path="my-booking" element={<MyBooking />} />
      <Route path="tracking" element={<Tracking />} />
      <Route path="checkout" element={<Checkout />} />
      {/* Trang Tình trạng phòng - chỉ hiển thị trong AdminLayout */}
      <Route path="room-status" element={<RoomStatusPage />} />
    </>
  );

  return (
    <Routes>
      {/* 
        1. Tuyến đường trực tiếp /admin:
           Cho phép trải nghiệm trực tiếp giao diện Admin bất cứ lúc nào qua link /admin
      */}
      <Route path="/admin" element={<AdminLayout />}>
        {sharedRoutes}
      </Route>

      {/* 
        2. Tuyến đường chính /:
           - Khi tài khoản có số điện thoại 0962606249 đăng nhập (isAdmin = true):
             Giao diện web tự động đổi thành AdminLayout (thư mục Chi) với thanh menu dọc bên trái.
           - Khi ở tài khoản khác hoặc chưa đăng nhập:
             Hiển thị giao diện khách hàng thông thường (MainLayout) với menu ngang.
           - Tất cả các trang con (Home, Services, Promotions, News, Booking...) dùng chung component,
             đồng bộ 100% nội dung.
      */}
      <Route path="/" element={isAdmin ? <AdminLayout /> : <MainLayout />}>
        {sharedRoutes}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <CustomerProvider>
      <UIProvider>
        <PetProvider>
          <BookingHistoryProvider>
            <RoomStateProvider>
              <Toaster position="top-center" reverseOrder={false} />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </RoomStateProvider>
          </BookingHistoryProvider>
        </PetProvider>
      </UIProvider>
    </CustomerProvider>
  );
}

export default App;
