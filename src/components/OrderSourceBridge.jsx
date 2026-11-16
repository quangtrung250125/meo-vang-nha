import { useEffect } from 'react';
import { useCustomerProfile } from '../contexts/CustomerContext';
import { pushAuthHeaders } from '../services/pushNotificationService';
import {
  detectOrderSource,
  rememberOrderSource,
  currentOrderSource,
  markOrderSourceLinked,
} from '../utils/orderSource';

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Nguồn đơn Messenger:
 * - Khách mở web từ link nhân viên gửi qua Messenger: ghi nhớ 7 ngày, đơn đặt trong thời gian đó được tính "Đặt qua Messenger".
 * - Khách đã đăng nhập: gắn cuộc trò chuyện Messenger với tài khoản để Hộp thư tập trung hiện đúng họ tên, SĐT, mèo.
 */
const OrderSourceBridge = () => {
  const { authenticatedCustomer, authLoading, isAdmin } = useCustomerProfile();
  const customerId = !isAdmin ? authenticatedCustomer?.id : null;

  useEffect(() => {
    if (isAdmin) return;
    const detected = detectOrderSource({
      search: window.location.search,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
    if (detected) rememberOrderSource(storage(), detected);
  }, [isAdmin]);

  useEffect(() => {
    if (authLoading || !customerId) return;
    const current = currentOrderSource(storage());
    if (!current?.ref || current.linked) return;
    (async () => {
      try {
        const headers = await pushAuthHeaders();
        if (!headers.Authorization) return;
        const res = await fetch('/api/marketing/messenger-ref', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ ref: current.ref }),
        });
        if (res.ok) markOrderSourceLinked(storage());
      } catch {
        // mất mạng: thử lại lần mở web sau
      }
    })();
  }, [authLoading, customerId]);

  return null;
};

export default OrderSourceBridge;
