import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { AdminLayout, RoomStatusPage } from '../Chi';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import AdminReviews from './pages/AdminReviews';
import AdminSettings from './pages/AdminSettings';
import AdminCustomers from './pages/AdminCustomers';
import Services from './pages/Services';
import Booking from './pages/Booking';
import PetProfile from './pages/PetProfile';
import CustomerProfile from './pages/CustomerProfile';
import MyBooking from './pages/MyBooking';
import Tracking from './pages/Tracking';
import Checkout from './pages/Checkout';
import Promotions from './pages/Promotions';
import AdminPromotions from './pages/AdminPromotions';
import AdminMarketing from './pages/AdminMarketing';
import News from './pages/News';
import { PetProvider } from './contexts/PetContext';
import { CustomerProvider, useCustomerProfile } from './contexts/CustomerContext';
import { BookingHistoryProvider } from './contexts/BookingHistoryContext';
import { CareLogProvider } from './contexts/CareLogContext';
import { UIProvider } from './contexts/UIContext';
import { RoomStateProvider } from './contexts/RoomStateContext';
import { Toaster } from 'react-hot-toast';
import CustomerSyncBridge from './components/CustomerSyncBridge';

// Chỉ tài khoản admin đã xác thực mới vào được trang quản trị
function RequireAdmin({ children }) {
  const { isAdmin, authLoading, isAuthenticated } = useCustomerProfile();
  if (isAdmin) return children;
  // Đang chờ Supabase xác thực phiên đã lưu thì chưa vội chuyển hướng
  if (authLoading && isAuthenticated) return null;
  return <Navigate to="/" replace />;
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 pt-24 pb-12 text-center">
      <p className="text-6xl">🐾</p>
      <h1 className="text-3xl font-bold text-text-dark font-title">Không tìm thấy trang</h1>
      <p className="text-gray-600">Trang bạn tìm không tồn tại hoặc đã được chuyển đi.</p>
      <Link to="/" className="bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity">
        Về trang chủ
      </Link>
    </div>
  );
}

function AppRoutes() {
  const { isAdmin } = useCustomerProfile();
  const adminOnly = (element) => <RequireAdmin>{element}</RequireAdmin>;

  // Shared routes between normal customer view and admin view
  const sharedRoutes = (
    <>
      <Route path="services" element={<Services />} />
      <Route path="pricing" element={<Navigate to="/services" replace />} />
      <Route path="promotions" element={isAdmin ? adminOnly(<AdminPromotions />) : <Promotions />} />
      <Route path="marketing" element={adminOnly(<AdminMarketing />)} />
      <Route path="news" element={<News />} />
      <Route path="booking" element={<Booking />} />
      <Route path="pet-profile" element={<PetProfile />} />
      <Route path="customer-profile" element={<CustomerProfile />} />
      <Route path="profile" element={<CustomerProfile />} />
      <Route path="my-booking" element={<MyBooking />} />
      <Route path="tracking" element={<Tracking />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="room-status" element={adminOnly(<RoomStatusPage />)} />
      <Route path="customers" element={adminOnly(<AdminCustomers />)} />
      <Route path="reviews" element={adminOnly(<AdminReviews />)} />
      <Route path="settings" element={adminOnly(<AdminSettings />)} />
      <Route path="*" element={<NotFound />} />
    </>
  );

  return (
    <Routes>
      {/* Direct Admin Route /admin */}
      <Route path="/admin" element={adminOnly(<AdminLayout />)}>
        <Route index element={<AdminDashboard />} />
        {sharedRoutes}
      </Route>

      {/* Main Layout / */}
      <Route path="/" element={isAdmin ? <AdminLayout /> : <MainLayout />}>
        <Route index element={isAdmin ? <AdminDashboard /> : <Home />} />
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
            <CareLogProvider>
              <RoomStateProvider>
                <Toaster position="top-center" reverseOrder={false} />
                <CustomerSyncBridge />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </RoomStateProvider>
            </CareLogProvider>
          </BookingHistoryProvider>
        </PetProvider>
      </UIProvider>
    </CustomerProvider>
  );
}

export default App;
