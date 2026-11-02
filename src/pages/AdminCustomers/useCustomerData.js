import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { fetchServerSync, subscribeSyncEvents } from '../../services/crossDeviceSync';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { buildCustomers } from './customerUtils';
import { fromPetRow } from '../../utils/petRows';

const REFRESH_MS = 15000;
const QUERY_TIMEOUT_MS = 8000;
const EMPTY = { profiles: [], bookings: [], pets: [] };

// Đọc thêm từ các bảng Supabase (nếu RLS cho phép admin đọc); lỗi thì bỏ qua
async function loadFromSupabase() {
  // Supabase không phản hồi (mất mạng, bị chặn) thì bỏ qua sau một lúc để trang không bị treo
  const safe = async (query) => {
    try {
      const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null }), QUERY_TIMEOUT_MS));
      const { data, error } = await Promise.race([query, timeout]);
      return !error && Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const [profiles, pets, bookings] = await Promise.all([
    safe(supabase.from('customer_profiles').select('*')),
    safe(supabase.from('pets').select('*')),
    safe(supabase.from('bookings').select('*')),
  ]);

  return {
    profiles: profiles.map((p) => ({
      id: p.id,
      fullName: p.full_name,
      phone: p.phone,
      email: p.email,
      createdAt: p.created_at,
    })),
    pets: pets.map(fromPetRow),
    bookings: bookings.map((row) => ({
      id: row.id,
      code: row.code,
      customerId: row.customer_id,
      createdAt: row.created_at,
      ...row.data,
    })),
  };
}

/**
 * Dữ liệu khách hàng cho trang Admin: gom từ server đồng bộ (/api/sync), bảng Supabase
 * và dữ liệu đang có trên trình duyệt; tự làm mới khi khách đặt phòng hoặc tạo hồ sơ mèo.
 */
export default function useCustomerData() {
  const { globalBookingList = [] } = useBookingHistory() || {};
  const { petList = [] } = usePetProfile() || {};
  const { authenticatedCustomer } = useCustomerProfile() || {};

  const [server, setServer] = useState(EMPTY);
  const [db, setDb] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      // Server đồng bộ thường trả về nhanh hơn Supabase, nên hiển thị ngay khi có
      const serverTask = fetchServerSync().then((serverData) => {
        if (serverData) {
          setServer({
            profiles: serverData.profiles || [],
            bookings: serverData.bookings || [],
            pets: serverData.pets || [],
          });
        }
        setLastSyncedAt(new Date());
        setLoading(false);
      });
      await Promise.all([serverTask, loadFromSupabase().then(setDb)]);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);

    let debounce = null;
    const scheduleRefresh = () => {
      clearTimeout(debounce);
      debounce = setTimeout(refresh, 600);
    };
    const unsubscribe = subscribeSyncEvents(({ type }) => {
      if (type !== 'REQUEST_SYNC') scheduleRefresh();
    });
    window.addEventListener('mvn_booking_sync', scheduleRefresh);
    window.addEventListener('focus', scheduleRefresh);

    return () => {
      clearInterval(timer);
      clearTimeout(debounce);
      unsubscribe();
      window.removeEventListener('mvn_booking_sync', scheduleRefresh);
      window.removeEventListener('focus', scheduleRefresh);
    };
  }, [refresh]);

  const customers = useMemo(
    () => buildCustomers({
      profiles: [...db.profiles, ...server.profiles],
      bookings: [...db.bookings, ...globalBookingList, ...server.bookings],
      pets: [...db.pets, ...petList, ...server.pets],
      excludeIds: [authenticatedCustomer?.id],
    }),
    [db, server, globalBookingList, petList, authenticatedCustomer?.id]
  );

  return { customers, loading, lastSyncedAt, refresh };
}
