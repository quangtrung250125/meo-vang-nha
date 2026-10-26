import React, { useState } from 'react';
import { X, AlertTriangle, XCircle } from 'lucide-react';

const CustomerCancelModal = ({ isOpen, onClose, booking, onConfirm }) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !booking) return null;

  const handleCancel = (e) => {
    e.preventDefault();
    if (onConfirm(booking.id, reason || 'Khách hàng yêu cầu hủy đơn') !== false) onClose();
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
        <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <h3 className="text-xl font-bold font-title">Xác Nhận Hủy Đơn Đặt</h3>
          </div>
          <p className="text-xs text-rose-100">
            Đơn #{booking.id} • Dành cho bé {petsName}
          </p>
        </div>

        <form onSubmit={handleCancel} className="p-6 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Bạn có chắc chắn muốn hủy đơn đặt phòng cho bé <strong className="text-text-dark">{petsName}</strong>? Hành động này sẽ chuyển trạng thái đơn sang <strong className="text-rose-600">Đã hủy</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Lý do hủy đơn (tùy chọn)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Thay đổi lịch công tác, gia đình có người chăm sóc..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
            >
              Giữ lại đơn
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-300 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Xác nhận hủy đơn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerCancelModal;
