import React from 'react';
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  ShieldAlert, 
  Sparkles,
  PawPrint,
  Package
} from 'lucide-react';
import { formatDateSingle } from '../utils/bookingStatus';

const CustomerApprovalModal = ({ isOpen, onClose, booking, onAccept, onReject }) => {
  if (!isOpen || !booking || !booking.pending_changes) return null;

  const changes = booking.pending_changes;
  const isReschedule = changes.type === 'RESCHEDULE';
  const isCancel = changes.type === 'CANCEL';
  const isUpdate = changes.type === 'UPDATE';

  const petsName = (booking.petProfiles || []).map(p => p.name).join(', ') || 'Bé cưng';

  // Nhân viên đặt phòng hộ tại cửa hàng: khách xác nhận thì đơn mới được ghi nhận
  if (changes.type === 'CONFIRM_BOOKING') {
    return (
      <ConfirmAssistedBooking booking={booking} petsName={petsName} onClose={onClose} onAccept={onAccept} onReject={onReject} />
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-purple-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Xác nhận đề xuất từ Admin</span>
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold font-title flex items-center gap-2">
            {isCancel ? (
              <>
                <ShieldAlert className="w-6 h-6 text-rose-300 shrink-0" />
                <span>Admin đề xuất HỦY ĐƠN ĐẶT</span>
              </>
            ) : isUpdate ? (
              <>
                <Package className="w-6 h-6 text-yellow-300 shrink-0" />
                <span>Admin đề xuất THAY ĐỔI ĐƠN</span>
              </>
            ) : (
              <>
                <Calendar className="w-6 h-6 text-yellow-300 shrink-0" />
                <span>Admin đề xuất ĐỔI LỊCH PHÒNG</span>
              </>
            )}
          </h2>
          <p className="text-purple-100 text-xs mt-1">
            Đơn đặt phòng: <strong className="text-white tracking-wider font-mono">#{booking.id}</strong> • Bé: <strong className="text-white">{petsName}</strong>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Alert Notice */}
          <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
            isCancel ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-purple-50 border-purple-200 text-purple-900'
          }`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isCancel ? 'text-rose-600' : 'text-purple-600'}`} />
            <div className="text-xs sm:text-sm leading-relaxed">
              <p className="font-bold mb-1">
                {isCancel 
                  ? 'Ban quản trị gửi yêu cầu hủy đơn đặt phòng này với lý do bên dưới.' 
                  : isUpdate
                    ? 'Ban quản trị gửi đề xuất thay đổi gói dịch vụ / nội dung đơn đặt của bé.'
                    : 'Ban quản trị gửi đề xuất điều chỉnh lịch check-in/check-out cho bé.'}
              </p>
              <p className="opacity-90">
                Vui lòng kiểm tra kỹ chi tiết. Nếu bạn <strong className="font-semibold underline">Đồng ý</strong>, hệ thống sẽ tự động cập nhật lại đơn. Nếu bạn <strong className="font-semibold underline">Từ chối</strong>, thông tin cũ sẽ được giữ nguyên 100%.
              </p>
            </div>
          </div>

          {/* Change Details */}
          {isReschedule && (
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-600" />
                So sánh lịch trình thay đổi:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lịch cũ */}
                <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-400 block uppercase">Lịch trình hiện tại</span>
                  <div className="mt-1 text-sm font-semibold text-gray-600 space-y-0.5">
                    <p>Nhận: <span className="line-through">{formatDateSingle(changes.oldCheckIn)}</span></p>
                    <p>Trả: <span className="line-through">{formatDateSingle(changes.oldCheckOut)}</span></p>
                  </div>
                </div>

                {/* Lịch mới đề xuất */}
                <div className="bg-purple-50/70 p-3.5 rounded-xl border-2 border-purple-300">
                  <span className="text-[11px] font-bold text-purple-700 block uppercase flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-purple-600" /> Lịch đề xuất mới
                  </span>
                  <div className="mt-1 text-sm font-black text-purple-900 space-y-0.5">
                    <p>Nhận: <span className="text-purple-700">{formatDateSingle(changes.newCheckIn)}</span></p>
                    <p>Trả: <span className="text-purple-700">{formatDateSingle(changes.newCheckOut)}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isUpdate && (
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-2 text-sm">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-purple-600" />
                Nội dung thay đổi:
              </h4>
              {changes.newPackageName && (
                <p className="font-semibold text-gray-700">
                  Gói dịch vụ: <span className="line-through text-gray-400">{changes.oldPackageName || 'Gói hiện tại'}</span>
                  <ArrowRight className="inline w-3.5 h-3.5 mx-1 text-purple-600" />
                  <span className="font-black text-purple-800">{changes.newPackageName}</span>
                </p>
              )}
              {changes.note && <p className="text-gray-700">• {changes.note}</p>}
            </div>
          )}

          {/* Reason from Admin */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              Lý do từ Ban Quản Trị (Admin):
            </h4>
            <p className="text-sm text-gray-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-amber-100">
              "{changes.reason || 'Thay đổi theo quy trình điều phối phòng tại khách sạn.'}"
            </p>
          </div>

          <div className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Thời gian Admin gửi yêu cầu: {new Date(changes.timestamp || Date.now()).toLocaleString('vi-VN')}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 items-center justify-end">
          <button
            onClick={() => {
              onReject(booking.id);
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl border-2 border-gray-300 hover:border-rose-400 text-gray-700 hover:text-rose-600 hover:bg-rose-50 font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Từ chối yêu cầu</span>
          </button>

          <button
            onClick={() => {
              if (onAccept(booking.id) !== false) onClose();
            }}
            className={`w-full sm:w-auto px-7 py-3 rounded-2xl text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              isCancel
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-300'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCancel ? 'Đồng ý hủy đơn' : isUpdate ? 'Xác nhận & Đồng ý thay đổi' : 'Xác nhận & Đồng ý đổi lịch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const money = (n) => `${(Number(n) || 0).toLocaleString('vi-VN')}đ`;

const ConfirmAssistedBooking = ({ booking, petsName, onClose, onAccept, onReject }) => {
  const changes = booking.pending_changes;
  const packages = booking.packages?.length ? booking.packages.join(' + ') : (booking.selectedPackage?.name || '');
  const rows = [
    ['Phòng', booking.roomId || booking.selectedRoom?.id],
    ['Thời gian', `${formatDateSingle(booking.checkIn)} → ${formatDateSingle(booking.checkOut)}`],
    ['Bé mèo', `${petsName}${booking.cats ? ` (${booking.cats} bé)` : ''}`],
    ['Gói dịch vụ', packages],
    ['Tổng tiền', money(booking.totalPrice ?? booking.totalAmount)],
  ].filter(([, v]) => v);
  const dueText = changes.dueAt ? new Date(changes.dueAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-sky-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid="confirm-assisted-booking"
      >
        <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white p-6 relative shrink-0">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center" title="Đóng">
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Đơn nhân viên đặt giúp bạn</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold font-title">Xác nhận đơn đặt phòng</h2>
          <p className="text-sky-100 text-xs mt-1">
            Mã đơn: <strong className="text-white font-mono tracking-wider">#{booking.id}</strong>
            {changes.staffName ? <> • Nhân viên: <strong className="text-white">{changes.staffName}</strong></> : null}
          </p>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-sm text-gray-700 leading-relaxed">
            Nhân viên Mèo Vắng Nhà đã tạo đơn này cho bạn tại cửa hàng. Vui lòng kiểm tra thông tin bên dưới. Đơn chỉ được ghi nhận sau khi bạn bấm <strong>Xác nhận</strong>.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-bold text-gray-800 text-right">{value}</span>
              </div>
            ))}
          </div>
          {dueText && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Vui lòng xác nhận trước {dueText}, quá hạn đơn có thể bị hủy để nhường phòng.
            </p>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 items-center justify-end shrink-0">
          <button
            onClick={() => { onReject(booking.id); onClose(); }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl border-2 border-gray-300 hover:border-rose-400 text-gray-700 hover:text-rose-600 hover:bg-rose-50 font-bold text-sm flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Không phải đơn của tôi</span>
          </button>
          <button
            onClick={() => { if (onAccept(booking.id) !== false) onClose(); }}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-300 flex items-center justify-center gap-2 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác nhận đơn</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerApprovalModal;
