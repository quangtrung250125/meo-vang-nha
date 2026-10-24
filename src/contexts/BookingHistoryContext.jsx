import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { BOOKING_STATUS, getBookingStatus, REALTIME_CHANNEL } from '../utils/bookingStatus';
import { toast } from 'react-hot-toast';

const BookingHistoryContext = createContext();

// Dữ liệu mẫu chuẩn cho đầy đủ các trạng thái để kiểm thử nghiệm thu
const INITIAL_DEMO_BOOKINGS = [
  {
    id: 'MVN-88219',
    checkIn: '2026-10-28',
    checkOut: '2026-11-02',
    status: BOOKING_STATUS.UPCOMING,
    previous_status: null,
    pending_changes: null,
    selectedPackage: {
      id: 'pkg-royal',
      name: 'Gói Hoàng Gia 5 Sao',
      price: 350000,
    },
    selectedRoom: {
      id: 'room-vip',
      name: 'Sky-View Condo VIP',
    },
    petIds: ['pet-1'],
    petProfiles: [
      {
        id: 'pet-1',
        name: 'Miu Miu',
        breed: 'Mèo Anh Lông Ngắn',
        gender: 'Cái',
        age: 2,
        imagePreview: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80',
      }
    ],
    totalAmount: 1750000,
    paymentStatus: 'Đã thanh toán',
    createdAt: '2026-10-24T08:30:00.000Z',
    customerName: 'Nguyễn Thu Trang',
    customerPhone: '0987654321',
  },
  {
    id: 'MVN-95104',
    checkIn: '2026-10-26',
    checkOut: '2026-10-30',
    status: BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL,
    previous_status: BOOKING_STATUS.UPCOMING,
    pending_changes: {
      type: 'RESCHEDULE',
      proposedBy: 'admin',
      oldCheckIn: '2026-10-26',
      oldCheckOut: '2026-10-30',
      newCheckIn: '2026-10-28',
      newCheckOut: '2026-11-01',
      reason: 'Phòng VIP đang trong đợt khử khuẩn định kỳ UV theo quy chuẩn y tế, xin phép dời lịch lùi 2 ngày.',
      timestamp: new Date().toISOString(),
    },
    selectedPackage: {
      id: 'pkg-deluxe',
      name: 'Gói Deluxe Spa & Nghỉ Dưỡng',
      price: 280000,
    },
    selectedRoom: {
      id: 'room-condo-doi',
      name: 'Phòng Condo Đôi Ban Công',
    },
    petIds: ['pet-2'],
    petProfiles: [
      {
        id: 'pet-2',
        name: 'Bánh Bao',
        breed: 'Mèo Ba Tư',
        gender: 'Đực',
        age: 1,
        imagePreview: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=500&q=80',
      }
    ],
    totalAmount: 1120000,
    paymentStatus: 'Chưa thanh toán',
    createdAt: '2026-10-24T10:15:00.000Z',
    customerName: 'Trần Văn Nam',
    customerPhone: '0912345678',
  },
  {
    id: 'MVN-73412',
    checkIn: '2026-10-23',
    checkOut: '2026-10-27',
    status: BOOKING_STATUS.IN_HOUSE,
    previous_status: BOOKING_STATUS.UPCOMING,
    pending_changes: null,
    selectedPackage: {
      id: 'pkg-standard',
      name: 'Gói Lưu Trú Tiêu Chuẩn',
      price: 180000,
    },
    selectedRoom: {
      id: 'room-standard',
      name: 'Standard Cozy Room A-02',
    },
    petIds: ['pet-3'],
    petProfiles: [
      {
        id: 'pet-3',
        name: 'Cà Phê',
        breed: 'Mèo Xiêm',
        gender: 'Đực',
        age: 3,
        imagePreview: 'https://images.unsplash.com/photo-1513360309081-38f076273999?auto=format&fit=crop&w=500&q=80',
      }
    ],
    totalAmount: 720000,
    paymentStatus: 'Đã thanh toán',
    createdAt: '2026-10-22T09:00:00.000Z',
    customerName: 'Lê Hoàng Yến',
    customerPhone: '0909888999',
  },
  {
    id: 'MVN-61208',
    checkIn: '2026-10-15',
    checkOut: '2026-10-18',
    status: BOOKING_STATUS.COMPLETED,
    previous_status: BOOKING_STATUS.IN_HOUSE,
    pending_changes: null,
    selectedPackage: {
      id: 'pkg-standard',
      name: 'Gói Tiêu Chuẩn + Tắm Thảo Dược',
      price: 220000,
    },
    selectedRoom: {
      id: 'room-standard-1',
      name: 'Standard Cozy Room A-05',
    },
    petIds: ['pet-4'],
    petProfiles: [
      {
        id: 'pet-4',
        name: 'Đậu Phộng',
        breed: 'Mèo Ragdoll',
        gender: 'Cái',
        age: 2,
        imagePreview: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=500&q=80',
      }
    ],
    totalAmount: 660000,
    paymentStatus: 'Đã thanh toán',
    createdAt: '2026-10-14T14:20:00.000Z',
    customerName: 'Phạm Minh Tuấn',
    customerPhone: '0933221100',
  },
  {
    id: 'MVN-50913',
    checkIn: '2026-10-10',
    checkOut: '2026-10-12',
    status: BOOKING_STATUS.CANCELLED,
    previous_status: BOOKING_STATUS.UPCOMING,
    cancelReason: 'Khách có việc đột xuất dời lịch công tác.',
    pending_changes: null,
    selectedPackage: {
      id: 'pkg-basic',
      name: 'Gói Lưu Trú Cơ Bản',
      price: 150000,
    },
    selectedRoom: {
      id: 'room-standard-3',
      name: 'Standard Room A-08',
    },
    petIds: ['pet-5'],
    petProfiles: [
      {
        id: 'pet-5',
        name: 'Mèo Mướp',
        breed: 'Mèo Mướp Ta',
        gender: 'Đực',
        age: 1,
        imagePreview: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=500&q=80',
      }
    ],
    totalAmount: 300000,
    paymentStatus: 'Chưa thanh toán',
    createdAt: '2026-10-08T11:00:00.000Z',
    customerName: 'Hoàng Anh Quân',
    customerPhone: '0977665544',
  }
];

