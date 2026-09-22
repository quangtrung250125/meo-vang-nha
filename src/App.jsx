import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { AdminLayout, RoomStatusPage } from '../Chi';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Services from './pages/Services';
import Booking from './pages/Booking';
import PetProfile from './pages/PetProfile';
import CustomerProfile from './pages/CustomerProfile';
import MyBooking from './pages/MyBooking';
import Tracking from './pages/Tracking';
import Checkout from './pages/Checkout';
import Promotions from './pages/Promotions';
import News from './pages/News';
import { PetProvider } from './contexts/PetContext';
import { CustomerProvider, useCustomerProfile } from './contexts/CustomerContext';
import { BookingHistoryProvider } from './contexts/BookingHistoryContext';
import { CareLogProvider } from './contexts/CareLogContext';
import { UIProvider } from './contexts/UIContext';
import { RoomStateProvider } from './contexts/RoomStateContext';
import { Toaster } from 'react-hot-toast';

function AppRoutes() {
  const { isAdmin } = useCustomerProfile();

  // Shared routes between normal customer view and admin view
  const sharedRoutes = (
    <>
      <Route path="services" element={<Services />} />
      <Route path="pricing" element={<Navigate to="/services" replace />} />
      <Route path="promotions" element={<Promotions />} />
      <Route path="news" element={<News />} />
      <Route path="booking" element={<Booking />} />
      <Route path="pet-profile" element={<PetProfile />} />
      <Route path="customer-profile" element={<CustomerProfile />} />
      <Route path="profile" element={<CustomerProfile />} />
      <Route path="my-booking" element={<MyBooking />} />
      <Route path="tracking" element={<Tracking />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="room-status" element={<RoomStatusPage />} />
    </>
  );

  return (
    <Routes>
      {/* Direct Admin Route /admin */}
      <Route path="/admin" element={<AdminLayout />}>
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
