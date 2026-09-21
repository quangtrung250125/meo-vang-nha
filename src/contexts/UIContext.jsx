import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

const initialNotifications = [
  {
    id: 1,
    title: 'Chương trình Nhân 2 Điểm Thưởng!',
    desc: 'Đặt phòng VIP cho bé trong tuần này để nhận gấp đôi điểm tích lũy hạng thẻ.',
    time: '10 phút trước',
    unread: true,
    type: 'gift',
    iconColor: 'bg-amber-100 text-amber-600',
  },
  {
    id: 2,
    title: 'Cập nhật: Phòng Condo Đôi Mới',
    desc: 'Mở rộng không gian nghỉ dưỡng cho nhà có từ 2 bé mèo trở lên với đầy đủ đồ chơi.',
    time: '2 giờ trước',
    unread: true,
    type: 'room',
    iconColor: 'bg-blue-100 text-blue-600',
  },
  {
    id: 3,
    title: 'Dịch vụ Mới: Spa Thảo Dược',
    desc: 'Giúp miêu cưng thư giãn, mượt lông và sạch ve rận an toàn tuyệt đối.',
    time: 'Hôm qua',
    unread: true,
    type: 'spa',
    iconColor: 'bg-emerald-100 text-emerald-600',
  },
];

export const UIProvider = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState({
    isOpen: false,
    activeTab: 'points', // 'points' | 'membership' | 'privacy' | 'terms'
  });
  const [notifications, setNotifications] = useState(initialNotifications);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const openAuth = () => setIsAuthOpen(true);
  const closeAuth = () => setIsAuthOpen(false);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const openPolicy = (activeTab = 'points') => {
    setPolicyModal({ isOpen: true, activeTab });
  };
  const closePolicy = () => {
    setPolicyModal(prev => ({ ...prev, isOpen: false }));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(item => ({ ...item, unread: false })));
  };

  const markNotificationRead = (id) => {
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <UIContext.Provider
      value={{
        isSearchOpen,
        openSearch,
        closeSearch,
        isAuthOpen,
        openAuth,
        closeAuth,
        policyModal,
        openPolicy,
        closePolicy,
        notifications,
        unreadCount,
        markAllNotificationsRead,
        markNotificationRead,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
