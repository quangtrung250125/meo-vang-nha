import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { triggerCareLogUpdateNotification } from '../services/notificationTriggers';

// ─────────────────────────────────────────────────────────────
// Nhật ký lưu trú (care log)
// Trước đây chỉ lưu localStorage nên admin cập nhật trên máy admin thì khách không thấy.
// Giờ nhật ký được lưu vào chính đơn đặt phòng trên Supabase: bookings.data.careLogs = { [petId]: [log, ...] }
// và đồng bộ tức thì sang mọi thiết bị (Realtime broadcast + nghe thay đổi bảng bookings + tải lại định kỳ).
// localStorage chỉ còn là bộ nhớ đệm để mở trang nhanh / dùng khi mất mạng.
// ─────────────────────────────────────────────────────────────

const CareLogContext = createContext();

const STORAGE_KEY = 'careLogs';
const BROADCAST_CHANNEL = 'mvn_care_log_rt';
const BROADCAST_EVENT = 'CARE_LOGS_ADDED';
const REFRESH_INTERVAL_MS = 30000;

const BOOKING_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Cột id của bảng bookings là UUID: chỉ lọc theo id khi giá trị là UUID, nếu không thì lọc theo mã đơn
const bookingRowFilter = (value) =>
  BOOKING_UUID_RE.test(String(value)) ? `id.eq.${value},code.eq.${value}` : `code.eq.${value}`;

const logKeyOf = (bookingId, petId) => `${bookingId}_${petId}`;

const createLogId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

// Khóa nhận diện 1 dòng nhật ký (nhật ký cũ chưa có id thì dùng nội dung)
const entryIdentity = (log) => log?.id || `${log?.rawDate}|${log?.time}|${log?.type}|${log?.detail}`;

// Gộp 2 danh sách nhật ký, bỏ trùng, mới nhất lên đầu
export const mergeLogLists = (current = [], incoming = []) => {
  const seen = new Set();
  const merged = [];
  [...incoming, ...current].forEach((log) => {
    if (!log) return;
    const id = entryIdentity(log);
    if (seen.has(id)) return;
    seen.add(id);
    merged.push(log);
  });
  return merged.sort((a, b) => {
    if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
    return 0;
  });
};

// Gộp map { "booking_pet": [logs] }
const mergeLogMaps = (base, incoming) => {
  let changed = false;
  const next = { ...base };
  Object.entries(incoming || {}).forEach(([key, logs]) => {
    if (!Array.isArray(logs) || logs.length === 0) return;
    const merged = mergeLogLists(base[key] || [], logs);
    const before = base[key] || [];
    if (merged.length !== before.length || merged.some((l, i) => entryIdentity(l) !== entryIdentity(before[i]))) {
      next[key] = merged;
      changed = true;
    }
  });
  return changed ? next : base;
};

// Lấy nhật ký từ 1 dòng bookings thành map { "booking_pet": [logs] }
export const logMapFromBookingRow = (row) => {
  const data = row?.data || {};
  const careLogs = data.careLogs;
  if (!careLogs || typeof careLogs !== 'object') return {};
  const bookingIds = [...new Set([data.id, data.code, row.code].filter(Boolean))];
  const map = {};
  Object.entries(careLogs).forEach(([petId, logs]) => {
    if (!Array.isArray(logs)) return;
    bookingIds.forEach((bid) => {
      map[logKeyOf(bid, petId)] = logs;
    });
  });
  return map;
};

const readCache = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) || {} : {};
  } catch (e) {
    return {};
  }
};

// Nhãn ngày luôn tính lại theo ngày hiện tại ("Hôm nay" của hôm qua không còn là hôm nay)
export const getLogDayLabel = (log) => {
  const raw = log?.rawDate;
  if (!raw) return log?.date || 'Không rõ ngày';
  const now = new Date();
  const today = now.toLocaleDateString('vi-VN');
  const yesterday = new Date(now.getTime() - 86400000).toLocaleDateString('vi-VN');
  const short = raw.split('/').slice(0, 2).map((p) => p.padStart(2, '0')).join('/');
  if (raw === today) return `Hôm nay, ${short}`;
  if (raw === yesterday) return `Hôm qua, ${short}`;
  return raw;
};

