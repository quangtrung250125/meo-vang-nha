import React, { useState, useRef, useEffect } from 'react';
import { Plus, Gift, Search, CheckCircle2, RefreshCw } from 'lucide-react';
import { useRoomState } from '../../contexts/RoomStateContext';


/* ------------------------------------------------
   Paw Icon SVG
------------------------------------------------ */
const PawIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="5.5" cy="6.5" rx="2.5" ry="3" />
    <ellipse cx="10" cy="4" rx="2" ry="2.5" />
    <ellipse cx="14.5" cy="4" rx="2" ry="2.5" />
    <ellipse cx="19" cy="6.5" rx="2.5" ry="3" />
    <path d="M12 8.5c-4 0-7 2.5-7 6.5 0 3 2 5 7 5s7-2 7-5c0-4-3-6.5-7-6.5z" />
  </svg>
);

/* ------------------------------------------------
   Cat Count Picker Component
------------------------------------------------ */
const CatCountPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const popupRef = useRef(null);
  const selectedRef = useRef(null);
  const numbers = Array.from({ length: 100 }, (_, i) => i + 1);

  // Close popup on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Scroll to selected item when popup opens
  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [open]);

  const handleSelect = (num) => {
    onChange(num);
    setOpen(false);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-text-dark mb-3">Số lượng mèo</label>
      <div className="flex items-center gap-4">
        {/* Display current value */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-primary-light border-2 border-primary rounded-full">
          <PawIcon className="h-4 w-4 text-primary" />
          <span className="text-primary font-bold text-sm">
            {value ? `${value} bé` : 'Chưa chọn'}
          </span>
        </div>

        {/* Plus button */}
        <div className="relative" ref={popupRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            title="Chọn số lượng"
            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-primary bg-white text-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-sm"
          >
            <Plus className="h-5 w-5" />
          </button>

          {/* Popup */}
          {open && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-12 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
              style={{ width: 160 }}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-primary-light border-b border-primary/20 text-center">
                <span className="text-xs font-bold text-primary tracking-wide uppercase">Số lượng bé</span>
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
                {numbers.map((num) => {
                  const isSelected = value === num;
                  const isHov = hovered === num;
                  return (
                    <div
                      key={num}
                      ref={isSelected ? selectedRef : null}
                      onClick={() => handleSelect(num)}
                      onMouseEnter={() => setHovered(num)}
                      onMouseLeave={() => setHovered(null)}
                      className={`flex items-center justify-between px-4 py-2 cursor-pointer transition-all duration-100 select-none ${
                        isSelected
                          ? 'bg-primary text-white font-bold'
                          : isHov
                          ? 'bg-primary-light text-primary font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm">{num} bé</span>
                      {(isSelected || isHov) && (
                        <PawIcon className={`h-4 w-4 ml-2 flex-shrink-0 ${isSelected ? 'text-white' : 'text-primary'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <span className="text-xs text-gray-400">Cuộn để xem thêm</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------
   Config hạng phòng — badge & màu
------------------------------------------------ */
const TYPE_META = {
  VIP: {
    label: 'Hạng VIP',
    badgeBg: 'bg-orange-100 border-orange-300 text-orange-700',
    selectBg: 'border-orange-400 bg-orange-50',
    dot: 'bg-orange-400',
    capacityLabel: 'Tối đa 2 mèo/phòng',
  },
  VVIP: {
    label: 'Hạng VVIP',
    badgeBg: 'bg-purple-100 border-purple-300 text-purple-700',
    selectBg: 'border-purple-400 bg-purple-50',
    dot: 'bg-purple-400',
    capacityLabel: 'Tối đa 4 mèo/phòng',
  },
  DELUXE: {
    label: 'Hạng DELUXE',
    badgeBg: 'bg-sky-100 border-sky-300 text-sky-700',
    selectBg: 'border-sky-400 bg-sky-50',
    dot: 'bg-sky-400',
    capacityLabel: 'Tối đa 6 mèo/phòng',
  },
};

/* ------------------------------------------------
   Main Step 1 Component
------------------------------------------------ */
const Step1Dates = ({ data, updateData, onNext }) => {
  const [error, setError] = useState('');
  const [availableGroups, setAvailableGroups] = useState(null); // nhóm theo hạng
  const [noRooms, setNoRooms] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Kết nối với shared RoomStateContext
  const { getRoomAvailability } = useRoomState();

  // Kiểm tra nếu ngày check-in là Thứ 5 (getDay() === 4)
  const isThursdayCheckIn = () => {
    if (!data.checkIn) return false;
    const d = new Date(data.checkIn + 'T00:00:00');
    return d.getDay() === 4;
  };
  const thursdayPromo = isThursdayCheckIn();

  const handleCheckRoom = () => {
    if (!data.checkIn || !data.checkOut) {
      setError('Vui lòng chọn ngày nhận và ngày trả.');
      return;
    }
    setError('');
    setIsChecking(true);

    // Mô phỏng delay network 600ms để UX mượt mà hơn
    setTimeout(() => {
      const groups = getRoomAvailability(data.catCount || 1);
      setIsChecking(false);
      if (!groups || groups.length === 0) {
        setNoRooms(true);
        setAvailableGroups(null);
        updateData({ selectedRoom: null });
      } else {
        setNoRooms(false);
        setAvailableGroups(groups);
      }
    }, 600);
  };

  const handleNextClick = () => {
    if (!data.checkIn || !data.checkOut || !data.selectedRoom) {
      setError('Vui lòng chọn ngày và phòng hợp lệ trước khi tiếp tục.');
      return;
    }
    onNext();
  };

  const resetRoomCheck = () => {
    setAvailableGroups(null);
    setNoRooms(false);
    updateData({ selectedRoom: null });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-text-dark font-title">1. Chọn thời gian &amp; Phòng</h2>

      {/* Date Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">Ngày nhận</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-600"
            value={data.checkIn}
            onChange={(e) => {
              updateData({ checkIn: e.target.value, selectedRoom: null });
              resetRoomCheck();
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">Ngày trả</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-600"
            value={data.checkOut}
            min={data.checkIn}
            onChange={(e) => {
              updateData({ checkOut: e.target.value, selectedRoom: null });
              resetRoomCheck();
            }}
          />
        </div>
      </div>

      {/* Thursday Promo Banner */}
      {thursdayPromo && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-amber-800 text-sm">🎉 Ưu đãi Thứ 5 — Tặng Pate Miễn Phí!</p>
            <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
              Check-in vào <strong>Thứ 5</strong>, các bé mèo được tặng <strong>pate theo sở thích riêng</strong> hoàn toàn miễn phí!
              Hãy cập nhật sở thích pate trong hồ sơ của từng bé ở bước 3.
            </p>
          </div>
        </div>
      )}

      {/* Cat Count Picker */}
      <CatCountPicker
        value={data.catCount}
        onChange={(num) => {
          updateData({ catCount: num, selectedRoom: null });
          resetRoomCheck();
        }}
      />

      {/* Check Room Action */}
      {!availableGroups && !noRooms && (
        <button
          onClick={handleCheckRoom}
          disabled={isChecking}
          className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30 mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Kiểm tra phòng trống
            </>
          )}
        </button>
      )}

      {/* No Rooms */}
      {noRooms && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium mb-4">Rất tiếc, cửa hàng không còn phòng phù hợp trong thời gian này.</p>
          <button
            onClick={() => {
              updateData({ checkIn: '', checkOut: '' });
              setNoRooms(false);
            }}
            className="px-6 py-2 bg-white border border-gray-300 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Chọn ngày khác
          </button>
        </div>
      )}

      {/* ── Available Rooms grouped by type ── */}
      {availableGroups && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-text-dark flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Phòng có sẵn:
            </h3>
            <button
              onClick={resetRoomCheck}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              Kiểm tra lại
            </button>
          </div>

          {availableGroups.map(({ type, rooms }) => {
            const meta = TYPE_META[type] || TYPE_META.VIP;
            return (
              <div key={type} className="space-y-2">
                {/* Tiêu đề hạng */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${meta.badgeBg}`}>
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                  <span className="opacity-60">— {meta.capacityLabel}</span>
                </div>

                {/* Danh sách phòng trong hạng: độ rộng vừa đủ chứa tên phòng & số chỗ còn trống */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {rooms.map((room) => {
                    const isSelected = data.selectedRoom?.id === room.id;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => updateData({ selectedRoom: room })}
                        className={`
                          inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all duration-200 text-sm
                          ${isSelected
                            ? `${meta.selectBg} shadow-sm ring-2 ring-primary/20`
                            : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-orange-50/20 text-gray-700'}
                        `}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                        <span className="font-bold text-text-dark">{room.id}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                          Còn {room.remaining}/{room.capacity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Validation Error */}
      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      {/* Next Button */}
      <div className="pt-6 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleNextClick}
          className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
};

export default Step1Dates;
