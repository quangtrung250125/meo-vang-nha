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

const NO_PROFILES = [];

// Dữ liệu lần tải gần nhất, dùng chung giữa trang Khách hàng và Tổng quan: chuyển trang là có số liệu ngay,
// không phải chờ tải lại từ đầu (trước đây mỗi lần mở trang đều bắt đầu từ 0)
const cache = { server: EMPTY, db: EMPTY, lastSyncedAt: null };

// Đơn admin vừa thay đổi trên máy này (check-in, check-out, thanh toán, hủy) nhưng máy chủ có thể chưa trả về:
// áp lên số liệu ngay để thẻ số liệu khớp thời gian thực, tự bỏ khi máy chủ đã có trạng thái mới
const PATCH_TTL_MS = 2 * 60 * 1000;
const patches = new Map();

const patchListeners = new Set();

// Nghe ở cấp module (không phụ thuộc trang đang mở): admin check-out ở Tình trạng phòng rồi mới chuyển sang
// Khách hàng / Tổng quan thì số liệu vẫn đã có thay đổi đó
if (typeof window !== 'undefined') {
  window.addEventListener('mvn_booking_patched', (e) => {
    const { code, updates } = e.detail || {};
    if (!code || !updates) return;
    patches.set(code, { updates: { ...patches.get(code)?.updates, ...updates }, at: Date.now() });
    patchListeners.forEach((fn) => fn());
  });
}

const applyPatches = (list) => {
  if (patches.size === 0) return list;
  const now = Date.now();
  patches.forEach((p, code) => {
    if (now - p.at > PATCH_TTL_MS) patches.delete(code);
  });
  return list.map((b) => {
    const p = patches.get(b?.code || b?.id);
    return p ? { ...b, ...p.updates } : b;
  });
};

/**
 * Dữ liệu khách hàng cho trang Admin: gom từ server đồng bộ (/api/sync), bảng Supabase
 * và dữ liệu đang có trên trình duyệt; tự làm mới khi khách đặt phòng hoặc tạo hồ sơ mèo.
 * extraProfiles: họ tên / SĐT tài khoản khách do máy chủ đọc thêm (vd. trang Marketing).
 */
export default function useCustomerData({ extraProfiles = NO_PROFILES } = {}) {
  const { globalBookingList = [] } = useBookingHistory() || {};
  const { petList = [] } = usePetProfile() || {};
  const { authenticatedCustomer } = useCustomerProfile() || {};

  const [server, setServer] = useState(cache.server);
  const [db, setDb] = useState(cache.db);
  const [loading, setLoading] = useState(!cache.lastSyncedAt);
  const [lastSyncedAt, setLastSyncedAt] = useState(cache.lastSyncedAt);
  const [patchVersion, setPatchVersion] = useState(0);
  const inFlight = useRef(false);
  const queued = useRef(false);

  const refresh = useCallback(async () => {
    // Đang tải dở thì không bỏ lượt: tải thêm 1 lần ngay sau đó để lấy trạng thái mới nhất (vd. vừa check-out)
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    inFlight.current = true;
    try {
      // Server đồng bộ thường trả về nhanh hơn Supabase, nên hiển thị ngay khi có
      const serverTask = fetchServerSync().then((serverData) => {
        if (serverData) {
          cache.server = {
            profiles: serverData.profiles || [],
            bookings: serverData.bookings || [],
            pets: serverData.pets || [],
          };
          setServer(cache.server);
        }
        cache.lastSyncedAt = new Date();
        setLastSyncedAt(cache.lastSyncedAt);
        setLoading(false);
      });
      const dbTask = loadFromSupabase().then((data) => {
        cache.db = data;
        setDb(data);
      });
      await Promise.all([serverTask, dbTask]);
    } finally {
      inFlight.current = false;
      setLoading(false);
      if (queued.current) {
        queued.current = false;
        refresh();
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);

    let debounce = null;
    const scheduleRefresh = () => {
      clearTimeout(debounce);
      debounce = setTimeout(refresh, 300);
    };
    const unsubscribe = subscribeSyncEvents(({ type }) => {
      if (type !== 'REQUEST_SYNC') scheduleRefresh();
    });
    const onPatched = () => {
      setPatchVersion((v) => v + 1);
      scheduleRefresh();
    };
    patchListeners.add(onPatched);
    window.addEventListener('mvn_booking_sync', scheduleRefresh);
    window.addEventListener('focus', scheduleRefresh);

    return () => {
      clearInterval(timer);
      clearTimeout(debounce);
      unsubscribe();
      window.removeEventListener('mvn_booking_sync', scheduleRefresh);
      patchListeners.delete(onPatched);
      window.removeEventListener('focus', scheduleRefresh);
    };
  }, [refresh]);

  const customers = useMemo(
    () => buildCustomers({
      profiles: [...db.profiles, ...extraProfiles, ...server.profiles],
      bookings: applyPatches([...db.bookings, ...globalBookingList, ...server.bookings]),
      pets: [...db.pets, ...petList, ...server.pets],
      excludeIds: [authenticatedCustomer?.id],
      excludePhones: [authenticatedCustomer?.phone],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, server, extraProfiles, globalBookingList, petList, authenticatedCustomer?.id, authenticatedCustomer?.phone, patchVersion]
  );

  return { customers, loading, lastSyncedAt, refresh };
}
