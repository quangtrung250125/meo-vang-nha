import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { triggerBookingConfirmedNotification, triggerBookingCompletedNotification, sendNotification } from '../services/notificationTriggers';
import {
  fetchServerSync,
  pushServerSync,
  broadcastEvent,
  subscribeSyncEvents,
  getAuthHeaders,
} from '../services/crossDeviceSync';
import {
  BOOKING_STATUS,
  STORED_STATUS,
  PROPOSAL_TYPE,
  PROPOSAL_LABEL,
  normalizeStatusValue,
  isClosedStatus,
  REALTIME_CHANNEL,
} from '../utils/bookingStatus';
import { withoutDemoBookings } from '../utils/demoBookings';

const BookingHistoryContext = createContext();

export const BookingHistoryProvider = ({ children }) => {
  const [globalBookingList, setRawBookingList] = useState(() => {
    const saved = localStorage.getItem('bookingHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Xoá các đơn mẫu cũ còn sót trong trình duyệt (không tồn tại trên server nên không hủy/đổi được)
          const cleaned = withoutDemoBookings(parsed);
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('bookingHistory', JSON.stringify(cleaned));
          }
          // Chuẩn hóa trạng thái cho các đơn hàng cũ
          return cleaned.map(b => ({
            ...b,
            pending_changes: b.pending_changes || null,
          }));
        }
      } catch (e) {
        console.error('Lỗi phân tích bookingHistory:', e);
      }
    }
    return [];
  });

  // Mọi nguồn dữ liệu (localStorage, server, Supabase, thiết bị khác) đều đi qua đây để lọc đơn mẫu
  const setGlobalBookingList = useCallback((next) => {
    setRawBookingList((prev) => withoutDemoBookings(typeof next === 'function' ? next(prev) : next));
  }, []);

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

  // Ghi danh sách mới đồng bộ ngay (ref + state + localStorage) để các lệnh đồng bộ
  // phía sau (server, broadcast) luôn nhận đúng danh sách vừa cập nhật
  const commitList = (nextList) => {
    bookingListRef.current = nextList;
    setGlobalBookingList(nextList);
    try {
      localStorage.setItem('bookingHistory', JSON.stringify(nextList));
    } catch (e) {}
    window.dispatchEvent(new Event('mvn_booking_sync'));
  };

  // ── 3. Thêm booking mới ──
  const addBooking = (bookingData) => {
    const updatedList = [bookingData, ...bookingListRef.current];
    commitList(updatedList);

    // A. Đồng bộ Server API (chỉ đơn mới, tránh gửi kèm đơn khác đang có trong máy)
    pushServerSync({ bookings: [bookingData] });

    // B. Broadcast tức thì qua Cloud WebSockets tới Điện thoại
    broadcastEvent('BOOKINGS_UPDATED', { bookings: [bookingData] });

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
    let changedBooking = bookingData;
    {
      const prev = bookingListRef.current;
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
        changedBooking = updatedList[index];
      } else {
        updatedList = [safeBooking, ...prev];
        changedBooking = safeBooking;
      }

      commitList(updatedList);
    }

    // A. Đồng bộ Server API (chỉ đơn vừa thêm / cập nhật)
    pushServerSync({ bookings: [changedBooking] });

    // B. Broadcast tức thì qua Cloud WebSockets tới Điện thoại
    broadcastEvent('BOOKINGS_UPDATED', { bookings: [changedBooking] });

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
  // options.syncRoom = false khi thao tác xuất phát từ trang Tình trạng phòng (đã tự cập nhật kho phòng)
  const updateBooking = (bookingId, updatedData, { syncRoom = true } = {}) => {
    const target = bookingListRef.current.find(b => b.id === bookingId || b.code === bookingId);
    const updatedList = bookingListRef.current.map(booking =>
      (booking.id === bookingId || booking.code === bookingId) ? { ...booking, ...updatedData } : booking
    );
    commitList(updatedList);
    const changedBooking = updatedList.find(b => b.id === bookingId || b.code === bookingId);

    // A. Đồng bộ Server API
    pushServerSync({ bookings: changedBooking ? [changedBooking] : updatedList });

    // B. Broadcast tức thì qua Cloud WebSockets tới Điện thoại
    broadcastEvent('BOOKINGS_UPDATED', { bookings: changedBooking ? [changedBooking] : updatedList });

    // C. Đồng bộ kho phòng trung tâm (/api/bookings) để trang Tình trạng phòng cập nhật theo
    const roomId = target?.roomId || target?.selectedRoom?.id;
    if (syncRoom && roomId) {
      const roomFields = [
        'status', 'checkIn', 'checkOut', 'pending_changes', 'checkedInAt', 'checkedOutAt',
        'rescheduledAt', 'cancelReason', 'cancelledAt', 'cancelledBy',
        'selectedPackage', 'packages', 'adminNote', 'specialNote', 'noteUpdatedAt',
      ];
      const roomUpdates = Object.fromEntries(
        Object.entries(updatedData).filter(([key]) => roomFields.includes(key))
      );
      if (Object.keys(roomUpdates).length > 0) {
        (async () => {
          try {
            const res = await fetch('/api/bookings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
              body: JSON.stringify({ roomId, code: target.code || target.id, updates: roomUpdates }),
            });
            // Server từ chối (VD: phòng vừa hết chỗ, đã qua ngày nhận phòng) -> trả đơn về như trước
            if (!res.ok) {
              const json = await res.json().catch(() => ({}));
              const restored = Object.fromEntries(Object.keys(updatedData).map((key) => [key, target[key] ?? null]));
              const revertedList = bookingListRef.current.map(b =>
                (b.id === bookingId || b.code === bookingId) ? { ...b, ...restored } : b
              );
              commitList(revertedList);
              const revertedBooking = revertedList.find(b => b.id === bookingId || b.code === bookingId);
              if (revertedBooking) {
                pushServerSync({ bookings: [revertedBooking] });
                broadcastEvent('BOOKINGS_UPDATED', { bookings: [revertedBooking] });
              }
              toast.error(json.message || 'Máy chủ chưa ghi nhận thay đổi, vui lòng thử lại.');
            }
          } catch (e) {}
        })();
      }
    }

    // Gửi thông báo Web Push khi hoàn tất đơn lưu trú (Check-out)
    if (updatedData?.status === 'Đã hoàn tất' || updatedData?.status === 'check-out') {
      triggerBookingCompletedNotification({
        userId: target?.customerId || target?.customerPhone || 'ducan',
        bookingCode: bookingId,
        petNames: target?.catNames || target?.petName || 'Bé mèo',
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

  // Gửi Web Push tới tài khoản khách (không chặn luồng nếu server push chưa cấu hình)
  const pushToCustomer = (booking, title, body) => {
    sendNotification({
      userId: booking.customerId || booking.customerPhone || booking.ownerPhone || 'ducan',
      title,
      body,
      url: '/my-booking',
      tag: `booking-${booking.code || booking.id}`,
      data: { bookingId: booking.id },
    }).catch(() => {});
  };

  // ── 7. ADMIN: Check-in (Sắp tới -> Đang lưu trú) ──
  // options.syncRoom = false khi gọi từ trang Tình trạng phòng
  const adminCheckIn = (bookingId, options) => {
    const booking = findBooking(bookingId);
    if (!booking) return false;
    if (normalizeStatusValue(booking.status) !== BOOKING_STATUS.UPCOMING) {
      toast.error(`Chỉ có thể Check-in cho đơn đang ở trạng thái 'Sắp tới'`);
      return false;
    }
    // Check-in thì mọi đề xuất đổi lịch/hủy đang chờ không còn hiệu lực
    updateBooking(bookingId, {
      status: STORED_STATUS.IN_HOUSE,
      checkedInAt: new Date().toISOString(),
      pending_changes: null,
    }, options);
    broadcastSync('CHECK_IN', bookingId, `Đơn #${bookingId} đã Check-in → Đang lưu trú`);
    pushToCustomer(booking, '🏠 Bé đã được nhận phòng', `Đơn #${bookingId} đã Check-in. Bé đang lưu trú tại Mèo Vắng Nhà.`);
    return true;
  };

  // ── 8. ADMIN: Check-out (Đang lưu trú -> Đã hoàn thành) ──
  const adminCheckOut = (bookingId, options) => {
    const booking = findBooking(bookingId);
    if (!booking) return false;
    if (normalizeStatusValue(booking.status) !== BOOKING_STATUS.IN_HOUSE) {
      toast.error(`Chỉ có thể Check-out cho đơn đang ở trạng thái 'Đang lưu trú'`);
      return false;
    }
    updateBooking(bookingId, {
      status: STORED_STATUS.COMPLETED,
      checkedOutAt: new Date().toISOString(),
      pending_changes: null,
    }, options);
    broadcastSync('CHECK_OUT', bookingId, `Đơn #${bookingId} đã Check-out → Đã hoàn thành`);
    return true;
  };

  // ── 9. ADMIN: Gửi đề xuất Đổi lịch / Hủy / Thay đổi đơn ──
  // Đơn KHÔNG đổi ngay: chỉ lưu pending_changes, chờ khách bấm Đồng ý
  const adminProposeChange = (bookingId, proposalData) => {
    const booking = findBooking(bookingId);
    if (!booking) return false;
    if (isClosedStatus(booking.status)) {
      toast.error('Đơn đã kết thúc, không thể gửi đề xuất.');
      return false;
    }
    const { type, newCheckIn, newCheckOut, newPackageName, note, reason } = proposalData;
    if (type !== PROPOSAL_TYPE.UPDATE && normalizeStatusValue(booking.status) !== BOOKING_STATUS.UPCOMING) {
      toast.error('Chỉ đề xuất Đổi lịch/Hủy đơn khi đơn chưa Check-in.');
      return false;
    }

    updateBooking(bookingId, {
      pending_changes: {
        type,
        proposedBy: 'admin',
        oldCheckIn: booking.checkIn,
        oldCheckOut: booking.checkOut,
        newCheckIn: newCheckIn || booking.checkIn,
        newCheckOut: newCheckOut || booking.checkOut,
        oldPackageName: booking.selectedPackage?.name || booking.packages?.[0] || '',
        newPackageName: newPackageName || '',
        note: note || '',
        reason: reason || 'Thay đổi theo quy trình vận hành của Pet Hotel.',
        timestamp: new Date().toISOString(),
      },
    });

    const label = PROPOSAL_LABEL[type] || 'Thay đổi';
    const msg = `Admin đã gửi đề xuất ${label} cho đơn #${bookingId} (Chờ khách xác nhận)`;
    broadcastSync('PROPOSE_CHANGE', bookingId, msg);
    pushToCustomer(booking, `📩 Admin đề xuất ${label.toLowerCase()} đơn #${bookingId}`, `${reason || ''} Vui lòng mở "Lịch đặt của tôi" để xác nhận.`.trim());
    toast.success(msg);
    return true;
  };

  // ── 10. ADMIN: Rút lại đề xuất trước khi khách phản hồi ──
  const adminCancelProposal = (bookingId) => {
    const booking = findBooking(bookingId);
    if (!booking || !booking.pending_changes) return false;
    updateBooking(bookingId, { pending_changes: null });
    broadcastSync('CANCEL_PROPOSAL', bookingId, `Admin đã rút lại đề xuất cho đơn #${bookingId}`);
    toast.success('Đã rút lại đề xuất, đơn giữ nguyên như cũ.');
    return true;
  };

  // ── 11. KHÁCH HÀNG: Đồng ý đề xuất từ Admin -> lúc này đơn mới thực sự thay đổi ──
  const customerAcceptProposal = (bookingId) => {
    const booking = findBooking(bookingId);
    if (!booking || !booking.pending_changes) return false;
    const changes = booking.pending_changes;
    const updatedFields = { pending_changes: null };

    if (changes.type === PROPOSAL_TYPE.CANCEL) {
      updatedFields.status = STORED_STATUS.CANCELLED;
      updatedFields.cancelReason = `Admin đề xuất hủy, khách đã đồng ý: ${changes.reason || ''}`;
      updatedFields.cancelledAt = new Date().toISOString();
      updatedFields.cancelledBy = 'admin';
    } else if (changes.type === PROPOSAL_TYPE.RESCHEDULE) {
      updatedFields.checkIn = changes.newCheckIn;
      updatedFields.checkOut = changes.newCheckOut;
      updatedFields.rescheduledAt = new Date().toISOString();
    } else if (changes.type === PROPOSAL_TYPE.UPDATE) {
      if (changes.newPackageName) {
        updatedFields.selectedPackage = { ...(booking.selectedPackage || {}), name: changes.newPackageName };
        updatedFields.packages = [changes.newPackageName, ...(booking.packages || []).slice(1)];
      }
      if (changes.note) updatedFields.adminNote = changes.note;
    }

    updateBooking(bookingId, updatedFields);
    broadcastSync('CUSTOMER_ACCEPT', bookingId, `Khách hàng đã đồng ý ${PROPOSAL_LABEL[changes.type] || 'thay đổi'} cho đơn #${bookingId}`);
    toast.success(changes.type === PROPOSAL_TYPE.CANCEL ? 'Bạn đã xác nhận hủy đơn theo đề xuất từ Admin.' : 'Bạn đã xác nhận thay đổi thành công!');
    return true;
  };

  // ── 12. KHÁCH HÀNG: Từ chối đề xuất -> giữ nguyên đơn ──
  const customerRejectProposal = (bookingId) => {
    const booking = findBooking(bookingId);
    if (!booking || !booking.pending_changes) return false;
    const changes = booking.pending_changes;
    updateBooking(bookingId, { pending_changes: null });
    broadcastSync('CUSTOMER_REJECT', bookingId, `Khách hàng đã từ chối ${PROPOSAL_LABEL[changes.type] || 'thay đổi'} cho đơn #${bookingId}`);
    toast.success('Bạn đã từ chối đề xuất. Đơn đặt được giữ nguyên.');
    return true;
  };

  // Khách chỉ tự thao tác khi đơn còn "Sắp tới" (chưa Check-in)
  const ensureCustomerCanModify = (booking, action) => {
    if (normalizeStatusValue(booking.status) !== BOOKING_STATUS.UPCOMING) {
      toast.error(`Chỉ được ${action} khi đơn đang ở trạng thái Sắp tới (chưa Check-in).`);
      return false;
    }
    return true;
  };

  // ── 13. KHÁCH HÀNG: Tự đổi lịch ──
  const customerReschedule = (bookingId, { newCheckIn, newCheckOut }) => {
    const booking = findBooking(bookingId);
    if (!booking || !ensureCustomerCanModify(booking, 'đổi lịch')) return false;
    updateBooking(bookingId, {
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      rescheduledAt: new Date().toISOString(),
      // Lịch đã đổi nên đề xuất cũ của Admin (nếu có) không còn phù hợp
      pending_changes: null,
    });
    broadcastSync('CUSTOMER_RESCHEDULE', bookingId, `Khách hàng đã đổi lịch đơn #${bookingId} sang ${newCheckIn} → ${newCheckOut}`);
    toast.success('Đã cập nhật lịch mới thành công!');
    return true;
  };

  // ── 14. KHÁCH HÀNG: Tự hủy đơn ──
  const customerCancel = (bookingId, reason = 'Khách hàng tự hủy') => {
    const booking = findBooking(bookingId);
    if (!booking || !ensureCustomerCanModify(booking, 'hủy đơn')) return false;
    updateBooking(bookingId, {
      status: STORED_STATUS.CANCELLED,
      cancelReason: reason,
      cancelledAt: new Date().toISOString(),
      cancelledBy: 'customer',
      pending_changes: null,
    });
    broadcastSync('CUSTOMER_CANCEL', bookingId, `Khách hàng đã hủy đơn #${bookingId}. Lý do: ${reason}`);
    toast.success('Đơn đặt phòng đã được hủy thành công.');
    return true;
  };

  // ── 15. KHÁCH HÀNG: Cập nhật yêu cầu đặc biệt cho đơn (Admin thấy ngay ở Tình trạng phòng) ──
  const customerUpdateNote = (bookingId, specialNote) => {
    const booking = findBooking(bookingId);
    if (!booking) return false;
    if (isClosedStatus(booking.status)) {
      toast.error('Đơn đã kết thúc, không thể cập nhật yêu cầu.');
      return false;
    }
    updateBooking(bookingId, { specialNote, noteUpdatedAt: new Date().toISOString() });
    broadcastSync('CUSTOMER_NOTE', bookingId, `Khách hàng đã cập nhật yêu cầu đặc biệt cho đơn #${bookingId}`);
    toast.success('Đã gửi yêu cầu đặc biệt tới Mèo Vắng Nhà.');
    return true;
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
        customerUpdateNote,
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
