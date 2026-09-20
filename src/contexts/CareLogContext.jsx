import React, { createContext, useState, useContext, useEffect } from 'react';

const CareLogContext = createContext();

export const CareLogProvider = ({ children }) => {
  const [careLogs, setCareLogs] = useState(() => {
    const saved = localStorage.getItem('careLogs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('careLogs', JSON.stringify(careLogs));
  }, [careLogs]);

  // addCareLog: Adds a new log entry for a specific booking and pet
  const addCareLog = (bookingId, petId, newLog) => {
    setCareLogs(prev => {
      const key = `${bookingId}_${petId}`;
      const existingLogs = prev[key] || [];
      return {
        ...prev,
        [key]: [newLog, ...existingLogs] // Prepend new log
      };
    });
  };

  // Lấy danh sách nhật ký của 1 booking và 1 pet
  const getLogs = (bookingId, petId) => {
    const key = `${bookingId}_${petId}`;
    return careLogs[key] || [];
  };

  // Helper cho giao diện Tracking: Group logs by date
  const getGroupedLogs = (bookingId, petId) => {
    const logs = getLogs(bookingId, petId);
    const groups = {};
    
    logs.forEach(log => {
      const dateKey = log.date; // e.g. "19/09/2026" or "Hôm nay, 19/09"
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          logs: []
        };
      }
      groups[dateKey].logs.push(log);
    });

    // Sắp xếp các nhóm theo ngày (mới nhất lên đầu)
    // Hiện tại chỉ đơn giản trả về array các nhóm, có thể cải thiện sort sau
    return Object.values(groups);
  };

  return (
    <CareLogContext.Provider value={{ careLogs, addCareLog, getLogs, getGroupedLogs }}>
      {children}
    </CareLogContext.Provider>
  );
};

export const useCareLog = () => useContext(CareLogContext);
