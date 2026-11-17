import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { triggerCareLogUpdateNotification } from '../services/notificationTriggers';
import { broadcastEvent, subscribeSyncEvents, getAuthHeaders } from '../services/crossDeviceSync';
import {
  DAILY_TASKS,
  getDailyTask,
  getTodayTaskStatus,
  vnDateKey,
  vnDateLabel,
  vnTime,
} from '../utils/careTasks';

// Nhật ký chăm sóc lưu trên server (bảng care_logs) qua /api/bookings?resource=care-logs.
// Admin bấm "Cho ăn / Vận động / Dọn vệ sinh", gửi ảnh hay báo cáo ngày -> server ghi thời điểm thật ->
// các tab khác (Tổng quan, Tình trạng phòng, Theo dõi lưu trú & Hồ sơ mèo của khách) tự tải lại, không cần F5.

const CareLogContext = createContext();

const API_URL = '/api/bookings?resource=care-logs';
const CHANNEL_NAME = 'mvn_carelog_channel';
const CHANGED_EVENT = 'CARE_LOGS_CHANGED';
const POLL_MS = 15000;

const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

// Gộp danh sách mới vào danh sách đang có theo id
const mergeLogs = (prev, incoming) => {
  const map = new Map(prev.map((l) => [l.id, l]));
  incoming.forEach((l) => map.set(l.id, l));
  return [...map.values()].sort(byNewest);
};

// Thêm các trường hiển thị (ngày / giờ theo giờ Việt Nam) cho giao diện
const withDisplayFields = (log, todayKey) => ({
  ...log,
  rawDate: vnDateKey(log.createdAt),
  date: vnDateLabel(log.createdAt, todayKey),
  time: vnTime(log.createdAt),
});

async function requestApi(method, body) {
  const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
  if (!headers.Authorization) return { ok: false, status: 401, json: { message: 'Vui lòng đăng nhập.' } };
  const res = await fetch(API_URL, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.success !== false, status: res.status, json };
}

