import React, { useState, useEffect } from 'react';
import { 
  PawPrint, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Video,
  CreditCard
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import { useUI } from '../../contexts/UIContext';
import { 
  BOOKING_STATUS, 
  BOOKING_STATUS_CONFIG, 
  getBookingStatus, 
  formatDateRange 
} from '../../utils/bookingStatus';
import CustomerApprovalModal from '../../components/CustomerApprovalModal';
import CustomerRescheduleModal from '../../components/CustomerRescheduleModal';
import CustomerCancelModal from '../../components/CustomerCancelModal';
import { toast } from 'react-hot-toast';

const MyBooking = () => {
  const { 
    globalBookingList, 
    updateBooking, 
    customerAcceptProposal, 
    customerRejectProposal,
    customerReschedule,
    customerCancel,
    resetDefaultBookings
  } = useBookingHistory();

  const { petList } = usePetProfile();
  const { approvalModalBookingId, openApprovalModal, closeApprovalModal } = useUI();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedBookingForApproval, setSelectedBookingForApproval] = useState(null);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState(null);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);

  // Danh mục tab chuẩn hóa theo 5 trạng thái enum
  const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: BOOKING_STATUS.UPCOMING, label: 'Sắp tới' },
    { key: BOOKING_STATUS.IN_HOUSE, label: 'Đang lưu trú' },
    { key: BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL, label: 'Chờ khách duyệt' },
    { key: BOOKING_STATUS.COMPLETED, label: 'Đã hoàn thành' },
    { key: BOOKING_STATUS.CANCELLED, label: 'Đã hủy' },
  ];

  // Tự động mở Modal phê duyệt nếu người dùng bấm từ Popover thông báo ở Header
  useEffect(() => {
    if (approvalModalBookingId) {
      const target = globalBookingList.find(b => b.id === approvalModalBookingId);
      if (target && target.pending_changes) {
        setSelectedBookingForApproval(target);
      }
      closeApprovalModal();
    }
  }, [approvalModalBookingId, globalBookingList, closeApprovalModal]);

  // Chuẩn hóa và lọc danh sách đơn
  const processedBookings = globalBookingList.map(booking => {
    const normalizedStatus = getBookingStatus(booking);
    return {
      ...booking,
      normalizedStatus,
      statusConfig: BOOKING_STATUS_CONFIG[normalizedStatus] || BOOKING_STATUS_CONFIG[BOOKING_STATUS.UPCOMING],
    };
  });

  const filteredBookings = processedBookings.filter(booking => {
    if (activeTab === 'ALL') return true;
    return booking.normalizedStatus === activeTab;
  });

  const handlePayment = (bookingId) => {
    updateBooking(bookingId, { paymentStatus: 'Đã thanh toán' });
    toast.success('Thanh toán thành công! Hệ thống đã ghi nhận tích lũy điểm VIP.');
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5]/80 pb-20">
      {/* Modals */}
      <CustomerApprovalModal
        isOpen={Boolean(selectedBookingForApproval)}
        booking={selectedBookingForApproval}
        onClose={() => setSelectedBookingForApproval(null)}
        onAccept={(id) => customerAcceptProposal(id)}
        onReject={(id) => customerRejectProposal(id)}
      />

      <CustomerRescheduleModal
        isOpen={Boolean(selectedBookingForReschedule)}
        booking={selectedBookingForReschedule}
        onClose={() => setSelectedBookingForReschedule(null)}
        onConfirm={(id, dates) => customerReschedule(id, dates)}
      />

      <CustomerCancelModal
        isOpen={Boolean(selectedBookingForCancel)}
        booking={selectedBookingForCancel}
        onClose={() => setSelectedBookingForCancel(null)}
        onConfirm={(id, reason) => customerCancel(id, reason)}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Banner điều hướng kiểm thử Admin & Realtime Sync */}
        <div className="mb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-500/20">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Đồng bộ Real-time Hai Chiều
                </span>
                <span className="text-xs text-slate-400">Không cần F5</span>
              </div>
              <p className="text-sm font-medium text-slate-200 mt-1">
                Mở song song <strong>Trang Quản trị Admin</strong> ở tab mới để xem Check-in, Check-out & Đề xuất đổi lịch cập nhật tức thì.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <Link
              to="/admin"
              target="_blank"
              rel="noreferrer"
              className="w-full md:w-auto text-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Mở Admin Quản Trị (Tab mới)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={resetDefaultBookings}
              className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Khôi phục lại dữ liệu mẫu 5 trạng thái"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-wider block mb-1">
              Quản lý dịch vụ & Phòng lưu trú
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title">
              Lịch Đặt Của Tôi
            </h1>
          </div>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm transition-all"
          >
            <span>+ Đặt phòng mới</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 scrollbar-none gap-2 mb-8 border-b border-gray-200">
          {tabs.map((tab) => {
            const count = tab.key === 'ALL'
              ? processedBookings.length
              : processedBookings.filter(b => b.normalizedStatus === tab.key).length;

            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer border-2 ${
                  isSelected
                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                    : 'bg-white text-gray-600 border-transparent hover:border-gray-200'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Booking Cards List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <PawPrint className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Không tìm thấy đơn đặt nào</h3>
            <p className="text-gray-500 mt-2 text-sm">Chưa có đơn đặt phòng nào trong mục này.</p>
            <Link
              to="/booking"
              className="mt-6 inline-block bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl hover:opacity-90 shadow-sm"
            >
              Đặt lịch cho bé ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const dynamicPets = (booking.petIds || []).map(id => petList.find(p => p.id === id)).filter(Boolean);
              const resolvedPets = dynamicPets.length > 0 ? dynamicPets : (booking.petProfiles || []);
              const petsName = resolvedPets.map(p => p.name).join(', ') || 'Chưa rõ';
              const packageDesc = booking.selectedPackage?.name || 'Gói chăm sóc tiêu chuẩn';
              const firstPetImage = resolvedPets[0]?.imagePreview;

              const isUpcoming = booking.normalizedStatus === BOOKING_STATUS.UPCOMING;
              const isInHouse = booking.normalizedStatus === BOOKING_STATUS.IN_HOUSE;
              const isPendingApproval = booking.normalizedStatus === BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL;
              const isCompleted = booking.normalizedStatus === BOOKING_STATUS.COMPLETED;
              const isCancelled = booking.normalizedStatus === BOOKING_STATUS.CANCELLED;

              return (
                <div 
                  key={booking.id}
                  className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-5 ${
                    isPendingApproval 
                      ? 'border-purple-300 ring-2 ring-purple-100 shadow-purple-50' 
                      : 'border-gray-100'
                  }`}
                >
                  {/* BẢNG CẢNH BÁO KHI CÓ YÊU CẦU DUYỆT TỪ ADMIN (APPROVAL BANNER) */}
                  {isPendingApproval && booking.pending_changes && (
                    <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-start gap-3 text-left">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                              Cần Bạn Xác Nhận
                            </span>
                            <span className="text-xs text-purple-700 font-bold">
                              {booking.pending_changes.type === 'CANCEL' ? 'Yêu cầu Hủy đơn' : 'Yêu cầu Đổi lịch'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-purple-950 mt-1">
                            Admin đã gửi yêu cầu <span className="underline font-bold">{booking.pending_changes.type === 'CANCEL' ? 'Hủy đơn đặt' : 'Thay đổi lịch'}</span> cho đơn #{booking.id}.
                          </p>
                          <p className="text-xs text-purple-700 mt-0.5 italic">
                            Lý do: "{booking.pending_changes.reason}"
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedBookingForApproval(booking)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-200 flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Xem chi tiết & Phản hồi</span>
                      </button>
                    </div>
                  )}

                  {/* THẺ DỊCH VỤ CHÍNH (MAIN SERVICE CARD CONTENT) */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Ảnh thú cưng */}
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border-4 border-gray-100 shadow-inner">
                      {firstPetImage ? (
                        <img src={firstPetImage} alt={petsName} className="w-full h-full object-cover" />
                      ) : (
                        <PawPrint className="w-10 h-10 text-gray-300" />
                      )}
                    </div>

                    {/* Chi tiết đơn */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                        <h3 className="text-xl font-bold text-text-dark font-title">{petsName}</h3>
                        
                        {/* Standard Status Badge */}
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${booking.statusConfig.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${booking.statusConfig.dotClass}`}></span>
                          {booking.statusConfig.label}
                        </span>

                        {/* Payment Badge */}
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          booking.paymentStatus === 'Đã thanh toán' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {booking.paymentStatus || 'Chưa thanh toán'}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm font-medium mb-1">
                        {booking.selectedRoom?.name ? <strong className="text-primary">Phòng {booking.selectedRoom.name}</strong> : ''} 
                        {booking.selectedRoom?.name ? ' • ' : ''}
                        {packageDesc}
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-gray-500 font-medium mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDateRange(booking.checkIn, booking.checkOut)}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="font-mono text-gray-400">Mã đơn: #{booking.id}</span>
                        {booking.totalAmount && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="font-bold text-accent">{booking.totalAmount.toLocaleString()}đ</span>
                          </>
                        )}
                      </div>

                      {/* Thông báo nếu đơn đã hủy kèm lý do */}
                      {isCancelled && booking.cancelReason && (
                        <p className="mt-2 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 inline-block">
                          Lý do hủy: {booking.cancelReason}
                        </p>
                      )}
                    </div>

                    {/* VÙNG NÚT THAO TÁC CỦA KHÁCH HÀNG (ACTIONS) */}
                    <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      
                      {/* 1. Nếu đang IN_HOUSE: Nút theo dõi Camera */}
                      {isInHouse && (
                        <button 
                          onClick={() => navigate('/tracking')}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Video className="w-4 h-4 text-emerald-600" />
                          <span>Xem Camera Bé</span>
                        </button>
                      )}

                      {/* 2. QUYỀN THAO TÁC CỦA KHÁCH HÀNG: CHỈ ĐƯỢC ĐỔI LỊCH & HỦY ĐƠN KHI UPCOMING */}
                      {isUpcoming && (
                        <>
                          <button
                            onClick={() => setSelectedBookingForReschedule(booking)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Thay đổi lịch</span>
                          </button>

                          <button
                            onClick={() => setSelectedBookingForCancel(booking)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Hủy đơn</span>
                          </button>
                        </>
                      )}

                      {/* 3. VÔ HIỆU HÓA HOẶC ẨN ĐỔI LỊCH/HỦY ĐƠN KHI ĐÃ CHECK-IN HOẶC HOÀN TẤT */}
                      {(isInHouse || isCompleted) && (
                        <div className="hidden sm:block text-[11px] text-gray-400 italic text-right">
                          {isInHouse ? 'Đã check-in lưu trú' : 'Kỳ lưu trú đã hoàn tất'}
                        </div>
                      )}

                      {/* Nút thanh toán nếu chưa thanh toán */}
                      {booking.paymentStatus !== 'Đã thanh toán' && !isCancelled && (
                        <button 
                          onClick={() => handlePayment(booking.id)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Thanh toán ngay</span>
                        </button>
                      )}
                    </div>
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
