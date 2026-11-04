import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stayEntriesForRoom } from '../src/utils/staySegments';
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
  AlertTriangle,
  Phone,
  XCircle,
} from 'lucide-react';
import { useRoomState, ROOM_CONFIG, getRoomStatus, displayCheckOut } from './RoomStateContext';
import BookingDetailModal from './BookingDetailModal';
import { PAYMENT_STATUS, DEPOSIT_DEADLINE_HOURS, isDepositOverdue, getDepositDueAt, formatVietnamDateTime } from '../src/utils/bookingDeposit';

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
 * - Thẻ phòng nền trắng, màu trạng thái ở vạch trái + nhãn + thanh sức chứa (xem STATUS_THEME):
 *     Trống → xanh ngọc · Còn chỗ → hổ phách · Đầy → hồng đỏ · Bảo trì → xám
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
// Bảng màu trạng thái (dùng chung cho thẻ phòng, thanh thống kê, chú thích)
//   Trống → xanh ngọc · Còn chỗ → hổ phách · Đầy → hồng đỏ · Bảo trì → xám
// Thiết kế mới: nền thẻ trắng, màu trạng thái chỉ ở viền trái, nhãn và thanh sức chứa
// ─────────────────────────────────────────────
const STATUS_THEME = {
  empty: {
    label: 'Trống',
    accent: 'bg-emerald-600',
    dot: 'bg-emerald-600',
    pill: 'bg-emerald-600 text-white',
    slot: 'bg-emerald-600',
    tint: 'bg-emerald-50/70 border-emerald-200',
  },
  available: {
    label: 'Còn chỗ',
    accent: 'bg-amber-500',
    dot: 'bg-amber-500',
    pill: 'bg-amber-400 text-amber-950',
    slot: 'bg-amber-500',
    tint: 'bg-amber-50/70 border-amber-200',
  },
  full: {
    label: 'Đầy',
    accent: 'bg-rose-600',
    dot: 'bg-rose-600',
    pill: 'bg-rose-600 text-white',
    slot: 'bg-rose-600',
    tint: 'bg-rose-50/70 border-rose-200',
  },
  maintenance: {
    label: 'Bảo trì',
    accent: 'bg-slate-500',
    dot: 'bg-slate-500',
    pill: 'bg-slate-600 text-white',
    slot: 'bg-slate-400',
    tint: 'bg-slate-100 border-slate-300',
  },
};

// ─────────────────────────────────────────────
// Badge màu sắc trạng thái booking
// ─────────────────────────────────────────────
const bookingStatusBadge = (status) => {
  const map = {
    'đang ở': 'bg-sky-600 text-white',
    'check-in': 'bg-emerald-600 text-white',
    'check-out': 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  };
  return map[status] || 'bg-gray-100 text-gray-600 ring-1 ring-gray-200';
};

