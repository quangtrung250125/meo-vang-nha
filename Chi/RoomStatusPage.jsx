import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Filter,
  Wrench,
  CheckCircle2,
  BedDouble,
  PlusCircle,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useRoomState, ROOM_CONFIG, getRoomStatus } from './RoomStateContext';
import BookingDetailModal from './BookingDetailModal';

/**
 * RoomStatusPage - Trang "Tình trạng phòng" dành riêng cho Admin
 * Lưu tại thư mục Chi
 *
 * Tính năng:
 * - Chế độ xem ngày mặc định với DatePicker popup
 *   (mở khi bấm vùng ngày HOẶC nút ◄ ▶ chuyển ngày)
 * - Bộ lọc: Hạng phòng (Tất cả, VIP, VVIP, DELUXE)
 *           Trạng thái (Tất cả, Trống, Còn chỗ, Đầy, Bảo trì)
 * - 11 phòng: VIP-01~06 (sức chứa 2), VVIP-01~03 (sức chứa 4), DELUXE-01~02 (sức chứa 6)
 * - Toggle Bảo trì trên góc trên phải mỗi ô phòng
 * - Màu nền ô phòng theo trạng thái:
 *     Trống    → Xanh lá  (bg-green-500)
 *     Còn chỗ → Vàng     (bg-yellow-400)
 *     Đầy      → Đỏ       (bg-red-500)
 *     Bảo trì  → Xám      (bg-gray-200)
 */

