import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import { useCareLog } from '../../contexts/CareLogContext';
import { activeBookings as mockActiveBookings } from '../../mockData/activeBookings';
import CatDiaryModal from './CatDiaryModal';
import BulkCareLogModal from './BulkCareLogModal';
import { Link } from 'react-router-dom';
import { 
  Zap, Utensils, Smile, Droplets, HeartPulse, 
  CheckCircle2, Clock, Plus, Sparkles, RefreshCw, Send, Check
} from 'lucide-react';

const AdminDashboard = () => {
  const { globalBookingList } = useBookingHistory();
  const { petList } = usePetProfile();
  const { getLogs, addCareLog, addBulkCareLog } = useCareLog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Filter active real bookings
  const activeRealBookings = globalBookingList.filter(b => {
    if (b.status === 'Đang lưu trú') return true;
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
      const hygiene = logsToday.some(l => l.type === 'hygiene');
      const hasWarning = logsToday.some(l => l.status === 'watch');

      return {
        id: pet.id,
        bookingId: booking.id,
        booking: booking,
        catName: pet.name,
        ownerName: booking.customerInfo?.fullName || 'Khách hàng',
        ownerPhone: booking.customerInfo?.phone || booking.customerPhone,
        room: booking.selectedRoom?.name || 'Tiêu chuẩn',
        image: pet.imagePreview || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80',
        feedingSchedule: '08:00, 18:00',
        playSchedule: '16:00',
        fed,
        played,
        hygiene,
        hasWarning,
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
      const hygiene = logsToday.some(l => l.type === 'hygiene');
      const hasWarning = logsToday.some(l => l.status === 'watch');

      return {
        ...mockCat,
        bookingId: 'mockBooking',
        id: mockCat.id,
        fed,
        played,
        hygiene,
        hasWarning,
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

  // 1. Lưu nhật ký đơn lẻ từ CatDiaryModal
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
        detail: `Đã cho ăn ${formData.foodAmount}g thức ăn. Bé ăn ngoan.`,
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
        detail: 'Bé đã chơi đùa và vận động tích cực.',
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
        label: 'Vệ sinh khay cát',
        detail: `Khay cát sạch sẽ. Tình trạng: ${formData.stool}`,
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

    toast.success('Đã cập nhật nhật ký & đồng bộ sang ứng dụng khách hàng!');
    closeModal();
  };

  // 2. Lưu nhật ký hàng loạt từ BulkCareLogModal
  const handleSaveBulk = (selectedCats, payload) => {
    const updatedCount = addBulkCareLog(selectedCats, payload);
    if (updatedCount > 0) {
      toast.success(`⚡ Đã cập nhật nhật ký cho ${updatedCount} bé mèo thành công!`, {
        icon: '🐾',
        duration: 4000
      });
    }
  };

  // 3. Phím tắt 1 chạm cho ăn nhanh 1 bé
  const handleQuickFeedOne = (e, cat) => {
    e.stopPropagation();
    const today = new Date();
    const time = today.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const rawDate = today.toLocaleDateString('vi-VN');
    const dateLabel = `Hôm nay, ${today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

    addCareLog(cat.bookingId, cat.id, {
      rawDate,
      date: dateLabel,
      time,
      type: 'eating',
      label: 'Cho ăn nhanh',
      detail: 'Đã cho ăn 50g hạt Royal Canin. Bé ăn ngoan, sạch phần ăn.',
      status: 'normal',
      tag: 'Bình thường',
      icon: 'Utensils'
    });
    toast.success(`Đã ghi nhận bé ${cat.catName} ăn xong 50g!`);
  };

  // 4. Phím tắt 1 chạm cho chơi nhanh 1 bé
  const handleQuickPlayOne = (e, cat) => {
    e.stopPropagation();
    const today = new Date();
    const time = today.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const rawDate = today.toLocaleDateString('vi-VN');
    const dateLabel = `Hôm nay, ${today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

    addCareLog(cat.bookingId, cat.id, {
      rawDate,
      date: dateLabel,
      time,
      type: 'mood',
      label: 'Vui chơi & Vận động',
      detail: 'Bé đã ra phòng chơi chung, đuổi bóng và vận động tích cực 30 phút.',
      status: 'normal',
      tag: 'Bình thường',
      icon: 'Smile'
    });
    toast.success(`Đã ghi nhận giờ chơi của bé ${cat.catName}!`);
  };

  // 5. Phím tắt 1 chạm cho ăn TẤT CẢ các bé
  const handleQuickFeedAll = () => {
    const payload = {
      food: {
        mealType: 'Bữa ăn tiêu chuẩn',
        amount: '50',
        foodType: 'Hạt Royal Canin + Pate',
        note: 'Các bé ăn ngoan, sạch đĩa'
      }
    };
    const count = addBulkCareLog(catsInHotel, payload);
    toast.success(`🍱 Đã ghi nhận bữa ăn cho toàn bộ ${count} bé mèo!`);
  };

  // 6. Phím tắt 1 chạm vận động TẤT CẢ các bé
  const handleQuickPlayAll = () => {
    const payload = {
      play: {
        enabled: true,
        activity: 'Vận động tại phòng chơi chung',
        mood: 'Vui vẻ, năng động',
        note: 'Các bé hòa đồng và leo trèo thoải mái'
      }
    };
    const count = addBulkCareLog(catsInHotel, payload);
    toast.success(`🎾 Đã ghi nhận giờ vận động cho ${count} bé mèo!`);
  };

  const totalCats = catsInHotel.length;
  const fedCats = catsInHotel.filter(cat => cat.fed).length;
  const playedCats = catsInHotel.filter(cat => cat.played).length;
  const cleanCats = catsInHotel.filter(cat => cat.hygiene).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🐱</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 font-title">Tác vụ hôm nay</h1>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {totalCats} bé đang lưu trú
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Quản lý và cập nhật nhật ký lưu trú cho các bé mèo. Mọi thay đổi sẽ tự động đồng bộ sang giao diện khách hàng.
          </p>
        </div>

        {/* Cụm nút hành động hàng loạt */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] cursor-pointer text-sm"
          >
            <Zap className="w-4 h-4 fill-white" />
            Cập nhật hàng loạt (Nhanh)
          </button>

          <Link
            to="/tracking"
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors"
            title="Xem giao diện hiển thị cho khách hàng"
          >
            📱 Xem giao diện KH
          </Link>
        </div>
      </div>

      {activeRealBookings.length === 0 && (
        <div className="bg-amber-50 text-amber-900 px-5 py-3.5 rounded-2xl border border-amber-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-amber-200/80 text-amber-800 text-xs px-2 py-0.5 rounded-md">Demo Mode</span>
            <span>Đang hiển thị dữ liệu mẫu các bé Mimi, Bông, Lu để bạn trải nghiệm cập nhật nhật ký.</span>
          </div>
          <Link to="/booking" className="underline font-bold text-amber-800 hover:text-amber-950 shrink-0">
            + Tạo đơn đặt phòng mới
          </Link>
        </div>
      )}

      {/* Thống kê tiến độ trong ngày */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <span className="text-xl">🏠</span>
          </div>
          <div>
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Đang lưu trú</h3>
            <p className="text-2xl font-black text-gray-800">{totalCats} bé</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Đã cho ăn</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-gray-800">{fedCats}/{totalCats}</p>
              {fedCats === totalCats && totalCats > 0 && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Xong</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Đã chơi đùa</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-gray-800">{playedCats}/{totalCats}</p>
              {playedCats === totalCats && totalCats > 0 && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Xong</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Dọn vệ sinh</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-gray-800">{cleanCats}/{totalCats}</p>
              {cleanCats === totalCats && totalCats > 0 && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Xong</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar for Whole Team */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-orange-950">
          <Sparkles className="w-5 h-5 text-orange-600 shrink-0" />
          <span>Thao tác nhanh 1 chạm cho toàn bộ mèo:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleQuickFeedAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white hover:bg-orange-100/60 text-orange-800 border border-orange-200 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-xs"
          >
            <Utensils className="w-3.5 h-3.5 text-orange-600" />
            Cho ăn tất cả (50g)
          </button>
          <button
            onClick={handleQuickPlayAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white hover:bg-purple-100/60 text-purple-800 border border-purple-200 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-xs"
          >
            <Smile className="w-3.5 h-3.5 text-purple-600" />
            Vận động tất cả
          </button>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Mở bảng chi tiết
          </button>
        </div>
      </div>

      {/* Danh sách các bé mèo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Lịch trình & Tình trạng chăm sóc hôm nay</h2>
          <span className="text-xs text-gray-500 font-medium">Bấm vào thẻ hoặc nút để cập nhật nhật ký</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catsInHotel.map((cat) => {
            const isCompleted = cat.fed && cat.played;

            return (
              <div 
                key={`${cat.bookingId}_${cat.id}`} 
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col group"
              >
                {/* Header Image */}
                <div className="h-44 overflow-hidden relative shrink-0">
                  <img 
                    src={cat.image} 
                    alt={cat.catName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                    Phòng {cat.room}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    {isCompleted ? (
                      <span className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành tác vụ
                      </span>
                    ) : (
                      <span className="bg-amber-400 text-amber-950 text-xs px-3 py-1 rounded-full font-bold shadow-md flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Cần hoàn thành thêm
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Body Content */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    {/* Cat & Owner Title */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-extrabold text-gray-900 font-title">{cat.catName}</h3>
                        <p className="text-xs text-gray-500">Chủ: {cat.ownerName}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {cat.logsToday.length} lần cập nhật
                      </span>
                    </div>

                    {/* Schedule times */}
                    <div className="space-y-1.5 mb-4 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Giờ ăn dự kiến:</span>
                        <span className="font-bold text-gray-800">{cat.feedingSchedule}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Giờ chơi dự kiến:</span>
                        <span className="font-bold text-gray-800">{cat.playSchedule}</span>
                      </div>
                    </div>

                    {/* Checklist Status Tags */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {/* Ăn uống */}
                      <div className={`p-2 rounded-xl text-center border ${
                        cat.fed 
                          ? 'bg-orange-50 border-orange-200 text-orange-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        <Utensils className={`w-4 h-4 mx-auto mb-1 ${cat.fed ? 'text-orange-600' : 'text-gray-300'}`} />
                        <span className="text-[11px] font-bold block">{cat.fed ? 'Đã ăn' : 'Chờ ăn'}</span>
                      </div>

                      {/* Vui chơi */}
                      <div className={`p-2 rounded-xl text-center border ${
                        cat.played 
                          ? 'bg-purple-50 border-purple-200 text-purple-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        <Smile className={`w-4 h-4 mx-auto mb-1 ${cat.played ? 'text-purple-600' : 'text-gray-300'}`} />
                        <span className="text-[11px] font-bold block">{cat.played ? 'Đã chơi' : 'Chưa chơi'}</span>
                      </div>

                      {/* Vệ sinh */}
                      <div className={`p-2 rounded-xl text-center border ${
                        cat.hygiene 
                          ? 'bg-blue-50 border-blue-200 text-blue-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        <Droplets className={`w-4 h-4 mx-auto mb-1 ${cat.hygiene ? 'text-blue-600' : 'text-gray-300'}`} />
                        <span className="text-[11px] font-bold block">{cat.hygiene ? 'Đã dọn' : 'Chưa dọn'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    {/* Quick 1-click feed & play buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => handleQuickFeedOne(e, cat)}
                        className="py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        title="Bấm nhanh để ghi nhận bé đã ăn xong 50g hạt"
                      >
                        <Utensils className="w-3.5 h-3.5" /> Cho ăn nhanh
                      </button>
                      <button
                        onClick={(e) => handleQuickPlayOne(e, cat)}
                        className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        title="Bấm nhanh để ghi nhận giờ vận động 30 phút"
                      >
                        <Smile className="w-3.5 h-3.5" /> Chơi đùa
                      </button>
                    </div>

                    {/* Full detail modal */}
                    <button
                      onClick={() => openModal(cat)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Chi tiết & Nhật ký đầy đủ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Cập nhật riêng cho 1 bé */}
      <CatDiaryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        cat={selectedCat}
        onSave={(catId, formData) => handleSaveDiary(selectedCat?.bookingId, catId, formData)}
      />

      {/* Modal Cập nhật hàng loạt cho nhiều bé */}
      <BulkCareLogModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        cats={catsInHotel}
        onSaveBulk={handleSaveBulk}
      />
    </div>
  );
};

export default AdminDashboard;

