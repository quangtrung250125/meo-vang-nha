import React from 'react';
import { 
  AlertCircle, LogIn, LogOut, MessageSquareWarning, 
  CheckCircle2, ChevronRight, Clock, Star, Phone, User
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const UrgentTasksToday = ({
  checkInList = [],
  checkOutList = [],
  complaintsList = [],
  onCheckIn,
  onCheckOut,
}) => {
  const location = useLocation();
  const isDirectAdminRoute = location.pathname.startsWith('/admin');
  const reviewsPath = isDirectAdminRoute ? '/admin/reviews' : '/reviews';
  const myBookingPath = isDirectAdminRoute ? '/admin/my-booking' : '/my-booking';

  const totalUrgent = checkInList.length + checkOutList.length + complaintsList.length;

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 font-title">
              Cần xử lý hôm nay
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {totalUrgent} việc cần xử lý
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Theo dõi đón mèo (Check-in), trả mèo (Check-out) và khiếu nại khách hàng trong ngày
          </p>
        </div>

        <Link
          to={myBookingPath}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 shrink-0"
        >
          Xem lịch đặt tổng thể <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. CHECK-IN HÔM NAY */}
        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <LogIn className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">Check-in hôm nay</h3>
              </div>
              <span className="text-xs font-extrabold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                {checkInList.length} đơn
              </span>
            </div>

            {checkInList.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                Không có đơn cần Check-in trong hôm nay
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {checkInList.map((item) => (
                  <div
                    key={item.code || item.id}
                    className="bg-white p-3 rounded-xl border border-amber-200/70 shadow-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-gray-900 truncate">
                          {item.ownerName || item.customerInfo?.fullName || 'Khách hàng'}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          {item.roomName || item.selectedRoom?.name || 'Phòng'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        Mèo: <b>{item.catNames || 'Bé mèo'}</b> • SĐT: {item.ownerPhone || item.customerPhone}
                      </p>
                    </div>

                    <button
                      onClick={() => onCheckIn(item.roomId || item.selectedRoom?.id, item.code || item.id)}
                      className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Check-in
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. CHECK-OUT HÔM NAY */}
        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">Check-out hôm nay</h3>
              </div>
              <span className="text-xs font-extrabold text-blue-800 bg-blue-200/80 px-2 py-0.5 rounded-full">
                {checkOutList.length} đơn
              </span>
            </div>

            {checkOutList.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                Không có đơn cần Check-out trong hôm nay
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {checkOutList.map((item) => (
                  <div
                    key={item.code || item.id}
                    className="bg-white p-3 rounded-xl border border-blue-200/70 shadow-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-gray-900 truncate">
                          {item.ownerName || item.customerInfo?.fullName || 'Khách hàng'}
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {item.roomName || item.selectedRoom?.name || 'Phòng'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        Mèo: <b>{item.catNames || 'Bé mèo'}</b> • SĐT: {item.ownerPhone || item.customerPhone}
                      </p>
                    </div>

                    <button
                      onClick={() => onCheckOut(item.roomId || item.selectedRoom?.id, item.code || item.id)}
                      className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Bàn giao
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. KHIẾU NẠI & PHẢN HỒI CẦN XỬ LÝ */}
        <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                  <MessageSquareWarning className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">Khiếu nại cần xử lý</h3>
              </div>
              <span className="text-xs font-extrabold text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded-full">
                {complaintsList.length} phản hồi
              </span>
            </div>

            {complaintsList.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                Tuyệt vời! Không có khiếu nại nào đang tồn đọng.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {complaintsList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-xl border border-rose-200/70 shadow-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-gray-900 truncate">{item.author}</span>
                        <span className="text-[10px] text-gray-400">({item.petName})</span>
                      </div>
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                        {item.rating}/5
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                      "{item.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-rose-100/80 text-right">
            <Link
              to={reviewsPath}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Mở trang Đánh giá & Phản hồi <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrgentTasksToday;
