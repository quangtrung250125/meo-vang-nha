import React, { createContext, useState, useContext } from 'react';

const BookingHistoryContext = createContext();

const defaultMockBookings = [
  {
    id: 'MVN-88231',
    checkIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    selectedPackage: {
      id: 'p4',
      name: 'Gói VIP Hoàng Gia',
      price: 500000,
      period: '/ngày',
      desc: 'Phòng VIP lớn, chế độ ăn organic, massage mỗi ngày, camera 24/7'
    },
    selectedRoom: {
      id: 'r1',
      name: 'Phòng Deluxe Suite 01'
    },
    petProfiles: [
      {
        id: 'pet-1',
        name: 'Bé Bơ',
        breed: 'Mèo Anh Lông Ngắn',
        weight: '4.5kg',
        age: '2 tuổi',
        imagePreview: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80',
        personality: 'Hơi nhút nhát, thích vuốt cằm, mê pate cá hồi',
        healthNotes: 'Đã tiêm phòng dại & 4 bệnh đầy đủ, không dị ứng',
        habits: 'Thích ngủ trưa trên nệm mềm, chơi cần câu mèo lúc chiều tối'
      }
    ],
    petIds: ['pet-1'],
    totalPrice: 2500000,
    depositPaid: 1000000,
    remainingAmount: 1500000,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'MVN-77412',
    checkIn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    selectedPackage: {
      id: 'p2',
      name: 'Gói Tiêu Chuẩn',
      price: 250000,
      period: '/ngày',
      desc: 'Bao gồm pate cao cấp, phòng rộng rãi'
    },
    selectedRoom: {
      id: 'r2',
      name: 'Phòng Cozy Room 03'
    },
    petProfiles: [
      {
        id: 'pet-2',
        name: 'Bé Đậu',
        breed: 'Mèo Xiêm',
        weight: '3.8kg',
        age: '1.5 tuổi',
        imagePreview: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&auto=format&fit=crop&q=80',
        personality: 'Năng động, tò mò, thích chạy nhảy',
        healthNotes: 'Sức khỏe tốt'
      }
    ],
    petIds: ['pet-2'],
    totalPrice: 1000000,
    depositPaid: 500000,
    remainingAmount: 500000,
    createdAt: new Date().toISOString()
  }
];

export const BookingHistoryProvider = ({ children }) => {
  const [globalBookingList, setGlobalBookingList] = useState(() => {
    const saved = localStorage.getItem('bookingHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback to default
      }
    }
    localStorage.setItem('bookingHistory', JSON.stringify(defaultMockBookings));
    return defaultMockBookings;
  });

  const addBooking = (bookingData) => {
    setGlobalBookingList(prev => {
      const newList = [bookingData, ...prev];
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      return newList;
    });
  };

  return (
    <BookingHistoryContext.Provider value={{ globalBookingList, addBooking }}>
      {children}
    </BookingHistoryContext.Provider>
  );
};

export const useBookingHistory = () => useContext(BookingHistoryContext);
