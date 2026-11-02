import React from 'react';
import { 
  Zap, Utensils, Smile, Droplets, HeartPulse, 
  CheckCircle2, Clock, Plus, Sparkles, RefreshCw, Send, Check, 
  Camera, FileText, Smartphone, ExternalLink
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const CatStayingSection = ({
  catsInHotel = [],
  isDemoMode = false,
  onOpenDiaryModal,
  onOpenBulkModal,
  onOpenMediaModal,
  onOpenReportModal,
  onQuickFeedOne,
  onQuickPlayOne,
  onQuickFeedAll,
  onQuickPlayAll,
}) => {
  const location = useLocation();
  const isDirectAdminRoute = location.pathname.startsWith('/admin');
  const trackingPath = isDirectAdminRoute ? '/admin/tracking' : '/tracking';
  const bookingPath = isDirectAdminRoute ? '/admin/booking' : '/booking';

  const totalCats = catsInHotel.length;
  const fedCats = catsInHotel.filter((c) => c.fed).length;
  const playedCats = catsInHotel.filter((c) => c.played).length;
  const cleanCats = catsInHotel.filter((c) => c.hygiene).length;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-gray-100">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-2xl">🐱</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 font-title">
              Tác vụ hôm nay: Theo dõi lưu trú
            </h2>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {totalCats} bé đang lưu trú
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đồng bộ Realtime KH
            </span>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm">
            Cập nhật tình hình chăm sóc mèo hôm nay. Mọi cập nhật (ăn uống, vận động, ảnh/video, báo cáo) sẽ tự động đồng bộ ngay sang giao diện khách hàng.
          </p>
        </div>

        {/* Cụm nút hành động hàng loạt & Xem giao diện khách hàng */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={onOpenBulkModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-4 py-2.5 rounded-2xl transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer text-xs sm:text-sm"
          >
            <Zap className="w-4 h-4 fill-white" />
            Cập nhật hàng loạt (Nhanh)
          </button>

          <Link
            to={trackingPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs sm:text-sm transition-colors"
            title="Mở giao diện khách hàng để xem kết quả đồng bộ thời gian thực"
          >
            <Smartphone className="w-4 h-4 text-orange-600" />
            Xem giao diện KH
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Thông báo Demo nếu chưa có đơn thực tế đang check-in */}
      {isDemoMode && (
        <div className="bg-amber-50 text-amber-900 px-4 py-3 rounded-2xl border border-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-amber-200/80 text-amber-900 text-xs px-2 py-0.5 rounded-md">
              Dữ liệu mẫu
            </span>
            <span>
              Đang hiển thị 3 bé mẫu (Mimi, Bông, Lu). Khi admin bấm Check-in đơn thực tế ở mục <b>Cần xử lý hôm nay</b>, các bé mèo thật sẽ lập tức đồng bộ tại đây!
            </span>
          </div>
          <Link to={bookingPath} className="underline font-bold text-amber-800 hover:text-amber-950 shrink-0">
            + Tạo đơn mới
          </Link>
        </div>
      )}

      {/* Thống kê tiến độ trong ngày */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="text-xl">🏠</span>
          </div>
          <div>
            <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Đang lưu trú</h3>
            <p className="text-2xl font-black text-gray-900 font-title">{totalCats} bé</p>
          </div>
        </div>

        <div className="bg-orange-50/60 rounded-2xl p-4 border border-orange-100/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Đã cho ăn</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-gray-900 font-title">
                {fedCats}/{totalCats}
              </p>
              {fedCats === totalCats && totalCats > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Xong
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Đã chơi đùa</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-gray-900 font-title">
                {playedCats}/{totalCats}
              </p>
              {playedCats === totalCats && totalCats > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Xong
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Dọn vệ sinh</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-gray-900 font-title">
                {cleanCats}/{totalCats}
              </p>
              {cleanCats === totalCats && totalCats > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Xong
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar for Whole Team */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-950">
          <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
          <span>Thao tác nhanh 1 chạm cho toàn bộ mèo:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onQuickFeedAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white hover:bg-orange-100/60 text-orange-800 border border-orange-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5 text-orange-600" />
            Cho ăn tất cả (50g)
          </button>
          <button
            onClick={onQuickPlayAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white hover:bg-purple-100/60 text-purple-800 border border-purple-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            <Smile className="w-3.5 h-3.5 text-purple-600" />
            Vận động tất cả
          </button>
          <button
            onClick={onOpenBulkModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Cập nhật chi tiết
          </button>
        </div>
      </div>

      {/* Danh sách thẻ từng bé mèo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">
            Danh sách mèo & Tác vụ chăm sóc
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            Bấm thẻ hoặc nút để cập nhật nhật ký & gửi ảnh cho khách
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {catsInHotel.map((cat) => {
            const isCompleted = cat.fed && cat.played && cat.hygiene;

            return (
              <div
                key={`${cat.bookingId}_${cat.id}`}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden"
              >
                {/* Header Image */}
                <div className="h-44 overflow-hidden relative shrink-0">
                  <img
                    src={cat.image}
                    alt={cat.catName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-xs">
                    Phòng {cat.room}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    {isCompleted ? (
                      <span className="bg-emerald-500 text-white text-[11px] px-2.5 py-1 rounded-full font-bold shadow-md flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành tác vụ
                      </span>
                    ) : (
                      <span className="bg-amber-400 text-amber-950 text-[11px] px-2.5 py-1 rounded-full font-bold shadow-md flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Cần hoàn thành thêm
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between space-y-4">
                  {/* Cat & Owner Title */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-extrabold text-gray-900 font-title">{cat.catName}</h4>
                      <p className="text-xs text-gray-500">
                        Chủ: <span className="font-semibold text-gray-700">{cat.ownerName}</span>
                        {cat.ownerPhone && ` • ${cat.ownerPhone}`}
                      </p>
                    </div>
                  </div>

                  {/* Trạng thái 3 tác vụ hôm nay */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-center">
                    <div className={`p-2 rounded-xl text-xs font-bold ${cat.fed ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                      <Utensils className="w-3.5 h-3.5 mx-auto mb-0.5" />
                      <span>{cat.fed ? 'Đã ăn' : 'Chưa ăn'}</span>
                    </div>
                    <div className={`p-2 rounded-xl text-xs font-bold ${cat.played ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-400'}`}>
                      <Smile className="w-3.5 h-3.5 mx-auto mb-0.5" />
                      <span>{cat.played ? 'Đã chơi' : 'Chưa chơi'}</span>
                    </div>
                    <div className={`p-2 rounded-xl text-xs font-bold ${cat.hygiene ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400'}`}>
                      <Droplets className="w-3.5 h-3.5 mx-auto mb-0.5" />
                      <span>{cat.hygiene ? 'Đã dọn' : 'Chưa dọn'}</span>
                    </div>
                  </div>

                  {/* Cụm 4 nút thao tác trực tiếp */}
                  <div className="space-y-2 pt-1">
                    {/* Hàng 1: Nút 1 chạm Ăn & Chơi */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => onQuickFeedOne(e, cat)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          cat.fed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 active:scale-95'
                        }`}
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        {cat.fed ? 'Đã cho ăn ✓' : 'Cho ăn (50g)'}
                      </button>

                      <button
                        onClick={(e) => onQuickPlayOne(e, cat)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          cat.played
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-gray-100 hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-gray-200 active:scale-95'
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5" />
                        {cat.played ? 'Đã chơi ✓' : 'Vận động'}
                      </button>
                    </div>

                    {/* Hàng 2: Gửi ảnh/video & Báo cáo cuối ngày */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenMediaModal(cat)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-600" />
                        Gửi ảnh/video
                      </button>

                      <button
                        onClick={() => onOpenReportModal(cat)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors cursor-pointer active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        Báo cáo ngày
                      </button>
                    </div>

                    {/* Hàng 3: Mở modal quản lý nhật ký chi tiết */}
                    <button
                      onClick={() => onOpenDiaryModal(cat)}
                      className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer mt-1"
                    >
                      <span>Mở sổ nhật ký & dịch vụ</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CatStayingSection;
