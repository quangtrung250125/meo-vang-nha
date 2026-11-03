import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { BOOKING_STATUS, normalizeStatusValue, STORED_STATUS } from '../../utils/bookingStatus';
import { usePetProfile } from '../../contexts/PetContext';
import { useCareLog } from '../../contexts/CareLogContext';
import { useRoomState, ROOM_CONFIG } from '../../../Chi/RoomStateContext';
import useCustomerData from '../AdminCustomers/useCustomerData';
import { activeBookings as mockActiveBookings } from '../../mockData/activeBookings';
import { triggerCareLogUpdateNotification } from '../../services/notificationTriggers';
import { mockReviews } from '../AdminReviews';
import { computeDashboardKpis, computeRevenueSeries, computeRoomHeatmap } from '../../utils/dashboardReport';
import { todayInVietnam } from '../../utils/bookingDeposit';

// Các thành phần thuộc Thẻ 1: Tổng quan
import OverviewFilters from './OverviewFilters';
import KpiMetricsGrid from './KpiMetricsGrid';
import RevenueChart from './RevenueChart';
import RoomHeatmap from './RoomHeatmap';
import CondensedFunnel from './CondensedFunnel';
import UrgentTasksToday from './UrgentTasksToday';
import CatStayingSection from './CatStayingSection';

// Các modal cập nhật
import CatDiaryModal from './CatDiaryModal';
import BulkCareLogModal from './BulkCareLogModal';
import SendMediaModal from './SendMediaModal';
import DailyReportModal from './DailyReportModal';

