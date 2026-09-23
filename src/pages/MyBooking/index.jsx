import React, { useState } from 'react';
import { PawPrint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import { toast } from 'react-hot-toast';

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
  const { globalBookingList, updateBooking } = useBookingHistory();
  const { petList } = usePetProfile();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const navigate = useNavigate();

  const tabs = ['Tất cả', 'Đang lưu trú', 'Sắp tới', 'Đã hoàn tất'];

  const processedBookings = globalBookingList.map(booking => ({
    ...booking,
    dynamicStatus: calculateBookingStatus(booking.checkIn, booking.checkOut)
  }));

  const filteredBookings = processedBookings.filter(booking => {
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

  const handlePayment = (bookingId) => {
    updateBooking(bookingId, { paymentStatus: 'Đã thanh toán' });
    toast.success('Thanh toán thành công! Hệ thống đã cập nhật hạng thành viên.');
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
                      <span className={`text-xs font-bold px-3 py-1 rounded-full w-max mx-auto sm:mx-0 ${getBadgeColor(booking.dynamicStatus)}`}>
                        {booking.dynamicStatus}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full w-max mx-auto sm:mx-0 ${booking.paymentStatus === 'Đã thanh toán' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {booking.paymentStatus || 'Chưa thanh toán'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      {booking.selectedRoom?.name ? `Phòng ${booking.selectedRoom.name} • ` : ''} 
                      {packageDesc}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">{formatDateRange(booking.checkIn, booking.checkOut)}</p>
                    <p className="text-xs text-gray-400 mt-2">Mã booking: {booking.id}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center sm:items-end gap-3 shrink-0 mt-4 sm:mt-0 border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0 w-full sm:w-auto">
                    {booking.dynamicStatus === 'Đang lưu trú' && (
                      <button 
                        onClick={() => navigate('/tracking')}
                        className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl text-sm font-bold text-accent border-2 border-accent/20 hover:border-accent hover:bg-accent hover:text-white transition-colors bg-accent/5"
                      >
                        Xem chi tiết / Camera
                      </button>
                    )}
                    {booking.paymentStatus !== 'Đã thanh toán' && (
                      <button 
                        onClick={() => handlePayment(booking.id)}
                        className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm"
                      >
                        Thanh toán ngay
                      </button>
                    )}
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
