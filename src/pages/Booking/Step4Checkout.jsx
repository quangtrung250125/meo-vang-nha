import React, { useState } from 'react';
import { Tag, Check, CheckCircle2, ShieldCheck, Sparkles, Percent, Gift, AlertTriangle, RefreshCw } from 'lucide-react';
import { promotionInfo } from '../../mockData/servicesData';
import { useRoomState, determineBookingStatus } from '../../contexts/RoomStateContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { sendWebNotification } from '../../utils/notificationService';

const Step4Checkout = ({ data, updateData, onNext, onPrev, onBackToStep1 }) => {
  const [couponCode, setCouponCode] = useState(promotionInfo.code);
  const [isCouponApplied, setIsCouponApplied] = useState(true);
  const [couponMessage, setCouponMessage] = useState('Đã áp dụng mã ưu đãi giảm 10%!');
  const [conflictError, setConflictError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addNewBooking } = useRoomState();
  const { authenticatedCustomer, customerProfile } = useCustomerProfile();
  const { upsertBooking } = useBookingHistory();

  // Kiểm tra ngày nhận có phải Thứ 5
  const isThursday = (() => {
    if (!data.checkIn) return false;
    return new Date(data.checkIn + 'T00:00:00').getDay() === 4;
  })();

  // Tính số ngày lưu trú
  const calculateDays = () => {
    if (!data.checkIn || !data.checkOut) return 0;
    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 1; // Mặc định ít nhất 1 ngày
  };

  const days = calculateDays();
  const discountedPackagePrice = data.selectedPackage?.price || 0;
  const originalPackagePrice = data.selectedPackage?.originalPrice || Math.round(discountedPackagePrice / 0.9);
  const cameraPrice = 10000; // Giá camera mỗi ngày

  // Subtotal without discount
  const originalPackageTotal = originalPackagePrice * days;
  const cameraTotal = cameraPrice * days;
  const grossTotal = originalPackageTotal + cameraTotal;

  // Discount calculation
  const discountAmount = isCouponApplied 
    ? (originalPackageTotal - (discountedPackagePrice * days)) 
    : 0;

  const total = grossTotal - discountAmount;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === promotionInfo.code || couponCode.trim().toUpperCase() === 'SALE10') {
      setIsCouponApplied(true);
      setCouponMessage('Áp dụng mã thành công! Giảm 10% chi phí dịch vụ.');
    } else {
      setIsCouponApplied(false);
      setCouponMessage('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  const handleSubmit = () => {
    const roomId = data.selectedRoom?.id;
    if (!roomId) {
      setConflictError('Vui lòng chọn phòng trước khi gửi yêu cầu.');
      return;
    }

    setIsSubmitting(true);
    setConflictError('');

    // Generate random booking ID: MVN-XXXXX
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newId = `MVN-${randomNum}`;

    const activeCustomer = authenticatedCustomer || customerProfile;
    const ownerName = activeCustomer?.fullName || data.customerName || 'Nguyễn Đức An';
    const ownerPhone = activeCustomer?.phone || data.customerPhone || '0376131531';
    const ownerTier = activeCustomer?.tier || 'Vàng';
    const catNames = data.petProfiles && data.petProfiles.length > 0
      ? data.petProfiles.map(p => p.name).filter(Boolean).join(', ')
      : 'Bé Miu Miu';
    const packageName = data.selectedPackage?.name || 'Gói Chăm Sóc Toàn Diện';
    const catCount = data.catCount || data.petProfiles?.length || 1;
    const bookingStatus = determineBookingStatus(data.checkIn);

    const bookingPayload = {
      id: newId,
      code: newId,
      ownerName,
      ownerPhone,
      ownerTier,
      catNames,
      cats: catCount,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      packages: [packageName],
      selectedPackage: data.selectedPackage,
      selectedRoom: data.selectedRoom,
      roomId,
      petIds: data.petProfiles?.map(p => p.id) || [],
      petProfiles: data.petProfiles,
      customerPhone: ownerPhone,
      customerName: ownerName,
      customerId: activeCustomer?.customerId || activeCustomer?.id || null,
      status: bookingStatus,
      totalPrice: total,
      createdAt: new Date().toISOString(),
    };

    // ── Kiểm tra độc quyền phòng theo ngày và thêm booking ──
    const roomResult = addNewBooking(roomId, bookingPayload);

    if (roomResult && (roomResult.conflict || roomResult.success === false)) {
      setIsSubmitting(false);
      const msg =
        roomResult.message ||
        `Rất tiếc, trong lúc bạn thao tác, phòng ${roomId} đã được một khách hàng khác đặt trong khoảng thời gian này. Vui lòng bấm "Chọn phòng khác" để đổi phòng!`;
      setConflictError(msg);
      sendWebNotification('⚠️ Phòng vừa có khách đặt!', {
        body: `Phòng ${roomId} vừa được khách khác đặt trước. Hãy bấm "Chọn phòng khác" để giữ chỗ cho bé nhé!`,
      });
      return;
    }

    // Lưu vào lịch sử đặt phòng khi phòng không bị xung đột
    upsertBooking(bookingPayload);

    // Cập nhật bookingData để Step 5 hiển thị
    if (updateData) {
      updateData({
        bookingId: newId,
        confirmedBooking: bookingPayload,
      });
    }

    sendWebNotification('🎉 Đặt phòng thành công!', {
      body: `Mã đặt phòng của bạn là ${newId}. Yêu cầu lưu trú của các bé đã được tiếp nhận thành công!`,
    });

    setIsSubmitting(false);
    onNext();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-dark font-title">4. Xác nhận & Báo giá ưu đãi</h2>
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Ưu đãi 10% hợp lệ</span>
        </div>
      </div>
      
      <div className="bg-bg-cream border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-text-dark text-lg mb-4 border-b border-gray-200/60 pb-3 flex items-center gap-2">
          <span>Thông tin đặt lịch</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-6 bg-white p-4 rounded-2xl border border-gray-100">
          <div>
            <span className="text-gray-400 block text-xs font-semibold uppercase">Thời gian</span>
            <span className="font-bold text-text-dark">{data.checkIn} → {data.checkOut} ({days} ngày)</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs font-semibold uppercase">Số lượng mèo</span>
            <span className="font-bold text-text-dark">{data.catCount} bé</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs font-semibold uppercase">Phòng & Gói dịch vụ</span>
            <span className="font-bold text-primary">{data.selectedRoom?.name} • {data.selectedPackage?.name}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs font-semibold uppercase">Tên các bé</span>
            <span className="font-bold text-text-dark">{data.petProfiles?.map(p => p.name).join(', ') || 'Chưa đặt tên'}</span>
          </div>
        </div>

        {/* Voucher Input Box */}
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-emerald-50 p-4 rounded-2xl border border-orange-200/80">
          <label className="block text-xs font-bold uppercase text-gray-700 mb-2 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-accent" />
            <span>Mã ưu đãi / Khuyến mãi</span>
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Nhập mã khuyến mãi (VD: MEOXINH10)"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold uppercase tracking-wider focus:outline-none focus:border-accent bg-white"
            />
            <button 
              type="button"
              onClick={handleApplyCoupon}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Áp dụng
            </button>
          </div>
          {couponMessage && (
            <p className={`text-xs mt-2 font-semibold ${isCouponApplied ? 'text-emerald-700' : 'text-red-500'}`}>
              {couponMessage}
            </p>
          )}
        </div>

        <h3 className="font-bold text-text-dark text-lg mb-4 border-b border-gray-200/60 pb-3">
          Chi tiết chi phí
        </h3>
        
        <div className="space-y-3 text-gray-700 mb-6 text-sm">
          <div className="flex justify-between">
            <span>Tiền dịch vụ ({days} ngày x {originalPackagePrice.toLocaleString()}đ):</span>
            <span className="font-medium text-gray-500 line-through">
              {originalPackageTotal.toLocaleString()}đ
            </span>
          </div>

          {isCouponApplied && discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <span className="flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Ưu đãi giảm giá 10% ({promotionInfo.code}):
              </span>
              <span>- {discountAmount.toLocaleString()}đ</span>
            </div>
          )}

          {/* Thứ 5 pate gift */}
          {isThursday && (
            <div className="flex justify-between items-start bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
              <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                <Gift className="w-4 h-4 text-amber-500" />
                Quà tặng Thứ 5 — Pate theo sở thích:
              </span>
              <div className="text-right">
                <span className="font-black text-amber-700">Miễn phí 🎉</span>
                {data.petProfiles && data.petProfiles.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {data.petProfiles.map(pet => (
                      <p key={pet.id} className="text-xs text-amber-600">
                        {pet.name}: {pet.patePreference || '<nhân viên xác nhận>'}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <span>Dịch vụ Camera 24/7 ({days} ngày x {cameraPrice.toLocaleString()}đ):</span>
            <span className="font-medium">{cameraTotal.toLocaleString()}đ</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-5 border-t-2 border-gray-200/80">
          <div>
            <span className="text-sm font-bold text-gray-400 uppercase block">Tổng thanh toán dự kiến</span>
            <span className="text-xs text-emerald-600 font-bold">
              {isCouponApplied ? `Đã tiết kiệm ${discountAmount.toLocaleString()}đ` : ''}
            </span>
          </div>
          <span className="text-3xl font-black text-accent">{total.toLocaleString()}đ</span>
        </div>
      </div>

      {/* Conflict Error Alert */}
      {conflictError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-3.5 text-left animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="font-bold text-red-800 text-base">Phòng vừa có khách đặt trước!</h4>
            <p className="text-red-700 text-sm mt-1 leading-relaxed">{conflictError}</p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const conflictedId = data.selectedRoom?.id;
                  if (onBackToStep1) {
                    onBackToStep1(conflictedId);
                  } else {
                    if (updateData) updateData({ selectedRoom: null, conflictedRoomId: conflictedId });
                    if (onPrev) onPrev();
                  }
                }}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>Chọn phòng khác</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
        <button 
          onClick={onPrev}
          disabled={isSubmitting}
          className="bg-white border border-gray-200 text-gray-600 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Quay lại
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-accent hover:bg-accent-hover text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-accent/30 active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>ĐANG XÁC NHẬN...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>GỬI YÊU CẦU ĐẶT LỊCH</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step4Checkout;