// Icons
import { BedDouble, Users, AlertTriangle, ShieldCheck, CheckCircle2, Flame } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminDashboard = () => {
  const location = useLocation();
  const isDirectAdminRoute = location.pathname.startsWith('/admin');
  const basePrefix = isDirectAdminRoute ? '/admin' : '';

  const { globalBookingList, adminCheckIn, adminCheckOut, updateBooking } = useBookingHistory();
  const { bookings: roomBookings, maintenanceRooms = {}, checkInBooking, checkOutBooking } = useRoomState();
  const { petList } = usePetProfile();
  const { getLogs, addCareLog, addBulkCareLog } = useCareLog();
  const { customers = [] } = useCustomerData();

  // 1. STATE BỘ LỌC THỜI GIAN
  const [timePreset, setTimePreset] = useState('30d'); // 'today', '7d', '30d', 'quarter', 'custom'
  const [customRange, setCustomRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [comparePrevious, setComparePrevious] = useState(true);

  // 2. STATE CÁC MODAL
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaCat, setMediaCat] = useState(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCat, setReportCat] = useState(null);

  // ─────────────────────────────────────────────────────────────
  // 3. TÍNH TOÁN DỮ LIỆU ĐANG LƯU TRÚ HÔM NAY (Đồng bộ số mèo thực tế)
  // ─────────────────────────────────────────────────────────────
  const activeRealBookings = useMemo(() => {
    return globalBookingList.filter(
      (b) => normalizeStatusValue(b.status) === BOOKING_STATUS.IN_HOUSE || b.status === STORED_STATUS.IN_HOUSE
    );
  }, [globalBookingList]);

  let isDemoMode = false;
  let catsInHotel = useMemo(() => {
    const list = activeRealBookings.flatMap((booking) => {
      const pets = [];
      if (booking.petIds) {
        booking.petIds.forEach((id) => {
          const p = petList.find((x) => x.id === id);
          if (p) pets.push(p);
        });
      }
      if (booking.petProfiles) {
        booking.petProfiles.forEach((p) => {
          if (!pets.find((x) => x.id === p.id)) {
            pets.push(p);
          }
        });
      }

      // Nếu booking không có hồ sơ riêng, tạo đại diện từ thông tin đặt
      if (pets.length === 0) {
        pets.push({
          id: `pet_${booking.id}`,
          name: booking.catNames || 'Bé cưng',
          imagePreview: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80',
        });
      }

      return pets.map((pet) => {
        const logs = getLogs(booking.id, pet.id) || [];
        const todayString = new Date().toLocaleDateString('vi-VN');
        const logsToday = logs.filter((l) => l.rawDate === todayString);
        const fed = logsToday.some((l) => l.type === 'eating');
        const played = logsToday.some((l) => l.type === 'mood' || l.type === 'play');
        const hygiene = logsToday.some((l) => l.type === 'hygiene');
        const hasWarning = logsToday.some((l) => l.status === 'watch');

        return {
          id: pet.id,
          bookingId: booking.id,
          booking: booking,
          catName: pet.name,
          ownerName: booking.customerInfo?.fullName || booking.ownerName || 'Khách hàng',
          ownerPhone: booking.customerInfo?.phone || booking.customerPhone || booking.ownerPhone,
          room: booking.selectedRoom?.name || booking.roomId || 'Tiêu chuẩn',
          image: pet.imagePreview || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80',
          fed,
          played,
          hygiene,
          hasWarning,
          logsToday,
          rawPet: pet,
        };
      });
    });

    return list;
  }, [activeRealBookings, petList, getLogs]);

  // Fallback sang dữ liệu mẫu nếu chưa có đơn đang lưu trú
  if (catsInHotel.length === 0) {
    isDemoMode = true;
    catsInHotel = mockActiveBookings.map((mockCat) => {
      const logs = getLogs('mockBooking', mockCat.id) || [];
      const todayString = new Date().toLocaleDateString('vi-VN');
      const logsToday = logs.filter((l) => l.rawDate === todayString);
      const fed = logsToday.some((l) => l.type === 'eating');
      const played = logsToday.some((l) => l.type === 'mood' || l.type === 'play');
      const hygiene = logsToday.some((l) => l.type === 'hygiene');
      const hasWarning = logsToday.some((l) => l.status === 'watch');

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

  // ─────────────────────────────────────────────────────────────
  // 4. TÍNH TOÁN CÁC CHỈ SỐ DOANH NGHIỆP KPI (Đồng bộ từ Khách hàng & Lịch đặt)
  // ─────────────────────────────────────────────────────────────
  const kpiMetrics = useMemo(
    () => computeDashboardKpis(customers, { preset: timePreset, customRange, totalRooms: ROOM_CONFIG.length || 11 }),
    [customers, timePreset, customRange]
  );

  // ─────────────────────────────────────────────────────────────
  // 5. BIỂU ĐỒ DOANH THU (Ngày / Tuần / Tháng) — từ hóa đơn các đơn đã check-out & thanh toán
  // ─────────────────────────────────────────────────────────────
  const revenueChartData = useMemo(() => computeRevenueSeries(customers), [customers]);

  // ─────────────────────────────────────────────────────────────
  // 6. BẢN ĐỒ NHIỆT CÔNG SUẤT PHÒNG 14-30 NGÀY TỚI (Đồng bộ Tình trạng phòng)
  // ─────────────────────────────────────────────────────────────
  const heatmapData = useMemo(
    () => computeRoomHeatmap(roomBookings, maintenanceRooms, ROOM_CONFIG, { days: 30 }),
    [roomBookings, maintenanceRooms]
  );

  // ─────────────────────────────────────────────────────────────
  // 7. CẦN XỬ LÝ HÔM NAY (Đồng bộ Lịch đặt & Đánh giá/Phản hồi)
  // ─────────────────────────────────────────────────────────────
  const todayDateStr = todayInVietnam();

  // Danh sách cần Check-in hôm nay (chỉ đơn có ngày gửi là hôm nay)
  const todayCheckInList = useMemo(() => {
    return globalBookingList.filter((b) => {
      const status = normalizeStatusValue(b.status);
      return status === BOOKING_STATUS.UPCOMING && b.checkIn === todayDateStr;
    });
  }, [globalBookingList, todayDateStr]);

  // Danh sách cần Check-out hôm nay
  const todayCheckOutList = useMemo(() => {
    return activeRealBookings.filter((b) => b.checkOut === todayDateStr || !b.checkOut);
  }, [activeRealBookings, todayDateStr]);

  // Đồng bộ khiếu nại thực tế từ module Đánh giá & Phản hồi (AdminReviews)
  const complaintsList = useMemo(() => {
    return mockReviews.filter(
      (r) => r.status === 'complaint' || r.status === 'pending' || r.rating <= 3
    );
  }, []);

  // Handler Check-in 1 chạm từ Tổng quan
  const handlePerformCheckIn = (roomId, bookingId) => {
    const ok = adminCheckIn(bookingId);
    if (roomId) {
      checkInBooking(roomId, bookingId);
    }
    if (ok) {
      toast.success(`Đã Check-in đơn #${bookingId} thành công! Bé đã vào danh sách lưu trú. 🏠🐾`);
    }
  };

  // Handler Check-out 1 chạm từ Tổng quan
  const handlePerformCheckOut = (roomId, bookingId) => {
    const ok = adminCheckOut(bookingId);
    if (roomId) {
      checkOutBooking(roomId, bookingId);
    }
    if (ok) {
      toast.success(`Đã hoàn tất bàn giao & Check-out đơn #${bookingId}! Phòng đã được giải phóng. ✨`);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 8. CÁC HÀNH ĐỘNG CẬP NHẬT NHẬT KÝ & ĐỒNG BỘ REALTIME SANG KHÁCH HÀNG
  // ─────────────────────────────────────────────────────────────
  const openDiaryModal = (cat) => {
    setSelectedCat(cat);
    setIsDiaryModalOpen(true);
  };

  const openMediaModal = (cat) => {
    setMediaCat(cat);
    setIsMediaModalOpen(true);
  };

  const openReportModal = (cat) => {
    setReportCat(cat);
    setIsReportModalOpen(true);
  };

  // Lưu nhật ký từ CatDiaryModal
  const handleSaveDiary = (petId, formData) => {
    if (!selectedCat) return;
    const bookingId = selectedCat.bookingId || 'mockBooking';
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
        detail: `Đã cho ăn ${formData.foodAmount}g thức ăn. Bé ăn ngoan miệng.`,
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Utensils',
      });
    }

    if (formData.played) {
      addCareLog(bookingId, petId, {
        rawDate,
        date: dateLabel,
        time,
        type: 'mood',
        label: 'Vui chơi & Vận động',
        detail: 'Bé đã chơi đùa và vận động tích cực cùng nhân viên.',
        status: 'normal',
        tag: 'Bình thường',
        icon: 'Smile',
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
        detail: `Khay cát sạch sẽ. Tình trạng: ${formData.stool}.`,
        status: isBad ? 'watch' : 'normal',
        tag: isBad ? 'Cần theo dõi' : 'Bình thường',
        icon: 'Droplets',
      });
    }

    if (formData.health) {
      addCareLog(bookingId, petId, {
        rawDate,
        date: dateLabel,
        time,
        type: 'health',
        label: 'Sức khỏe & Tâm trạng',
        detail: formData.health,
        status: 'watch',
        tag: 'Cần theo dõi',
        icon: 'HeartPulse',
      });
    }

    toast.success('Đã cập nhật nhật ký & đồng bộ ngay sang ứng dụng khách hàng! 🐾');
    setIsDiaryModalOpen(false);
  };

  // Lưu hàng loạt từ BulkCareLogModal
  const handleSaveBulk = (selectedCats, payload) => {
    const updatedCount = addBulkCareLog(selectedCats, payload);
    if (updatedCount > 0) {
      toast.success(`⚡ Đã cập nhật nhật ký cho ${updatedCount} bé mèo & đồng bộ realtime sang khách hàng!`, {
        icon: '🐾',
        duration: 4000,
      });
    }
  };

  // Gửi ảnh/video cho khách
  const handleSendMedia = (cat, mediaData) => {
    const today = new Date();
    const time = today.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const rawDate = today.toLocaleDateString('vi-VN');
    const dateLabel = `Hôm nay, ${today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

    addCareLog(cat.bookingId, cat.id, {
      rawDate,
      date: dateLabel,
      time,
      type: 'media',
      label: 'Khoảnh khắc của bé',
      detail: mediaData.caption,
      imageUrl: mediaData.imageUrl,
      tag: mediaData.tag || 'Ảnh mới',
      icon: 'Camera',
      status: 'normal',
    });

    try {
      triggerCareLogUpdateNotification({
        userId: cat.ownerPhone || 'ducan',
        petName: cat.catName || 'Bé cưng',
        actionTitle: 'Nhân viên vừa gửi ảnh mới của bé!',
        detail: mediaData.caption,
      });
    } catch (e) {}
  };

  // Gửi báo cáo cuối ngày cho khách
  const handleSendReport = (cat, reportData) => {
    const today = new Date();
    const time = today.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const rawDate = today.toLocaleDateString('vi-VN');
    const dateLabel = `Hôm nay, ${today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

    addCareLog(cat.bookingId, cat.id, {
      rawDate,
      date: dateLabel,
      time,
      type: 'report',
      label: 'Báo cáo tổng kết ngày',
      detail: reportData.note,
      reportData,
      isDailyReport: true,
      tag: 'Báo cáo ngày',
      icon: 'FileText',
      status: 'normal',
    });

    try {
      triggerCareLogUpdateNotification({
        userId: cat.ownerPhone || 'ducan',
        petName: cat.catName || 'Bé cưng',
        actionTitle: 'Báo cáo chăm sóc cuối ngày đã sẵn sàng',
        detail: reportData.note,
      });
    } catch (e) {}
  };

  // Phím tắt 1 chạm cho ăn 1 bé
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
      detail: 'Đã cho ăn 50g hạt dinh dưỡng Royal Canin. Bé ăn ngoan, sạch đĩa.',
      status: 'normal',
      tag: 'Bình thường',
      icon: 'Utensils',
    });
    toast.success(`Đã ghi nhận bé ${cat.catName} ăn xong 50g hạt!`);
  };

  // Phím tắt 1 chạm cho chơi 1 bé
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
      detail: 'Bé đã ra khu vui chơi chung, leo trèo và đuổi cần câu lông vũ 30 phút.',
      status: 'normal',
      tag: 'Bình thường',
      icon: 'Smile',
    });
    toast.success(`Đã ghi nhận giờ chơi của bé ${cat.catName}!`);
  };

  // Phím tắt cho ăn TẤT CẢ các bé
  const handleQuickFeedAll = () => {
    const payload = {
      food: {
        mealType: 'Bữa ăn tiêu chuẩn',
        amount: '50',
        foodType: 'Hạt Royal Canin + Pate tươi',
        note: 'Các bé ăn ngoan, sạch đĩa và rất hợp tác',
      },
    };
    const count = addBulkCareLog(catsInHotel, payload);
    toast.success(`🍱 Đã ghi nhận bữa ăn cho toàn bộ ${count} bé mèo và đồng bộ realtime!`);
  };

  // Phím tắt vận động TẤT CẢ các bé
  const handleQuickPlayAll = () => {
    const payload = {
      play: {
        enabled: true,
        activity: 'Vận động tại phòng chơi chung & chải lông',
        mood: 'Vui vẻ, năng động, quấn người',
        note: 'Các bé hòa đồng và leo trèo thoải mái',
      },
    };
    const count = addBulkCareLog(catsInHotel, payload);
    toast.success(`🎾 Đã ghi nhận giờ vận động cho ${count} bé mèo và đồng bộ realtime!`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ── THANH TRẠNG THÁI TỔNG THỂ ĐỒNG BỘ CÁC MODULE ── */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🐱</span>
            <h1 className="text-xl sm:text-2xl font-black font-title">
              Trung tâm Quản trị & Tổng quan Mèo Vắng Nhà
            </h1>
          </div>
          <p className="text-white/85 text-xs sm:text-sm">
            Hệ thống dữ liệu tập trung: Đồng bộ trực tiếp từ Khách hàng, Tình trạng phòng, Lịch đặt, Đánh giá và Nhật ký chăm sóc Realtime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to={`${basePrefix}/room-status`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-xs font-bold text-white transition-colors"
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>Phòng: {heatmapData[0]?.occupied || 0}/{heatmapData[0]?.total || ROOM_CONFIG.length}</span>
          </Link>
          <Link
            to={`${basePrefix}/customers`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-xs font-bold text-white transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{customers.length} Khách hàng</span>
          </Link>
          <Link
            to={`${basePrefix}/reviews`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-xs font-bold text-white transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{complaintsList.length} Khiếu nại/Phản hồi</span>
          </Link>
        </div>
      </div>

      {/* 1. BỘ LỌC THỜI GIAN & SO SÁNH KỲ TRƯỚC */}
      <OverviewFilters
        timePreset={timePreset}
        setTimePreset={setTimePreset}
        customRange={customRange}
        setCustomRange={setCustomRange}
        comparePrevious={comparePrevious}
        setComparePrevious={setComparePrevious}
      />

      {/* 2. 7 THẺ SỐ LIỆU CHỈ SỐ DOANH NGHIỆP (KPI) */}
      <KpiMetricsGrid metrics={kpiMetrics} comparePrevious={comparePrevious} />

      {/* 3. BIỂU ĐỒ DOANH THU & CÔNG SUẤT PHÒNG (BẢN ĐỒ NHIỆT) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <RevenueChart chartData={revenueChartData} />
        <RoomHeatmap heatmapData={heatmapData} />
      </div>

      {/* 4. PHỄU CHUYỂN ĐỔI THU GỌN & CẦN XỬ LÝ HÔM NAY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <CondensedFunnel customers={customers} />
        <UrgentTasksToday
          checkInList={todayCheckInList}
          checkOutList={todayCheckOutList}
          complaintsList={complaintsList}
          onCheckIn={handlePerformCheckIn}
          onCheckOut={handlePerformCheckOut}
        />
      </div>

      {/* 5. THEO DÕI LƯU TRÚ & TÁC VỤ HÔM NAY (ĐỒNG BỘ SỐ MÈO VÀ NHẬT KÝ SANG KHÁCH HÀNG) */}
      <CatStayingSection
        catsInHotel={catsInHotel}
        isDemoMode={isDemoMode}
        onOpenDiaryModal={openDiaryModal}
        onOpenBulkModal={() => setIsBulkModalOpen(true)}
        onOpenMediaModal={openMediaModal}
        onOpenReportModal={openReportModal}
        onQuickFeedOne={handleQuickFeedOne}
        onQuickPlayOne={handleQuickPlayOne}
        onQuickFeedAll={handleQuickFeedAll}
        onQuickPlayAll={handleQuickPlayAll}
      />

      {/* 6. CÁC MODAL CẬP NHẬT */}
      {selectedCat && (
        <CatDiaryModal
          isOpen={isDiaryModalOpen}
          onClose={() => {
            setIsDiaryModalOpen(false);
            setSelectedCat(null);
          }}
          cat={selectedCat}
          onSave={handleSaveDiary}
        />
      )}

      <BulkCareLogModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        cats={catsInHotel}
        onSaveBulk={handleSaveBulk}
      />

      {mediaCat && (
        <SendMediaModal
          isOpen={isMediaModalOpen}
          onClose={() => {
            setIsMediaModalOpen(false);
            setMediaCat(null);
          }}
          cat={mediaCat}
          onSendMedia={handleSendMedia}
        />
      )}

      {reportCat && (
        <DailyReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setReportCat(null);
          }}
          cat={reportCat}
          onSendReport={handleSendReport}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
