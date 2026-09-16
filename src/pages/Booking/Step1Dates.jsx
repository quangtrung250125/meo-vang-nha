import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Clock } from 'lucide-react';

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
   Main Step 1 Component
------------------------------------------------ */
const Step1Dates = ({ data, updateData, onNext }) => {
  const [error, setError] = useState('');
  const [availableRooms, setAvailableRooms] = useState(null);
  const [noRooms, setNoRooms] = useState(false);

  const handleCheckRoom = () => {
    if (!data.checkIn || !data.checkOut) {
      setError('Vui lòng chọn ngày nhận và ngày trả.');
      return;
    }
    setError('');

    const isAvailable = Math.random() > 0.2;
    if (isAvailable) {
      setNoRooms(false);
      setAvailableRooms([
        { id: 'R1', name: 'Phòng Tiêu Chuẩn 1', capacity: '2/4', status: 'Còn trống' },
        { id: 'R2', name: 'Phòng Cao Cấp 2', capacity: '1/2', status: 'Còn trống' },
        { id: 'R3', name: 'Phòng VIP 1', capacity: '0/2', status: 'Còn trống' },
      ]);
    } else {
      setNoRooms(true);
      setAvailableRooms(null);
      updateData({ selectedRoom: null });
    }
  };

  const handleNextClick = () => {
    if (!data.checkIn || !data.checkOut || !data.selectedRoom) {
      setError('Vui lòng chọn ngày và phòng hợp lệ trước khi tiếp tục.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-text-dark font-title">1. Chọn thời gian &amp; Phòng</h2>

      {/* Date & Time Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check-in Group */}
        <div className="bg-bg-cream/70 border border-gray-200/80 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <Calendar className="w-5 h-5" />
            <span>Thông tin nhận mèo (Check-in)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ngày nhận *</label>
              <input
                type="date"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary text-gray-700 font-medium"
                value={data.checkIn}
                onChange={(e) => {
                  updateData({ checkIn: e.target.value, selectedRoom: null });
                  setAvailableRooms(null);
                  setNoRooms(false);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Giờ nhận *</span>
              </label>
              <input
                type="time"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary text-gray-700 font-medium"
                value={data.checkInTime || '09:00'}
                onChange={(e) => {
                  updateData({ checkInTime: e.target.value });
                }}
              />
            </div>
          </div>
        </div>

        {/* Check-out Group */}
        <div className="bg-bg-cream/70 border border-gray-200/80 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <Calendar className="w-5 h-5" />
            <span>Thông tin trả mèo (Check-out)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ngày trả *</label>
              <input
                type="date"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary text-gray-700 font-medium"
                value={data.checkOut}
                min={data.checkIn}
                onChange={(e) => {
                  updateData({ checkOut: e.target.value, selectedRoom: null });
                  setAvailableRooms(null);
                  setNoRooms(false);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Giờ trả *</span>
              </label>
              <input
                type="time"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary text-gray-700 font-medium"
                value={data.checkOutTime || '18:00'}
                onChange={(e) => {
                  updateData({ checkOutTime: e.target.value });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Note about working hours */}
      <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50/80 border border-orange-200/60 px-4 py-3 rounded-xl">
        <Clock className="w-4 h-4 text-primary flex-shrink-0" />
        <span>Khung giờ tiếp nhận &amp; đón trả bé mèo: <strong>08:00 - 20:00</strong> các ngày trong tuần.</span>
      </div>

      {/* Cat Count Picker */}
      <CatCountPicker
        value={data.catCount}
        onChange={(num) => {
          updateData({ catCount: num, selectedRoom: null });
          setAvailableRooms(null);
          setNoRooms(false);
        }}
      />

      {/* Check Room Action */}
      {!availableRooms && !noRooms && (
        <button
          onClick={handleCheckRoom}
          className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30 mt-4"
        >
          Kiểm tra phòng trống
        </button>
      )}

      {/* No Rooms */}
      {noRooms && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium mb-4">Rất tiếc, cửa hàng không còn phòng trong thời gian này.</p>
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

      {/* Available Rooms */}
      {availableRooms && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-bold text-text-dark">Phòng có sẵn:</h3>
          <div className="grid gap-3">
            {availableRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => updateData({ selectedRoom: room })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  data.selectedRoom?.id === room.id
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-100 bg-bg-cream hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-text-dark">{room.name}</span>
                  <span className="text-sm text-gray-500">Sức chứa: {room.capacity}</span>
                </div>
              </div>
            ))}
          </div>
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
