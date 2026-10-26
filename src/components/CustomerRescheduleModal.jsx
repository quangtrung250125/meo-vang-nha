import React, { useState } from 'react';
import { X, Calendar, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { formatDateSingle } from '../utils/bookingStatus';
import { toast } from 'react-hot-toast';

const CustomerRescheduleModal = ({ isOpen, onClose, booking, onConfirm }) => {
  const [newCheckIn, setNewCheckIn] = useState(booking?.checkIn || '');
  const [newCheckOut, setNewCheckOut] = useState(booking?.checkOut || '');

  if (!isOpen || !booking) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCheckIn || !newCheckOut) {
      toast.error('Vui lòng chọn đầy đủ ngày nhận và trả phòng');
      return;
    }
    if (new Date(newCheckIn) >= new Date(newCheckOut)) {
      toast.error('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày');
      return;
    }

    // Giữ modal mở nếu đổi lịch thất bại (VD: phòng đã kín chỗ ngày mới)
    if (onConfirm(booking.id, { newCheckIn, newCheckOut }) !== false) onClose();
  };

  const petsName = (booking.petProfiles || []).map(p => p.name).join(', ') || 'Bé cưng';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-white" />
            <h3 className="text-xl font-bold font-title">Thay Đổi Lịch Đặt Phòng</h3>
          </div>
          <p className="text-xs text-amber-100">
            Đơn #{booking.id} • Dành cho bé {petsName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Quý khách chỉ có thể thay đổi ngày khi đơn ở trạng thái <strong>Sắp tới</strong> (chưa Check-in). Lịch mới sẽ được cập nhật trực tiếp.
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500">
            Lịch hiện tại: <strong className="text-gray-700">{formatDateSingle(booking.checkIn)} → {formatDateSingle(booking.checkOut)}</strong>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Ngày nhận phòng mới (Check-in)
            </label>
            <input
              type="date"
              min={todayStr}
              value={newCheckIn}
              onChange={(e) => setNewCheckIn(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Ngày trả phòng mới (Check-out)
            </label>
            <input
              type="date"
              min={newCheckIn || todayStr}
              value={newCheckOut}
              onChange={(e) => setNewCheckOut(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-md shadow-accent/25 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận đổi ngày</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerRescheduleModal;
