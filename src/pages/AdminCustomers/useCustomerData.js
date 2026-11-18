import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { fetchServerSync, subscribeSyncEvents } from '../../services/crossDeviceSync';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { buildCustomers } from './customerUtils';
import { fromPetRow } from '../../utils/petRows';
import { readAdminCustomerSnapshot, writeAdminCustomerSnapshot } from '../../utils/adminCustomerCache';

const REFRESH_MS = 15000;
const QUERY_TIMEOUT_MS = 8000;
const EMPTY = { profiles: [], bookings: [], pets: [] };

const caches = new Map();
const sourceRequests = new Map();

const storage = () => {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch (error) {
    console.warn('[AdminCustomerData] Session storage is unavailable:', error);
    return null;
  }
};

const getCache = (userId) => {
  const key = userId || 'anonymous';
  if (!caches.has(key)) {
    caches.set(key, userId ? readAdminCustomerSnapshot(storage(), userId) : {
      server: EMPTY,
      db: EMPTY,
      lastSyncedAt: null,
    });
  }
  return caches.get(key);
};

const loadSharedSources = (userId) => {
  const key = userId || 'anonymous';
  if (sourceRequests.has(key)) return sourceRequests.get(key);

  const request = (async () => {
    try {
      return await Promise.all([fetchServerSync(), loadFromSupabase()]);
    } finally {
      if (sourceRequests.get(key) === request) sourceRequests.delete(key);
    }
  })();
  sourceRequests.set(key, request);
  return request;
};

async function loadFromSupabase() {
  const safe = async (table, query) => {
    let timeoutId;
    try {
      const timeout = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve({ timedOut: true }), QUERY_TIMEOUT_MS);
      });
      const result = await Promise.race([query, timeout]);
      if (result.timedOut) {
        console.warn(`[AdminCustomerData] Timed out loading ${table}`);
        return { data: [], succeeded: false };
      }
      if (result.error) {
        console.warn(`[AdminCustomerData] Unable to load ${table}:`, result.error.message);
        return { data: [], succeeded: false };
      }
      return { data: Array.isArray(result.data) ? result.data : [], succeeded: true };
    } catch (error) {
      console.warn(`[AdminCustomerData] Unable to load ${table}:`, error);
      return { data: [], succeeded: false };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const [profilesResult, petsResult] = await Promise.all([
    safe('customer_profiles', supabase.from('customer_profiles').select('id,full_name,phone,email,created_at')),
    safe('pets', supabase.from('pets').select('id,customer_id,name,data,created_at,updated_at')),
  ]);

  return {
    profiles: profilesResult.data.map((p) => ({
      id: p.id,
      fullName: p.full_name,
      phone: p.phone,
      email: p.email,
      createdAt: p.created_at,
    })),
    profileQuerySucceeded: profilesResult.succeeded,
    pets: petsResult.data.map(fromPetRow),
    petsQuerySucceeded: petsResult.succeeded,
  };
}

