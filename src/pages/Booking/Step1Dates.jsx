import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

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
    
    // Simulate API call (80% chance of success)
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
      <h2 className="text-2xl font-bold text-text-dark font-title">1. Chọn thời gian & Phòng</h2>
      
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
              setAvailableRooms(null);
              setNoRooms(false);
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
              setAvailableRooms(null);
              setNoRooms(false);
            }}
          />
        </div>
      </div>

      {/* Cat Count */}
      <div>
        <label className="block text-sm font-semibold text-text-dark mb-3">Số lượng mèo</label>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((num) => (
            <label key={num} className={`cursor-pointer border ${data.catCount === num ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 hover:border-primary'} rounded-full px-5 py-2 transition-colors`}>
              <input 
                type="radio" 
                name="cats" 
                className="hidden" 
                checked={data.catCount === num}
                onChange={() => {
                  updateData({ catCount: num, selectedRoom: null });
                  setAvailableRooms(null);
                  setNoRooms(false);
                }} 
              />
              <span className="text-sm font-medium">{num} bé</span>
            </label>
          ))}
        </div>
      </div>

      {/* Check Room Action */}
      {!availableRooms && !noRooms && (
        <button 
          onClick={handleCheckRoom}
          className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30 mt-4"
        >
          Kiểm tra phòng trống
        </button>
      )}

      {/* Error/No Rooms */}
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

      {/* Available Rooms List */}
      {availableRooms && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-bold text-text-dark">Phòng có sẵn:</h3>
          <div className="grid gap-3">
            {availableRooms.map((room) => (
              <div 
                key={room.id}
                onClick={() => updateData({ selectedRoom: room })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${data.selectedRoom?.id === room.id ? 'border-primary bg-primary-light' : 'border-gray-100 bg-bg-cream hover:border-primary/50'}`}
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
