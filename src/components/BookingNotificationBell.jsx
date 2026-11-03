import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Send, CalendarClock, XCircle, MessageSquare, Settings, PencilLine, Wallet, Megaphone } from 'lucide-react';
import { useBookingHistory, isBookingOfCustomer } from '../contexts/BookingHistoryContext';
import { useCustomerProfile } from '../contexts/CustomerContext';
import { useUI } from '../contexts/UIContext';
import { PROPOSAL_LABEL, formatDateRange, isClosedStatus } from '../utils/bookingStatus';
import { PAYMENT_STATUS, depositToTransferOf } from '../utils/bookingDeposit';
import useMarketingInbox from '../hooks/useMarketingInbox';
import { trackInboxClick } from '../services/marketingApi';

const RECENT_MS = 24 * 60 * 60 * 1000;
const isRecent = (iso) => iso && Date.now() - new Date(iso).getTime() < RECENT_MS;

/**
 * Chuông thông báo đơn đặt — dữ liệu lấy trực tiếp từ đơn đặt nên đồng bộ giữa mọi thiết bị:
 * - Khách: các đề xuất Admin gửi đang chờ khách xác nhận (bấm để mở modal Đồng ý / Từ chối)
 * - Admin: đề xuất đang chờ khách + thay đổi khách vừa thực hiện trong 24h
 */
