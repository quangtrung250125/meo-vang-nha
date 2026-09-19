import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
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
import { CustomerProvider } from './contexts/CustomerContext';
import { BookingHistoryProvider } from './contexts/BookingHistoryContext';
import { UIProvider } from './contexts/UIContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <CustomerProvider>
      <UIProvider>
        <PetProvider>
          <BookingHistoryProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="services" element={<Services />} />
                  <Route path="promotions" element={<Promotions />} />
                  <Route path="news" element={<News />} />
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
      </UIProvider>
    </CustomerProvider>
  );
}

export default App;
