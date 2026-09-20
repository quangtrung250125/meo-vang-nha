import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import { useCareLog } from '../../contexts/CareLogContext';
import { activeBookings as mockActiveBookings } from '../../mockData/activeBookings';
import CatDiaryModal from './CatDiaryModal';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { globalBookingList } = useBookingHistory();
  const { petList } = usePetProfile();
  const { getLogs, addCareLog } = useCareLog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);

  // Filter active real bookings
  const activeRealBookings = globalBookingList.filter(b => {
    if (!b.checkIn || !b.checkOut) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const inDate = new Date(b.checkIn); inDate.setHours(0, 0, 0, 0);
    const outDate = new Date(b.checkOut); outDate.setHours(23, 59, 59, 999);
    return today >= inDate && today <= outDate;
  });

  // Extract cats from real bookings
  let catsInHotel = activeRealBookings.flatMap(booking => {
    const pets = [];
    if (booking.petIds) {
      booking.petIds.forEach(id => {
        const p = petList.find(x => x.id === id);
        if (p) pets.push(p);
      });
    }
    if (booking.petProfiles) {
      booking.petProfiles.forEach(p => {
        if (!pets.find(x => x.id === p.id)) {
          pets.push(p);
        }
      });
    }
    return pets.map(pet => {
      const logs = getLogs(booking.id, pet.id) || [];
      const todayString = new Date().toLocaleDateString('vi-VN');
      const logsToday = logs.filter(l => l.rawDate === todayString);
      const fed = logsToday.some(l => l.type === 'eating');
      const played = logsToday.some(l => l.type === 'mood' || l.type === 'play');

      return {
        id: pet.id,
        bookingId: booking.id,
        booking: booking, // Pass the entire booking object
        catName: pet.name,
        ownerName: booking.customerInfo?.fullName || 'Khách hàng',
        room: booking.selectedRoom?.name || 'Tiêu chuẩn',
        image: pet.imagePreview || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80',
        feedingSchedule: '08:00, 18:00',
        playSchedule: '16:00',
        fed,
        played,
        logsToday,
        rawPet: pet,
      };
    });
  });

  // Fallback to mock data if no real bookings exist today for demonstration
  if (catsInHotel.length === 0) {
    catsInHotel = mockActiveBookings.map(mockCat => {
      const logs = getLogs('mockBooking', mockCat.id) || [];
      const todayString = new Date().toLocaleDateString('vi-VN');
      const logsToday = logs.filter(l => l.rawDate === todayString);
      const fed = logsToday.some(l => l.type === 'eating');
      const played = logsToday.some(l => l.type === 'mood' || l.type === 'play');

      return {
        ...mockCat,
        bookingId: 'mockBooking',
        id: mockCat.id, // String or number
        fed,
        played,
        logsToday,
      };
    });
  }

  const openModal = (cat) => {
    setSelectedCat(cat);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCat(null);
  };

  const handleSaveDiary = (bookingId, petId, formData) => {
    const today = new Date();
    const time = today.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const rawDate = today.toLocaleDateString('vi-VN');
    const dateLabel = `Hôm nay, ${today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

    if (formData.foodAmount) {
      addCareLog(bookingId, petId, {
        rawDate,
        date: dateLabel,
        time,
        type: 'eating',
        label: 'Cho ăn',
        detail: `Đã cho ăn ${formData.foodAmount}g thức ăn.`,
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Utensils'
      });
    }

    if (formData.played) {
      addCareLog(bookingId, petId, {
        rawDate,
        date: dateLabel,
        time,
        type: 'mood',
        label: 'Vui chơi',
        detail: 'Bé đã chơi đùa và vận động.',
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Smile'
      });
    }

    if (formData.stool) {
      const isBad = formData.stool === 'Tiêu chảy' || formData.stool === 'Táo bón';
      addCareLog(bookingId, petId, {
        rawDate,
        date: dateLabel,
        time,
        type: 'hygiene',
        label: 'Vệ sinh',
        detail: `Tình trạng: ${formData.stool}`,
        status: isBad ? 'watch' : 'normal',
        tag: isBad ? 'Cần theo dõi' : 'Bình thường',
        icon: 'Droplets'
      });
    }

    if (formData.health) {
      addCareLog(bookingId, petId, {
        rawDate,
        date: dateLabel,
        time,
        type: 'health',
        label: 'Sức khỏe',
        detail: formData.health,
        status: 'watch',
        tag: 'Cần theo dõi',
        icon: 'HeartPulse'
      });
    }

    toast.success('Đã cập nhật nhật ký thành công!');
    closeModal();
  };

  const totalCats = catsInHotel.length;
  const fedCats = catsInHotel.filter(cat => cat.fed).length;
  const playedCats = catsInHotel.filter(cat => cat.played).length;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tác vụ hôm nay</h1>
          <p className="text-gray-600">Tổng quan công việc chăm sóc mèo đang lưu trú tại khách sạn.</p>
        </div>
        {activeRealBookings.length === 0 && (
          <div className="mt-4 md:mt-0 bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg border border-yellow-200 text-sm flex items-center">
            <span className="font-bold mr-2">Demo Mode:</span> Đang hiển thị dữ liệu mẫu do chưa có booking thực tế hôm nay. 
            <Link to="/booking" className="ml-2 underline text-yellow-900 font-bold">Đặt phòng mới</Link>
          </div>
        )}
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Đang lưu trú</h3>
            <p className="text-2xl font-bold text-gray-800">{totalCats} bé</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Đã cho ăn</h3>
            <p className="text-2xl font-bold text-gray-800">{fedCats}/{totalCats} bé</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Đã chơi đùa</h3>
            <p className="text-2xl font-bold text-gray-800">{playedCats}/{totalCats} bé</p>
          </div>
        </div>
      </div>

      {/* Danh sách các bé mèo */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Lịch trình chăm sóc hôm nay</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catsInHotel.map((cat) => (
          <div key={`${cat.bookingId}_${cat.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className="h-40 overflow-hidden relative shrink-0">
              <img src={cat.image} alt={cat.catName} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                Phòng {cat.room}
              </div>
            </div>
            
            <div className="p-5 flex-grow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{cat.catName}</h3>
                    <p className="text-sm text-gray-500">Chủ: {cat.ownerName}</p>
                  </div>
                  {cat.fed && cat.played ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">Hoàn thành</span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-medium">Đang chờ</span>
                  )}
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-medium mr-1">Giờ ăn:</span> {cat.feedingSchedule}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-medium mr-1">Giờ chơi:</span> {cat.playSchedule}
                  </div>
                </div>
              </div>

              <button
                onClick={() => openModal(cat)}
                className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center mt-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Cập nhật Nhật ký
              </button>
            </div>
          </div>
        ))}
      </div>

      <CatDiaryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        cat={selectedCat}
        onSave={(catId, formData) => handleSaveDiary(selectedCat?.bookingId, catId, formData)}
      />
    </div>
  );
};

export default AdminDashboard;
