import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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

  // Đồng bộ Realtime với bảng bookings trong Supabase
  useEffect(() => {
    let isMounted = true;

    // 1. Tải danh sách đơn đặt từ Supabase
    const fetchSupabaseBookings = async () => {
      try {
        const { data, error } = await supabase.from('bookings').select('*');
        if (!error && Array.isArray(data) && isMounted) {
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

    fetchSupabaseBookings();

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

  const addBooking = (bookingData) => {
    setGlobalBookingList(prev => {
      const newList = [bookingData, ...prev];
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      window.dispatchEvent(new Event('mvn_booking_sync'));
      return newList;
    });

    // Lưu vào Supabase nền
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id || bookingData.customerId || null;
        await supabase.from('bookings').upsert({
          id: bookingData.id || crypto.randomUUID(),
          customer_id: userId,
          code: bookingData.code || bookingData.id,
          data: bookingData,
        });
      } catch (e) {
        console.warn('Lỗi ghi Supabase bookings:', e);
      }
    })();
  };

  const upsertBooking = (bookingData) => {
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
        const updatedList = [...prev];
        updatedList[index] = { ...updatedList[index], ...safeBooking };
        localStorage.setItem('bookingHistory', JSON.stringify(updatedList));
        window.dispatchEvent(new Event('mvn_booking_sync'));
        return updatedList;
      }

      const newList = [safeBooking, ...prev];
      localStorage.setItem('bookingHistory', JSON.stringify(newList));
      window.dispatchEvent(new Event('mvn_booking_sync'));
      return newList;
    });

    // Lưu vào Supabase nền
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id || bookingData.customerId || null;
        await supabase.from('bookings').upsert({
          id: bookingData.id || crypto.randomUUID(),
          customer_id: userId,
          code: bookingData.code || bookingData.id,
          data: bookingData,
        });
      } catch (e) {
        console.warn('Lỗi upsert Supabase bookings:', e);
      }
    })();
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

    // Cập nhật Supabase nền
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
