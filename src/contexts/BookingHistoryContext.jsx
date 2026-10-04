import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { triggerBookingConfirmedNotification, triggerBookingCompletedNotification } from '../services/notificationTriggers';
import {
  fetchServerSync,
  pushServerSync,
  broadcastEvent,
  subscribeSyncEvents,
} from '../services/crossDeviceSync';

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

  return (
    <BookingHistoryContext.Provider value={{ globalBookingList, addBooking, upsertBooking, updateBooking }}>
      {children}
    </BookingHistoryContext.Provider>
  );
};

export const useBookingHistory = () => useContext(BookingHistoryContext);

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
