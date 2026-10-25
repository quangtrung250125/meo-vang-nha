import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { triggerBookingConfirmedNotification, triggerBookingCompletedNotification } from '../services/notificationTriggers';
import {
  fetchServerSync,
  pushServerSync,
  broadcastEvent,
  subscribeSyncEvents,
} from '../services/crossDeviceSync';
import { BOOKING_STATUS, getBookingStatus, REALTIME_CHANNEL } from '../utils/bookingStatus';

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

  const bookingListRef = useRef(globalBookingList);
  bookingListRef.current = globalBookingList;

  // Lắng nghe thay đổi từ các tab trong cùng trình duyệt
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

  // ── 1. Tải đơn đặt phòng từ Server API và Supabase DB ──
  useEffect(() => {
    let isMounted = true;

    const syncInitialBookings = async () => {
      // 1.1 Tải từ server sync store (Đồng bộ đa thiết bị Desktop <-> Mobile)
      try {
        const serverData = await fetchServerSync();
        if (serverData && Array.isArray(serverData.bookings) && serverData.bookings.length > 0 && isMounted) {
          setGlobalBookingList((prev) => {
            const merged = [...prev];
            serverData.bookings.forEach((sb) => {
              const idx = merged.findIndex(
                (b) => (b.id && b.id === sb.id) || (b.code && b.code === sb.code)
              );
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...sb };
              } else {
                merged.push(sb);
              }
            });
            try {
              localStorage.setItem('bookingHistory', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Lỗi lấy bookings từ server sync:', err);
      }

      // 1.2 Tải danh sách đơn đặt từ Supabase DB
      try {
        const { data, error } = await supabase.from('bookings').select('*');
        if (!error && Array.isArray(data) && isMounted && data.length > 0) {
          const dbBookings = data.map((row) => ({
            id: row.id,
            code: row.code,
            customerId: row.customer_id,
            createdAt: row.created_at,
            ...(row.data || {}),
          }));

          setGlobalBookingList((prev) => {
            const merged = [...prev];
            dbBookings.forEach((dbItem) => {
              const idx = merged.findIndex(
                (b) => (b.id && b.id === dbItem.id) || (b.code && b.code === dbItem.code)
              );
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...dbItem };
              } else {
                merged.push(dbItem);
              }
            });
            try {
              localStorage.setItem('bookingHistory', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Lỗi đọc bảng bookings từ Supabase:', err);
      }
    };

    syncInitialBookings();

    // 2. Kênh Realtime lắng nghe mọi sự kiện INSERT, UPDATE, DELETE từ bảng bookings
    const realtimeChannel = supabase
      .channel('mvn_bookings_history_rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const row = payload.new;
            const newBooking = {
              id: row.id,
              code: row.code,
              customerId: row.customer_id,
              createdAt: row.created_at,
              ...(row.data || {}),
            };
            setGlobalBookingList((prev) => {
              if (prev.some((b) => b.id === newBooking.id || b.code === newBooking.code)) {
                return prev;
              }
              const next = [newBooking, ...prev];
              try {
                localStorage.setItem('bookingHistory', JSON.stringify(next));
              } catch (e) {}
              window.dispatchEvent(new Event('mvn_booking_sync'));
              return next;
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const row = payload.new;
            const updated = {
              id: row.id,
              code: row.code,
              customerId: row.customer_id,
              ...(row.data || {}),
            };
            setGlobalBookingList((prev) => {
              const next = prev.map((b) =>
                b.id === updated.id || b.code === updated.code ? { ...b, ...updated } : b
              );
              try {
                localStorage.setItem('bookingHistory', JSON.stringify(next));
              } catch (e) {}
              window.dispatchEvent(new Event('mvn_booking_sync'));
              return next;
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const delId = payload.old.id;
            setGlobalBookingList((prev) => {
              const next = prev.filter((b) => b.id !== delId && b.code !== delId);
              try {
                localStorage.setItem('bookingHistory', JSON.stringify(next));
              } catch (e) {}
              window.dispatchEvent(new Event('mvn_booking_sync'));
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // ── 2. Lắng nghe Đồng Bộ Realtime Đa Thiết Bị (Supabase Broadcast Channel) ──
  useEffect(() => {
    const unsubscribe = subscribeSyncEvents(({ type, payload }) => {
      if (type === 'BOOKINGS_UPDATED' || type === 'FULL_SYNC_RESPONSE') {
        const incomingBookings = payload?.bookings;
        if (Array.isArray(incomingBookings) && incomingBookings.length > 0) {
          setGlobalBookingList((prev) => {
            const merged = [...prev];
            incomingBookings.forEach((ib) => {
              const idx = merged.findIndex(
                (b) => (b.id && b.id === ib.id) || (b.code && b.code === ib.code)
              );
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...ib };
              } else {
                merged.unshift(ib);
              }
            });
            try {
              localStorage.setItem('bookingHistory', JSON.stringify(merged));
            } catch (e) {}
            window.dispatchEvent(new Event('mvn_booking_sync'));
            return merged;
          });
        }
      } else if (type === 'REQUEST_SYNC') {
        // Thiết bị khác vừa mở và yêu cầu dữ liệu
        if (bookingListRef.current && bookingListRef.current.length > 0) {
          broadcastEvent('FULL_SYNC_RESPONSE', {
            bookings: bookingListRef.current,
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ── 3. Thêm booking mới ──
  const addBooking = (bookingData) => {
    let updatedList = [];
    setGlobalBookingList(prev => {
      updatedList = [bookingData, ...prev];
      localStorage.setItem('bookingHistory', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mvn_booking_sync'));
      return updatedList;
    });

    // A. Đồng bộ Server API
    pushServerSync({ bookings: updatedList });

    // B. Broadcast tức thì qua Cloud WebSockets tới Điện thoại
    broadcastEvent('BOOKINGS_UPDATED', { bookings: updatedList });

    // Gửi thông báo Web Push xác nhận đơn đặt phòng
    if (bookingData) {
      triggerBookingConfirmedNotification({
        userId: bookingData.customerId || bookingData.customerPhone || 'ducan',
        bookingCode: bookingData.code || bookingData.id || 'MVN-NEW',
        petNames: bookingData.catNames || bookingData.petName || 'Bé mèo',
        roomName: bookingData.selectedRoom?.name || bookingData.roomType || 'Phòng Khách Sạn',
        checkIn: bookingData.checkIn || bookingData.checkInDate || 'hôm nay',
      });
    }

    // C. Lưu vào Supabase nền nếu có session
    (async () => {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const genUUID = () => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id || bookingData.customerId || null;
        const rowId = isUUID(bookingData.dbId || bookingData.id) ? (bookingData.dbId || bookingData.id) : genUUID();

        await supabase.from('bookings').upsert({
          id: rowId,
          customer_id: userId,
          code: bookingData.code || bookingData.id,
          data: { ...bookingData, dbId: rowId },
        });
      } catch (e) {
        console.warn('Lỗi ghi Supabase bookings:', e);
      }
    })();
  };

  // ── 4. Upsert booking ──
  const upsertBooking = (bookingData) => {
    let updatedList = [];
    setGlobalBookingList(prev => {
      const safeBooking = { ...bookingData };
      const index = prev.findIndex((booking) => {
        if (booking.id && safeBooking.id && booking.id === safeBooking.id) return true;
        if (safeBooking.customerPhone && booking.customerPhone && booking.customerPhone === safeBooking.customerPhone) {
          const sameRoom = booking.selectedRoom?.id && safeBooking.selectedRoom?.id && booking.selectedRoom.id === safeBooking.selectedRoom.id;
          const sameDates = booking.checkIn === safeBooking.checkIn && booking.checkOut === safeBooking.checkOut;
          return sameRoom && sameDates;
        }
        return false;
      });

      if (index >= 0) {
        updatedList = [...prev];
        updatedList[index] = { ...updatedList[index], ...safeBooking };
      } else {
        updatedList = [safeBooking, ...prev];
      }

      localStorage.setItem('bookingHistory', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mvn_booking_sync'));
      return updatedList;
    });

    // A. Đồng bộ Server API
    pushServerSync({ bookings: updatedList });

    // B. Broadcast tức thì qua Cloud WebSockets tới Điện thoại
    broadcastEvent('BOOKINGS_UPDATED', { bookings: updatedList });

    // C. Lưu vào Supabase nền nếu có session
    (async () => {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const genUUID = () => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id || bookingData.customerId || null;
        const rowId = isUUID(bookingData.dbId || bookingData.id) ? (bookingData.dbId || bookingData.id) : genUUID();

        await supabase.from('bookings').upsert({
          id: rowId,
          customer_id: userId,
          code: bookingData.code || bookingData.id,
          data: { ...bookingData, dbId: rowId },
        });
      } catch (e) {
        console.warn('Lỗi upsert Supabase bookings:', e);
      }
    })();
  };

  // ── 5. Cập nhật booking theo ID ──
  const updateBooking = (bookingId, updatedData) => {
    let updatedList = [];
    setGlobalBookingList(prev => {
      updatedList = prev.map(booking => 
        (booking.id === bookingId || booking.code === bookingId) ? { ...booking, ...updatedData } : booking
      );
      localStorage.setItem('bookingHistory', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('mvn_booking_sync'));
      return updatedList;
    });

    // A. Đồng bộ Server API
    pushServerSync({ bookings: updatedList });

    // B. Broadcast tức thì qua Cloud WebSockets tới Điện thoại
    broadcastEvent('BOOKINGS_UPDATED', { bookings: updatedList });

    // Gửi thông báo Web Push khi hoàn tất đơn lưu trú (Check-out)
    if (updatedData?.status === 'Đã hoàn tất' || updatedData?.status === 'check-out') {
      triggerBookingCompletedNotification({
        userId: updatedData.customerId || updatedData.customerPhone || 'ducan',
        bookingCode: bookingId,
        petNames: updatedData.catNames || updatedData.petName || 'Bé mèo',
      });
    }

    // C. Cập nhật Supabase nền
    (async () => {
      try {
        const { data: existingRows } = await supabase
          .from('bookings')
          .select('id, data')
          .or(`id.eq.${bookingId},code.eq.${bookingId}`);

        if (existingRows && existingRows.length > 0) {
          const target = existingRows[0];
          await supabase.from('bookings').update({
            data: { ...(target.data || {}), ...updatedData },
          }).eq('id', target.id);
        }
      } catch (e) {
        console.warn('Lỗi update Supabase bookings:', e);
      }
    })();
  };


  // ── 6. Kênh đồng bộ thông báo quy trình phê duyệt giữa các tab ──
  const channelRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return undefined;
    const channel = new BroadcastChannel(REALTIME_CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const data = event.data;
      if (data?.type === 'BOOKING_SYNC' && data.notifyMessage) {
        toast(data.notifyMessage, { icon: '⚡', duration: 4000 });
      }
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const broadcastSync = useCallback((action, bookingId, notifyMessage = '') => {
    channelRef.current?.postMessage({
      type: 'BOOKING_SYNC',
      action,
      bookingId,
      notifyMessage,
      timestamp: Date.now(),
    });
  }, []);

  const findBooking = (bookingId) =>
    bookingListRef.current.find(b => b.id === bookingId || b.code === bookingId);

  // ── 7. ADMIN: Check-in (UPCOMING -> IN_HOUSE) ──
  const adminCheckIn = (bookingId) => {
    const booking = findBooking(bookingId);
    if (!booking) return;
    if (getBookingStatus(booking) !== BOOKING_STATUS.UPCOMING) {
      toast.error(`Chỉ có thể Check-in cho đơn hàng đang ở trạng thái 'Sắp tới' (Hiện tại: ${booking.status})`);
      return;
    }
    updateBooking(bookingId, { status: BOOKING_STATUS.IN_HOUSE, checkedInAt: new Date().toISOString() });
    broadcastSync('CHECK_IN', bookingId, `Đơn hàng #${bookingId} đã Check-in sang 'Đang lưu trú' thành công!`);
    toast.success(`Check-in thành công đơn hàng #${bookingId}`);
  };

  // ── 8. ADMIN: Check-out (IN_HOUSE -> COMPLETED) ──
  const adminCheckOut = (bookingId) => {
    const booking = findBooking(bookingId);
    if (!booking) return;
    if (getBookingStatus(booking) !== BOOKING_STATUS.IN_HOUSE) {
      toast.error(`Chỉ có thể Check-out cho đơn hàng đang ở trạng thái 'Đang lưu trú'`);
      return;
    }
    updateBooking(bookingId, { status: BOOKING_STATUS.COMPLETED, checkedOutAt: new Date().toISOString() });
    broadcastSync('CHECK_OUT', bookingId, `Đơn hàng #${bookingId} đã Check-out hoàn tất!`);
    toast.success(`Check-out thành công đơn hàng #${bookingId}. Kỳ lưu trú đã kết thúc.`);
  };

  // ── 9. ADMIN: Gửi đề xuất Đổi lịch / Hủy đơn (-> PENDING_CUSTOMER_APPROVAL) ──
  const adminProposeChange = (bookingId, proposalData) => {
    const booking = findBooking(bookingId);
    if (!booking) return;
    const { type, newCheckIn, newCheckOut, reason } = proposalData;
    updateBooking(bookingId, {
      previous_status: getBookingStatus(booking),
      status: BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL,
      pending_changes: {
        type, // 'RESCHEDULE' hoặc 'CANCEL'
        proposedBy: 'admin',
        oldCheckIn: booking.checkIn,
        oldCheckOut: booking.checkOut,
        newCheckIn: newCheckIn || booking.checkIn,
        newCheckOut: newCheckOut || booking.checkOut,
        reason: reason || 'Thay đổi theo quy trình vận hành của Pet Hotel.',
        timestamp: new Date().toISOString(),
      },
    });
    const actionName = type === 'CANCEL' ? 'Hủy đơn' : 'Đổi lịch';
    const msg = `Admin đã gửi đề xuất ${actionName} cho đơn #${bookingId} (Chờ khách duyệt)`;
    broadcastSync('PROPOSE_CHANGE', bookingId, msg);
    toast.success(msg);
  };

  // ── 10. ADMIN: Rút lại đề xuất trước khi khách phản hồi ──
  const adminCancelProposal = (bookingId) => {
    const booking = findBooking(bookingId);
    if (!booking || getBookingStatus(booking) !== BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL) return;
    updateBooking(bookingId, {
      status: booking.previous_status || BOOKING_STATUS.UPCOMING,
      pending_changes: null,
    });
    broadcastSync('CANCEL_PROPOSAL', bookingId, `Admin đã hủy yêu cầu đề xuất cho đơn #${bookingId}`);
    toast.success('Đã hủy yêu cầu đề xuất, đơn trở về trạng thái trước đó.');
  };

  // ── 11. KHÁCH HÀNG: Chấp thuận đề xuất từ Admin ──
  const customerAcceptProposal = (bookingId) => {
    const booking = findBooking(bookingId);
    if (!booking || !booking.pending_changes) return;
    const changes = booking.pending_changes;
    let updatedFields = { status: booking.previous_status || BOOKING_STATUS.UPCOMING };

    if (changes.type === 'CANCEL') {
      updatedFields = {
        status: BOOKING_STATUS.CANCELLED,
        cancelReason: `Admin đề xuất hủy đã được khách chấp thuận: ${changes.reason || ''}`,
      };
    } else if (changes.type === 'RESCHEDULE') {
      updatedFields.checkIn = changes.newCheckIn;
      updatedFields.checkOut = changes.newCheckOut;
    }

    updateBooking(bookingId, { ...updatedFields, pending_changes: null });
    broadcastSync('CUSTOMER_ACCEPT', bookingId, `Khách hàng đã chấp nhận thay đổi cho đơn hàng #${bookingId}`);
    toast.success(changes.type === 'CANCEL' ? 'Bạn đã xác nhận hủy đơn theo đề xuất từ Admin.' : 'Bạn đã xác nhận thay đổi lịch thành công!');
  };

  // ── 12. KHÁCH HÀNG: Từ chối đề xuất từ Admin ──
  const customerRejectProposal = (bookingId) => {
    const booking = findBooking(bookingId);
    if (!booking) return;
    updateBooking(bookingId, {
      status: booking.previous_status || BOOKING_STATUS.UPCOMING,
      pending_changes: null,
    });
    broadcastSync('CUSTOMER_REJECT', bookingId, `Khách hàng đã từ chối yêu cầu thay đổi cho đơn hàng #${bookingId}`);
    toast.success('Bạn đã từ chối đề xuất. Lịch đặt cũ được giữ nguyên.');
  };

  // ── 13. KHÁCH HÀNG: Tự đổi lịch (CHỈ KHI UPCOMING) ──
  const customerReschedule = (bookingId, { newCheckIn, newCheckOut }) => {
    const booking = findBooking(bookingId);
    if (!booking) return;
    if (getBookingStatus(booking) !== BOOKING_STATUS.UPCOMING) {
      toast.error('Chỉ được phép đổi lịch khi đơn đặt phòng đang ở trạng thái Sắp tới (Chưa Check-in).');
      return;
    }
    updateBooking(bookingId, {
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      rescheduledAt: new Date().toISOString(),
    });
    broadcastSync('CUSTOMER_RESCHEDULE', bookingId, `Khách hàng đã tự đổi lịch cho đơn #${bookingId} sang ngày ${newCheckIn} - ${newCheckOut}`);
    toast.success('Đã cập nhật lịch mới thành công!');
  };

  // ── 14. KHÁCH HÀNG: Tự hủy đơn (CHỈ KHI UPCOMING) ──
  const customerCancel = (bookingId, reason = 'Khách hàng tự hủy') => {
    const booking = findBooking(bookingId);
    if (!booking) return;
    if (getBookingStatus(booking) !== BOOKING_STATUS.UPCOMING) {
      toast.error('Chỉ được phép hủy đơn khi đơn đặt phòng đang ở trạng thái Sắp tới (Chưa Check-in).');
      return;
    }
    updateBooking(bookingId, {
      status: BOOKING_STATUS.CANCELLED,
      cancelReason: reason,
      cancelledAt: new Date().toISOString(),
    });
    broadcastSync('CUSTOMER_CANCEL', bookingId, `Khách hàng đã hủy đơn đặt #${bookingId}. Lý do: ${reason}`);
    toast.success('Đơn đặt phòng đã được hủy thành công.');
  };

  // Reset về dữ liệu mẫu để thuận tiện kiểm thử
  const resetDefaultBookings = () => {
    localStorage.setItem('bookingHistory', JSON.stringify(INITIAL_DEMO_BOOKINGS));
    setGlobalBookingList(INITIAL_DEMO_BOOKINGS);
    window.dispatchEvent(new Event('mvn_booking_sync'));
    broadcastSync('RESET', null, 'Đã đặt lại danh sách đơn hàng về mặc định!');
    toast.success('Đã khôi phục dữ liệu mẫu kiểm thử.');
  };

  return (
    <BookingHistoryContext.Provider
      value={{
        globalBookingList,
        addBooking,
        upsertBooking,
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


/**
 * Kiểm tra xem một booking có thuộc về khách hàng đang đăng nhập hay không
 * @param {object} booking - Dữ liệu đơn đặt
 * @param {object} customer - Thông tin khách hàng hiện tại
 * @param {boolean} isAdmin - Nếu là admin thì xem được tất cả
 */
export const isBookingOfCustomer = (booking, customer, isAdmin = false) => {
  if (isAdmin) return true;
  if (!customer || !booking) return false;

  // 1. So khớp theo ID khách hàng
  const targetId = customer.id || customer.customerId;
  if (targetId && (booking.customerId === targetId || booking.customer_id === targetId)) {
    return true;
  }

  // 2. So khớp theo Số điện thoại
  const targetPhone = customer.phone?.replace(/\D/g, '');
  if (targetPhone) {
    const bPhone = (booking.customerPhone || booking.ownerPhone || booking.phone)?.replace(/\D/g, '');
    if (bPhone && bPhone === targetPhone) {
      return true;
    }
  }

  // 3. So khớp theo Email
  const targetEmail = customer.email?.trim().toLowerCase();
  if (targetEmail) {
    const bEmail = (booking.customerEmail || booking.email)?.trim().toLowerCase();
    if (bEmail && bEmail === targetEmail) {
      return true;
    }
  }

  return false;
};