// ROOM_CONFIG và getRoomStatus được import từ RoomStateContext

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VN = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function formatDateVN(date) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const dow = DAYS_VN[date.getDay()];
  return `${dow}, ${d < 10 ? '0' + d : d}/${m < 10 ? '0' + m : m}/${y}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// getRoomStatus được import từ RoomStateContext

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

// ─────────────────────────────────────────────
// DatePicker Popup Component
// ─────────────────────────────────────────────
const DatePickerPopup = ({ selectedDate, onSelect, onClose, anchorRef }) => {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const today = new Date();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleSelectDay = (day) => {
    onSelect(new Date(viewYear, viewMonth, day));
    onClose();
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div
      ref={popupRef}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-72 select-none"
      style={{ minWidth: 280 }}
    >
      {/* Header tháng/năm */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-bold text-gray-800 text-sm">
          {MONTHS_VN[viewMonth]} {viewYear}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tiêu đề ngày trong tuần */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_VN.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Lưới ngày */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          const isToday = isSameDay(cellDate, today);
          const isSelected = isSameDay(cellDate, selectedDate);
          return (
            <button
              key={day}
              onClick={() => handleSelectDay(day)}
              className={`
                h-8 w-8 mx-auto rounded-lg text-xs font-semibold transition-all
                ${isSelected
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : isToday
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'text-gray-700 hover:bg-gray-100'}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Nút Hôm nay */}
      <button
        onClick={() => { onSelect(new Date()); onClose(); }}
        className="mt-3 w-full py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
      >
        Về hôm nay
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Badge màu sắc trạng thái booking
// ─────────────────────────────────────────────
const bookingStatusBadge = (status) => {
  const map = {
    'đang ở': 'bg-blue-100 text-blue-700',
    'check-in': 'bg-green-100 text-green-700',
    'check-out': 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

// ─────────────────────────────────────────────
// RoomCard Component
// ─────────────────────────────────────────────
const RoomCard = ({ room, bookings, isMaintenance, onToggleMaintenance, newBookingIds = new Set(), onBookingClick, selectedDate = new Date() }) => {
  const selectedDateStr = (() => {
    const d = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const bks = (bookings[room.id] || []).filter((b) => {
    if (!b || b.code?.includes('BK')) return false;
    // Bỏ qua nếu đơn đã check-out, đã hoàn tất hoặc bị hủy
    if (
      b.status === 'check-out' ||
      b.status === 'Đã hoàn tất' ||
      b.status === 'hoàn tất' ||
      b.status === 'cancelled' ||
      b.status === 'Đã hủy'
    ) return false;
    // Chỉ tính đang ở phòng nếu ngày đang xem nằm trong khoảng [checkIn, checkOut]
    if (!b.checkIn || !b.checkOut) return true;
    return selectedDateStr >= b.checkIn && selectedDateStr <= b.checkOut;
  });

  const totalCats = bks.reduce((s, b) => s + (b.cats || 1), 0);
  const remaining = Math.max(0, room.capacity - totalCats);
  const status = getRoomStatus(room.id, bookings, isMaintenance, selectedDate);

  /**
   * Màu nền ô phòng theo đúng spec:
   *   Trống    → Xanh lá rõ  (bg-green-500)
   *   Còn chỗ → Vàng rõ     (bg-yellow-400)
   *   Đầy      → Đỏ rõ       (bg-red-500)
   *   Bảo trì  → Xám nhạt    (bg-gray-200)
   */
  const statusStyles = {
    maintenance: {
      bg: 'bg-gray-200 border-gray-400',
      text: 'text-gray-600',
      subText: 'text-gray-500',
      bkRow: 'bg-white/50 border-gray-300',
      bkCode: 'text-gray-700',
      bkCat: 'text-gray-500',
    },
    empty: {
      bg: 'bg-green-500 border-green-600',
      text: 'text-white',
      subText: 'text-white/80',
      bkRow: 'bg-white/20 border-white/30',
      bkCode: 'text-white font-bold',
      bkCat: 'text-white/80',
    },
    available: {
      bg: 'bg-yellow-400 border-yellow-500',
      text: 'text-yellow-900',
      subText: 'text-yellow-800',
      bkRow: 'bg-white/60 border-yellow-300',
      bkCode: 'text-yellow-900 font-bold',
      bkCat: 'text-yellow-800',
    },
    full: {
      bg: 'bg-red-500 border-red-600',
      text: 'text-white',
      subText: 'text-white/80',
      bkRow: 'bg-white/20 border-white/30',
      bkCode: 'text-white font-bold',
      bkCat: 'text-white/80',
    },
  };

  // Badge hạng phòng – màu tương phản trên từng nền
  const typeBadgeColor = {
    maintenance: 'bg-gray-400 text-white',
    empty: 'bg-white/25 text-white border border-white/40',
    available: 'bg-yellow-600 text-white',
    full: 'bg-white/25 text-white border border-white/40',
  };

  // Nút bảo trì – màu tương phản
  const maintenanceBtnClass = isMaintenance
    ? 'bg-gray-700 text-white hover:bg-gray-600 border-transparent'
    : status === 'empty' || status === 'full'
    ? 'bg-white/20 text-white border border-white/50 hover:bg-white/35'
    : 'bg-white/60 text-yellow-900 border border-yellow-500/50 hover:bg-white/80';

  const st = statusStyles[status];

  return (
    <div
      className={`
        relative rounded-2xl border-2 p-4 flex flex-col gap-2 transition-all duration-300 min-h-[140px] shadow-md
        ${st.bg}
      `}
    >
      {/* ── Header card: tên phòng + badge hạng + nút bảo trì (góc trên phải) ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <BedDouble className={`h-4 w-4 shrink-0 ${st.text}`} />
          <span className={`font-extrabold text-sm truncate ${st.text}`}>{room.id}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${typeBadgeColor[status]}`}>
            {room.type}
          </span>
        </div>

        {/* Nút [Bảo trì] / [Hết bảo trì] ở góc trên bên phải */}
        <button
          onClick={() => onToggleMaintenance(room.id)}
          className={`
            flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all shrink-0
            ${maintenanceBtnClass}
          `}
          title={isMaintenance ? 'Bấm để hết bảo trì' : 'Bấm để bật bảo trì'}
        >
          {isMaintenance ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Hết bảo trì
            </>
          ) : (
            <>
              <Wrench className="h-3 w-3" />
              Bảo trì
            </>
          )}
        </button>
      </div>

      {/* ── Nội dung chính ── */}
      {status === 'maintenance' ? (
        /* Bảo trì: ẩn chi tiết, hiển thị chữ BẢO TRÌ ở giữa */
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="text-center">
            <Wrench className="h-9 w-9 text-gray-500 mx-auto mb-2" />
            <span className="text-base font-black tracking-widest text-gray-600 uppercase">
              BẢO TRÌ
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Tình trạng tổng quan */}
          <div className={`text-sm font-bold ${st.text}`}>
            {/* Trống: "Trống (Còn: X/Y)" */}
            {status === 'empty' && (
              <span>Trống &nbsp;(Còn: <strong>{remaining}/{room.capacity}</strong>)</span>
            )}
            {/* Còn chỗ: "Còn X/Y" */}
            {status === 'available' && (
              <span>Còn <strong>{remaining}/{room.capacity}</strong></span>
            )}
            {/* Đầy: "Đầy" */}
            {status === 'full' && (
              <span>Đầy</span>
            )}
          </div>

          {/* Danh sách booking kèm trạng thái (đang ở)/(check-in)/(check-out) + số mèo */}
          {bks.length > 0 && (
            <div className="flex flex-col gap-1 mt-0.5">
              {bks.map((bk) => {
                const isNew = newBookingIds.has(bk.code);
                const isClickable = status === 'available' || status === 'full';
                return (
                  <div
                    key={bk.code}
                    onClick={() => isClickable && onBookingClick && onBookingClick(bk, room.id)}
                    className={`flex items-center justify-between text-xs rounded-xl px-2.5 py-1.5 border transition-all duration-300 ${
                      isNew
                        ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-300 ring-offset-1 animate-pulse'
                        : st.bkRow
                    } ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-white/60 hover:shadow-md active:scale-[0.97]' : ''}`}
                    title={isClickable ? `Xem chi tiết ${bk.code}` : ''}
                  >
                    <div className="flex items-center gap-1">
                      {isNew && <Zap className="h-3 w-3 text-yellow-500 shrink-0" />}
                      <span className={isNew ? 'text-yellow-900 font-bold' : st.bkCode}>{bk.code}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={isNew ? 'text-yellow-800' : st.bkCat}>🐱 {bk.cats}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full font-semibold text-[10px] ${bookingStatusBadge(bk.status)}`}
                      >
                        ({bk.status})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sức chứa */}
          <div className="mt-auto pt-1">
            <div className={`text-[11px] font-semibold text-center ${st.subText}`}>
              Sức chứa: {room.capacity} mèo/phòng
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────
const RoomStatusPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [filterType, setFilterType] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const dateBarRef = useRef(null);

  // State cho BookingDetailModal
  const [activeBooking, setActiveBooking] = useState(null); // { booking, roomId }

  // Lấy bookings và maintenance thời gian thực (kèm lưu vĩnh viễn) từ shared context
  const { bookings, newBookingIds, maintenanceRooms, toggleMaintenance, checkInBooking, checkOutBooking, removeBooking, updateBooking, resetDemoData } = useRoomState();

  const handleBookingClick = useCallback((booking, roomId) => {
    setActiveBooking({ booking, roomId });
  }, []);

  // Khi bookings thay đổi (check-in/update), refresh active booking nếu đang mở
  useEffect(() => {
    if (!activeBooking) return;
    const { roomId, booking } = activeBooking;
    const updated = (bookings[roomId] || []).find(b => b.code === booking.code);
    if (updated) {
      setActiveBooking({ booking: updated, roomId });
    }
  }, [bookings]);

  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const basePrefix = isAdminRoute ? '/admin' : '';

  const handleToggleMaintenance = useCallback((roomId) => {
    toggleMaintenance(roomId);
  }, [toggleMaintenance]);

  /**
   * Nút ◄ ▶: đổi ngày VÀ bật DatePicker popup
   * (theo yêu cầu: "khi người dùng bấm vào nút chuyển đổi ngày... hệ thống bật lên ô lịch")
   */
  const handlePrevDay = () => {
    setSelectedDate((d) => addDays(d, -1));
    setIsDatePickerOpen(true);
  };
  const handleNextDay = () => {
    setSelectedDate((d) => addDays(d, 1));
    setIsDatePickerOpen(true);
  };

  const isToday = isSameDay(selectedDate, new Date());

  // Lọc phòng theo hạng & trạng thái (dựa theo ngày được chọn)
  const filteredRooms = ROOM_CONFIG.filter((room) => {
    const isMaintenance = !!maintenanceRooms[room.id];
    const status = getRoomStatus(room.id, bookings, isMaintenance, selectedDate);

    const statusMap = {
      Trống: 'empty',
      'Còn chỗ': 'available',
      Đầy: 'full',
      'Bảo trì': 'maintenance',
    };

    const typeMatch = filterType === 'Tất cả' || room.type === filterType;
    const statusMatch = filterStatus === 'Tất cả' || status === statusMap[filterStatus];

    return typeMatch && statusMatch;
  });

  // Nhóm phòng theo loại (VIP → VVIP → DELUXE từ trên xuống)
  const groupedRooms = ['VIP', 'VVIP', 'DELUXE']
    .map((type) => ({
      type,
      rooms: filteredRooms.filter((r) => r.type === type),
    }))
    .filter((g) => g.rooms.length > 0);

  // Thống kê nhanh theo ngày đang xem
  const stats = ROOM_CONFIG.reduce((acc, room) => {
    const isMaintenance = !!maintenanceRooms[room.id];
    const status = getRoomStatus(room.id, bookings, isMaintenance, selectedDate);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const typeGroupLabel = {
    VIP: {
      label: 'Phòng VIP',
      sub: 'Tối đa 2 mèo/phòng · 6 phòng (VIP-01 → VIP-06)',
      color: 'text-orange-700',
      bg: 'bg-orange-50 border-orange-200',
    },
    VVIP: {
      label: 'Phòng VVIP',
      sub: 'Tối đa 4 mèo/phòng · 3 phòng (VVIP-01 → VVIP-03)',
      color: 'text-purple-700',
      bg: 'bg-purple-50 border-purple-200',
    },
    DELUXE: {
      label: 'Phòng DELUXE',
      sub: 'Tối đa 6 mèo/phòng · 2 phòng (DELUXE-01 → DELUXE-02)',
      color: 'text-sky-700',
      bg: 'bg-sky-50 border-sky-200',
    },
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-orange-500" />
              Tình trạng phòng
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Theo dõi trạng thái tất cả các phòng theo ngày
            </p>
          </div>

          {/* Nhóm nút chức năng */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-reset-demo-room-status"
              onClick={() => {
                if (window.confirm('Khôi phục dữ liệu phòng về trạng thái mẫu ban đầu (sẽ xóa các phòng đang trống)?')) {
                  resetDemoData();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Khôi phục dữ liệu phòng mẫu ban đầu"
            >
              <RefreshCw className="h-4 w-4" />
              Khôi phục mẫu
            </button>

            <button
              id="btn-dat-phong-room-status"
              onClick={() => navigate(`${basePrefix}/booking`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="h-4 w-4" />
              Đặt phòng
            </button>
          </div>
        </div>

        {/* ── Thanh thống kê nhanh ── */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: 'Trống',   count: stats.empty || 0,       color: 'bg-green-100 text-green-800 border-green-300' },
            { label: 'Còn chỗ', count: stats.available || 0,   color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
            { label: 'Đầy',     count: stats.full || 0,         color: 'bg-red-100 text-red-700 border-red-200' },
            { label: 'Bảo trì', count: stats.maintenance || 0,  color: 'bg-gray-200 text-gray-600 border-gray-300' },
          ].map((s) => (
            <div
              key={s.label}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${s.color}`}
            >
              <span>{s.label}</span>
              <span className="font-extrabold">{s.count}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 text-xs font-bold text-gray-600 bg-white">
            Tổng: <span className="ml-1 font-extrabold">{ROOM_CONFIG.length}</span> phòng
          </div>
        </div>
      </div>

      {/* ── Toolbar: DatePicker + Bộ lọc ── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between sticky top-[80px] z-20 shadow-sm">

        {/* Khu vực chọn ngày */}
        <div className="relative" ref={dateBarRef}>
          <div className="flex items-center gap-1">
            {/* Nút ◄ → đổi ngày + bật DatePicker */}
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-xl hover:bg-orange-50 hover:text-orange-600 text-gray-500 transition-colors"
              aria-label="Ngày trước"
              title="Ngày trước · Mở lịch"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Vùng hiển thị ngày → bấm bật/tắt DatePicker */}
            <button
              id="btn-date-picker-toggle"
              onClick={() => setIsDatePickerOpen((o) => !o)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-sm transition-all
                ${isDatePickerOpen
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'}
              `}
            >
              <Calendar className="h-4 w-4 shrink-0" />
              {isToday ? '📅 Hôm nay · ' : '📅 '}
              {formatDateVN(selectedDate)}
            </button>

            {/* Nút ▶ → đổi ngày + bật DatePicker */}
            <button
              onClick={handleNextDay}
              className="p-2 rounded-xl hover:bg-orange-50 hover:text-orange-600 text-gray-500 transition-colors"
              aria-label="Ngày sau"
              title="Ngày sau · Mở lịch"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* DatePicker Popup */}
          {isDatePickerOpen && (
            <DatePickerPopup
              selectedDate={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setIsDatePickerOpen(false); }}
              onClose={() => setIsDatePickerOpen(false)}
              anchorRef={dateBarRef}
            />
          )}
        </div>

        {/* Bộ lọc */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />

          {/* Lọc hạng phòng: Tất cả | VIP | VVIP | DELUXE */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 mr-1 whitespace-nowrap">Hạng phòng:</span>
            {['Tất cả', 'VIP', 'VVIP', 'DELUXE'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterType === t
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* Lọc trạng thái: Tất cả | Trống | Còn chỗ | Đầy | Bảo trì */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 mr-1 whitespace-nowrap">Trạng thái:</span>
            {['Tất cả', 'Trống', 'Còn chỗ', 'Đầy', 'Bảo trì'].map((s) => {
              const isActive = filterStatus === s;
              const colorMap = {
                'Tất cả':  isActive ? 'bg-orange-500 text-white'  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                'Trống':   isActive ? 'bg-green-600 text-white'   : 'bg-green-50 text-green-700 hover:bg-green-100',
                'Còn chỗ': isActive ? 'bg-yellow-500 text-white'  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
                'Đầy':     isActive ? 'bg-red-600 text-white'     : 'bg-red-50 text-red-700 hover:bg-red-100',
                'Bảo trì': isActive ? 'bg-gray-600 text-white'    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              };
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${colorMap[s]}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Lưới phòng ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {groupedRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CalendarDays className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-bold text-lg">Không có phòng nào phù hợp</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc để xem thêm phòng</p>
          </div>
        ) : (
          groupedRooms.map(({ type, rooms }) => {
            const meta = typeGroupLabel[type];
            return (
              <section key={type}>
                {/* Tiêu đề nhóm */}
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border mb-4 ${meta.bg}`}>
                  <span className={`font-extrabold text-sm ${meta.color}`}>{meta.label}</span>
                  <span className={`text-xs font-semibold ${meta.color} opacity-70`}>— {meta.sub}</span>
                  <span className={`ml-1 text-xs font-extrabold ${meta.color}`}>({rooms.length} phòng)</span>
                </div>

                {/* Grid phòng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      bookings={bookings}
                      isMaintenance={!!maintenanceRooms[room.id]}
                      onToggleMaintenance={handleToggleMaintenance}
                      newBookingIds={newBookingIds}
                      onBookingClick={handleBookingClick}
                      selectedDate={selectedDate}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* ── Legend ── */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-4 items-center shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Chú thích màu sắc:</span>
          {[
            { color: 'bg-green-500',  label: 'Trống — 0 mèo' },
            { color: 'bg-yellow-400', label: 'Còn chỗ — Có khách, chưa đầy (nhấp mã đơn để xem)' },
            { color: 'bg-red-500',    label: 'Đầy — Hết chỗ (nhấp mã đơn để xem)' },
            { color: 'bg-gray-300',   label: 'Bảo trì — Tạm khóa' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`h-4 w-4 rounded-md ${l.color} shadow-sm`} />
              <span className="text-xs text-gray-600 font-medium">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
      </div>

    {/* ── BookingDetailModal ── */}
    {activeBooking && (
      <BookingDetailModal
        booking={activeBooking.booking}
        roomId={activeBooking.roomId}
        onClose={() => setActiveBooking(null)}
        onCheckIn={checkInBooking}
        onCheckOut={checkOutBooking}
        onDelete={removeBooking}
        onUpdate={updateBooking}
      />
    )}
  </>);
};

export default RoomStatusPage;
