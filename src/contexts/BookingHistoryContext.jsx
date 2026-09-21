import React, { createContext, useState, useContext } from 'react';

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

  const addBooking = (bookingData) => {
    setGlobalBookingList(prev => {
      const newList = [bookingData, ...prev];
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      return newList;
    });
  };

  const updateBooking = (bookingId, updatedData) => {
    setGlobalBookingList(prev => {
      const newList = prev.map(booking => 
        booking.id === bookingId ? { ...booking, ...updatedData } : booking
      );
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
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