// ─────────────────────────────────────────────
// RoomCard Component
// ─────────────────────────────────────────────
const RoomCard = ({ room, bookings, isMaintenance, onToggleMaintenance, newBookingIds = new Set(), onBookingClick, selectedDate = new Date(), now = Date.now(), onDepositWarn, onDepositCancel }) => {
  const selectedDateStr = (() => {
    const d = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  // Gồm cả bé của đơn phòng khác chuyển sang phòng này theo lịch khách tự đổi phòng / gia hạn
  const bks = stayEntriesForRoom(room.id, bookings).filter((b) => {
    if (!b || b.code?.includes('BK')) return false;
    if (b._movesOutOn && selectedDateStr >= b._movesOutOn) return false;
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
    // Bé đang ở quá ngày hẹn đón vẫn hiện tới hôm nay để Admin check-out muộn
    return selectedDateStr >= b.checkIn && selectedDateStr <= displayCheckOut(b);
  });

  const totalCats = bks.reduce((s, b) => s + (Number(b.cats) || 1), 0);
  const remaining = Math.max(0, room.capacity - totalCats);
  const used = Math.min(room.capacity, totalCats);
  const status = getRoomStatus(room.id, bookings, isMaintenance, selectedDate);
  const theme = STATUS_THEME[status];

  // Nhãn trạng thái ở góc phải thẻ
  const statusText =
    status === 'empty' ? 'Trống'
    : status === 'available' ? `Còn ${remaining}/${room.capacity}`
    : status === 'full' ? 'Đầy'
    : 'Bảo trì';

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border pl-5 pr-4 py-4 flex flex-col gap-3
        min-h-[150px] shadow-sm hover:shadow-md transition-all duration-300
        ${theme.tint}
      `}
    >
      {/* Vạch màu trạng thái bên trái */}
      <span className={`absolute left-0 top-0 h-full w-2 ${theme.accent}`} aria-hidden="true" />

      {/* ── Header: tên phòng + hạng + nhãn trạng thái ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 shrink-0 text-gray-600" />
            <span className="font-extrabold text-[15px] text-gray-900 truncate">{room.id}</span>
          </div>
          <span className="mt-0.5 inline-block text-[10px] font-bold tracking-wide text-gray-500 uppercase">
            Hạng {room.type}
          </span>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${theme.pill}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {statusText}
        </span>
      </div>

      {/* ── Nội dung chính ── */}
      {status === 'maintenance' ? (
        /* Bảo trì: ẩn chi tiết, hiển thị chữ BẢO TRÌ ở giữa */
        <div className="flex-1 flex items-center justify-center py-3">
          <div className="text-center text-slate-600">
            <Wrench className="h-7 w-7 mx-auto mb-1" />
            <span className="text-xs font-bold tracking-widest uppercase">Tạm khóa bảo trì</span>
          </div>
        </div>
      ) : (
        <>
          {/* Thanh sức chứa: mỗi ô là một chỗ cho mèo */}
          <div>
            <div className="flex gap-1">
              {Array.from({ length: room.capacity }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < used ? theme.slot : 'bg-white ring-1 ring-inset ring-gray-300'}`}
                />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-gray-600">
              {status === 'empty'
                ? <>Còn <strong className="text-gray-900">{remaining}/{room.capacity}</strong> chỗ</>
                : <><strong className="text-gray-900">{used}/{room.capacity}</strong> mèo đang ở</>}
            </p>
          </div>

          {/* Danh sách booking kèm trạng thái (đang ở)/(check-in)/(check-out) + số mèo */}
          {bks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {bks.map((bk) => {
                const isNew = newBookingIds.has(bk.code);
                const isClickable = status === 'available' || status === 'full';
                const overdue = isDepositOverdue(bk, now);
                return (
                  <div key={bk.code} className="flex flex-col gap-1">
                  <div
                    onClick={() => isClickable && onBookingClick && onBookingClick(bk._booking || bk, bk._homeRoomId || room.id)}
                    className={`flex items-center justify-between gap-2 text-xs rounded-xl px-2.5 py-2 border transition-all duration-300 ${
                      isNew
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200 animate-pulse'
                        : 'bg-white border-gray-200 shadow-sm'
                    } ${isClickable ? 'cursor-pointer hover:border-orange-300 hover:bg-orange-50/60 active:scale-[0.98]' : ''}`}
                    title={isClickable ? `Xem chi tiết ${bk.code}` : ''}
                  >
                    <div className="flex items-center gap-1 min-w-0 flex-wrap">
                      {isNew && <Zap className="h-3 w-3 text-amber-500 shrink-0" />}
                      <span className="font-bold text-gray-800">{bk.code}</span>
                      {bk.paymentStatus === PAYMENT_STATUS.AWAITING_DEPOSIT && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950">Chờ cọc</span>
                      )}
                      {bk.paymentStatus === PAYMENT_STATUS.AWAITING_TOP_UP && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">Chờ cọc thêm</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-gray-700 font-semibold">🐱 {bk.cats}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full font-semibold text-[10px] ${bookingStatusBadge(bk.status)}`}
                      >
                        {bk.status}
                      </span>
                    </div>
                  </div>
                  {/* Quá 24 giờ chưa nhận cọc: nhân viên gọi nhắc khách hoặc hủy đơn luôn */}
                  {overdue && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700">
                      <p className="font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Quá {DEPOSIT_DEADLINE_HOURS}h chưa cọc
                      </p>
                      {bk.depositWarnedAt && (
                        <p className="text-[10px] text-gray-500">Đã gọi nhắc lúc {formatVietnamDateTime(bk.depositWarnedAt)}</p>
                      )}
                      <div className="mt-1.5 flex gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDepositWarn && onDepositWarn(bk, room.id); }}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-1"
                        >
                          <Phone className="h-3 w-3" /> Cảnh báo
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDepositCancel && onDepositCancel(bk, room.id); }}
                          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1"
                        >
                          <XCircle className="h-3 w-3" /> Hủy
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Chân thẻ: sức chứa + nút Bảo trì / Hết bảo trì ── */}
      <div className="mt-auto pt-2 border-t border-black/10 flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-600">Sức chứa: {room.capacity} mèo/phòng</span>
        <button
          onClick={() => onToggleMaintenance(room.id)}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all shrink-0 ${
            isMaintenance
              ? 'bg-slate-700 text-white hover:bg-slate-600'
              : 'text-gray-700 bg-white/70 ring-1 ring-gray-300 hover:bg-white'
          }`}
          title={isMaintenance ? 'Bấm để hết bảo trì' : 'Bấm để bật bảo trì'}
        >
          {isMaintenance ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Hết bảo trì
            </>
          ) : (
            <>
              <Wrench className="h-3.5 w-3.5" />
              Bảo trì
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Hộp thoại cho đơn quá hạn cọc 24 giờ: gọi nhắc khách hoặc hủy đơn (không cần khách duyệt)
// ─────────────────────────────────────────────
const DepositOverdueDialog = ({ action, onClose, onMarkWarned, onConfirmCancel }) => {
  const { type, booking: bk, roomId } = action;
  const phone = bk.customerPhone || bk.ownerPhone || '';
  const name = bk.customerName || bk.ownerName || 'Khách';
  const dueText = formatVietnamDateTime(getDepositDueAt(bk));
  const isCancel = type === 'cancel';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className={`text-lg font-extrabold flex items-center gap-2 ${isCancel ? 'text-red-700' : 'text-amber-700'}`}>
          {isCancel ? <XCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          {isCancel ? 'Hủy đơn quá hạn cọc?' : 'Nhắc khách chuyển cọc'}
        </h3>
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 space-y-1">
          <p><strong>{bk.code}</strong> · Phòng {roomId} · 🐱 {bk.cats}</p>
          <p>Khách: <strong>{name}</strong></p>
          {phone && <p>SĐT: <strong>{phone}</strong></p>}
          <p>Tiền cọc: <strong>{Number(bk.depositAmount || 0).toLocaleString()}đ</strong></p>
          {dueText && <p className="text-red-600">Hạn chuyển cọc: {dueText}</p>}
          {bk.depositWarnedAt && <p className="text-gray-500">Đã gọi nhắc lúc {formatVietnamDateTime(bk.depositWarnedAt)}</p>}
        </div>
        {isCancel ? (
          <p className="text-sm text-gray-600">
            Đơn sẽ bị hủy ngay, không cần chờ khách duyệt, và chỗ trong phòng được trả lại cho khách khác.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Gọi cho khách, nhắc chuyển tiền cọc (nội dung: <strong>COC {bk.code}</strong>). Gọi xong bấm "Đã gọi nhắc" để lưu lại.
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">
            Đóng
          </button>
          {isCancel ? (
            <button type="button" onClick={() => onConfirmCancel(roomId, bk.code)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm">
              Hủy đơn
            </button>
          ) : (
            <>
              {phone && (
                <a href={`tel:${phone}`} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-1">
                  <Phone className="h-4 w-4" /> Gọi
                </a>
              )}
              <button type="button" onClick={() => onMarkWarned(roomId, bk.code)} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm">
                Đã gọi nhắc
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────
const RoomStatusPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      const saved = sessionStorage.getItem('mvn_admin_room_selected_date');
      if (saved) {
        const parsed = new Date(saved);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    } catch (e) {}
    return new Date();
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('mvn_admin_room_selected_date', selectedDate.toISOString());
    } catch (e) {}
  }, [selectedDate]);
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

  // Đồng hồ cập nhật mỗi 30 giây để nút Cảnh báo / Hủy tự hiện khi đơn vừa quá hạn cọc
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Hộp thoại cho đơn quá hạn cọc: { type: 'warn' | 'cancel', booking, roomId }
  const [depositAction, setDepositAction] = useState(null);
  const handleDepositWarn = useCallback((booking, roomId) => setDepositAction({ type: 'warn', booking, roomId }), []);
  const handleDepositCancel = useCallback((booking, roomId) => setDepositAction({ type: 'cancel', booking, roomId }), []);

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
      bar: 'bg-orange-400',
    },
    VVIP: {
      label: 'Phòng VVIP',
      sub: 'Tối đa 4 mèo/phòng · 3 phòng (VVIP-01 → VVIP-03)',
      bar: 'bg-purple-400',
    },
    DELUXE: {
      label: 'Phòng DELUXE',
      sub: 'Tối đa 6 mèo/phòng · 2 phòng (DELUXE-01 → DELUXE-02)',
      bar: 'bg-sky-400',
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

        {/* ── Thanh thống kê nhanh (bấm để lọc nhanh theo trạng thái) ── */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {[
            { key: 'empty',       label: 'Trống',   count: stats.empty || 0 },
            { key: 'available',   label: 'Còn chỗ', count: stats.available || 0 },
            { key: 'full',        label: 'Đầy',     count: stats.full || 0 },
            { key: 'maintenance', label: 'Bảo trì', count: stats.maintenance || 0 },
          ].map((s) => {
            const active = filterStatus === s.label;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setFilterStatus(active ? 'Tất cả' : s.label)}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                  active ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-100' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                title={active ? 'Bỏ lọc' : `Chỉ xem phòng ${s.label.toLowerCase()}`}
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_THEME[s.key].dot}`} />
                  {s.label}
                </span>
                <span className="text-lg font-extrabold text-gray-800">{s.count}</span>
              </button>
            );
          })}
          <div className="col-span-2 sm:col-span-1 flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="text-xs font-semibold text-gray-500">Tổng</span>
            <span className="text-lg font-extrabold text-gray-800">{ROOM_CONFIG.length} <span className="text-xs font-semibold text-gray-400">phòng</span></span>
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
                flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all
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
              const dotKey = { 'Trống': 'empty', 'Còn chỗ': 'available', 'Đầy': 'full', 'Bảo trì': 'maintenance' }[s];
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {dotKey && <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-white' : STATUS_THEME[dotKey].dot}`} />}
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
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                  <h2 className="flex items-center gap-2 font-extrabold text-base text-gray-800">
                    <span className={`h-4 w-1 rounded-full ${meta.bar}`} />
                    {meta.label}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">{rooms.length} phòng</span>
                  </h2>
                  <span className="text-xs text-gray-400">{meta.sub}</span>
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
                      now={now}
                      onDepositWarn={handleDepositWarn}
                      onDepositCancel={handleDepositCancel}
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
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Chú thích:</span>
          {[
            { color: STATUS_THEME.empty.dot,       label: 'Trống — 0 mèo' },
            { color: STATUS_THEME.available.dot,   label: 'Còn chỗ — Có khách, chưa đầy (nhấp mã đơn để xem)' },
            { color: STATUS_THEME.full.dot,        label: 'Đầy — Hết chỗ (nhấp mã đơn để xem)' },
            { color: STATUS_THEME.maintenance.dot, label: 'Bảo trì — Tạm khóa' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
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
    {depositAction && (
      <DepositOverdueDialog
        action={depositAction}
        onClose={() => setDepositAction(null)}
        onMarkWarned={(roomId, code) => {
          updateBooking(roomId, code, { depositWarnedAt: new Date().toISOString() });
          setDepositAction(null);
        }}
        onConfirmCancel={(roomId, code) => {
          removeBooking(roomId, code, `Quá ${DEPOSIT_DEADLINE_HOURS} giờ chưa chuyển tiền cọc`);
          setDepositAction(null);
        }}
      />
    )}
  </>);
};

export default RoomStatusPage;
