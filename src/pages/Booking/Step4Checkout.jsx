import React, { useEffect, useRef, useState } from 'react';
import { Tag, CheckCircle2, Sparkles, Percent, Gift, AlertTriangle, RefreshCw, Star, X } from 'lucide-react';
import { promotionInfo } from '../../mockData/servicesData';
import { useRoomState, determineBookingStatus } from '../../contexts/RoomStateContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { sendWebNotification } from '../../utils/notificationService';
import { calculateBookingPrice, countStayDays, CAMERA_PRICE_PER_DAY } from '../../utils/bookingPricing';
import { getDepositPolicy, DEPOSIT_MIN_STAY_DAYS, DEPOSIT_DEADLINE_HOURS, PAYMENT_STATUS } from '../../utils/bookingDeposit';
import { useServiceCatalog } from '../../contexts/ServiceCatalogContext';
import { buildConfirmRequest, assistedOwnerFields } from '../../utils/assistedBooking';
import { sendNotification } from '../../services/notificationTriggers';
import { orderSourceFields, clearOrderSource, browserStorage } from '../../utils/orderSource';
import { useLoyalty } from '../../contexts/LoyaltyContext';
import { quoteLoyaltyPromo } from '../../services/loyaltyApi';

const Step4Checkout = ({ data, updateData, onNext, onPrev, onBackToStep1 }) => {
  // Ưu đãi 10% có sẵn trên giá niêm yết (giá gói đã giảm) luôn được áp dụng
  const isCouponApplied = true;
  // Mã giảm giá thật do Admin tạo ở trang Khuyến mãi & Điểm thưởng + điểm thưởng của khách
  const [voucherInput, setVoucherInput] = useState(data.promoRequest?.voucherCode || '');
  const [pointsInput, setPointsInput] = useState(data.promoRequest?.pointsToUse ? String(data.promoRequest.pointsToUse) : '');
  const [promoRequest, setPromoRequest] = useState({ voucherCode: data.promoRequest?.voucherCode || '', pointsToUse: Number(data.promoRequest?.pointsToUse) || 0 });
  const [promoQuote, setPromoQuote] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [pointsError, setPointsError] = useState('');
  const [isQuoting, setIsQuoting] = useState(false);
  const { loyalty, refresh: refreshLoyalty } = useLoyalty();
  const [conflictError, setConflictError] = useState('');
  // 'conflict': phòng vừa hết chỗ | 'retry': hệ thống bận / mất mạng, đơn chưa được ghi | 'invalid': dữ liệu sai
  const [errorKind, setErrorKind] = useState('conflict');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addCamera, setAddCamera] = useState(Boolean(data.addCamera));

  const { addNewBooking } = useRoomState();
  const { authenticatedCustomer, customerProfile, isAdmin } = useCustomerProfile();
  // Nhân viên đặt hộ khách đến cửa hàng
  const assisted = isAdmin ? data.assistedCustomer || null : null;
  const { upsertBooking } = useBookingHistory();
  // Quy tắc giá admin đang bật (cuối tuần, mùa, lễ Tết, giảm giá)
  const { activeRules } = useServiceCatalog();

  // Kiểm tra ngày nhận có phải Thứ 5
  const isThursday = (() => {
    if (!data.checkIn) return false;
    return new Date(data.checkIn + 'T00:00:00').getDay() === 4;
  })();

  // Tính số ngày lưu trú
  const days = countStayDays(data.checkIn, data.checkOut);

  // ── Gói lưu trú (bắt buộc) ──
  const lodging = data.selectedLodging || data.selectedPackage;
  const originalLodgingPrice = lodging?.originalPrice || Math.round((lodging?.price || 0) / 0.9);

  // ── Gói spa (tùy chọn, tính theo lần, không nhân ngày) ──
  const spa = data.selectedSpa || null;

  // ── Dịch vụ khác (tùy chọn, tính theo lần/chuyến) ──
  const extra = data.selectedExtra || null;
  const extraDiscountedPrice = extra?.price || 0;
  const extraOriginalPrice   = extra?.originalPrice || Math.round(extraDiscountedPrice / 0.9);

  // ── Tổng cộng: gói lưu trú & spa nhân theo số mèo; camera chỉ tính khi gói chưa có sẵn camera và khách tích chọn ──
  const {
    catCount,
    spaOriginalTotal,
    spaTotal,
    originalLodgingTotal,
    discountedLodgingTotal,
    cameraIncluded,
    cameraTotal,
    discount: totalDiscountAmount,
    ruleAdjustments,
    total,
  } = calculateBookingPrice({
    lodging, spa, extra, days,
    checkIn: data.checkIn,
    pricingRules: activeRules,
    cats: data.catCount || data.petProfiles?.length || 1,
    couponApplied: isCouponApplied,
    addCamera,
  });

  const isLoggedIn = Boolean(authenticatedCustomer?.id);
  const pointBalance = Number(promoQuote?.balance ?? loyalty?.points) || 0;
  const valuePerPoint = Number(loyalty?.rules?.valuePerPoint) || 1000;
  const promo = promoQuote?.promo || null;
  const voucherDiscount = Number(promo?.voucherDiscount) || 0;
  const pointsDiscount = Number(promo?.pointsDiscount) || 0;
  // Số tiền khách phải trả sau khi trừ mã giảm giá và điểm (doanh thu, tiền cọc, QR đều theo số này)
  const payable = Math.max(0, total - voucherDiscount - pointsDiscount);

  // Hỏi máy chủ số tiền giảm của mã / điểm (máy chủ kiểm tra lại lần nữa khi gửi đơn)
  const quoteSeq = useRef(0);
  const runQuote = async (request) => {
    const seq = ++quoteSeq.current;
    if (!request.voucherCode && !(request.pointsToUse > 0)) {
      setPromoQuote(null);
      return { ok: true };
    }
    setIsQuoting(true);
    try {
      const res = await quoteLoyaltyPromo({
        booking: { totalPrice: total, checkIn: data.checkIn, checkOut: data.checkOut },
        voucherCode: request.voucherCode,
        pointsToUse: request.pointsToUse,
      });
      if (seq !== quoteSeq.current) return res;
      if (res.ok) setPromoQuote(res);
      return res;
    } catch (err) {
      return { ok: false, message: err.message || 'Chưa kiểm tra được ưu đãi, vui lòng thử lại.' };
    } finally {
      if (seq === quoteSeq.current) setIsQuoting(false);
    }
  };

  const applyPromo = async (next, field) => {
    const res = await runQuote(next);
    if (res.ok) {
      setPromoRequest(next);
      setVoucherError('');
      setPointsError('');
      if (updateData) updateData({ promoRequest: next });
    } else if ((res.field || field) === 'points') {
      setPointsError(res.message);
    } else {
      setVoucherError(res.message);
    }
    return res;
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }
    applyPromo({ ...promoRequest, voucherCode: code }, 'voucher');
  };

  const handleRemoveVoucher = () => {
    setVoucherInput('');
    applyPromo({ ...promoRequest, voucherCode: '' }, 'voucher');
  };

  const handleApplyPoints = (e) => {
    e.preventDefault();
    const pts = Math.floor(Number(pointsInput) || 0);
    if (pts <= 0) {
      setPointsError('Nhập số điểm muốn dùng');
      return;
    }
    applyPromo({ ...promoRequest, pointsToUse: pts }, 'points');
  };

  const handleUseMaxPoints = (e) => {
    if (e) e.preventDefault();
    const maxPercent = Number(loyalty?.rules?.maxRedeemPercentPerOrder) || 50;
    const vDiscount = Number(promo?.voucherDiscount) || 0;
    const maxCapByOrder = Math.floor(((total - vDiscount) * maxPercent) / 100 / valuePerPoint);
    const maxAllowed = Math.max(0, Math.min(pointBalance, maxCapByOrder));
    if (maxAllowed <= 0) {
      setPointsError('Không có điểm khả dụng hoặc đơn hàng không thể giảm thêm bằng điểm.');
      return;
    }
    setPointsInput(String(maxAllowed));
    setPointsError('');
    applyPromo({ ...promoRequest, pointsToUse: maxAllowed }, 'points');
  };

  const handleRemovePoints = () => {
    setPointsInput('');
    applyPromo({ ...promoRequest, pointsToUse: 0 }, 'points');
  };

  // Tổng tiền đổi (bật camera...) thì tính lại số tiền giảm; mã / điểm không còn hợp lệ thì gỡ ra
  const lastTotal = useRef(total);
  useEffect(() => {
    if (lastTotal.current === total) return;
    lastTotal.current = total;
    if (!promoRequest.voucherCode && !(promoRequest.pointsToUse > 0)) return;
    runQuote(promoRequest).then((res) => {
      if (!res.ok) {
        setPromoQuote(null);
        setPromoRequest({ voucherCode: '', pointsToUse: 0 });
        if (res.field === 'points') setPointsError(res.message);
        else setVoucherError(res.message);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // Quay lại bước 4 với mã đã nhập trước đó: tính lại ngay
  useEffect(() => {
    if (isLoggedIn && (promoRequest.voucherCode || promoRequest.pointsToUse > 0)) runQuote(promoRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // ── Đặt cọc: gửi bé từ 5 ngày trở lên thì cọc 50% mới nhận mã đặt phòng ──
  const deposit = getDepositPolicy({ checkIn: data.checkIn, checkOut: data.checkOut, total: payable });

  const handleSubmit = async () => {
    const roomId = data.selectedRoom?.id;
    if (!roomId) {
      setErrorKind('invalid');
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
    const packageName = data.selectedLodging?.name || data.selectedPackage?.name || 'Gói Chăm Sóc Toàn Diện';
    const bookingStatus = determineBookingStatus(data.checkIn);
    const packageNames = [
      packageName,
      data.selectedSpa?.name,
      data.selectedExtra?.name,
    ].filter(Boolean);

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
      packages: packageNames,
      selectedPackage: data.selectedLodging || data.selectedPackage,
      selectedLodging: data.selectedLodging,
      selectedSpa: data.selectedSpa,
      selectedExtra: data.selectedExtra,
      selectedRoom: data.selectedRoom,
      hasCamera: cameraIncluded || addCamera,
      addCamera: !cameraIncluded && addCamera,
      // Ghi lại để khi khách chỉnh sửa đơn, giá mới tính cùng ưu đãi như lúc đặt
      couponApplied: isCouponApplied,
      roomId,
      petIds: data.petProfiles?.map(p => p.id) || [],
      petProfiles: data.petProfiles,
      customerPhone: ownerPhone,
      customerName: ownerName,
      customerId: activeCustomer?.customerId || activeCustomer?.id || null,
      status: bookingStatus,
      totalPrice: total,
      totalAmount: payable,
      pricingAdjustments: ruleAdjustments,
      // Mã giảm giá / điểm thưởng khách chọn: server kiểm tra lại rồi mới trừ vào đơn
      ...(promoRequest.voucherCode || promoRequest.pointsToUse > 0
        ? { promoRequest: { voucherCode: promoRequest.voucherCode, pointsToUse: promoRequest.pointsToUse } }
        : {}),
      depositRequired: deposit.required,
      depositAmount: deposit.amount,
      paymentStatus: deposit.paymentStatus,
      pending_changes: null,
      previous_status: null,
      // Khách mở web từ link nhân viên gửi qua Messenger: đơn được ghi nguồn "Đặt qua Messenger"
      ...(assisted ? {} : orderSourceFields(browserStorage())),
      createdAt: new Date().toISOString(),
    };

    // Đặt hộ: chủ đơn là khách đã chọn. Khách đã có tài khoản phải xác nhận thì đơn mới được ghi nhận.
    if (assisted) {
      const staffName = authenticatedCustomer?.fullName || 'Nhân viên';
      Object.assign(bookingPayload, assistedOwnerFields(assisted, { staffName, isNewAccount: assisted.isNewAccount }));
      bookingPayload.ownerTier = assisted.tier || 'Thành viên';
      if (!assisted.isNewAccount) bookingPayload.pending_changes = buildConfirmRequest({ staffName });
    }

    // ── Kiểm tra độc quyền phòng theo ngày và thêm booking (Atomic qua server) ──
    const roomResult = await addNewBooking(roomId, bookingPayload);

    if (roomResult && (roomResult.conflict || roomResult.success === false)) {
      setIsSubmitting(false);
      const msg =
        roomResult.message ||
        `Rất tiếc, phòng ${roomId} không còn đủ chỗ trống trong khoảng thời gian này. Vui lòng bấm "Chọn phòng khác" để đổi phòng!`;
      if (roomResult.promoError) {
        // Mã / điểm vừa hết hiệu lực (hết lượt, đổi điều kiện...): gỡ ra để khách xem lại tổng tiền
        setPromoQuote(null);
        setPromoRequest({ voucherCode: '', pointsToUse: 0 });
        if (roomResult.promoField === 'points') setPointsError(roomResult.message);
        else setVoucherError(roomResult.message);
      }
      const kind = roomResult.retryable ? 'retry' : roomResult.invalid ? 'invalid' : 'conflict';
      setErrorKind(kind);
      setConflictError(msg);
      if (kind === 'conflict') {
        sendWebNotification('⚠️ Đặt phòng chưa thành công', {
          body: `Phòng ${roomId} vừa có khách khác đặt trước bạn. Tình trạng phòng đã được cập nhật lại, thông tin bạn điền vẫn được giữ nguyên.`,
        });
      }
      if (updateData && kind === 'conflict') {
        updateData({ conflictedRoomId: roomResult.conflictedRoomId || roomId });
      }
      return;
    }

    // Server có thể cấp mã mới nếu mã tạo ở trình duyệt bị trùng
    const confirmedCode = roomResult?.booking?.code || newId;
    // Lấy trạng thái cọc do server tính (nếu có) để bước 5 hiện đúng
    const confirmedBooking = { ...bookingPayload, ...(roomResult?.booking || {}), id: confirmedCode, code: confirmedCode };

    delete confirmedBooking.promoRequest;

    // Lưu vào lịch sử đặt phòng khi phòng không bị xung đột
    upsertBooking(confirmedBooking);
    if (!assisted && bookingPayload.orderSource) clearOrderSource(browserStorage());
    if (confirmedBooking.promo) {
      refreshLoyalty();
      try { window.dispatchEvent(new Event('mvn_loyalty_changed')); } catch { /* bỏ qua */ }
    }

    // Cập nhật bookingData để Step 5 hiển thị
    if (updateData) {
      updateData({
        bookingId: confirmedCode,
        confirmedBooking,
        totalAmount: Number(confirmedBooking.totalAmount ?? payable),
        promoRequest: null,
      });
    }

    if (assisted) {
      const awaitingConfirm = Boolean(confirmedBooking.pending_changes);
      // Báo cho khách (chuông thông báo trên web tự hiện theo đơn, Web Push tới điện thoại nếu khách đã bật)
      sendNotification({
        userId: assisted.id,
        title: awaitingConfirm ? `📩 Mèo Vắng Nhà đã đặt phòng giúp bạn (#${confirmedCode})` : `🎉 Đặt phòng thành công (#${confirmedCode})`,
        body: awaitingConfirm
          ? `Phòng ${roomId}, ${data.checkIn} → ${data.checkOut}. Vui lòng mở "Lịch đặt của tôi" để xác nhận đơn.`
          : `Phòng ${roomId}, ${data.checkIn} → ${data.checkOut}. Nhân viên đã tạo đơn cho bạn tại cửa hàng.`,
        url: `/my-booking?code=${confirmedCode}`,
        tag: `booking-${confirmedCode}`,
        data: { bookingId: confirmedCode },
      }).catch(() => {});
      sendWebNotification(awaitingConfirm ? '📩 Đã gửi đơn cho khách xác nhận' : '🎉 Đã đặt phòng cho khách', {
        body: awaitingConfirm
          ? `Đơn ${confirmedCode} của ${assisted.fullName} đang chờ khách xác nhận.`
          : `Đơn ${confirmedCode} của ${assisted.fullName} đã được ghi nhận.`,
      });
    } else if (confirmedBooking.paymentStatus === PAYMENT_STATUS.AWAITING_DEPOSIT) {
      sendWebNotification('🏠 Đã giữ phòng cho các bé!', {
        body: `Vui lòng chuyển khoản cọc ${Number(confirmedBooking.depositAmount || 0).toLocaleString()}đ trong vòng ${DEPOSIT_DEADLINE_HOURS} giờ để nhận mã đặt phòng, nếu không đơn có thể bị hủy.`,
      });
    } else {
      sendWebNotification('🎉 Đặt phòng thành công!', {
        body: `Mã đặt phòng của bạn là ${confirmedCode}. Yêu cầu lưu trú của các bé đã được tiếp nhận thành công!`,
      });
    }

    setIsSubmitting(false);
    onNext(confirmedCode, confirmedBooking);
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
            <span className="font-bold text-text-dark">{catCount} bé</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-gray-400 block text-xs font-semibold uppercase mb-1">Phòng & Gói dịch vụ</span>
            <div className="space-y-1">
              <span className="font-bold text-primary block">
                {data.selectedRoom?.id} — {lodging?.name || 'Chưa chọn gói'}
              </span>
              {spa && (
                <span className="font-semibold text-purple-600 block text-xs">+ {spa.name}</span>
              )}
              {extra && (
                <span className="font-semibold text-sky-600 block text-xs">+ {extra.name}</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-gray-400 block text-xs font-semibold uppercase">Tên các bé</span>
            <span className="font-bold text-text-dark">{data.petProfiles?.map(p => p.name).join(', ') || 'Chưa đặt tên'}</span>
          </div>
        </div>

        {/* Mã giảm giá & điểm thưởng thật */}
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-emerald-50 p-4 rounded-2xl border border-orange-200/80 space-y-4" data-testid="promo-box">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-accent" />
              <span>Mã giảm giá</span>
            </label>
            {promo?.voucherCode ? (
              <div className="flex items-center justify-between gap-2 bg-white border border-emerald-200 rounded-xl px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-black text-emerald-700 tracking-wider">{promo.voucherCode}</span>
                  <span className="text-gray-500"> · {promo.voucherLabel}</span>
                  <p className="text-xs font-bold text-emerald-700">Giảm {voucherDiscount.toLocaleString()}đ</p>
                </div>
                <button type="button" onClick={handleRemoveVoucher} className="text-gray-400 hover:text-red-500 p-1" title="Bỏ mã">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => { setVoucherInput(e.target.value); setVoucherError(''); }}
                  placeholder={isLoggedIn ? 'Nhập mã giảm giá (VD: SUMMERBOSS)' : 'Đăng nhập để dùng mã giảm giá'}
                  disabled={!isLoggedIn || isQuoting}
                  data-testid="voucher-input"
                  className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold uppercase tracking-wider focus:outline-none focus:border-accent bg-white disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={!isLoggedIn || isQuoting}
                  className="bg-accent hover:bg-accent-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-60"
                >
                  Áp dụng
                </button>
              </form>
            )}
            {voucherError && <p className="text-xs mt-2 font-semibold text-red-500" data-testid="voucher-error">{voucherError}</p>}
          </div>

          <div className="border-t border-orange-200/60 pt-3">
            <label className="block text-xs font-bold uppercase text-gray-700 mb-2 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Dùng điểm tích lũy</span>
              </span>
              {isLoggedIn && (
                <span className="normal-case font-semibold text-gray-500">
                  Bạn có <strong className="text-amber-600">{pointBalance.toLocaleString()} điểm</strong> (1 điểm = {valuePerPoint.toLocaleString()}đ)
                </span>
              )}
            </label>
            {promo?.pointsUsed > 0 ? (
              <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-xl px-4 py-2.5">
                <div className="text-sm">
                  <span className="font-black text-amber-700">{promo.pointsUsed.toLocaleString()} điểm</span>
                  <p className="text-xs font-bold text-emerald-700">Giảm {pointsDiscount.toLocaleString()}đ (áp dụng vào hóa đơn)</p>
                </div>
                <button type="button" onClick={handleRemovePoints} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer" title="Không dùng điểm">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPoints} className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={pointBalance}
                  value={pointsInput}
                  onChange={(e) => { setPointsInput(e.target.value); setPointsError(''); }}
                  placeholder={isLoggedIn ? (pointBalance > 0 ? 'Nhập số điểm muốn dùng' : 'Bạn chưa có điểm tích lũy') : 'Đăng nhập để dùng điểm tích lũy'}
                  disabled={!isLoggedIn || isQuoting || pointBalance <= 0}
                  data-testid="points-input"
                  className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-accent bg-white disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={handleUseMaxPoints}
                  disabled={!isLoggedIn || isQuoting || pointBalance <= 0}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-3 py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  data-testid="use-max-points-btn"
                  title="Dùng tối đa số điểm (tối đa 50% giá trị hóa đơn)"
                >
                  Dùng tối đa
                </button>
                <button
                  type="submit"
                  disabled={!isLoggedIn || isQuoting || pointBalance <= 0}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  Áp dụng
                </button>
              </form>
            )}
            {pointsError && <p className="text-xs mt-2 font-semibold text-red-500" data-testid="points-error">{pointsError}</p>}
            {isLoggedIn && !pointsError && !(promo?.pointsUsed > 0) && (
              <p className="text-[11px] mt-1.5 text-gray-500">
                {pointBalance > 0
                  ? `Giảm tối đa ${Number(loyalty?.rules?.maxRedeemPercentPerOrder) || 50}% giá trị đơn hàng (1 điểm = ${valuePerPoint.toLocaleString()}đ).`
                  : 'Bạn chưa có điểm. Mỗi đơn hoàn tất (check-out) sẽ được cộng điểm theo tỷ lệ 10.000đ = 1 điểm.'}
              </p>
            )}
          </div>
        </div>

        <h3 className="font-bold text-text-dark text-lg mb-4 border-b border-gray-200/60 pb-3">
          Chi tiết chi phí
        </h3>
        
        <div className="space-y-2.5 text-gray-700 mb-6 text-sm">

          {/* ── Gói lưu trú ── */}
          <div className="bg-white border border-gray-100 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-text-dark">🏠 {lodging?.name || 'Gói lưu trú'}</span>
              <span className="font-medium text-gray-400 line-through text-xs">{originalLodgingTotal.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{catCount} bé × {days} ngày × {originalLodgingPrice.toLocaleString()}đ/ngày</span>
              <span className="font-bold text-text-dark">{discountedLodgingTotal.toLocaleString()}đ</span>
            </div>
          </div>

          {/* ── Gói Spa ── */}
          {spa && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-purple-800">💆 {spa.name}</span>
                <span className="font-medium text-gray-400 line-through text-xs">{spaOriginalTotal.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center text-xs text-purple-700">
                <span>{catCount} bé × {(spa.originalPrice || Math.round((spa.price || 0) / 0.9)).toLocaleString()}đ/lần</span>
                <span className="font-bold">{spaTotal.toLocaleString()}đ</span>
              </div>
            </div>
          )}

          {/* ── Dịch vụ khác ── */}
          {extra && (
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sky-800">🚗 {extra.name}</span>
                <span className="font-medium text-gray-400 line-through text-xs">{extraOriginalPrice.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between items-center text-xs text-sky-700">
                <span>1 {extra.period?.replace('/', '') || 'lần'}</span>
                <span className="font-bold">{extraDiscountedPrice.toLocaleString()}đ</span>
              </div>
            </div>
          )}

          {/* ── Camera ── */}
          {cameraIncluded ? (
            <div className="flex justify-between items-center py-1.5 border-t border-dashed border-gray-200">
              <span className="text-gray-500">📷 Camera 24/7</span>
              <span className="font-medium text-emerald-700">Đã gồm trong gói</span>
            </div>
          ) : (
            <label className="flex justify-between items-center gap-3 py-1.5 border-t border-dashed border-gray-200 cursor-pointer">
              <span className="flex items-center gap-2 text-gray-500">
                <input
                  type="checkbox"
                  checked={addCamera}
                  onChange={(e) => setAddCamera(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                📷 Thêm camera 24/7 ({days} ngày × {CAMERA_PRICE_PER_DAY.toLocaleString()}đ)
              </span>
              <span className="font-medium">{cameraTotal.toLocaleString()}đ</span>
            </label>
          )}

          {/* ── Giảm giá ── */}
          {isCouponApplied && totalDiscountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <span className="flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Ưu đãi -10% ({promotionInfo.code}):
              </span>
              <span>- {totalDiscountAmount.toLocaleString()}đ</span>
            </div>
          )}

          {/* ── Phụ thu / giảm giá theo quy tắc admin bật ở trang Dịch vụ ── */}
          {ruleAdjustments.map((line) => (
            <div
              key={line.id}
              className={`flex justify-between p-2.5 rounded-xl border font-semibold ${line.amount < 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-800 bg-amber-50 border-amber-200'}`}
            >
              <span>
                {line.name}
                {line.nights ? ` (${line.nights} đêm, ${line.percent > 0 ? '+' : ''}${line.percent}%)` : ` (-${line.percent}%)`}:
              </span>
              <span>{line.amount < 0 ? '- ' : '+ '}{Math.abs(line.amount).toLocaleString()}đ</span>
            </div>
          ))}

          {/* ── Mã giảm giá & điểm thưởng ── */}
          {voucherDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100" data-testid="voucher-line">
              <span className="flex items-center gap-1"><Tag className="w-4 h-4" />Mã giảm giá {promo.voucherCode}:</span>
              <span>- {voucherDiscount.toLocaleString()}đ</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100" data-testid="points-line">
              <span className="flex items-center gap-1"><Star className="w-4 h-4" />Dùng {promo.pointsUsed.toLocaleString()} điểm thưởng:</span>
              <span>- {pointsDiscount.toLocaleString()}đ</span>
            </div>
          )}

          {/* ── Thứ 5 quà tặng ── */}
          {isThursday && (
            <div className="flex justify-between items-start bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
              <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                <Gift className="w-4 h-4 text-amber-500" />
                Quà Thứ 5 — Pate theo sở thích:
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
        </div>

        <div className="flex justify-between items-center pt-5 border-t-2 border-gray-200/80">
          <div>
            <span className="text-sm font-bold text-gray-400 uppercase block">Tổng thanh toán dự kiến</span>
            {isCouponApplied && totalDiscountAmount + voucherDiscount + pointsDiscount > 0 && (
              <span className="text-xs text-emerald-600 font-bold">Đã tiết kiệm {(totalDiscountAmount + voucherDiscount + pointsDiscount).toLocaleString()}đ</span>
            )}
          </div>
          <div className="text-right">
            {payable !== total && <span className="block text-sm text-gray-400 line-through font-semibold">{total.toLocaleString()}đ</span>}
            <span className="text-3xl font-black text-accent" data-testid="payable-total">{payable.toLocaleString()}đ</span>
          </div>
        </div>
      </div>

      {/* ── Ghi chú đặt cọc ── */}
      {deposit.required ? (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-sm text-amber-900 space-y-1.5">
          <p className="font-bold text-base">💰 Cần đặt cọc 50% để nhận mã đặt phòng</p>
          <p>
            Bạn gửi bé {deposit.stayDays} ngày (từ {DEPOSIT_MIN_STAY_DAYS} ngày trở lên) nên cần chuyển khoản cọc{' '}
            <strong>{deposit.amount.toLocaleString()}đ</strong>. Mèo Vàng Nhà giữ phòng cho bạn và gửi mã đặt phòng ngay khi nhận được tiền cọc.
          </p>
          <p className="font-bold text-red-700">
            ⏰ Vui lòng chuyển tiền cọc trong vòng {DEPOSIT_DEADLINE_HOURS} giờ kể từ lúc đặt phòng. Quá {DEPOSIT_DEADLINE_HOURS} giờ chưa nhận được cọc, đơn đặt phòng có thể bị hủy và phòng được nhường cho khách khác.
          </p>
          <p>Số còn lại thanh toán khi hoàn thành dịch vụ. Nếu tiền cọc nhiều hơn số tiền thực tế phải trả, phần dư sẽ được hoàn lại khi hoàn thành dịch vụ.</p>
        </div>
      ) : (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 text-sm text-emerald-900 space-y-1.5">
          <p className="font-bold text-base">✅ Không cần đặt cọc trước</p>
          <p>
            Bạn gửi bé {deposit.stayDays} ngày (dưới {DEPOSIT_MIN_STAY_DAYS} ngày) nên bạn nhận mã đặt phòng ngay và thanh toán khi hoàn thành dịch vụ.
          </p>
        </div>
      )}

      {/* Conflict Error Alert */}
      {conflictError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-3.5 text-left animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="font-bold text-red-800 text-base">
              {errorKind === 'retry' ? 'Chưa gửi được yêu cầu đặt phòng' : errorKind === 'invalid' ? 'Thông tin đặt phòng chưa hợp lệ' : 'Đặt phòng chưa thành công'}
            </h4>
            {errorKind === 'conflict' && (
              <p className="text-red-800 text-sm mt-1 leading-relaxed font-semibold" data-testid="booking-conflict-reason">
                Phòng {data.selectedRoom?.id} vừa có khách khác đặt trước bạn trong cùng thời gian. Tình trạng phòng đã được cập nhật lại.
              </p>
            )}
            <p className="text-red-700 text-sm mt-1 leading-relaxed">{conflictError}</p>
            {errorKind !== 'invalid' && (
              <p className="text-red-700 text-sm mt-1 leading-relaxed">
                Thông tin bạn đã điền (ngày gửi, bé mèo, gói dịch vụ) vẫn được giữ nguyên, bạn chỉ cần {errorKind === 'retry' ? 'bấm gửi lại' : 'chọn phòng khác rồi gửi lại'}.
              </p>
            )}
            <div className="mt-3 flex gap-3">
              {errorKind === 'retry' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Gửi lại</span>
              </button>
              ) : (
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
              )}
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
              <span>{deposit.required ? 'GIỮ PHÒNG & ĐẶT CỌC' : 'GỬI YÊU CẦU ĐẶT LỊCH'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step4Checkout;