const BookingNotificationBell = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { globalBookingList } = useBookingHistory();
  const { authenticatedCustomer, customerProfile, isAdmin } = useCustomerProfile();
  const { openApprovalModal } = useUI();
  // Tin Admin gửi qua Marketing tự động (Web Push) cũng được lưu ở đây cho khách xem lại
  const inbox = useMarketingInbox(!isAdmin ? authenticatedCustomer?.id : null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = useMemo(() => {
    const activeCustomer = authenticatedCustomer || customerProfile;
    const mine = isAdmin
      ? globalBookingList
      : globalBookingList.filter(b => !activeCustomer || isBookingOfCustomer(b, activeCustomer, false));

    const list = [];
    mine.forEach((b) => {
      const changes = b.pending_changes;
      if (changes) {
        const label = PROPOSAL_LABEL[changes.type] || 'Thay đổi';
        list.push({
          key: `pending-${b.id}`,
          bookingId: b.id,
          icon: Send,
          tone: 'bg-purple-100 text-purple-600',
          title: isAdmin
            ? `Đơn #${b.id}: chờ khách xác nhận ${label.toLowerCase()}`
            : `Admin đề xuất ${label.toLowerCase()} đơn #${b.id}`,
          desc: changes.reason || 'Vui lòng xem và xác nhận.',
          time: changes.timestamp,
          actionable: !isAdmin,
        });
      }
      // Khách sửa đơn xong cần cọc thêm: nhắc tới khi chuyển đủ (mã đặt phòng vẫn giữ nguyên)
      if (!isAdmin && b.paymentStatus === PAYMENT_STATUS.AWAITING_TOP_UP && !isClosedStatus(b.status)) {
        list.push({
          key: `topup-${b.id}`,
          bookingId: b.id,
          icon: Wallet,
          tone: 'bg-amber-100 text-amber-600',
          title: `Đơn #${b.id} cần cọc bổ sung ${depositToTransferOf(b).toLocaleString('vi-VN')}đ`,
          desc: `Nội dung chuyển khoản: COC ${b.code || b.id}`,
          time: b.editedAt,
          reminder: true,
        });
      }
      if (!isAdmin) return;
      if (b.cancelledBy === 'customer' && isRecent(b.cancelledAt)) {
        list.push({
          key: `cancel-${b.id}`,
          bookingId: b.id,
          icon: XCircle,
          tone: 'bg-rose-100 text-rose-600',
          title: `Khách đã hủy đơn #${b.id}`,
          desc: b.cancelReason || '',
          time: b.cancelledAt,
        });
      }
      if (isRecent(b.editedAt)) {
        list.push({
          key: `edit-${b.id}`,
          bookingId: b.id,
          icon: PencilLine,
          tone: 'bg-orange-100 text-orange-600',
          title: `Khách đã chỉnh sửa đơn #${b.id}`,
          desc: b.lastEditSummary || '',
          time: b.editedAt,
        });
      }
      // Đổi lịch trong lúc chỉnh sửa đơn đã nằm trong thông báo chỉnh sửa ở trên
      if (isRecent(b.rescheduledAt) && b.rescheduledAt !== b.editedAt) {
        list.push({
          key: `reschedule-${b.id}`,
          bookingId: b.id,
          icon: CalendarClock,
          tone: 'bg-amber-100 text-amber-600',
          title: `Đơn #${b.id} đã đổi lịch`,
          desc: formatDateRange(b.checkIn, b.checkOut),
          time: b.rescheduledAt,
        });
      }
      if (isRecent(b.noteUpdatedAt) && b.specialNote) {
        list.push({
          key: `note-${b.id}`,
          bookingId: b.id,
          icon: MessageSquare,
          tone: 'bg-sky-100 text-sky-600',
          title: `Khách gửi yêu cầu đặc biệt cho đơn #${b.id}`,
          desc: b.specialNote,
          time: b.noteUpdatedAt,
        });
      }
    });
    if (!isAdmin) {
      inbox.messages.forEach((m) => {
        list.push({
          key: `mkt-${m.id}`,
          messageId: m.id,
          url: m.url,
          icon: Megaphone,
          tone: 'bg-emerald-100 text-emerald-600',
          title: m.title || 'Thông báo từ Mèo Vắng Nhà',
          desc: m.body,
          time: m.createdAt,
          unread: inbox.isUnread(m),
        });
      });
    }
    return list.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  }, [globalBookingList, authenticatedCustomer, customerProfile, isAdmin, inbox.messages, inbox.isUnread]);

  // Mở chuông thì tin Marketing đang hiện được tính là đã xem (lần sau không đếm trên chấm đỏ nữa)
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(inbox.markAllSeen, 1500);
    return () => clearTimeout(t);
  }, [open, inbox.markAllSeen]);

  const actionableCount = items.filter(i => i.actionable).length;
  const badgeCount = isAdmin ? items.length : items.filter(i => i.actionable || i.reminder || i.unread).length;
  const bookingPath = location.pathname.startsWith('/admin') ? '/admin/my-booking' : '/my-booking';

  const handleItemClick = (item) => {
    setOpen(false);
    if (item.messageId) {
      trackInboxClick(item.messageId);
      navigate(item.url || '/');
      return;
    }
    if (item.actionable) openApprovalModal(item.bookingId);
    navigate(bookingPath);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) inbox.refresh();
        }}
        className="relative hover:text-primary transition-colors p-2 rounded-full hover:bg-orange-50 cursor-pointer flex items-center justify-center"
        title="Thông báo đơn đặt"
        aria-label="Thông báo đơn đặt"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {badgeCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Thông báo đơn đặt</p>
            {actionableCount > 0 && (
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {actionableCount} cần xác nhận
              </span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">Chưa có thông báo mới.</p>
            ) : items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  data-testid={item.messageId ? 'inbox-marketing-item' : undefined}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition cursor-pointer ${item.actionable ? 'bg-purple-50/40' : item.unread ? 'bg-emerald-50/50' : ''}`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.tone}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-gray-800 leading-snug">{item.title}</span>
                    {item.desc && <span className="block text-[11px] text-gray-500 mt-0.5 line-clamp-2">{item.desc}</span>}
                    {item.actionable && <span className="block text-[11px] font-bold text-purple-700 mt-1">Bấm để xem & xác nhận →</span>}
                    {item.messageId && item.time && (
                      <span className="block text-[10px] text-gray-400 mt-1">
                        {new Date(item.time).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        {item.unread && <span className="ml-1.5 font-bold text-emerald-600">• Mới</span>}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {!isAdmin && (
            <Link
              to="/customer-profile?tab=notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-gray-100 text-[11px] font-semibold text-gray-500 hover:text-primary hover:bg-gray-50"
            >
              <Settings className="w-3.5 h-3.5" />
              Cài đặt thông báo Web Push
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingNotificationBell;
