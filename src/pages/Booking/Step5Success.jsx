import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Clock, Download, Home, Gift, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { useRoomState, determineBookingStatus } from '../../contexts/RoomStateContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { paymentAccount } from '../../config/payment';
import { buildVietQrPayload, isPaymentAccountReady } from '../../utils/vietqr';
import { PAYMENT_STATUS } from '../../utils/bookingDeposit';

const Step5Success = ({ data, onBackToStep1 }) => {
  const initialBookingId = data.bookingId || data.confirmedBooking?.code || data.confirmedBooking?.id || '';
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [bookingConflict, setBookingConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  const { upsertBooking } = useBookingHistory();
  const { addNewBooking, bookings } = useRoomState();
  const { authenticatedCustomer, customerProfile } = useCustomerProfile();
  const hasAdded = useRef(false);
  const paymentTotal = Number(data.confirmedBooking?.totalPrice) || 0;

  // Kiểm tra Thứ 5
  const isThursday = (() => {
    if (!data.checkIn) return false;
    return new Date(data.checkIn + 'T00:00:00').getDay() === 4;
  })();

  useEffect(() => {
    // Nếu đơn đã được xác nhận thành công tại Bước 4, chỉ hiển thị mã đặt phòng
    if (data.confirmedBooking || data.bookingId) {
      if (!bookingId) {
        setBookingId(data.bookingId || data.confirmedBooking?.code || data.confirmedBooking?.id);
      }
      return;
    }

    if (hasAdded.current) return;
    hasAdded.current = true;

    // Dự phòng khi chuyển trực tiếp vào Bước 5
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newId = `MVN-${randomNum}`;
    setBookingId(newId);

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
      roomId: data.selectedRoom?.id,
      petIds: data.petProfiles?.map(p => p.id) || [],
      petProfiles: data.petProfiles,
      customerPhone: ownerPhone,
      customerName: ownerName,
      customerId: activeCustomer?.customerId || activeCustomer?.id || null,
      status: bookingStatus,
      createdAt: new Date().toISOString(),
    };

    const executeFallbackBooking = async () => {
      // ── Kiểm tra độc quyền phòng và đồng bộ sang Admin Tình trạng phòng ──
      const roomId = data.selectedRoom?.id;
      if (roomId) {
        const roomResult = await addNewBooking(roomId, bookingPayload);

        if (roomResult && (roomResult.conflict || roomResult.success === false)) {
          setBookingConflict(true);
          setConflictMessage(
            roomResult.message ||
              `Phòng ${roomId} vừa có khách đặt trong khoảng thời gian này. Vui lòng chọn phòng khác!`
          );
          return; // Dừng lại, KHÔNG lưu đơn vào booking history
        }
      }

      // Chỉ lưu vào booking history khi phòng không bị xung đột
      upsertBooking(bookingPayload);
    };

    executeFallbackBooking();
  }, [addNewBooking, data, authenticatedCustomer, customerProfile, upsertBooking, bookingId]);

  if (bookingConflict) {
    return (
      <div className="text-center space-y-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-red-500 animate-pulse" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-dark font-title">
          Phòng vừa có khách đặt trước!
        </h2>
        <p className="max-w-xl mx-auto text-gray-600 leading-relaxed text-sm sm:text-base">
          {conflictMessage ||
            `Rất tiếc, trong lúc bạn thao tác, phòng ${data.selectedRoom?.id || ''} đã được một khách hàng khác đặt trong khoảng thời gian này. Để đảm bảo không gian riêng biệt cho các bé, vui lòng quay lại chọn phòng khác hoặc đổi ngày.`}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onBackToStep1 ? (
            <button
              onClick={() => onBackToStep1(data.selectedRoom?.id)}
              className="inline-flex items-center justify-center bg-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Chọn phòng khác
            </button>
          ) : (
            <Link
              to="/booking"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center bg-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Chọn phòng khác
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!bookingId) return null;

  // Trạng thái cọc lấy từ server (tự cập nhật vài giây một lần) để hiện mã ngay khi admin xác nhận đã nhận cọc
  const liveBooking = Object.values(bookings || {}).flat().find((b) => b?.code === bookingId || b?.id === bookingId);
  const paymentStatus = liveBooking?.paymentStatus || data.confirmedBooking?.paymentStatus;
  const depositAmount = Number(liveBooking?.depositAmount ?? data.confirmedBooking?.depositAmount) || 0;
  const awaitingDeposit = paymentStatus === PAYMENT_STATUS.AWAITING_DEPOSIT;
  const depositPaid = paymentStatus === PAYMENT_STATUS.DEPOSIT_PAID;
  const qrAmount = awaitingDeposit ? depositAmount : depositPaid ? 0 : paymentTotal;
  const qrMemo = awaitingDeposit ? `COC ${bookingId}` : bookingId;

  return (
    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 py-8">
      <div className="flex justify-center mb-6">
        {awaitingDeposit
          ? <Clock className="w-24 h-24 text-amber-500" />
          : <CheckCircle className="w-24 h-24 text-primary animate-bounce" />}
      </div>

      {awaitingDeposit ? (
        <>
          <h2 className="text-3xl font-bold text-text-dark font-title">Đã Giữ Phòng, Chờ Đặt Cọc</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Mèo Vàng Nhà đang giữ phòng cho các bé <strong>{data.petProfiles?.map(p => p.name).join(', ')}</strong>.
            Vui lòng chuyển khoản cọc 50% bên dưới để nhận mã đặt phòng.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-text-dark font-title">Đặt Lịch Thành Công!</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Cảm ơn bạn đã tin tưởng Mèo Vắng Nhà. Yêu cầu đặt phòng của các bé <strong>{data.petProfiles?.map(p => p.name).join(', ')}</strong> đã được ghi nhận.
          </p>
        </>
      )}

      {/* Thursday pate gift notification */}
      {isThursday && (
        <div className="mx-auto max-w-md bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 flex items-start gap-3 text-left">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-amber-800">🎉 Quà Tặng Thứ 5 Đã Được Đăng Ký!</p>
            <p className="text-amber-700 text-sm mt-1">Các bé sẽ được tặng <strong>pate miễn phí</strong> theo sở thích riêng:</p>
            <div className="mt-2 space-y-1">
              {data.petProfiles?.map(pet => (
                <p key={pet.id} className="text-xs text-amber-700 font-semibold">
                  🐾 {pet.name}: {pet.patePreference || 'nhân viên sẽ xác nhận khi check-in'}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {awaitingDeposit ? (
        <div className="bg-amber-50 max-w-md mx-auto p-6 rounded-3xl border-2 border-dashed border-amber-300 mt-8">
          <p className="text-sm text-amber-700 mb-2 font-semibold">MÃ ĐẶT PHÒNG CỦA BẠN</p>
          <p className="text-amber-900 font-bold">Sẽ hiện tại đây ngay khi Mèo Vàng Nhà nhận được tiền cọc.</p>
          <p className="text-xs text-amber-700 mt-2">Trang tự cập nhật, bạn không cần tải lại. Bạn cũng xem được trong mục "Lịch của tôi".</p>
        </div>
      ) : (
      <div className="bg-bg-cream inline-block p-8 rounded-3xl border border-gray-100 shadow-sm mx-auto mt-8">
        <p className="text-sm text-gray-500 mb-2 font-semibold">MÃ ĐẶT PHÒNG CỦA BẠN</p>
        <p className="text-2xl font-bold text-text-dark mb-6 tracking-wider">{bookingId}</p>

        <div className="bg-white p-4 rounded-xl inline-block shadow-sm mb-6 border border-gray-100">
          <QRCodeSVG
            value={`https://meovangnha.vn/booking/${bookingId}`}
            size={180}
            level="H"
            fgColor="#1E293B" // text-dark
          />
        </div>

        <p className="text-sm text-gray-500 italic max-w-xs mx-auto">
          Vui lòng lưu lại mã QR này hoặc đưa cho nhân viên khi đến làm thủ tục check-in.
        </p>
      </div>
      )}

      {/* ── Ghi chú thanh toán theo quy định đặt cọc ── */}
      {depositPaid && (
        <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-900 text-left">
          <p className="font-bold">✅ Đã nhận tiền cọc {depositAmount.toLocaleString()}đ</p>
          <p className="mt-1">
            Số còn lại {Math.max(paymentTotal - depositAmount, 0).toLocaleString()}đ thanh toán khi đón bé.
            Nếu tiền cọc nhiều hơn số tiền thực tế phải trả, phần dư sẽ được hoàn lại khi hoàn thành dịch vụ.
          </p>
        </div>
      )}
      {paymentStatus === PAYMENT_STATUS.PAY_AT_CHECKIN && (
        <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-900 text-left">
          <p className="font-bold">✅ Không cần đặt cọc trước</p>
          <p className="mt-1">Ngày gửi bé không quá 5 ngày nữa, bạn thanh toán khi đưa bé đến hoặc chuyển khoản trước bằng mã QR bên dưới.</p>
        </div>
      )}

      {/* ── QR thanh toán chuyển khoản: điền sẵn số tiền và mã đặt phòng ── */}
      {qrAmount > 0 && (
        <div className="bg-white max-w-md mx-auto mt-6 p-6 rounded-3xl border border-emerald-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1 font-semibold">{awaitingDeposit ? 'QUÉT MÃ ĐỂ ĐẶT CỌC 50%' : 'QUÉT MÃ ĐỂ THANH TOÁN'}</p>
          <p className="text-3xl font-black text-accent mb-4">{qrAmount.toLocaleString()}đ</p>
          {awaitingDeposit && (
            <p className="text-xs text-gray-500 -mt-3 mb-4">Tổng đơn {paymentTotal.toLocaleString()}đ, số còn lại thanh toán khi đón bé.</p>
          )}
          {isPaymentAccountReady(paymentAccount) ? (
            <>
              <div className="bg-white p-3 rounded-xl inline-block border border-gray-100 mb-4">
                <QRCodeSVG
                  value={buildVietQrPayload({ ...paymentAccount, amount: qrAmount, memo: qrMemo })}
                  size={200}
                  level="M"
                />
              </div>
              <div className="text-sm text-gray-600 space-y-1 text-left bg-bg-cream rounded-2xl p-4">
                {paymentAccount.bankName && <p>Ngân hàng: <strong className="text-text-dark">{paymentAccount.bankName}</strong></p>}
                <p>Số tài khoản: <strong className="text-text-dark">{paymentAccount.accountNumber}</strong></p>
                {paymentAccount.accountName && <p>Chủ tài khoản: <strong className="text-text-dark">{paymentAccount.accountName}</strong></p>}
                <p>Nội dung: <strong className="text-text-dark">{qrMemo}</strong></p>
              </div>
              <p className="text-xs text-gray-400 mt-3">Mở app ngân hàng, quét mã QR. Số tiền và nội dung đã được điền sẵn.</p>
            </>
          ) : (
            <p className="text-sm text-gray-500 bg-bg-cream rounded-2xl p-4">
              Nhân viên Mèo Vàng Nhà sẽ gửi thông tin chuyển khoản cho bạn qua Zalo/điện thoại.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4 pt-8">
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
          <Download className="w-5 h-5" />
          Lưu ảnh QR
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Home className="w-5 h-5" />
          Về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default Step5Success;
