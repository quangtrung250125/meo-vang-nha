import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { REALTIME_CHANNEL } from '../utils/bookingStatus';

const UIContext = createContext();

const initialNotifications = [
  {
    id: 'init-1',
    title: 'Admin đã gửi yêu cầu Thay đổi lịch cho đơn đặt dịch vụ #MVN-95104',
    desc: 'Admin đề xuất dời lịch lùi 2 ngày do phòng VIP khử khuẩn định kỳ. Vui lòng xem và xác nhận.',
    time: '15 phút trước',
    unread: true,
    type: 'booking_proposal',
    bookingId: 'MVN-95104',
    iconColor: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'init-2',
    title: 'Chương trình Nhân 2 Điểm Thưởng!',
    desc: 'Đặt phòng VIP cho bé trong tuần này để nhận gấp đôi điểm tích lũy hạng thẻ.',
    time: '1 giờ trước',
    unread: true,
    type: 'gift',
    iconColor: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'init-3',
    title: 'Cập nhật: Phòng Condo Đôi Mới',
    desc: 'Mở rộng không gian nghỉ dưỡng cho nhà có từ 2 bé mèo trở lên với đầy đủ đồ chơi.',
    time: 'Hôm qua',
    unread: false,
    type: 'room',
    iconColor: 'bg-blue-100 text-blue-600',
  },
];

export const UIProvider = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState({
    isOpen: false,
    activeTab: 'points',
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('mvn_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialNotifications;
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [approvalModalBookingId, setApprovalModalBookingId] = useState(null);

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

  const openApprovalModal = (bookingId) => {
    setApprovalModalBookingId(bookingId);
  };
  const closeApprovalModal = () => {
    setApprovalModalBookingId(null);
  };

  // Lưu thông báo vào localStorage
  const saveNotifications = useCallback((newNotifs) => {
    setNotifications(newNotifs);
    try {
      localStorage.setItem('mvn_notifications', JSON.stringify(newNotifs));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addNotification = useCallback((notifItem) => {
    const item = {
      id: notifItem.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: notifItem.time || 'Vừa xong',
      unread: true,
      ...notifItem,
    };
    setNotifications(prev => {
      const updated = [item, ...prev];
      try {
        localStorage.setItem('mvn_notifications', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const markAllNotificationsRead = () => {
    const updated = notifications.map(item => ({ ...item, unread: false }));
    saveNotifications(updated);
  };

  const markNotificationRead = (id) => {
    const updated = notifications.map(item => (item.id === id ? { ...item, unread: false } : item));
    saveNotifications(updated);
  };

  // Lắng nghe BroadcastChannel để thêm thông báo Real-time hai chiều
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(REALTIME_CHANNEL);
      channel.onmessage = (event) => {
        const { type, action, bookingId, notifyMessage } = event.data || {};
        if (type === 'BOOKING_SYNC') {
          if (action === 'PROPOSE_CHANGE') {
            addNotification({
              title: `Admin đã gửi yêu cầu thay đổi/hủy cho đơn #${bookingId}`,
              desc: `Admin đã gửi đề xuất cho đơn đặt dịch vụ #${bookingId}. Vui lòng xem và xác nhận.`,
              type: 'booking_proposal',
              bookingId,
              iconColor: 'bg-purple-100 text-purple-600',
            });
          } else if (action === 'CUSTOMER_ACCEPT') {
            addNotification({
              title: `Khách hàng đã chấp nhận thay đổi cho đơn #${bookingId}`,
              desc: notifyMessage || `Khách hàng đã đồng ý áp dụng thay đổi mới cho đơn hàng #${bookingId}`,
              type: 'admin_feedback',
              bookingId,
              iconColor: 'bg-emerald-100 text-emerald-600',
            });
          } else if (action === 'CUSTOMER_REJECT') {
            addNotification({
              title: `Khách hàng đã từ chối yêu cầu thay đổi cho đơn #${bookingId}`,
              desc: notifyMessage || `Khách hàng đã từ chối đề xuất cho đơn hàng #${bookingId}. Giữ nguyên thông tin cũ.`,
              type: 'admin_feedback',
              bookingId,
              iconColor: 'bg-rose-100 text-rose-600',
            });
          }
        }
      };

      return () => channel.close();
    } catch (err) {
      console.warn(err);
    }
  }, [addNotification]);

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
        addNotification,
        markAllNotificationsRead,
        markNotificationRead,
        approvalModalBookingId,
        openApprovalModal,
        closeApprovalModal,
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
