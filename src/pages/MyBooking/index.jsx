import React, { useState, useEffect } from 'react';
import { 
  PawPrint, 
  Eye, 
  CreditCard, 
  Video, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download,
  Info,
  Heart
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';

const calculateBookingStatus = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 'Chưa rõ';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkIn = new Date(checkInDate);
  checkIn.setHours(0, 0, 0, 0);
  
  const checkOut = new Date(checkOutDate);
  checkOut.setHours(23, 59, 59, 999);
  
  if (today < checkIn) return 'Sắp tới';
  if (today >= checkIn && today <= checkOut) return 'Đang lưu trú';
  if (today > checkOut) return 'Đã hoàn tất';
  return 'Chưa rõ';
};

const MyBooking = () => {
  const { globalBookingList } = useBookingHistory();
  const { petList } = usePetProfile();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [searchParams, setSearchParams] = useSearchParams();
  const [detailBooking, setDetailBooking] = useState(null);
  const navigate = useNavigate();

  const tabs = ['Tất cả', 'Đang lưu trú', 'Sắp tới', 'Đã hoàn tất'];

  const processedBookings = globalBookingList.map(booking => ({
    ...booking,
    dynamicStatus: calculateBookingStatus(booking.checkIn, booking.checkOut)
  }));

  // Handle URL param: ?view=detail
  useEffect(() => {
    if (searchParams.get('view') === 'detail') {
      const targetBookingId = searchParams.get('id');
      if (targetBookingId) {
        const found = processedBookings.find(b => b.id === targetBookingId);
        setDetailBooking(found || processedBookings[0]);
      } else {
        setDetailBooking(processedBookings[0] || null);
      }
    }
  }, [searchParams, globalBookingList]);

  const filteredBookings = processedBookings.filter(booking => {
    if (activeTab === 'Tất cả') return true;
    return booking.dynamicStatus === activeTab;
  });

  const getBadgeColor = (status) => {
    switch (status) {
      case 'Đang lưu trú': return 'bg-primary-light text-primary border border-primary/20';
      case 'Sắp tới': return 'bg-orange-50 text-orange-600 border border-orange-200';
      case 'Đã hoàn tất': return 'bg-green-50 text-green-600 border border-green-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDateRange = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '';
    const format = (d) => {
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return d;
    };
    return `${format(checkIn)} - ${format(checkOut)}`;
  };

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const openBookingDetail = (booking) => {
    setDetailBooking(booking);
    setSearchParams({ view: 'detail', id: booking.id });
  };

  const closeBookingDetail = () => {
    setDetailBooking(null);
    setSearchParams({});
  };

  return (
    <div className="w-full min-h-screen bg-bg-cream pb-16">
      
      {/* MODAL: Chi tiết booking */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-bg-cream/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text-dark font-title">Chi tiết Booking</h3>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getBadgeColor(detailBooking.dynamicStatus)}`}>
                      {detailBooking.dynamicStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Mã đơn: <span className="font-mono font-bold text-text-dark">{detailBooking.id}</span></p>
                </div>
              </div>
              
              <button 
                onClick={closeBookingDetail}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Pet Info */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thông tin thú cưng</h4>
                <div className="space-y-3">
                  {(detailBooking.petProfiles || []).map((pet, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-bg-cream border border-gray-100">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        {pet.imagePreview ? (
                          <img src={pet.imagePreview} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <PawPrint className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-bold text-text-dark">{pet.name}</h5>
                          {pet.breed && <span className="text-xs text-gray-500">• {pet.breed}</span>}
                        </div>
                        <p className="text-xs text-gray-500">Cân nặng: <strong>{pet.weight || '4.5kg'}</strong> • Tuổi: <strong>{pet.age || '2 tuổi'}</strong></p>
                        {pet.personality && (
                          <p className="text-xs text-primary mt-1 line-clamp-1">Tính cách: {pet.personality}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Time & Room Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-bg-cream border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Thời gian lưu trú
                  </div>
                  <p className="text-sm font-bold text-text-dark">
                    {formatDateRange(detailBooking.checkIn, detailBooking.checkOut)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tổng: {calculateNights(detailBooking.checkIn, detailBooking.checkOut)} ngày lưu trú
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-bg-cream border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    Phòng & Gói dịch vụ
                  </div>
                  <p className="text-sm font-bold text-text-dark">
                    {detailBooking.selectedRoom?.name || 'Phòng Deluxe Suite'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {detailBooking.selectedPackage?.name || 'Gói Tiêu Chuẩn'}
                  </p>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chi tiết thanh toán</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Tiền phòng & chăm sóc ({calculateNights(detailBooking.checkIn, detailBooking.checkOut)} ngày):</span>
                    <span className="font-semibold text-text-dark">
                      {(detailBooking.totalPrice || 1200000).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Đã đặt cọc (50%):</span>
                    <span className="font-semibold text-emerald-600">
                      - {(detailBooking.depositPaid || 600000).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-3 border-t border-gray-200 text-text-dark">
                    <span>Còn lại cần thanh toán:</span>
                    <span className="text-accent text-base">
                      {(detailBooking.remainingAmount || 600000).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code check-in */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 shrink-0">
                  <QRCodeSVG 
                    value={`https://meovangnha.vn/booking/${detailBooking.id}`}
                    size={80}
                  />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold text-text-dark">Mã QR Check-in / Nhận mèo</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Xuất trình mã này cho nhân viên lễ tân khi gửi hoặc đón bé tại khách sạn.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3 justify-end">
              <button 
                onClick={closeBookingDetail}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
              
              <button 
                onClick={() => {
                  closeBookingDetail();
                  navigate('/checkout', { state: { bookingData: detailBooking } });
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Thanh toán ngay
              </button>

              <button 
                onClick={() => {
                  closeBookingDetail();
                  navigate('/tracking', { state: { bookingData: detailBooking } });
                }}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-primary/20 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                Theo dõi mèo (Live)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-text-dark font-title">Booking của tôi</h1>
            <p className="text-gray-500 text-sm mt-1">Quản lý lịch lưu trú, xem chi tiết và theo dõi tình trạng của các bé mèo.</p>
          </div>
          <button 
            onClick={() => navigate('/booking')}
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-secondary transition-colors shadow-md shadow-primary/20 w-fit cursor-pointer"
          >
            + Đặt phòng mới
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
          {tabs.map((tab, idx) => {
            const count = tab === 'Tất cả' 
              ? processedBookings.length 
              : processedBookings.filter(b => b.dynamicStatus === tab).length;
              
            return (
              <button 
                key={idx}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                    : 'bg-white text-gray-600 border-transparent hover:border-gray-200'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Booking List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <PawPrint className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Chưa có lịch đặt phòng nào</h3>
            <p className="text-gray-500 mt-2 text-sm">Bạn chưa có lịch đặt phòng nào trong mục "{activeTab}".</p>
            <button 
              onClick={() => navigate('/booking')}
              className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-secondary transition-colors cursor-pointer"
            >
              Đặt phòng ngay
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredBookings.map((booking, idx) => {
              const dynamicPets = (booking.petIds || []).map(id => petList.find(p => p.id === id)).filter(Boolean);
              const resolvedPets = dynamicPets.length > 0 ? dynamicPets : (booking.petProfiles || []);
              
              const petsName = resolvedPets.map(p => p.name).join(', ') || 'Chưa rõ';
              const packageDesc = booking.selectedPackage?.name || 'Gói Tiêu Chuẩn';
              const firstPetImage = resolvedPets[0]?.imagePreview;
              
              return (
                <div 
                  key={booking.id || idx} 
                  className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xs hover:shadow-md transition-all hover:border-primary/20 group"
                >
                  {/* Image */}
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border-4 border-gray-100 shadow-inner group-hover:scale-105 transition-transform">
                    {firstPetImage ? (
                      <img src={firstPetImage} alt={petsName} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-text-dark">{petsName}</h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full w-max mx-auto sm:mx-0 ${getBadgeColor(booking.dynamicStatus)}`}>
                        {booking.dynamicStatus}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      {booking.selectedRoom?.name ? `Phòng ${booking.selectedRoom.name} • ` : ''} 
                      {packageDesc}
                    </p>
                    <p className="text-gray-500 text-xs font-medium flex items-center justify-center md:justify-start gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatDateRange(booking.checkIn, booking.checkOut)}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono mt-2">Mã booking: {booking.id}</p>
                  </div>

                  {/* Actions Deck */}
                  <div className="flex flex-wrap sm:flex-nowrap md:flex-col items-center md:items-end gap-2 shrink-0 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 w-full md:w-auto">
                    
                    {/* Nút Xem chi tiết */}
                    <button 
                      onClick={() => openBookingDetail(booking)}
                      className="w-full sm:w-auto text-center px-4 py-2 rounded-xl text-xs font-bold text-text-dark bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      Xem chi tiết
                    </button>

                    {/* Nút Theo dõi bé (nếu đang lưu trú) */}
                    {booking.dynamicStatus === 'Đang lưu trú' && (
                      <button 
                        onClick={() => navigate('/tracking', { state: { bookingData: booking } })}
                        className="w-full sm:w-auto text-center px-4 py-2 rounded-xl text-xs font-bold text-primary bg-primary-light hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Theo dõi / Camera
                      </button>
                    )}

                    {/* Nút Thanh toán */}
                    <button 
                      onClick={() => navigate('/checkout', { state: { bookingData: booking } })}
                      className="w-full sm:w-auto text-center px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Thanh toán
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooking;