const NO_PROFILES = [];

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
  const { globalBookingList = [], bookingDataReady = false } = useBookingHistory() || {};
  const { petList = [] } = usePetProfile() || {};
  const { authenticatedCustomer } = useCustomerProfile() || {};
  const userId = authenticatedCustomer?.id || null;
  const bookingDataReadyRef = useRef(bookingDataReady);
  bookingDataReadyRef.current = bookingDataReady;
  const previousBookingDataReady = useRef(bookingDataReady);
  const currentUserId = useRef(userId);
  currentUserId.current = userId;

  const [state, setState] = useState(() => {
    const cached = getCache(userId);
    return {
      ownerId: userId,
      server: cached.server,
      db: cached.db,
      loading: !cached.lastSyncedAt,
      hasData: Boolean(cached.lastSyncedAt),
      lastSyncedAt: cached.lastSyncedAt,
      error: '',
    };
  });
  const activeCache = state.ownerId === userId ? state : {
    ...getCache(userId),
    ownerId: userId,
    loading: !getCache(userId).lastSyncedAt,
    hasData: Boolean(getCache(userId).lastSyncedAt),
    error: '',
  };
  const [patchVersion, setPatchVersion] = useState(0);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const refreshRef = useRef(null);

  const refresh = useCallback(async () => {
    // Đang tải dở thì không bỏ lượt: tải thêm 1 lần ngay sau đó để lấy trạng thái mới nhất (vd. vừa check-out)
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    inFlight.current = true;
    if (currentUserId.current === userId && !getCache(userId).lastSyncedAt) {
      setState((previous) => previous.ownerId === userId
        ? { ...previous, loading: true, error: '' }
        : previous);
    }
    try {
      const [serverData, dbData] = await loadSharedSources(userId);
      const cached = getCache(userId);

      if (serverData) {
        cached.server = {
          profiles: Array.isArray(serverData.profiles) ? serverData.profiles : [],
          bookings: Array.isArray(serverData.bookings) ? serverData.bookings : [],
          pets: Array.isArray(serverData.pets) ? serverData.pets : [],
        };
      }
      cached.db = {
        profiles: dbData.profileQuerySucceeded ? dbData.profiles : cached.db.profiles,
        bookings: cached.db.bookings,
        pets: dbData.petsQuerySucceeded ? dbData.pets : cached.db.pets,
      };

      const hasAuthoritativeData = Boolean(serverData) || bookingDataReadyRef.current;
      if (hasAuthoritativeData) {
        cached.lastSyncedAt = new Date();
        writeAdminCustomerSnapshot(storage(), userId, cached);
      }

      if (currentUserId.current === userId) {
        setState({
          ownerId: userId,
          ...cached,
          loading: false,
          hasData: Boolean(cached.lastSyncedAt),
          error: cached.lastSyncedAt
            ? ''
            : 'Không thể xác nhận dữ liệu thống kê từ máy chủ. Hãy thử tải lại.',
        });
      }
    } finally {
      inFlight.current = false;
      if (currentUserId.current === userId) {
        const cached = getCache(userId);
        setState((previous) => previous.ownerId === userId
          ? { ...previous, loading: false }
          : previous);
        if (!cached.lastSyncedAt) {
          setState((previous) => previous.ownerId === userId
            ? { ...previous, error: 'Không thể xác nhận dữ liệu thống kê từ máy chủ. Hãy thử tải lại.' }
            : previous);
        }
      }
      if (queued.current) {
        queued.current = false;
        refreshRef.current?.();
      }
    }
  }, [userId]);
  refreshRef.current = refresh;

  useEffect(() => {
    const cached = getCache(userId);
    setState({
      ownerId: userId,
      ...cached,
      loading: !cached.lastSyncedAt,
      hasData: Boolean(cached.lastSyncedAt),
      error: '',
    });
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
  }, [refresh, userId]);

  useEffect(() => {
    const becameReady = bookingDataReady && !previousBookingDataReady.current;
    previousBookingDataReady.current = bookingDataReady;
    if (becameReady && !inFlight.current && !getCache(userId).lastSyncedAt) {
      refreshRef.current?.();
    }
  }, [bookingDataReady, userId]);

  const customers = useMemo(
    () => buildCustomers({
      profiles: [...activeCache.db.profiles, ...extraProfiles, ...activeCache.server.profiles],
      bookings: applyPatches([...activeCache.db.bookings, ...globalBookingList, ...activeCache.server.bookings]),
      pets: [...activeCache.db.pets, ...petList, ...activeCache.server.pets],
      excludeIds: [authenticatedCustomer?.id],
      excludePhones: [authenticatedCustomer?.phone],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCache, extraProfiles, globalBookingList, petList, authenticatedCustomer?.id, authenticatedCustomer?.phone, patchVersion]
  );

  return {
    customers,
    loading: activeCache.loading,
    hasData: activeCache.hasData,
    error: activeCache.error,
    lastSyncedAt: activeCache.lastSyncedAt,
    refresh,
  };
}
