import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import Pricing from './pages/Pricing';
import Booking from './pages/Booking';
import PetProfile from './pages/PetProfile';
import MyBooking from './pages/MyBooking';
import Tracking from './pages/Tracking';
import Checkout from './pages/Checkout';
import { PetProvider } from './contexts/PetContext';
import { BookingHistoryProvider } from './contexts/BookingHistoryContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <PetProvider>
        <BookingHistoryProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="services" element={<Services />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="booking" element={<Booking />} />
                <Route path="pet-profile" element={<PetProfile />} />
                <Route path="my-booking" element={<MyBooking />} />
                <Route path="tracking" element={<Tracking />} />
                <Route path="checkout" element={<Checkout />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </BookingHistoryProvider>
      </PetProvider>
    </AuthProvider>
  );
}

export default App;