export const BookingHistoryProvider = ({ children }) => {
  const [globalBookingList, setGlobalBookingList] = useState(() => {
    const saved = localStorage.getItem('bookingHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Chuẩn hóa trạng thái cho các đơn hàng cũ
          return parsed.map(b => ({
            ...b,
            status: getBookingStatus(b),
            pending_changes: b.pending_changes || null,
          }));
        }
      } catch (e) {
        console.error('Lỗi phân tích bookingHistory:', e);
      }
    }
    // Nếu chưa có dữ liệu thì nạp danh sách mẫu chuẩn
    localStorage.setItem('bookingHistory', JSON.stringify(INITIAL_DEMO_BOOKINGS));
    return INITIAL_DEMO_BOOKINGS;
  });

  const channelRef = useRef(null);

  // Khởi tạo BroadcastChannel để đồng bộ Real-time giữa các tab không cần F5
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(REALTIME_CHANNEL);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (data && data.type === 'BOOKING_SYNC') {
          // Tự động tải lại danh sách mới nhất từ localStorage
          const latestSaved = localStorage.getItem('bookingHistory');
          if (latestSaved) {
            try {
              const parsed = JSON.parse(latestSaved);
              if (Array.isArray(parsed)) {
                setGlobalBookingList(parsed);
              }
            } catch (e) {
              console.error('Error parsing synced bookings:', e);
            }
          }

          if (data.notifyMessage) {
            toast(data.notifyMessage, {
              icon: '⚡',
              duration: 4000,
            });
          }
        }
      };

      // Đồng bộ qua sự kiện storage (hỗ trợ thêm cho các trình duyệt)
      const handleStorageChange = (e) => {
        if (e.key === 'bookingHistory' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              setGlobalBookingList(parsed);
            }
          } catch (err) {
            console.error(err);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        channel.close();
        window.removeEventListener('storage', handleStorageChange);
      };
    } catch (err) {
      console.warn('BroadcastChannel not supported:', err);
    }
  }, []);

  // Hàm phát tín hiệu đồng bộ Real-time
  const broadcastSync = useCallback((action, bookingId, notifyMessage = '') => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'BOOKING_SYNC',
        action,
        bookingId,
        notifyMessage,
        timestamp: Date.now(),
      });
    }
  }, []);

  // Lưu danh sách vào state và localStorage kèm phát sóng
  const persistBookings = useCallback((newList, action = 'UPDATE', bookingId = null, notifyMessage = '') => {
    localStorage.setItem('bookingHistory', JSON.stringify(newList));
    setGlobalBookingList(newList);
    broadcastSync(action, bookingId, notifyMessage);
  }, [broadcastSync]);

  // 1. Thêm đơn đặt phòng mới (Mặc định UPCOMING)
  const addBooking = useCallback((bookingData) => {
    const newBooking = {
      ...bookingData,
      status: BOOKING_STATUS.UPCOMING,
      pending_changes: null,
      previous_status: null,
      createdAt: bookingData.createdAt || new Date().toISOString(),
    };

    setGlobalBookingList(prev => {
      const newList = [newBooking, ...prev];
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      broadcastSync('ADD_BOOKING', newBooking.id, `Đơn hàng mới #${newBooking.id} đã được tạo thành công!`);
      return newList;
    });
  }, [broadcastSync]);

  // 2. Cập nhật thông tin đơn phòng chung
  const updateBooking = useCallback((id, newData) => {
    setGlobalBookingList(prev => {
      const newList = prev.map(booking =>
        booking.id === id ? { ...booking, ...newData } : booking
      );
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      broadcastSync('UPDATE_BOOKING', id);
      return newList;
    });
  }, [broadcastSync]);

  // 3. ADMIN: Check-in (Từ UPCOMING -> IN_HOUSE)
  const adminCheckIn = useCallback((bookingId) => {
    let success = false;
    setGlobalBookingList(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (!booking) return prev;

      if (booking.status !== BOOKING_STATUS.UPCOMING) {
        toast.error(`Chỉ có thể Check-in cho đơn hàng đang ở trạng thái 'Sắp tới' (Hiện tại: ${booking.status})`);
        return prev;
      }

      success = true;
      const newList = prev.map(b =>
        b.id === bookingId ? { ...b, status: BOOKING_STATUS.IN_HOUSE, checkedInAt: new Date().toISOString() } : b
      );
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      return newList;
    });

    if (success) {
      broadcastSync('CHECK_IN', bookingId, `Đơn hàng #${bookingId} đã Check-in sang 'Đang lưu trú' thành công!`);
      toast.success(`Check-in thành công đơn hàng #${bookingId}`);
    }
  }, [broadcastSync]);

  // 4. ADMIN: Check-out (Từ IN_HOUSE -> COMPLETED)
  const adminCheckOut = useCallback((bookingId) => {
    let success = false;
    setGlobalBookingList(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (!booking) return prev;

      if (booking.status !== BOOKING_STATUS.IN_HOUSE) {
        toast.error(`Chỉ có thể Check-out cho đơn hàng đang ở trạng thái 'Đang lưu trú'`);
        return prev;
      }

      success = true;
      const newList = prev.map(b =>
        b.id === bookingId ? { ...b, status: BOOKING_STATUS.COMPLETED, checkedOutAt: new Date().toISOString() } : b
      );
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      return newList;
    });

    if (success) {
      broadcastSync('CHECK_OUT', bookingId, `Đơn hàng #${bookingId} đã Check-out hoàn tất!`);
      toast.success(`Check-out thành công đơn hàng #${bookingId}. Kỳ lưu trú đã kết thúc.`);
    }
  }, [broadcastSync]);

  // 5. ADMIN: Gửi đề xuất Đổi lịch / Hủy đơn (Chuyển sang PENDING_CUSTOMER_APPROVAL)
  const adminProposeChange = useCallback((bookingId, proposalData) => {
    const { type, newCheckIn, newCheckOut, reason } = proposalData;
    let success = false;

    setGlobalBookingList(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (!booking) return prev;

      success = true;
      const pendingChanges = {
        type, // 'RESCHEDULE' hoặc 'CANCEL'
        proposedBy: 'admin',
        oldCheckIn: booking.checkIn,
        oldCheckOut: booking.checkOut,
        newCheckIn: newCheckIn || booking.checkIn,
        newCheckOut: newCheckOut || booking.checkOut,
        reason: reason || 'Thay đổi theo quy trình vận hành của Pet Hotel.',
        timestamp: new Date().toISOString(),
      };

      const newList = prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              previous_status: b.status,
              status: BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL,
              pending_changes: pendingChanges,
            }
          : b
      );

      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      return newList;
    });

    if (success) {
      const actionName = type === 'CANCEL' ? 'Hủy đơn' : 'Đổi lịch';
      const msg = `Admin đã gửi đề xuất ${actionName} cho đơn #${bookingId} (Chờ khách duyệt)`;
      broadcastSync('PROPOSE_CHANGE', bookingId, msg);
      toast.success(msg);
    }
  }, [broadcastSync]);

  // 6. ADMIN: Rút lại đề xuất trước khi khách phản hồi
  const adminCancelProposal = useCallback((bookingId) => {
    setGlobalBookingList(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (!booking || booking.status !== BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL) return prev;

      const restoredStatus = booking.previous_status || BOOKING_STATUS.UPCOMING;
      const newList = prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              status: restoredStatus,
              pending_changes: null,
            }
          : b
      );
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      broadcastSync('CANCEL_PROPOSAL', bookingId, `Admin đã hủy yêu cầu đề xuất cho đơn #${bookingId}`);
      return newList;
    });
    toast.success('Đã hủy yêu cầu đề xuất, đơn trở về trạng thái trước đó.');
  }, [broadcastSync]);

  // 7. KHÁCH HÀNG: Đồng ý / Chấp thuận yêu cầu từ Admin
  const customerAcceptProposal = useCallback((bookingId) => {
    let acceptedType = '';
    setGlobalBookingList(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (!booking || !booking.pending_changes) return prev;

      const changes = booking.pending_changes;
      acceptedType = changes.type;

      let nextStatus = booking.previous_status || BOOKING_STATUS.UPCOMING;
      let updatedFields = {};

      if (changes.type === 'CANCEL') {
        nextStatus = BOOKING_STATUS.CANCELLED;
        updatedFields = {
          cancelReason: `Admin đề xuất hủy đã được khách chấp thuận: ${changes.reason || ''}`,
        };
      } else if (changes.type === 'RESCHEDULE') {
        updatedFields = {
          checkIn: changes.newCheckIn,
          checkOut: changes.newCheckOut,
        };
      }

      const newList = prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              ...updatedFields,
              status: nextStatus,
              pending_changes: null,
            }
          : b
      );

      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      return newList;
    });

    const msg = `Khách hàng đã chấp nhận thay đổi cho đơn hàng #${bookingId}`;
    broadcastSync('CUSTOMER_ACCEPT', bookingId, msg);
    toast.success(acceptedType === 'CANCEL' ? 'Bạn đã xác nhận hủy đơn theo đề xuất từ Admin.' : 'Bạn đã xác nhận thay đổi lịch thành công!');
  }, [broadcastSync]);

  // 8. KHÁCH HÀNG: Từ chối yêu cầu từ Admin
  const customerRejectProposal = useCallback((bookingId) => {
    setGlobalBookingList(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (!booking) return prev;

      const restoredStatus = booking.previous_status || BOOKING_STATUS.UPCOMING;
      const newList = prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              status: restoredStatus,
              pending_changes: null,
            }
          : b
      );

      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      return newList;
    });

    const msg = `Khách hàng đã từ chối yêu cầu thay đổi cho đơn hàng #${bookingId}`;
    broadcastSync('CUSTOMER_REJECT', bookingId, msg);
    toast.success('Bạn đã từ chối đề xuất. Lịch đặt cũ được giữ nguyên.');
  }, [broadcastSync]);

  // 9. KHÁCH HÀNG: Tự thay đổi lịch (CHỈ KHI UPCOMING)
  const customerReschedule = useCallback((bookingId, { newCheckIn, newCheckOut }) => {
    let allowed = false;

    setGlobalBookingList(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (!booking) return prev;

      if (booking.status !== BOOKING_STATUS.UPCOMING) {
        toast.error('Chỉ được phép đổi lịch khi đơn đặt phòng đang ở trạng thái Sắp tới (Chưa Check-in).');
        return prev;
      }

      allowed = true;
      const newList = prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              checkIn: newCheckIn,
              checkOut: newCheckOut,
              rescheduledAt: new Date().toISOString(),
            }
          : b
      );

      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      return newList;
    });

    if (allowed) {
      const msg = `Khách hàng đã tự đổi lịch cho đơn #${bookingId} sang ngày ${newCheckIn} - ${newCheckOut}`;
      broadcastSync('CUSTOMER_RESCHEDULE', bookingId, msg);
      toast.success('Đã cập nhật lịch mới thành công!');
    }
  }, [broadcastSync]);

  // 10. KHÁCH HÀNG: Tự hủy đơn đặt (CHỈ KHI UPCOMING)
  const customerCancel = useCallback((bookingId, reason = 'Khách hàng tự hủy') => {
    let allowed = false;

    setGlobalBookingList(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (!booking) return prev;

      if (booking.status !== BOOKING_STATUS.UPCOMING) {
        toast.error('Chỉ được phép hủy đơn khi đơn đặt phòng đang ở trạng thái Sắp tới (Chưa Check-in).');
        return prev;
      }

      allowed = true;
      const newList = prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              status: BOOKING_STATUS.CANCELLED,
              cancelReason: reason,
              cancelledAt: new Date().toISOString(),
            }
          : b
      );

      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      return newList;
    });

    if (allowed) {
      const msg = `Khách hàng đã hủy đơn đặt #${bookingId}. Lý do: ${reason}`;
      broadcastSync('CUSTOMER_CANCEL', bookingId, msg);
      toast.success('Đơn đặt phòng đã được hủy thành công.');
    }
  }, [broadcastSync]);

  // Reset về dữ liệu mẫu để thuận tiện kiểm thử
  const resetDefaultBookings = useCallback(() => {
    persistBookings(INITIAL_DEMO_BOOKINGS, 'RESET', null, 'Đã đặt lại danh sách đơn hàng về mặc định!');
    toast.success('Đã khôi phục dữ liệu mẫu kiểm thử.');
  }, [persistBookings]);

  return (
    <BookingHistoryContext.Provider
      value={{
        globalBookingList,
        addBooking,
        updateBooking,
        adminCheckIn,
        adminCheckOut,
        adminProposeChange,
        adminCancelProposal,
        customerAcceptProposal,
        customerRejectProposal,
        customerReschedule,
        customerCancel,
        resetDefaultBookings,
      }}
    >
      {children}
    </BookingHistoryContext.Provider>
  );
};

export const useBookingHistory = () => {
  const context = useContext(BookingHistoryContext);
  if (!context) {
    throw new Error('useBookingHistory must be used within a BookingHistoryProvider');
  }
  return context;
};