/**
 * Ghi nhật ký của 1 đơn đặt phòng lên Supabase.
 * @param {string} bookingId
 * @param {Object<string, Array>} logsByPet  { [petId]: [log, ...] }
 * @returns {Promise<boolean>} true nếu đã lưu lên database
 */
export async function saveLogsToBooking(bookingId, logsByPet) {
  const { data: rows, error } = await supabase
    .from('bookings')
    .select('id, data')
    .or(bookingRowFilter(bookingId))
    .limit(1);
  if (error || !rows || rows.length === 0) return false;

  const row = rows[0];
  const careLogs = { ...((row.data && row.data.careLogs) || {}) };
  Object.entries(logsByPet).forEach(([petId, logs]) => {
    careLogs[petId] = mergeLogLists(careLogs[petId] || [], logs);
  });

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ data: { ...(row.data || {}), careLogs } })
    .eq('id', row.id);
  return !updateError;
}

export const CareLogProvider = ({ children }) => {
  const [careLogs, setCareLogs] = useState(readCache);
  const channelRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(careLogs));
    } catch (e) {}
  }, [careLogs]);

  const mergeIncoming = useCallback((incomingMap) => {
    setCareLogs((prev) => mergeLogMaps(prev, incomingMap));
  }, []);

  // Tải toàn bộ nhật ký từ database
  const refreshFromServer = useCallback(async () => {
    try {
      // Chỉ lấy phần nhật ký (đơn đặt phòng có thể chứa ảnh hồ sơ mèo rất nặng)
      const { data, error } = await supabase
        .from('bookings')
        .select('code, careLogs:data->careLogs, dataId:data->>id, dataCode:data->>code')
        .not('data->careLogs', 'is', null);
      if (error || !Array.isArray(data)) return;
      const map = {};
      data.forEach((row) =>
        Object.assign(
          map,
          logMapFromBookingRow({
            code: row.code,
            data: { careLogs: row.careLogs, id: row.dataId, code: row.dataCode },
          })
        )
      );
      mergeIncoming(map);
    } catch (e) {
      console.warn('[CareLog] Không tải được nhật ký từ Supabase:', e);
    }
  }, [mergeIncoming]);

  useEffect(() => {
    refreshFromServer();

    // 1. Kênh broadcast: admin lưu xong là khách nhận ngay
    const channel = supabase
      .channel(BROADCAST_CHANNEL, { config: { broadcast: { ack: false, self: false } } })
      .on('broadcast', { event: BROADCAST_EVENT }, ({ payload }) => {
        if (payload?.logs) mergeIncoming(payload.logs);
      })
      // 2. Nghe thay đổi bảng bookings (nếu Supabase đã bật Realtime cho bảng này)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload?.new) mergeIncoming(logMapFromBookingRow(payload.new));
      })
      .subscribe();
    channelRef.current = channel;

    // 3. Tải lại định kỳ + khi quay lại tab, phòng trường hợp mất kết nối realtime
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshFromServer();
    }, REFRESH_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshFromServer();
    };
    document.addEventListener('visibilitychange', onVisible);

    // 4. Đồng bộ giữa các tab trên cùng máy
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          mergeIncoming(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [refreshFromServer, mergeIncoming]);

  /**
   * Thêm nhiều dòng nhật ký cùng lúc (cho 1 hoặc nhiều bé).
   * @param {Array<{bookingId, petId, log, notifyUserId?, petName?}>} entries
   * @returns {Promise<{ total: number, savedBookings: string[], unsavedBookings: string[] }>}
   */
  const addCareLogs = useCallback(async (entries = []) => {
    const nowIso = new Date().toISOString();
    const prepared = entries
      .filter((e) => e && e.bookingId != null && e.petId != null && e.log)
      .map((e) => ({
        ...e,
        log: { id: createLogId(), createdAt: nowIso, ...e.log },
      }));
    if (prepared.length === 0) return { total: 0, savedBookings: [], unsavedBookings: [] };

    // Cập nhật ngay trên màn hình
    const localMap = {};
    prepared.forEach(({ bookingId, petId, log }) => {
      const key = logKeyOf(bookingId, petId);
      localMap[key] = [log, ...(localMap[key] || [])];
    });
    mergeIncoming(localMap);

    // Báo tức thì cho các thiết bị khác đang mở
    try {
      channelRef.current?.send({ type: 'broadcast', event: BROADCAST_EVENT, payload: { logs: localMap } });
    } catch (e) {}

    // Lưu lên database, mỗi đơn 1 lần ghi
    const byBooking = {};
    prepared.forEach(({ bookingId, petId, log }) => {
      byBooking[bookingId] = byBooking[bookingId] || {};
      byBooking[bookingId][petId] = [...(byBooking[bookingId][petId] || []), log];
    });
    const savedBookings = [];
    const unsavedBookings = [];
    await Promise.all(
      Object.entries(byBooking).map(async ([bookingId, logsByPet]) => {
        let ok = false;
        try {
          ok = await saveLogsToBooking(bookingId, logsByPet);
        } catch (e) {
          console.warn('[CareLog] Lỗi lưu nhật ký lên Supabase:', e);
        }
        (ok ? savedBookings : unsavedBookings).push(bookingId);
      })
    );

    // Gửi thông báo đến điện thoại khách (mỗi bé 1 thông báo tóm tắt)
    const perPet = {};
    prepared.forEach((e) => {
      const key = logKeyOf(e.bookingId, e.petId);
      perPet[key] = perPet[key] || { ...e, labels: [] };
      perPet[key].labels.push(e.log.label);
    });
    Object.values(perPet).forEach((e) => {
      if (!e.notifyUserId) return;
      triggerCareLogUpdateNotification({
        userId: e.notifyUserId,
        petName: e.petName || e.log.petName || 'Bé cưng',
        actionTitle: e.labels.length > 1 ? 'Cập nhật nhật ký lưu trú' : e.log.label,
        detail: e.labels.length > 1 ? `Nhân viên vừa cập nhật: ${e.labels.join(', ')}.` : e.log.detail,
      });
    });

    return { total: prepared.length, savedBookings, unsavedBookings };
  }, [mergeIncoming]);

  // Giữ API cũ: thêm 1 dòng nhật ký
  const addCareLog = useCallback(
    (bookingId, petId, newLog) =>
      addCareLogs([
        {
          bookingId,
          petId,
          log: newLog,
          petName: newLog?.petName,
          notifyUserId: newLog?.userId || newLog?.customerId,
        },
      ]),
    [addCareLogs]
  );

  // Lấy danh sách nhật ký của 1 booking và 1 pet
  const getLogs = useCallback((bookingId, petId) => careLogs[logKeyOf(bookingId, petId)] || [], [careLogs]);

  // Nhóm nhật ký theo ngày (mới nhất lên đầu) cho giao diện dòng thời gian
  const getGroupedLogs = useCallback(
    (bookingId, petId) => {
      const groups = [];
      const byLabel = {};
      getLogs(bookingId, petId).forEach((log) => {
        const label = getLogDayLabel(log);
        if (!byLabel[label]) {
          byLabel[label] = { date: label, logs: [] };
          groups.push(byLabel[label]);
        }
        byLabel[label].logs.push(log);
      });
      return groups;
    },
    [getLogs]
  );

  return (
    <CareLogContext.Provider
      value={{ careLogs, addCareLog, addCareLogs, getLogs, getGroupedLogs, refreshCareLogs: refreshFromServer }}
    >
      {children}
    </CareLogContext.Provider>
  );
};

export const useCareLog = () => useContext(CareLogContext);
