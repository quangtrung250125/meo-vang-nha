import { needsReviewAttention } from '../../utils/reviewInsights';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import { useCareLog } from '../../contexts/CareLogContext';
import { useRoomState, ROOM_CONFIG } from '../../../Chi/RoomStateContext';
import useCustomerData from '../AdminCustomers/useCustomerData';
import { getStayingCats, getTodayCheckIns, getTodayCheckOuts } from '../../utils/stayingCats';
import { getDailyTask, getTodayTaskStatus, vnTime } from '../../utils/careTasks';
import { useReviews } from '../../contexts/ReviewsContext';
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
  const { reviews } = useReviews();
  const location = useLocation();
  const isDirectAdminRoute = location.pathname.startsWith('/admin');
  const basePrefix = isDirectAdminRoute ? '/admin' : '';

  const { adminCheckIn, adminCheckOut } = useBookingHistory();
  const { bookings: roomBookings, maintenanceRooms = {}, checkInBooking, checkOutBooking } = useRoomState();
  const { petList } = usePetProfile();
  const { getLogs, addCareLog, addBulkCareLog, completeTask, undoLog } = useCareLog();
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
  // 3. MÈO ĐANG LƯU TRÚ — cùng nguồn kho phòng với trang Tình trạng phòng,
  //    trạng thái tác vụ hôm nay tính từ nhật ký chăm sóc trên server
  // ─────────────────────────────────────────────────────────────
  const catsInHotel = useMemo(
    () => getStayingCats(roomBookings, petList).map((cat) => ({
      ...cat,
      ...getTodayTaskStatus(getLogs(cat.bookingId, cat.id)),
    })),
    [roomBookings, petList, getLogs]
  );

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

  // Danh sách cần Check-in / Check-out hôm nay (từ kho phòng, giống trang Tình trạng phòng)
  const todayCheckInList = useMemo(() => getTodayCheckIns(roomBookings, todayDateStr), [roomBookings, todayDateStr]);
  const todayCheckOutList = useMemo(() => getTodayCheckOuts(roomBookings, todayDateStr), [roomBookings, todayDateStr]);

  // Đồng bộ khiếu nại thực tế từ module Đánh giá & Phản hồi (AdminReviews)
  const complaintsList = useMemo(() => reviews.filter(needsReviewAttention).map(r => ({...r,id:r.bookingCode,author:r.authorName,petName:r.petNames,status:'pending'})), [reviews]);

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

  // Báo kết quả ghi nhật ký (thành công / đã làm rồi / lỗi máy chủ)
  const reportSaveResult = (result, successMessage) => {
    if (result.ok) {
      toast.success(successMessage);
    } else {
      toast.error(result.message || 'Chưa lưu được nhật ký, vui lòng thử lại.');
    }
    return result.ok;
  };

  // Lưu nhật ký từ CatDiaryModal
  const handleSaveDiary = async (petId, formData) => {
    if (!selectedCat) return;
    const bookingId = selectedCat.bookingId;
    const petName = selectedCat.catName;
    const entries = [];

    if (formData.foodAmount) {
      entries.push({
        type: 'eating', label: 'Cho ăn', icon: 'Utensils', status: 'normal', tag: 'Bình thường',
        detail: `Đã cho ăn ${formData.foodAmount}g thức ăn. Bé ăn ngoan miệng.`,
      });
    }
    if (formData.played) {
      entries.push({
        type: 'mood', label: 'Vui chơi & Vận động', icon: 'Smile', status: 'normal', tag: 'Bình thường',
        detail: 'Bé đã chơi đùa và vận động tích cực cùng nhân viên.',
      });
    }
    if (formData.stool) {
      const isBad = formData.stool === 'Tiêu chảy' || formData.stool === 'Táo bón';
      entries.push({
        type: 'hygiene', label: 'Vệ sinh khay cát', icon: 'Droplets',
        status: isBad ? 'watch' : 'normal', tag: isBad ? 'Cần theo dõi' : 'Bình thường',
        detail: `Khay cát sạch sẽ. Tình trạng: ${formData.stool}.`,
      });
    }
    if (formData.health) {
      entries.push({
        type: 'health', label: 'Sức khỏe & Tâm trạng', icon: 'HeartPulse', status: 'watch', tag: 'Cần theo dõi',
        detail: formData.health,
      });
    }
    if (entries.length === 0) {
      setIsDiaryModalOpen(false);
      return;
    }

    const results = await Promise.all(entries.map((entry) => addCareLog(bookingId, petId, { ...entry, petName })));
    const failed = results.find((r) => !r.ok);
    if (failed) {
      toast.error(failed.message || 'Chưa lưu được nhật ký, vui lòng thử lại.');
      return;
    }
    toast.success('Đã cập nhật nhật ký & đồng bộ sang ứng dụng khách hàng! 🐾');
    setIsDiaryModalOpen(false);
  };

  // Lưu hàng loạt từ BulkCareLogModal
  const handleSaveBulk = async (selectedCats, payload) => {
    const updatedCount = await addBulkCareLog(selectedCats, payload);
    if (updatedCount > 0) {
      toast.success(`⚡ Đã cập nhật nhật ký cho ${updatedCount} bé mèo & đồng bộ sang khách hàng!`, {
        icon: '🐾',
        duration: 4000,
      });
    } else {
      toast.error('Chưa lưu được nhật ký, vui lòng thử lại.');
    }
  };

  // Gửi ảnh/video cho khách
  const handleSendMedia = async (cat, mediaData) => {
    const result = await addCareLog(cat.bookingId, cat.id, {
      type: 'media',
      label: 'Khoảnh khắc của bé',
      detail: mediaData.caption,
      imageUrl: mediaData.imageUrl,
      tag: mediaData.tag || 'Ảnh mới',
      icon: 'Camera',
      status: 'normal',
      petName: cat.catName,
    });
    return reportSaveResult(result, `Đã gửi ảnh của bé ${cat.catName} cho khách! 📸`);
  };

  // Gửi báo cáo cuối ngày cho khách
  const handleSendReport = async (cat, reportData) => {
    const result = await addCareLog(cat.bookingId, cat.id, {
      type: 'report',
      label: 'Báo cáo tổng kết ngày',
      detail: reportData.note,
      reportData,
      tag: 'Báo cáo ngày',
      icon: 'FileText',
      status: 'normal',
      petName: cat.catName,
    });
    return reportSaveResult(result, `Đã gửi báo cáo ngày của bé ${cat.catName}! 📝`);
  };

  // Tác vụ 1 chạm cho 1 bé: Cho ăn / Vận động / Dọn vệ sinh
  const handleQuickTask = async (e, cat, taskKey) => {
    e?.stopPropagation();
    const task = getDailyTask(taskKey);
    const result = await completeTask(cat, taskKey);
    if (result.ok) {
      toast.success(`${task.label}: bé ${cat.catName} (lúc ${vnTime(result.logs[0].createdAt)})`);
    } else {
      toast.error(result.message || 'Chưa lưu được tác vụ, vui lòng thử lại.');
    }
  };

  // Tác vụ 1 chạm cho TẤT CẢ các bé đang lưu trú (bé đã làm hôm nay được bỏ qua)
  const handleQuickAll = async (taskKey) => {
    const task = getDailyTask(taskKey);
    const pending = catsInHotel.filter((cat) => !cat[taskKey]);
    if (pending.length === 0) {
      toast(`Tất cả các bé đã xong "${task.label}" hôm nay.`, { icon: '✅' });
      return;
    }
    const result = await completeTask(pending, taskKey);
    if (result.logs.length > 0) {
      toast.success(`${task.label}: đã ghi nhận cho ${result.logs.length} bé.`);
    } else {
      toast.error(result.message || 'Chưa lưu được tác vụ, vui lòng thử lại.');
    }
  };

  // Hoàn tác một tác vụ bấm nhầm (trong 5 phút)
  const handleUndoTask = async (cat, taskKey) => {
    const logId = cat.done?.[taskKey]?.logId;
    if (!logId) return;
    const result = await undoLog(logId);
    if (result.ok) toast.success(`Đã hoàn tác "${getDailyTask(taskKey).label}" của bé ${cat.catName}.`);
    else toast.error(result.message || 'Không hoàn tác được, vui lòng thử lại.');
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
            to={`${basePrefix}/reviews?tab=urgent`}
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
        onOpenDiaryModal={openDiaryModal}
        onOpenBulkModal={() => setIsBulkModalOpen(true)}
        onOpenMediaModal={openMediaModal}
        onOpenReportModal={openReportModal}
        onQuickTask={handleQuickTask}
        onQuickAll={handleQuickAll}
        onUndoTask={handleUndoTask}
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
