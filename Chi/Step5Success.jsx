import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Download, Home, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBookingHistory } from '../src/contexts/BookingHistoryContext';
import { useRoomState, determineBookingStatus } from './RoomStateContext';
import { useCustomerProfile } from '../src/contexts/CustomerContext';

const Step5Success = ({ data }) => {
  const [bookingId, setBookingId] = useState('');
  const { addBooking, upsertBooking } = useBookingHistory();
  const { addNewBooking } = useRoomState();
  const { authenticatedCustomer, customerProfile } = useCustomerProfile?.() || {};
  const hasAdded = useRef(false);

  // Kiểm tra Thứ 5
  const isThursday = (() => {
    if (!data.checkIn) return false;
    return new Date(data.checkIn + 'T00:00:00').getDay() === 4;
  })();

  useEffect(() => {
    if (hasAdded.current) return;
    hasAdded.current = true;

    // Generate random booking ID: MVN-XXXXX
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
      petIds: data.petProfiles?.map(p => p.id) || [],
      petProfiles: data.petProfiles,
      customerPhone: ownerPhone,
      customerName: ownerName,
      customerId: activeCustomer?.customerId || null,
      status: bookingStatus,
      createdAt: new Date().toISOString(),
    };

    // Save to booking history context
    if (upsertBooking) {
      upsertBooking(bookingPayload);
    } else {
      addBooking(bookingPayload);
    }

    // ── Đồng bộ sang Admin Tình trạng phòng ──
    const roomId = data.selectedRoom?.id;
    if (roomId) {
      addNewBooking(roomId, {
        ...bookingPayload,
        roomId,
      });
    }
  }, [addBooking, addNewBooking, data, authenticatedCustomer, customerProfile, upsertBooking]);

  if (!bookingId) return null;

  return (
    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 py-8">
      <div className="flex justify-center mb-6">
        <CheckCircle className="w-24 h-24 text-primary animate-bounce" />
      </div>

      <h2 className="text-3xl font-bold text-text-dark font-title">Đặt Lịch Thành Công!</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Cảm ơn bạn đã tin tưởng Mèo Vắng Nhà. Yêu cầu đặt phòng của các bé <strong>{data.petProfiles?.map(p => p.name).join(', ')}</strong> đã được ghi nhận.
      </p>

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

      <div className="bg-bg-cream inline-block p-8 rounded-3xl border border-gray-100 shadow-sm mx-auto mt-8">
        <p className="text-sm text-gray-500 mb-2 font-semibold">MÃ ĐẶT PHÒNG CỦA BẠN</p>
        <p className="text-2xl font-bold text-text-dark mb-6 tracking-wider">{bookingId}</p>

        <div className="bg-white p-4 rounded-xl inline-block shadow-sm mb-6 border border-gray-100">
          <QRCodeSVG
            value={`https://meovangnha.vn/booking/${bookingId}`}
            size={180}
            level="H"
            fgColor="#1E293B"
          />
        </div>

        <p className="text-sm text-gray-500 italic max-w-xs mx-auto">
          Vui lòng lưu lại mã QR này hoặc đưa cho nhân viên khi đến làm thủ tục check-in.
        </p>
      </div>

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
