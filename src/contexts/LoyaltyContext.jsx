import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCustomerProfile } from './CustomerContext';
import { fetchMyLoyalty, rememberReferralFromUrl } from '../services/loyaltyApi';

// Điểm thưởng, hạng thành viên, mã giới thiệu của khách đang đăng nhập (đọc từ máy chủ, dùng chung cho
// thanh menu, trang Hồ sơ và bước thanh toán khi đặt phòng)
const LoyaltyContext = createContext({ loyalty: null, loading: false, refresh: () => {} });

export const LoyaltyProvider = ({ children }) => {
  const { authenticatedCustomer, isAdmin } = useCustomerProfile();
  const userId = authenticatedCustomer?.id || null;
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    rememberReferralFromUrl();
  }, []);

  const refresh = useCallback(async () => {
    if (!userId || isAdmin) {
      setLoyalty(null);
      return null;
    }
    setLoading(true);
    try {
      const data = await fetchMyLoyalty();
      setLoyalty(data);
      return data;
    } catch (e) {
      console.warn('[Loyalty] Không tải được điểm thưởng:', e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Đơn vừa đặt / check-out / hủy: tải lại điểm
  useEffect(() => {
    if (!userId) return undefined;
    let timer = null;
    const onSync = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 1500);
    };
    window.addEventListener('mvn_booking_sync', onSync);
    window.addEventListener('mvn_loyalty_changed', refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mvn_booking_sync', onSync);
      window.removeEventListener('mvn_loyalty_changed', refresh);
    };
  }, [userId, refresh]);

  const value = useMemo(() => ({ loyalty, loading, refresh }), [loyalty, loading, refresh]);
  return <LoyaltyContext.Provider value={value}>{children}</LoyaltyContext.Provider>;
};

export const useLoyalty = () => useContext(LoyaltyContext);