export const CareLogProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const channelRef = useRef(null);

  // Tải nhật ký theo tài khoản đang đăng nhập (Admin: 45 ngày gần đây, khách: các đơn của mình)
  const refresh = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        setLogs([]);
        return;
      }
      const res = await fetch(API_URL, { headers });
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.logs)) setLogs([...json.logs].sort(byNewest));
    } catch (e) {
      console.warn('Không tải được nhật ký chăm sóc:', e);
    }
  }, []);

  // Báo các tab / thiết bị khác tải lại (chỉ gửi mã đơn, không gửi nội dung nhật ký)
  const notifyChanged = useCallback((bookingCodes = []) => {
    try {
      channelRef.current?.postMessage({ type: CHANGED_EVENT });
    } catch (e) {}
    broadcastEvent(CHANGED_EVENT, { bookingCodes });
  }, []);

  useEffect(() => {
    // Nhật ký cũ chỉ nằm trong trình duyệt (phần lớn là dữ liệu mẫu) không còn dùng
    try {
      localStorage.removeItem('careLogs');
    } catch (e) {}
    refresh();

    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        channelRef.current = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current.onmessage = (event) => {
          if (event.data?.type === CHANGED_EVENT) refresh();
        };
      } catch (e) {}
    }

    const unsubscribeSync = subscribeSyncEvents(({ type }) => {
      if (type === CHANGED_EVENT) refresh();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') refresh();
    });

    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    // Dự phòng khi kênh realtime bị gián đoạn
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
      if (unsubscribeSync) unsubscribeSync();
      subscription?.unsubscribe();
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [refresh]);

  /**
   * Ghi nhiều dòng nhật ký một lần.
   * @returns {Promise<{ ok: boolean, logs: object[], skipped: object[], message?: string }>}
   */
  const saveEntries = useCallback(async (entries) => {
    try {
      const { ok, json } = await requestApi('POST', { entries });
      const saved = Array.isArray(json.logs) ? json.logs : [];
      if (saved.length > 0) {
        setLogs((prev) => mergeLogs(prev, saved));
        notifyChanged([...new Set(saved.map((l) => l.bookingCode))]);

        // Báo khách qua Web Push (mỗi bé 1 thông báo)
        const seen = new Set();
        saved.forEach((log) => {
          const key = `${log.bookingCode}|${log.petId}`;
          if (seen.has(key) || !log.customerId) return;
          seen.add(key);
          triggerCareLogUpdateNotification({
            userId: log.customerId,
            petName: log.petName || 'Bé cưng',
            actionTitle: log.label || 'Nhật ký chăm sóc mới',
            detail: log.detail || 'Nhân viên vừa cập nhật tình hình của bé.',
          });
        });
      }
      return { ok: ok && saved.length > 0, logs: saved, skipped: json.skipped || [], message: json.message };
    } catch (e) {
      return { ok: false, logs: [], skipped: [], message: 'Không kết nối được máy chủ, vui lòng thử lại.' };
    }
  }, [notifyChanged]);

  // Thêm 1 dòng nhật ký cho 1 bé (ghi chú chi tiết, ảnh, báo cáo ngày...)
  const addCareLog = useCallback((bookingId, petId, log) =>
    saveEntries([{ ...log, bookingCode: bookingId, petId }]), [saveEntries]);

  // Tác vụ hằng ngày 1 chạm (Cho ăn / Vận động / Dọn vệ sinh) cho 1 hoặc nhiều bé, bé đã làm hôm nay được bỏ qua
  const completeTask = useCallback((cats, taskKey, overrides = {}) => {
    const task = getDailyTask(taskKey);
    const list = Array.isArray(cats) ? cats : [cats];
    if (!task || list.length === 0) return Promise.resolve({ ok: false, logs: [], skipped: [] });
    return saveEntries(list.map((cat) => ({
      bookingCode: cat.bookingId,
      petId: cat.id,
      petName: cat.catName,
      type: task.type,
      label: task.label,
      detail: task.detail,
      icon: task.icon,
      status: 'normal',
      tag: 'Bình thường',
      task: true,
      ...overrides,
    })));
  }, [saveEntries]);

  // Cập nhật hàng loạt (form chi tiết) cho nhiều bé
  const addBulkCareLog = useCallback(async (selectedCats, logPayload) => {
    if (!Array.isArray(selectedCats) || selectedCats.length === 0 || !logPayload) return 0;
    const entries = [];

    if (logPayload.food && (logPayload.food.amount || logPayload.food.type || logPayload.food.foodType)) {
      const amountStr = logPayload.food.amount ? `${logPayload.food.amount}g ` : '';
      const foodTypeStr = logPayload.food.foodType || 'thức ăn';
      const mealTypeStr = logPayload.food.mealType ? ` (${logPayload.food.mealType})` : '';
      const noteStr = logPayload.food.note ? `. Ghi chú: ${logPayload.food.note}` : '';
      entries.push({
        type: 'eating', label: `Cho ăn${mealTypeStr}`, icon: 'Utensils', status: 'normal', tag: 'Bình thường',
        detail: `Đã cho ăn ${amountStr}${foodTypeStr}${noteStr}. Bé ăn ngoan.`,
      });
    }
    if (logPayload.play && logPayload.play.enabled) {
      const activityStr = logPayload.play.activity || 'Vận động & chơi đùa tự do';
      const moodStr = logPayload.play.mood ? ` | Tâm trạng: ${logPayload.play.mood}` : '';
      const noteStr = logPayload.play.note ? `. ${logPayload.play.note}` : '';
      entries.push({
        type: 'mood', label: 'Vui chơi & Vận động', icon: 'Smile', status: 'normal', tag: 'Bình thường',
        detail: `${activityStr}${moodStr}${noteStr}.`,
      });
    }
    if (logPayload.hygiene && logPayload.hygiene.enabled) {
      const stool = logPayload.hygiene.stool || 'Bình thường';
      const isBad = stool === 'Tiêu chảy' || stool === 'Táo bón';
      const noteStr = logPayload.hygiene.note ? `. ${logPayload.hygiene.note}` : '';
      entries.push({
        type: 'hygiene', label: 'Vệ sinh khay cát', icon: 'Droplets',
        status: isBad ? 'watch' : 'normal', tag: isBad ? 'Cần theo dõi' : 'Bình thường',
        detail: `Khay cát đã dọn sạch sẽ. Tình trạng phân: ${stool}${noteStr}.`,
      });
    }
    if (logPayload.health && (logPayload.health.status || logPayload.health.note)) {
      const cond = logPayload.health.status || 'Khỏe mạnh';
      const isWatch = cond.toLowerCase().includes('theo dõi') || cond.toLowerCase().includes('mệt');
      const noteStr = logPayload.health.note ? `: ${logPayload.health.note}` : '';
      entries.push({
        type: 'health', label: 'Kiểm tra sức khỏe', icon: 'HeartPulse',
        status: isWatch ? 'watch' : 'normal', tag: isWatch ? 'Cần theo dõi' : 'Khỏe mạnh',
        detail: `Tình trạng: ${cond}${noteStr}.`,
      });
    }
    if (entries.length === 0) return 0;

    const result = await saveEntries(selectedCats.flatMap((cat) => entries.map((e) => ({
      ...e,
      bookingCode: cat.bookingId,
      petId: cat.id || cat.rawPet?.id || cat.petId,
      petName: cat.catName || cat.name || 'Bé cưng',
    }))));
    return new Set(result.logs.map((l) => `${l.bookingCode}|${l.petId}`)).size;
  }, [saveEntries]);

  // Hoàn tác một dòng nhật ký (trong 5 phút sau khi bấm)
  const undoLog = useCallback(async (logId) => {
    try {
      const { ok, json } = await requestApi('DELETE', { id: logId });
      if (ok) {
        setLogs((prev) => prev.filter((l) => l.id !== logId));
        notifyChanged(json.bookingCode ? [json.bookingCode] : []);
      }
      return { ok, message: json.message };
    } catch (e) {
      return { ok: false, message: 'Không kết nối được máy chủ, vui lòng thử lại.' };
    }
  }, [notifyChanged]);

  // Nhật ký của 1 bé trong 1 đơn, mới nhất trước, kèm ngày / giờ hiển thị theo giờ Việt Nam
  const getLogs = useCallback((bookingId, petId) => {
    if (!bookingId || petId == null) return [];
    const todayKey = vnDateKey();
    return logs
      .filter((l) => l.bookingCode === bookingId && sameId(l.petId, petId))
      .map((l) => withDisplayFields(l, todayKey));
  }, [logs]);

  // Nhóm nhật ký theo ngày cho giao diện khách hàng (Theo dõi lưu trú / Hồ sơ mèo)
  const getGroupedLogs = useCallback((bookingId, petId) => {
    const groups = [];
    getLogs(bookingId, petId).forEach((log) => {
      const last = groups[groups.length - 1];
      if (last && last.dateKey === log.rawDate) last.logs.push(log);
      else groups.push({ dateKey: log.rawDate, date: log.date, logs: [log] });
    });
    return groups;
  }, [getLogs]);

  // Tình trạng 3 tác vụ hôm nay của 1 bé
  const getLatestStatus = useCallback((bookingId, petId) => {
    const petLogs = getLogs(bookingId, petId);
    return {
      ...getTodayTaskStatus(petLogs),
      lastLog: petLogs[0] || null,
      totalLogs: petLogs.length,
    };
  }, [getLogs]);

  const value = useMemo(() => ({
    careLogs: logs,
    dailyTasks: DAILY_TASKS,
    refresh,
    addCareLog,
    addBulkCareLog,
    completeTask,
    undoLog,
    getLogs,
    getGroupedLogs,
    getLatestStatus,
  }), [logs, refresh, addCareLog, addBulkCareLog, completeTask, undoLog, getLogs, getGroupedLogs, getLatestStatus]);

  return <CareLogContext.Provider value={value}>{children}</CareLogContext.Provider>;
};

export const useCareLog = () => useContext(CareLogContext);
