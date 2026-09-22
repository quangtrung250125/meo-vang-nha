import React, { createContext, useState, useContext, useEffect } from 'react';

const BookingHistoryContext = createContext();

export const BookingHistoryProvider = ({ children }) => {
  const [globalBookingList, setGlobalBookingList] = useState(() => {
    const saved = localStorage.getItem('bookingHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Lắng nghe thay đổi từ các tab và trong cùng tab (khi admin bấm check-in)
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('bookingHistory');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setGlobalBookingList(parsed);
        }
      } catch (e) {}
    };

    const handleStorage = (e) => {
      if (e.key === 'bookingHistory') handleSync();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('mvn_booking_sync', handleSync);

    let channel = null;
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      channel = new BroadcastChannel('mvn_room_channel');
      channel.onmessage = (event) => {
        if (
          event.data?.type === 'BOOKING_UPDATED' ||
          event.data?.type === 'BOOKING_ADDED' ||
          event.data?.type === 'BOOKING_REMOVED'
        ) {
          handleSync();
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mvn_booking_sync', handleSync);
      if (channel) channel.close();
    };
  }, []);

  const addBooking = (bookingData) => {
    setGlobalBookingList(prev => {
      const newList = [bookingData, ...prev];
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      window.dispatchEvent(new Event('mvn_booking_sync'));
      return newList;
    });
  };

  const updateBooking = (bookingId, updatedData) => {
    setGlobalBookingList(prev => {
      const newList = prev.map(booking => 
        (booking.id === bookingId || booking.code === bookingId) ? { ...booking, ...updatedData } : booking
      );
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      window.dispatchEvent(new Event('mvn_booking_sync'));
      return newList;
    });
  };

  return (
    <BookingHistoryContext.Provider value={{ globalBookingList, addBooking, updateBooking }}>
      {children}
    </BookingHistoryContext.Provider>
  );
};

export const useBookingHistory = () => useContext(BookingHistoryContext);
