import React, { useState } from 'react';
import { PawPrint, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingHistory, isBookingOfCustomer } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useRoomState } from '../../contexts/RoomStateContext';
import { getAuthHeaders } from '../../services/crossDeviceSync';
import { hasBookingCode, todayInVietnam, PAYMENT_STATUS } from '../../utils/bookingDeposit';

const CANCELLED_STATUSES = ['cancelled', 'Đã hủy'];

// Khách tự hủy được khi đơn chưa nhận phòng và chưa qua ngày nhận phòng
const canSelfCancel = (booking) =>
  !CANCELLED_STATUSES.includes(booking.status) &&
  booking.dynamicStatus === 'Sắp tới' &&
  Boolean(booking.checkIn) &&
  booking.checkIn >= todayInVietnam();

const calculateBookingStatus = (booking) => {
  if (!booking) return 'Chưa rõ';

  // 1. Khi Admin bấm 'Check-out' hoặc đơn hoàn tất hoặc hủy -> luôn là 'Đã hoàn tất'
  if (
    booking.status === 'check-out' ||
    booking.status === 'Đã hoàn tất' ||
    booking.status === 'hoàn tất' ||
    booking.status === 'cancelled' ||
    booking.status === 'Đã hủy'
  ) {
    return 'Đã hoàn tất';
  }

  // 2. Khi hết hạn đặt phòng (hôm nay đã qua ngày checkOut) -> tự động chuyển thành 'Đã hoàn tất'
  if (booking.checkOut) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOut = new Date(booking.checkOut);
    checkOut.setHours(23, 59, 59, 999);
    if (today > checkOut) {
      return 'Đã hoàn tất';
    }
  }

  // 3. Nếu ngày hôm nay nằm trong khoảng [checkIn, checkOut] hoặc admin đã check-in
  if (booking.status === 'đang ở' || booking.status === 'Đang lưu trú') {
    return 'Đang lưu trú';
  }

  if (booking.checkIn && booking.checkOut) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inDate = new Date(booking.checkIn);
    inDate.setHours(0, 0, 0, 0);
    const outDate = new Date(booking.checkOut);
    outDate.setHours(23, 59, 59, 999);

    if (today >= inDate && today <= outDate) {
      return 'Đang lưu trú';
    }
  }

  // 4. Mặc định là 'Sắp tới' (chưa đến ngày nhận phòng)
  return 'Sắp tới';
};

