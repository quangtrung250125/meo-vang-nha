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
  const safeValue = Number(value) || 1;

  const handleManualChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(1);
      return;
    }

    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      onChange(parsed);
    }
  };

  const handleAdd = () => {
    const next = Math.min(3, safeValue + 1);
    onChange(next);
  };

  const handleSubtract = () => {
    const next = Math.max(1, safeValue - 1);
    onChange(next);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-text-dark mb-3">Số lượng mèo</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubtract}
          className="w-10 h-10 rounded-full border border-primary bg-white text-primary font-bold text-lg hover:bg-primary hover:text-white transition-colors"
        >
          −
        </button>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-light border-2 border-primary rounded-full min-w-[120px] justify-center">
          <PawIcon className="h-4 w-4 text-primary" />
          <input
            type="number"
            min={1}
            step={1}
            value={safeValue}
            onChange={handleManualChange}
            className="w-14 bg-transparent text-center text-primary font-bold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Số lượng mèo"
          />
          <span className="text-primary font-bold text-sm">bé</span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={safeValue >= 3}
          className="w-10 h-10 rounded-full border border-primary bg-white text-primary font-bold text-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Tăng số lượng bé tối đa 3"
        >
          +
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">Bạn gửi trên 3 bé, hãy nhập số lượng bé muốn gửi vào ô nhé!</p>
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
  const { getRoomAvailability, bookings } = useRoomState();

  // Kiểm tra nếu ngày check-in là Thứ 5 (getDay() === 4)
  const isThursdayCheckIn = () => {
    if (!data.checkIn) return false;
    const d = new Date(data.checkIn + 'T00:00:00');
    return d.getDay() === 4;
  };
  const thursdayPromo = isThursdayCheckIn();

  const parseDateOnly = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Cập nhật trạng thái phòng Realtime nếu có khách khác vừa đặt
  useEffect(() => {
    if (availableGroups && data.checkIn && data.checkOut) {
      const updatedGroups = getRoomAvailability(data.catCount || 1, data.checkIn, data.checkOut);
      setAvailableGroups(updatedGroups);

      if (data.selectedRoom) {
        const roomStillFree = updatedGroups?.some((g) =>
          g.rooms.some((r) => r.id === data.selectedRoom.id && !r.isBooked)
        );
        if (!roomStillFree) {
          updateData({ selectedRoom: null });
          setError(`Phòng ${data.selectedRoom.id} vừa được khách khác đặt. Vui lòng chọn phòng khác!`);
        }
      }
    }
  }, [bookings, data.catCount, data.checkIn, data.checkOut]);

  const handleCheckRoom = () => {
    if (!data.checkIn || !data.checkOut) {
      setError('Vui lòng chọn ngày gửi và ngày đón.');
      return;
    }

    if (parseDateOnly(data.checkOut) <= parseDateOnly(data.checkIn)) {
      setError('Ngày đón bé phải sau ngày gửi bé.');
      return;
    }

    setError('');
    setIsChecking(true);

    // Mô phỏng delay network 500ms để UX mượt mà hơn
    setTimeout(() => {
      const groups = getRoomAvailability(data.catCount || 1, data.checkIn, data.checkOut);
      setIsChecking(false);
      const hasAnyFree = groups && groups.some((g) => g.rooms.some((r) => !r.isBooked));
      if (!groups || groups.length === 0 || !hasAnyFree) {
        setNoRooms(true);
        setAvailableGroups(null);
        updateData({ selectedRoom: null });
      } else {
        setNoRooms(false);
        setAvailableGroups(groups);
      }
    }, 500);
  };

  const handleNextClick = () => {
    if (!data.checkIn || !data.checkOut) {
      setError('Vui lòng chọn ngày gửi và ngày đón.');
      return;
    }

    if (parseDateOnly(data.checkOut) <= parseDateOnly(data.checkIn)) {
      setError('Ngày đón bé phải sau ngày gửi bé.');
      return;
    }

    if (!data.selectedRoom) {
      setError('Vui lòng chọn phòng hợp lệ trước khi tiếp tục.');
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
          <label className="block text-sm font-semibold text-text-dark mb-2">Ngày gửi bé</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-600"
            value={data.checkIn}
            onChange={(e) => {
              const nextCheckIn = e.target.value;
              updateData({ checkIn: nextCheckIn, selectedRoom: null });
              if (data.checkOut && parseDateOnly(data.checkOut) <= parseDateOnly(nextCheckIn)) {
                setError('Ngày đón bé phải sau ngày gửi bé.');
              } else {
                setError('');
              }
              resetRoomCheck();
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">Ngày đón bé</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-600"
            value={data.checkOut}
            onChange={(e) => {
              const nextCheckOut = e.target.value;
              updateData({ checkOut: nextCheckOut, selectedRoom: null });
              if (data.checkIn && parseDateOnly(nextCheckOut) <= parseDateOnly(data.checkIn)) {
                setError('Ngày đón bé phải sau ngày gửi bé.');
              } else {
                setError('');
              }
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
                    const isFull = room.isBooked || room.remaining <= 0;

                    if (isFull) {
                      return (
                        <div
                          key={room.id}
                          title="Phòng đã có khách đặt trong khoảng thời gian này"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50/70 text-gray-400 cursor-not-allowed text-sm select-none"
                        >
                          <span className="font-bold line-through text-gray-500">{room.id}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-600">
                            Đã kín lịch
                          </span>
                        </div>
                      );
                    }

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
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Còn trống
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
