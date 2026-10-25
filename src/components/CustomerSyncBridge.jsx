import { useEffect, useRef } from 'react';
import { useCustomerProfile } from '../contexts/CustomerContext';
import { pushServerSync, setSyncIdentity } from '../services/crossDeviceSync';

/**
 * Gửi hồ sơ của khách vừa đăng ký / đăng nhập lên server đồng bộ,
 * để trang Admin > Khách hàng thấy cả khách chưa đặt phòng.
 */
const CustomerSyncBridge = () => {
  const { authenticatedCustomer, authLoading, isAdmin } = useCustomerProfile();
  const sentFor = useRef(null);

  useEffect(() => {
    const customer = authenticatedCustomer;
    if (authLoading || isAdmin || !customer?.id || sentFor.current === customer.id) return;
    sentFor.current = customer.id;

    // Hiệu ứng của component con chạy trước CustomerContext, nên đặt danh tính đồng bộ ở đây luôn
    setSyncIdentity({ userId: customer.id, isAdmin: false });
    pushServerSync({
      profiles: [{
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        createdAt: customer.createdAt,
      }],
    });
  }, [authenticatedCustomer, authLoading, isAdmin]);

  return null;
};

export default CustomerSyncBridge;