const MyBooking = () => {
  const { globalBookingList, updateBooking } = useBookingHistory();
  const { bookings: liveBookingsByRoom } = useRoomState();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const { authenticatedCustomer, customerProfile, isAdmin } = useCustomerProfile();
  const { petList } = usePetProfile();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const navigate = useNavigate();

  const activeCustomer = authenticatedCustomer || customerProfile;

  // Lọc chỉ hiển thị đơn của tài khoản đang đăng nhập (Admin thấy tất cả; nếu chưa đăng nhập thì hiển thị danh sách đơn đã đồng bộ)
  const myBookings = activeCustomer
    ? globalBookingList.filter((booking) => isBookingOfCustomer(booking, activeCustomer, isAdmin))
    : globalBookingList;

  const tabs = ['Tất cả', 'Đang lưu trú', 'Sắp tới', 'Đã hoàn tất'];

  // Trạng thái cọc và trạng thái đơn lấy từ server (cập nhật mỗi 2 giây), để khi admin xác nhận cọc
  // thì trang của khách đổi theo ngay, không phụ thuộc bản lưu cũ trên trình duyệt
  const liveByCode = {};
  Object.values(liveBookingsByRoom || {}).flat().forEach((b) => {
    if (b?.code) liveByCode[b.code] = b;
  });

  const processedBookings = myBookings.map((booking) => {
    const live = liveByCode[booking.code || booking.id];
    const merged = { ...booking };
    // Đơn đã hủy thì giữ nguyên, server không còn trả đơn hủy nên bản trên trình duyệt có thể còn trạng thái cũ
    if (live && !CANCELLED_STATUSES.includes(booking.status)) {
      ['paymentStatus', 'depositAmount', 'status'].forEach((key) => {
        if (live[key] !== undefined) merged[key] = live[key];
      });
    }
    return { ...merged, dynamicStatus: calculateBookingStatus(merged) };
  });

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError('');
    const code = cancelTarget.code || cancelTarget.id;
    try {
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          roomId: cancelTarget.roomId || cancelTarget.selectedRoom?.id,
          code,
          updates: { status: 'cancelled' },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        setCancelError(json.message || 'Không hủy được đơn, vui lòng thử lại.');
        return;
      }
      updateBooking(code, { status: 'cancelled' });
      setCancelTarget(null);
    } catch {
      setCancelError('Không kết nối được máy chủ, vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings = processedBookings.filter((booking) => {
    if (activeTab === 'Tất cả') return true;
    return booking.dynamicStatus === activeTab;
  });

  const getBadgeColor = (status) => {
    switch (status) {
      case 'Đang lưu trú': return 'bg-primary-light text-primary';
      case 'Sắp tới': return 'bg-red-50 text-red-500';
      case 'Đã hoàn tất': return 'bg-green-50 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDateRange = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '';
    const format = (d) => {
      const [year, month, day] = d.split('-');
      return `${day}/${month}/${year}`;
    }
    return `${format(checkIn)} - ${format(checkOut)}`;
  };

  return (
    <div className="w-full min-h-screen bg-bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-extrabold text-text-dark font-title mb-8">Danh sách booking</h1>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-10 border-b border-gray-200 pb-4">
          {tabs.map((tab, idx) => {
            const count = tab === 'Tất cả' 
              ? processedBookings.length 
              : processedBookings.filter(b => b.dynamicStatus === tab).length;
              
            return (
              <button 
                key={idx}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${activeTab === tab ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' : 'bg-white text-gray-600 border-transparent hover:border-gray-200'}`}
              >
                {tab} ({count})
              </button>
            )
          })}
        </div>

        {/* Booking List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <PawPrint className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Chưa có lịch đặt phòng nào</h3>
            <p className="text-gray-500 mt-2">Bạn chưa có lịch đặt phòng nào trong mục này.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking, idx) => {
              const dynamicPets = (booking.petIds || []).map(id => petList.find(p => p.id === id)).filter(Boolean);
              const resolvedPets = dynamicPets.length > 0 ? dynamicPets : (booking.petProfiles || []);
              
              const petsName = resolvedPets.map(p => p.name).join(', ') || 'Chưa rõ';
              const packageDesc = booking.selectedPackage?.name || 'Chưa rõ';
              const firstPetImage = resolvedPets[0]?.imagePreview;
              
              return (
                <div key={booking.id || idx} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border-4 border-gray-100">
                    {firstPetImage ? (
                      <img src={firstPetImage} alt={petsName} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-text-dark">{petsName}</h3>
                      {CANCELLED_STATUSES.includes(booking.status) ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full w-max mx-auto sm:mx-0 bg-gray-100 text-gray-500">
                          Đã hủy
                        </span>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full w-max mx-auto sm:mx-0 ${getBadgeColor(booking.dynamicStatus)}`}>
                          {booking.dynamicStatus}
                        </span>
                      )}
                      {!hasBookingCode(booking) && !CANCELLED_STATUSES.includes(booking.status) && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full w-max mx-auto sm:mx-0 bg-amber-100 text-amber-700">
                          Chờ đặt cọc
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      {booking.selectedRoom?.name ? `Phòng ${booking.selectedRoom.name} • ` : ''} 
                      {packageDesc}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">{formatDateRange(booking.checkIn, booking.checkOut)}</p>
                    {CANCELLED_STATUSES.includes(booking.status) ? (
                      <p className="text-xs text-gray-400 mt-2">Đơn {booking.id} đã hủy.</p>
                    ) : hasBookingCode(booking) ? (
                      <p className="text-xs text-gray-400 mt-2">Mã booking: {booking.id}</p>
                    ) : (
                      <p className="text-xs text-amber-700 mt-2">
                        Chuyển khoản cọc {Number(booking.depositAmount || 0).toLocaleString()}đ (nội dung: COC {booking.id}) để nhận mã đặt phòng.
                      </p>
                    )}
                  </div>

                  {canSelfCancel(booking) && (
                    <div className="flex flex-col items-center sm:items-end gap-3 shrink-0 mt-4 sm:mt-0 border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0 w-full sm:w-auto">
                      <button
                        id={`btn-cancel-booking-${booking.id}`}
                        onClick={() => { setCancelError(''); setCancelTarget(booking); }}
                        className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl text-sm font-bold text-red-500 border-2 border-red-100 hover:border-red-400 hover:bg-red-50 transition-colors bg-white"
                      >
                        Hủy đặt phòng
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  {booking.dynamicStatus === 'Đang lưu trú' && (
                    <div className="flex flex-col items-center sm:items-end gap-3 shrink-0 mt-4 sm:mt-0 border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0 w-full sm:w-auto">
                      <button 
                        onClick={() => navigate('/tracking')}
                        className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl text-sm font-bold text-accent border-2 border-accent/20 hover:border-accent hover:bg-accent hover:text-white transition-colors bg-accent/5"
                      >
                        Xem chi tiết / Camera
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500 shrink-0" />
              <h2 className="text-lg font-bold text-text-dark">Hủy đơn {cancelTarget.id}?</h2>
            </div>
            <p className="text-sm text-gray-600">
              Đơn gửi bé từ {formatDateRange(cancelTarget.checkIn, cancelTarget.checkOut)} sẽ bị hủy và phòng được trả lại. Thao tác này không hoàn tác được.
            </p>
            {cancelTarget.paymentStatus === PAYMENT_STATUS.DEPOSIT_PAID && (
              <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-3">
                Đơn này đã đặt cọc {Number(cancelTarget.depositAmount || 0).toLocaleString()}đ. Vui lòng liên hệ Mèo Vắng Nhà để được hỗ trợ về tiền cọc.
              </p>
            )}
            {cancelError && <p className="text-sm text-red-600">{cancelError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 border-2 border-gray-200 hover:bg-gray-50"
              >
                Giữ đơn
              </button>
              <button
                id="btn-confirm-cancel-booking"
                onClick={confirmCancel}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBooking;
