import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Search, 
  RefreshCw, 
  LogOut, 
  Sparkles,
  ExternalLink,
  MessageSquare,
  Video,
  Undo2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { useUI } from '../../contexts/UIContext';
import { 
  BOOKING_STATUS, 
  BOOKING_STATUS_CONFIG, 
  getBookingStatus, 
  formatDateRange 
} from '../../utils/bookingStatus';
import AdminProposeChangeModal from '../../components/AdminProposeChangeModal';

const AdminPage = () => {
  const { 
    globalBookingList, 
    adminCheckIn, 
    adminCheckOut, 
    adminProposeChange, 
    adminCancelProposal,
    resetDefaultBookings 
  } = useBookingHistory();

  const { notifications } = useUI();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [selectedBookingForProposal, setSelectedBookingForProposal] = useState(null);

  // Chuẩn hóa danh sách đơn
  const normalizedBookings = globalBookingList.map(booking => {
    const normalizedStatus = getBookingStatus(booking);
    return {
      ...booking,
      normalizedStatus,
      statusConfig: BOOKING_STATUS_CONFIG[normalizedStatus] || BOOKING_STATUS_CONFIG[BOOKING_STATUS.UPCOMING],
    };
  });

  // Thống kê
  const totalCount = normalizedBookings.length;
  const upcomingCount = normalizedBookings.filter(b => b.normalizedStatus === BOOKING_STATUS.UPCOMING).length;
  const inHouseCount = normalizedBookings.filter(b => b.normalizedStatus === BOOKING_STATUS.IN_HOUSE).length;
  const pendingApprovalCount = normalizedBookings.filter(b => b.normalizedStatus === BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL).length;
  const completedCount = normalizedBookings.filter(b => b.normalizedStatus === BOOKING_STATUS.COMPLETED).length;
  const cancelledCount = normalizedBookings.filter(b => b.normalizedStatus === BOOKING_STATUS.CANCELLED).length;

  // Lọc theo tìm kiếm và tab
  const filteredBookings = normalizedBookings.filter(booking => {
    if (activeStatusFilter !== 'ALL' && booking.normalizedStatus !== activeStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const petNames = (booking.petProfiles || []).map(p => p.name.toLowerCase()).join(' ');
      const matchId = (booking.id || '').toLowerCase().includes(q);
      const matchPhone = (booking.customerPhone || '').toLowerCase().includes(q);
      const matchName = (booking.customerName || '').toLowerCase().includes(q);
      const matchPets = petNames.includes(q);
      return matchId || matchPhone || matchName || matchPets;
    }
    return true;
  });

  // Danh sách thông báo phản hồi từ khách
  const adminNotifications = notifications.filter(n => n.type === 'admin_feedback' || n.type === 'booking_proposal');

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Modal đề xuất thay đổi/hủy của Admin */}
      <AdminProposeChangeModal
        isOpen={Boolean(selectedBookingForProposal)}
        booking={selectedBookingForProposal}
        onClose={() => setSelectedBookingForProposal(null)}
        onConfirm={(id, data) => adminProposeChange(id, data)}
      />

      {/* Header Admin */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold font-title tracking-tight text-white">
                  Mèo Vắng Nhà - Quản Trị Hệ Thống (Admin Portal)
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Realtime Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý vòng đời đơn đặt: Check-in ➔ Check-out ➔ Quy trình Đề xuất Đổi lịch/Hủy đơn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/my-booking"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition border border-slate-700"
            >
              <span>Xem trang Khách hàng (Tab mới)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={resetDefaultBookings}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow cursor-pointer"
              title="Khôi phục lại dữ liệu mẫu"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset dữ liệu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Hướng dẫn kiểm thử 2 tab Real-time */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border border-indigo-700/40 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 mt-0.5">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="flex-1 text-sm leading-relaxed">
              <h3 className="font-extrabold text-white text-base mb-1">
                Quy Trình Kiểm Thử Đồng Bộ Thời Gian Thực (Real-Time Two-Way Sync)
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm">
                Để kiểm tra luồng nghiệp vụ hoàn hảo mà không cần F5: Hãy mở <strong>1 tab là trang này (Admin)</strong> và <strong>1 tab là trang "Lịch đặt của tôi" (/my-booking)</strong> song song trên màn hình. Khi Admin bấm <em>"Check-in"</em>, <em>"Check-out"</em> hoặc <em>"Đề xuất đổi lịch"</em>, màn hình Khách hàng sẽ cập nhật ngay lập tức!
              </p>
            </div>
          </div>
        </div>

        {/* Thống kê Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div 
            onClick={() => setActiveStatusFilter('ALL')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeStatusFilter === 'ALL' ? 'bg-slate-800 border-indigo-500 shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-slate-400 block font-semibold">Tất cả đơn</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalCount}</span>
          </div>

          <div 
            onClick={() => setActiveStatusFilter(BOOKING_STATUS.UPCOMING)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeStatusFilter === BOOKING_STATUS.UPCOMING ? 'bg-amber-950/40 border-amber-500 shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-amber-400 block font-semibold">Sắp tới (UPCOMING)</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{upcomingCount}</span>
          </div>

          <div 
            onClick={() => setActiveStatusFilter(BOOKING_STATUS.IN_HOUSE)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeStatusFilter === BOOKING_STATUS.IN_HOUSE ? 'bg-emerald-950/40 border-emerald-500 shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-emerald-400 block font-semibold">Đang ở (IN_HOUSE)</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{inHouseCount}</span>
          </div>

          <div 
            onClick={() => setActiveStatusFilter(BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeStatusFilter === BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL ? 'bg-purple-950/40 border-purple-500 shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-purple-400 block font-semibold">Chờ khách duyệt</span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">{pendingApprovalCount}</span>
          </div>

          <div 
            onClick={() => setActiveStatusFilter(BOOKING_STATUS.COMPLETED)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeStatusFilter === BOOKING_STATUS.COMPLETED ? 'bg-blue-950/40 border-blue-500 shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-blue-400 block font-semibold">Đã xong (COMPLETED)</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{completedCount}</span>
          </div>

          <div 
            onClick={() => setActiveStatusFilter(BOOKING_STATUS.CANCELLED)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeStatusFilter === BOOKING_STATUS.CANCELLED ? 'bg-rose-950/40 border-rose-500 shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-xs text-rose-400 block font-semibold">Đã hủy (CANCELLED)</span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">{cancelledCount}</span>
          </div>
        </div>

        {/* Thanh tìm kiếm & Lọc */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên bé, SĐT khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Hiển thị <strong>{filteredBookings.length}</strong> / {totalCount} đơn đặt
          </div>
        </div>

        {/* Bảng danh sách đơn đặt phòng */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-5">Mã đơn & Ngày tạo</th>
                  <th className="py-4 px-5">Bé mèo & Chủ nuôi</th>
                  <th className="py-4 px-5">Dịch vụ & Phòng</th>
                  <th className="py-4 px-5">Lịch trình lưu trú</th>
                  <th className="py-4 px-5">Trạng thái (Enum)</th>
                  <th className="py-4 px-5 text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                      Không tìm thấy đơn đặt nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => {
                    const resolvedPets = booking.petProfiles || [];
                    const petsName = resolvedPets.map(p => p.name).join(', ') || 'Chưa rõ';
                    const isUpcoming = booking.normalizedStatus === BOOKING_STATUS.UPCOMING;
                    const isInHouse = booking.normalizedStatus === BOOKING_STATUS.IN_HOUSE;
                    const isPendingApproval = booking.normalizedStatus === BOOKING_STATUS.PENDING_CUSTOMER_APPROVAL;
                    const isCompleted = booking.normalizedStatus === BOOKING_STATUS.COMPLETED;
                    const isCancelled = booking.normalizedStatus === BOOKING_STATUS.CANCELLED;

                    return (
                      <tr key={booking.id} className="hover:bg-slate-800/30 transition-colors">
                        
                        {/* 1. Mã đơn & Ngày tạo */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-indigo-400 text-sm block">#{booking.id}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {new Date(booking.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                          </span>
                        </td>

                        {/* 2. Thú cưng & Khách hàng */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-white text-sm">{petsName}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {booking.customerName || 'Khách vãng lai'} • <span className="font-mono">{booking.customerPhone || 'Chưa có SĐT'}</span>
                          </div>
                        </td>

                        {/* 3. Dịch vụ & Phòng */}
                        <td className="py-4 px-5">
                          <div className="font-medium text-slate-200">
                            {booking.selectedPackage?.name || 'Gói chuẩn'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Phòng: <span className="text-amber-400 font-semibold">{booking.selectedRoom?.name || 'Phòng tiêu chuẩn'}</span>
                          </div>
                        </td>

                        {/* 4. Lịch trình lưu trú */}
                        <td className="py-4 px-5">
                          <div className="font-medium text-slate-200">
                            {formatDateRange(booking.checkIn, booking.checkOut)}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Tổng: {booking.totalAmount ? `${booking.totalAmount.toLocaleString()}đ` : 'Chưa tính'}
                          </div>
                        </td>

                        {/* 5. Trạng thái chuẩn Enum */}
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${booking.statusConfig.badgeClass}`}>
                              <span className={`w-2 h-2 rounded-full ${booking.statusConfig.dotClass}`}></span>
                              {booking.statusConfig.label}
                            </span>

                            {isPendingApproval && booking.pending_changes && (
                              <div className="text-[10px] text-purple-300 bg-purple-950/60 p-2 rounded-lg border border-purple-800/80 max-w-xs mt-1">
                                <strong>Đang đề xuất: </strong>
                                {booking.pending_changes.type === 'CANCEL' ? 'Hủy đơn' : 'Đổi ngày'}
                                <br />
                                <em>"{booking.pending_changes.reason}"</em>
                              </div>
                            )}

                            {isCancelled && booking.cancelReason && (
                              <div className="text-[10px] text-rose-400 italic">
                                Lý do: {booking.cancelReason}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 6. Thao tác Admin */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            
                            {/* UPCOMING -> Nút Check-in & Đề xuất */}
                            {isUpcoming && (
                              <>
                                <button
                                  onClick={() => adminCheckIn(booking.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer flex items-center gap-1"
                                  title="Check-in nhận bé vào khách sạn"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Check-in</span>
                                </button>

                                <button
                                  onClick={() => setSelectedBookingForProposal(booking)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                                  title="Gửi đề xuất đổi lịch hoặc hủy tới khách hàng"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>Đề xuất đổi/hủy</span>
                                </button>
                              </>
                            )}

                            {/* IN_HOUSE -> Nút Check-out */}
                            {isInHouse && (
                              <>
                                <button
                                  onClick={() => adminCheckOut(booking.id)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition cursor-pointer flex items-center gap-1"
                                  title="Check-out trả bé cho khách"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span>Check-out</span>
                                </button>

                                <Link
                                  to="/tracking"
                                  target="_blank"
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1"
                                >
                                  <Video className="w-3 h-3 text-emerald-400" />
                                  <span>Camera</span>
                                </Link>
                              </>
                            )}

                            {/* PENDING_CUSTOMER_APPROVAL -> Rút lại đề xuất */}
                            {isPendingApproval && (
                              <button
                                onClick={() => adminCancelProposal(booking.id)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-300 border border-rose-800/60 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                                title="Rút lại đề xuất trước khi khách phản hồi"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                                <span>Rút lại đề xuất</span>
                              </button>
                            )}

                            {/* COMPLETED / CANCELLED -> Trạng thái kết thúc */}
                            {(isCompleted || isCancelled) && (
                              <span className="text-[11px] text-slate-500 italic">
                                Không có hành động khả dụng
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Notification & Activity Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Nhật Ký Phản Hồi Từ Khách Hàng (Live Feed)</h3>
            </div>
            <span className="text-xs text-slate-500">Tự động nhận thông báo khi khách Đồng ý / Từ chối</span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {adminNotifications.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">Chưa có phản hồi mới từ khách hàng.</p>
            ) : (
              adminNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-bold text-slate-200">{notif.title}</p>
                    <p className="text-slate-400 mt-0.5">{notif.desc}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">{notif.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default AdminPage;
