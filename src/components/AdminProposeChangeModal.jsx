import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, Send, ShieldAlert, Package } from 'lucide-react';
import {
  BOOKING_STATUS,
  PROPOSAL_TYPE,
  formatDateSingle,
  normalizeStatusValue,
} from '../utils/bookingStatus';
import { packagesList } from '../mockData/servicesData';
import { toast } from 'react-hot-toast';

const AdminProposeChangeModal = ({ isOpen, onClose, booking, onConfirm }) => {
  // Đổi lịch / Hủy chỉ áp dụng khi đơn chưa Check-in; đang lưu trú thì chỉ "Thay đổi đơn"
  const isUpcoming = normalizeStatusValue(booking?.status) === BOOKING_STATUS.UPCOMING;
  const [type, setType] = useState(isUpcoming ? PROPOSAL_TYPE.RESCHEDULE : PROPOSAL_TYPE.UPDATE);
  const [newCheckIn, setNewCheckIn] = useState(booking?.checkIn || '');
  const [newCheckOut, setNewCheckOut] = useState(booking?.checkOut || '');
  const [newPackageName, setNewPackageName] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen || !booking) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const currentPackageName = booking.selectedPackage?.name || booking.packages?.[0] || 'Chưa rõ';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === PROPOSAL_TYPE.UPDATE && !newPackageName && !note.trim()) {
      toast.error('Vui lòng chọn gói mới hoặc nhập nội dung thay đổi');
      return;
    }
    if (type === PROPOSAL_TYPE.RESCHEDULE) {
      if (!newCheckIn || !newCheckOut) {
        toast.error('Vui lòng chọn ngày nhận và trả phòng đề xuất');
        return;
      }
      if (new Date(newCheckIn) >= new Date(newCheckOut)) {
        toast.error('Ngày trả phòng đề xuất phải sau ngày nhận ít nhất 1 ngày');
        return;
      }
    }
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do đề xuất gửi cho khách hàng');
      return;
    }

    const ok = onConfirm(booking.id, {
      type,
      newCheckIn: type === PROPOSAL_TYPE.RESCHEDULE ? newCheckIn : undefined,
      newCheckOut: type === PROPOSAL_TYPE.RESCHEDULE ? newCheckOut : undefined,
      newPackageName: type === PROPOSAL_TYPE.UPDATE ? newPackageName : undefined,
      note: type === PROPOSAL_TYPE.UPDATE ? note.trim() : undefined,
      reason,
    });
    if (ok !== false) onClose();
  };

  const petsName = (booking.petProfiles || []).map(p => p.name).join(', ') || 'Bé cưng';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Admin Workflow</span>
          </div>
          <h3 className="text-xl font-bold font-title">Đề Xuất Thay Đổi / Hủy Đơn</h3>
          <p className="text-xs text-slate-300 mt-1">
            Đơn #{booking.id} • Khách hàng: {booking.customerName || 'Khách'} ({booking.customerPhone || 'Chưa có SĐT'}) • Bé: {petsName}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Theo quy trình nghiệp vụ: Đơn hàng sẽ <strong>KHÔNG</strong> đổi ngay mà được chuyển sang trạng thái <strong>"Chờ khách xác nhận"</strong> và hệ thống tự động gửi thông báo tới tài khoản Khách hàng để họ bấm Đồng ý hoặc Từ chối.
            </span>
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Loại đề xuất gửi khách:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={!isUpcoming}
                onClick={() => setType(PROPOSAL_TYPE.RESCHEDULE)}
                className={`py-3 px-2 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  type === PROPOSAL_TYPE.RESCHEDULE
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Đổi lịch</span>
              </button>
              <button
                type="button"
                disabled={!isUpcoming}
                onClick={() => setType(PROPOSAL_TYPE.CANCEL)}
                className={`py-3 px-2 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  type === PROPOSAL_TYPE.CANCEL
                    ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Hủy đơn</span>
              </button>
              <button
                type="button"
                onClick={() => setType(PROPOSAL_TYPE.UPDATE)}
                className={`py-3 px-2 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === PROPOSAL_TYPE.UPDATE
                    ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Thay đổi đơn</span>
              </button>
            </div>
            {!isUpcoming && (
              <p className="text-[11px] text-gray-500 mt-1.5">Đơn đã Check-in nên chỉ có thể đề xuất thay đổi gói dịch vụ / nội dung đơn.</p>
            )}
          </div>

          {/* Update (thay đổi gói / nội dung đơn) inputs */}
          {type === PROPOSAL_TYPE.UPDATE && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="text-xs text-gray-500">
                Gói hiện tại: <strong className="text-gray-700">{currentPackageName}</strong>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Gói dịch vụ mới (không bắt buộc)</label>
                <select
                  value={newPackageName}
                  onChange={(e) => setNewPackageName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                >
                  <option value="">-- Giữ nguyên gói --</option>
                  {packagesList.filter(p => p.name !== currentPackageName).map(p => (
                    <option key={p.id || p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Nội dung thay đổi khác</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Tặng thêm 1 lần tắm sấy miễn phí"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Reschedule inputs */}
          {type === PROPOSAL_TYPE.RESCHEDULE && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">
                Lịch trình gốc: <strong className="text-gray-700">{formatDateSingle(booking.checkIn)} → {formatDateSingle(booking.checkOut)}</strong>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Ngày nhận mới</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={newCheckIn}
                    onChange={(e) => setNewCheckIn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Ngày trả mới</label>
                  <input
                    type="date"
                    min={newCheckIn || todayStr}
                    value={newCheckOut}
                    onChange={(e) => setNewCheckOut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reason input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Lý do đề xuất (Khách hàng sẽ nhìn thấy nội dung này) *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Phòng VIP đang bảo trì đèn UV khử khuẩn định kỳ, xin phép lùi lịch 2 ngày..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Gửi đề xuất tới khách hàng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProposeChangeModal;
