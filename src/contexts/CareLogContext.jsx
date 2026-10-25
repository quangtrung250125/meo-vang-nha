import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { triggerCareLogUpdateNotification } from '../services/notificationTriggers';
import { broadcastEvent, subscribeSyncEvents } from '../services/crossDeviceSync';

const CareLogContext = createContext();

// Dữ liệu mẫu ban đầu nếu máy chưa có nhật ký
const getInitialSampleLogs = () => {
  const today = new Date();
  const rawDate = today.toLocaleDateString('vi-VN');
  const dateLabel = `Hôm nay, ${today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

  return {
    'mockBooking_1': [
      {
        id: 'sample_1_3',
        rawDate,
        date: dateLabel,
        time: '10:30',
        type: 'mood',
        label: 'Vui chơi & Vận động',
        detail: 'Bé Mimi đã ra phòng chơi chung, đuổi bóng và leo trèo rất tích cực, tinh thần vui vẻ.',
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Smile',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'sample_1_2',
        rawDate,
        date: dateLabel,
        time: '09:00',
        type: 'hygiene',
        label: 'Vệ sinh khay cát',
        detail: 'Đã dọn khay cát sáng. Phân khuôn bình thường, nước tiểu tốt.',
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Droplets',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'sample_1_1',
        rawDate,
        date: dateLabel,
        time: '08:00',
        type: 'eating',
        label: 'Cho ăn bữa sáng',
        detail: 'Đã cho ăn 50g hạt Royal Canin + 20g pate cá hồi. Bé ăn hết sạch phần ăn.',
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Utensils',
        createdAt: new Date(Date.now() - 10800000).toISOString()
      }
    ],
    'mockBooking_2': [
      {
        id: 'sample_2_1',
        rawDate,
        date: dateLabel,
        time: '08:15',
        type: 'eating',
        label: 'Cho ăn bữa sáng',
        detail: 'Đã cho ăn 45g hạt dinh dưỡng. Bé Bông ăn gần hết.',
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Utensils',
        createdAt: new Date(Date.now() - 10000000).toISOString()
      }
    ],
    'mockBooking_3': [
      {
        id: 'sample_3_2',
        rawDate,
        date: dateLabel,
        time: '10:00',
        type: 'mood',
        label: 'Vui chơi',
        detail: 'Bé Lu hơi nhút nhát, thích nằm nghỉ ngơi và được nhân viên vuốt ve.',
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Smile',
        createdAt: new Date(Date.now() - 5400000).toISOString()
      },
      {
        id: 'sample_3_1',
        rawDate,
        date: dateLabel,
        time: '08:30',
        type: 'eating',
        label: 'Cho ăn bữa sáng',
        detail: 'Đã cho ăn 40g hạt và bổ sung súp thưởng súp cá ngừ.',
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Utensils',
        createdAt: new Date(Date.now() - 9500000).toISOString()
      }
    ]
  };
};

export const CareLogProvider = ({ children }) => {
  const [careLogs, setCareLogs] = useState(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('careLogs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Lỗi parse careLogs từ localStorage:', e);
      }
    }
    // Khởi tạo logs mẫu ban đầu để demo mượt mà
    const initial = getInitialSampleLogs();
    try {
      localStorage.setItem('careLogs', JSON.stringify(initial));
    } catch (e) {}
    return initial;
  });

  const careLogsRef = useRef(careLogs);
  careLogsRef.current = careLogs;

  // Lắng nghe thay đổi careLogs giữa các tab và BroadcastChannel
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('careLogs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setCareLogs(parsed);
          }
        }
      } catch (e) {}
    };

    const handleStorage = (e) => {
      if (e.key === 'careLogs') {
        handleSync();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('mvn_carelog_sync', handleSync);

    let channel = null;
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        channel = new BroadcastChannel('mvn_carelog_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'CARE_LOGS_UPDATED') {
            handleSync();
          }
        };
      } catch (e) {}
    }

    // Đăng ký đồng bộ real-time qua Supabase Cloud WebSockets (nếu có)
    const unsub = subscribeSyncEvents(({ type, payload }) => {
      if (type === 'CARE_LOGS_UPDATED' && payload?.careLogs) {
        setCareLogs(payload.careLogs);
        try {
          localStorage.setItem('careLogs', JSON.stringify(payload.careLogs));
        } catch (e) {}
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mvn_carelog_sync', handleSync);
      if (channel) channel.close();
      if (unsub) unsub();
    };
  }, []);

  // Lưu state vào localStorage khi careLogs thay đổi
  const saveLogsToStorage = useCallback((newLogs) => {
    try {
      localStorage.setItem('careLogs', JSON.stringify(newLogs));
    } catch (e) {}

    // Kích hoạt event cho cùng tab
    window.dispatchEvent(new Event('mvn_carelog_sync'));

    // Broadcast cho các tab khác
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        const ch = new BroadcastChannel('mvn_carelog_channel');
        ch.postMessage({ type: 'CARE_LOGS_UPDATED' });
        ch.close();
      } catch (e) {}
    }

    // Broadcast tới các thiết bị khác (Desktop <-> Mobile)
    broadcastEvent('CARE_LOGS_UPDATED', { careLogs: newLogs });
  }, []);

  // Thêm 1 dòng nhật ký cho 1 bé mèo
  const addCareLog = useCallback((bookingId, petId, newLog) => {
    if (!bookingId || !petId || !newLog) return;
    const key = `${bookingId}_${petId}`;

    const logEntry = {
      id: newLog.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...newLog
    };

    setCareLogs(prev => {
      const existing = prev[key] || [];
      const updated = {
        ...prev,
        [key]: [logEntry, ...existing]
      };
      saveLogsToStorage(updated);
      return updated;
    });

    // Thông báo Web Push
    try {
      const targetUser = newLog.userId || newLog.customerId || 'ducan';
      triggerCareLogUpdateNotification({
        userId: targetUser,
        petName: newLog.petName || 'Bé cưng',
        actionTitle: newLog.label || newLog.title || 'Nhật ký chăm sóc mới',
        detail: newLog.detail || newLog.notes || 'Bé đang sinh hoạt và chăm sóc rất tốt.',
      });
    } catch (e) {}
  }, [saveLogsToStorage]);

  // CẬP NHẬT HÀNG LOẠT (BULK UPDATE) CHO NHIỀU MÈO
  const addBulkCareLog = useCallback((selectedCats, logPayload) => {
    if (!Array.isArray(selectedCats) || selectedCats.length === 0 || !logPayload) return 0;

    const today = new Date();
    const time = today.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const rawDate = today.toLocaleDateString('vi-VN');
    const dateLabel = `Hôm nay, ${today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

    const entriesToAdd = [];

    // 1. Nhật ký ăn uống
    if (logPayload.food && (logPayload.food.amount || logPayload.food.type)) {
      const amountStr = logPayload.food.amount ? `${logPayload.food.amount}g ` : '';
      const foodTypeStr = logPayload.food.foodType || 'thức ăn';
      const mealTypeStr = logPayload.food.mealType ? ` (${logPayload.food.mealType})` : '';
      const noteStr = logPayload.food.note ? `. Ghi chú: ${logPayload.food.note}` : '';

      entriesToAdd.push({
        type: 'eating',
        label: `Cho ăn${mealTypeStr}`,
        detail: `Đã cho ăn ${amountStr}${foodTypeStr}${noteStr}. Bé ăn ngoan.`,
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Utensils'
      });
    }

    // 2. Nhật ký vui chơi / vận động
    if (logPayload.play && logPayload.play.enabled) {
      const activityStr = logPayload.play.activity || 'Vận động & chơi đùa tự do';
      const moodStr = logPayload.play.mood ? ` | Tâm trạng: ${logPayload.play.mood}` : '';
      const noteStr = logPayload.play.note ? `. ${logPayload.play.note}` : '';

      entriesToAdd.push({
        type: 'mood',
        label: 'Vui chơi & Vận động',
        detail: `${activityStr}${moodStr}${noteStr}.`,
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Smile'
      });
    }

    // 3. Nhật ký vệ sinh
    if (logPayload.hygiene && logPayload.hygiene.enabled) {
      const stool = logPayload.hygiene.stool || 'Bình thường';
      const isBad = stool === 'Tiêu chảy' || stool === 'Táo bón';
      const noteStr = logPayload.hygiene.note ? `. ${logPayload.hygiene.note}` : '';

      entriesToAdd.push({
        type: 'hygiene',
        label: 'Vệ sinh khay cát',
        detail: `Khay cát đã dọn sạch sẽ. Tình trạng phân: ${stool}${noteStr}.`,
        status: isBad ? 'watch' : 'normal',
        tag: isBad ? 'Cần theo dõi' : 'Bình thường',
        icon: 'Droplets'
      });
    }

    // 4. Nhật ký sức khỏe
    if (logPayload.health && (logPayload.health.status || logPayload.health.note)) {
      const cond = logPayload.health.status || 'Khỏe mạnh';
      const isWatch = cond.toLowerCase().includes('theo dõi') || cond.toLowerCase().includes('mệt');
      const noteStr = logPayload.health.note ? `: ${logPayload.health.note}` : '';

      entriesToAdd.push({
        type: 'health',
        label: 'Kiểm tra sức khỏe',
        detail: `Tình trạng: ${cond}${noteStr}.`,
        status: isWatch ? 'watch' : 'normal',
        tag: isWatch ? 'Cần theo dõi' : 'Khỏe mạnh',
        icon: 'HeartPulse'
      });
    }

    if (entriesToAdd.length === 0) return 0;

    setCareLogs(prev => {
      const updated = { ...prev };

      selectedCats.forEach(cat => {
        const bId = cat.bookingId || 'mockBooking';
        const pId = cat.id || cat.rawPet?.id || cat.petId;
        const key = `${bId}_${pId}`;
        const existing = updated[key] || [];

        const newCatLogs = entriesToAdd.map(e => ({
          ...e,
          id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          rawDate,
          date: dateLabel,
          time,
          petName: cat.catName || cat.name || 'Bé cưng',
          createdAt: new Date().toISOString()
        }));

        updated[key] = [...newCatLogs, ...existing];
      });

      saveLogsToStorage(updated);
      return updated;
    });

    // Bắn thông báo demo cho các bé
    try {
      selectedCats.forEach(cat => {
        triggerCareLogUpdateNotification({
          userId: cat.ownerPhone || 'ducan',
          petName: cat.catName || 'Bé cưng',
          actionTitle: 'Cập nhật nhật ký chăm sóc hôm nay',
          detail: 'Nhân viên vừa cập nhật tình hình ăn uống và sinh hoạt của bé!',
        });
      });
    } catch (e) {}

    return selectedCats.length;
  }, [saveLogsToStorage]);

  // Lấy nhật ký của 1 booking và 1 pet
  const getLogs = useCallback((bookingId, petId) => {
    if (!bookingId || !petId) return [];
    const key = `${bookingId}_${petId}`;
    return careLogs[key] || [];
  }, [careLogs]);

  // Nhóm nhật ký theo ngày cho giao diện khách hàng (Tracking / Timeline)
  const getGroupedLogs = useCallback((bookingId, petId) => {
    const logs = getLogs(bookingId, petId);
    if (!logs || logs.length === 0) return [];

    const groups = {};
    logs.forEach(log => {
      const dateKey = log.date || log.rawDate || 'Hôm nay';
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          logs: []
        };
      }
      groups[dateKey].logs.push(log);
    });

    return Object.values(groups);
  }, [getLogs]);

  // Lấy tóm tắt trạng thái mới nhất hôm nay của bé
  const getLatestStatus = useCallback((bookingId, petId) => {
    const logs = getLogs(bookingId, petId);
    const todayString = new Date().toLocaleDateString('vi-VN');
    const logsToday = logs.filter(l => l.rawDate === todayString);

    const fed = logsToday.some(l => l.type === 'eating');
    const played = logsToday.some(l => l.type === 'mood' || l.type === 'play');
    const hygiene = logsToday.some(l => l.type === 'hygiene');
    const hasWarning = logsToday.some(l => l.status === 'watch');

    const lastLog = logs[0] || null;

    return {
      fed,
      played,
      hygiene,
      hasWarning,
      logsToday,
      lastLog,
      totalLogs: logs.length
    };
  }, [getLogs]);

  return (
    <CareLogContext.Provider value={{
      careLogs,
      addCareLog,
      addBulkCareLog,
      getLogs,
      getGroupedLogs,
      getLatestStatus
    }}>
      {children}
    </CareLogContext.Provider>
  );
};

export const useCareLog = () => useContext(CareLogContext);

