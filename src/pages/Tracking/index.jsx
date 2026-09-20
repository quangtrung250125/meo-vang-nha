import React, { useState } from 'react';
import {
  PawPrint, CalendarDays, Clock, Camera, CheckCircle2,
  AlertTriangle, ChevronRight, MessageCircle,
  Utensils, Droplets, Smile, HeartPulse, Sparkles,
  Loader2, ArrowRight, Home, Phone, Video,
  Package, Plus, ChevronDown, X, RefreshCw,
  Zap, Gift, Send, Bell, BellRing, Smartphone, Volume2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePetProfile } from '../../contexts/PetContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useCareLog } from '../../contexts/CareLogContext';
import PetDashboardNav from '../../components/PetDashboardNav';
import CustomerWelcomeModal from '../../components/CustomerWelcomeModal';
import CareLogTimeline from '../../components/CareLogTimeline';
import ServiceManagement, { ADDONS } from '../../components/ServiceManagement';
import { toast } from 'react-hot-toast';
import {
  getPermissionStatus,
  requestNotificationPermission,
  testPhoneNotification
} from '../../utils/notifications';
import cameraFeed from '../../assets/images/camera_feed.png';

// ─── Helpers ────────────────────────────────────────────────────────────────

const calculateStatus = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 'Chưa rõ';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const inDate = new Date(checkIn); inDate.setHours(0, 0, 0, 0);
  const outDate = new Date(checkOut); outDate.setHours(23, 59, 59, 999);
  if (today < inDate) return 'Sắp tới';
  if (today >= inDate && today <= outDate) return 'Đang lưu trú';
  return 'Đã hoàn tất';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const getDaysRemaining = (checkOut) => {
  if (!checkOut) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const out = new Date(checkOut); out.setHours(0, 0, 0, 0);
  const diff = Math.ceil((out - today) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

// ─── Mock Care Log Data ──────────────────────────────────────────────────────
// Khách hàng bây giờ dùng logs thực tế từ CareLogContext
const FALLBACK_LOGS = [];

// ─── Stepper Steps ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Đặt cọc giữ phòng', short: 'Đặt cọc', icon: '💳' },
  { id: 2, label: 'Check-in', short: 'Check-in', icon: '🏠' },
  { id: 3, label: 'Đang lưu trú & chăm sóc', short: 'Lưu trú', icon: '🐱' },
  { id: 4, label: 'Chuẩn bị check-out', short: 'Chuẩn bị', icon: '📦' },
  { id: 5, label: 'Bàn giao & thanh toán', short: 'Thanh toán', icon: '✅' },
];

// ─── Add-on Modals ───────────────────────────────────────────────────────────
// ADDONS is imported from ServiceManagement

// ─── Confirmation Modal ──────────────────────────────────────────────────────

const ConfirmModal = ({ addon, selectedOption, onConfirm, onClose }) => {
  if (!addon || !selectedOption) return null;
  const opt = ADDONS[addon].options.find(o => o.value === selectedOption);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-text-dark">Xác nhận yêu cầu</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="bg-[#F0FDF8] rounded-2xl p-4 mb-6 border border-primary/20">
          <p className="text-sm text-gray-600 mb-1 font-medium">{ADDONS[addon].title}</p>
          <p className="text-text-dark font-bold">{opt?.label}</p>
          {opt?.price !== 'Tư vấn' && (
            <p className="text-primary font-bold text-lg mt-1">{opt?.price}</p>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            {opt?.price === 'Tư vấn'
              ? 'Nhân viên sẽ liên hệ để tư vấn và xác nhận giá trước khi thực hiện.'
              : 'Phí dịch vụ sẽ được cộng vào hoá đơn thanh toán khi đón bé về.'}
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-secondary transition-colors shadow-lg shadow-primary/25"
          >
            Xác nhận yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Camera QR Modal ─────────────────────────────────────────────────────────

const CameraModal = ({ onClose, onConfirm, isVerifying }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
        <X className="w-4 h-4 text-gray-500" />
      </button>
      <h3 className="text-xl font-bold text-text-dark text-center mb-2">Thanh toán phí xem Camera</h3>
      <p className="text-gray-500 text-center mb-6 text-sm">Quét mã QR bên dưới để thanh toán và xem camera trực tiếp.</p>
      <div className="bg-gray-50 rounded-2xl p-4 flex justify-center mb-6 border border-gray-100">
        <img
          src="https://img.vietqr.io/image/mbbank-111122223333-compact2.png?amount=10000&addInfo=Thanh%20toan%20Camera%20Miu&accountName=MEO%20VANG%20NHA"
          alt="QR Code"
          className="w-48 h-48 object-contain"
        />
      </div>
      <p className="text-center font-bold text-accent text-2xl mb-8">10.000 VNĐ / ngày</p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onConfirm}
          disabled={isVerifying}
          className={`w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-secondary transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2 ${isVerifying ? 'opacity-80 cursor-wait' : ''}`}
        >
          {isVerifying && <Loader2 className="w-5 h-5 animate-spin" />}
          {isVerifying ? 'Đang kiểm tra giao dịch...' : 'Tôi đã chuyển khoản'}
        </button>
        <button onClick={onClose} disabled={isVerifying} className="w-full bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
          Hủy
        </button>
      </div>
    </div>
  </div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyState = ({ navigate }) => (
  <div className="flex flex-col items-center justify-center text-center py-20 px-4">
    <div className="relative mb-8">
      <div className="w-32 h-32 bg-gradient-to-br from-primary-light to-[#a7f3d0] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
        <PawPrint className="w-14 h-14 text-primary opacity-40" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-100">
        <span className="text-2xl">🐾</span>
      </div>
    </div>

    <h2 className="text-2xl font-extrabold text-text-dark font-title mb-3">
      Hiện không có mèo đang lưu trú
    </h2>
    <p className="text-gray-500 max-w-sm leading-relaxed mb-8">
      Khi bé mèo của bạn đang được chúng mình chăm sóc, mọi thông tin lưu trú, nhật ký chăm sóc và camera sẽ hiện tại đây.
    </p>

    <button
      onClick={() => navigate('/booking')}
      className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-secondary transition-all shadow-lg shadow-primary/30 active:scale-[0.98] cursor-pointer text-base"
    >
      <CalendarDays className="w-5 h-5" />
      Đặt lịch lưu trú
      <ArrowRight className="w-4 h-4" />
    </button>

    <p className="text-xs text-gray-400 mt-4">Chỉ mất vài phút để đặt lịch cho bé yêu!</p>
  </div>
);

// ─── Stepper ─────────────────────────────────────────────────────────────────

const Stepper = ({ currentStep = 3 }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
    <h3 className="font-bold text-text-dark mb-5 flex items-center gap-2">
      <Zap className="w-4 h-4 text-primary" />
      Hành trình lưu trú
    </h3>
    {/* Desktop stepper */}
    <div className="hidden md:flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isDone = step.id < currentStep;
        const isActive = step.id === currentStep;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-sm transition-all ${
                isDone
                  ? 'bg-primary text-white shadow-primary/30'
                  : isActive
                  ? 'bg-primary text-white ring-4 ring-primary/20 shadow-primary/30'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <span>{step.icon}</span>}
              </div>
              <p className={`text-xs font-semibold mt-2 text-center leading-tight max-w-[80px] ${
                isActive ? 'text-primary' : isDone ? 'text-gray-500' : 'text-gray-400'
              }`}>{step.label}</p>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-6 rounded-full transition-all ${isDone ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
    {/* Mobile stepper */}
    <div className="md:hidden space-y-3">
      {STEPS.map((step) => {
        const isDone = step.id < currentStep;
        const isActive = step.id === currentStep;
        return (
          <div key={step.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-primary-light/40 border border-primary/20' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              isDone ? 'bg-primary text-white' : isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span>{step.icon}</span>}
            </div>
            <span className={`text-sm font-semibold ${isActive ? 'text-primary' : isDone ? 'text-gray-500' : 'text-gray-400'}`}>
              {step.label}
            </span>
            {isActive && <span className="ml-auto text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">Hiện tại</span>}
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Care Log & Package Block are now imported ──────────────────────────────

// ─── Call Confirmation Modal ────────────────────────────────────────────────
const HOTLINE_NUMBER = '0904957555';
const HOTLINE_DISPLAY = '090 495 75 55';

const CallModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-secondary px-6 pt-8 pb-10 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          {/* Pulsing phone icon */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-white/25 rounded-full flex items-center justify-center ring-4 ring-white/30">
              <Phone className="w-9 h-9 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-white font-title mb-1">Gọi cho nhân viên</h2>
          <p className="text-white/80 text-sm">Mèo Vắng Nhà</p>
        </div>

        {/* Body */}
        <div className="-mt-6 bg-white rounded-t-3xl px-6 pt-6 pb-6">
          <p className="text-gray-500 text-center text-sm leading-relaxed mb-4">
            Bạn sẽ được kết nối trực tiếp với nhân viên chăm sóc để được hỗ trợ nhanh nhất.
          </p>

          {/* Hotline display */}
          <div className="bg-primary-light/50 border border-primary/20 rounded-2xl py-4 px-5 mb-6 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">Hotline hỗ trợ 24/7</p>
            <p className="text-3xl font-black text-primary tracking-wide">{HOTLINE_DISPLAY}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98] cursor-pointer text-base"
            >
              <Phone className="w-5 h-5" />
              Gọi ngay
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl transition-colors cursor-pointer text-sm"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Staff Chat Modal ────────────────────────────────────────────────────────
const StaffChatModal = ({ isOpen, onClose, onSend }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Chat với nhân viên</h3>
              <p className="text-white/80 text-xs mt-0.5">Mèo Vắng Nhà</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Top note in italics */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4 mb-4">
            <p className="italic text-emerald-900 text-xs sm:text-sm leading-relaxed">
              &ldquo;Những yêu cầu về dịch vụ khác với dịch vụ sẵn có sẽ được gửi tự động và thông báo tới nhân viên ngay sau khi gửi. Vui lòng chat ở phần bên dưới&rdquo;
            </p>
          </div>

          {/* Textarea container */}
          <div className="relative">
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập nội dung yêu cầu của bạn gửi tới nhân viên chăm sóc..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-2xl p-4 pb-14 text-sm text-gray-800 placeholder-gray-400 resize-none transition-all outline-none"
              autoFocus
            />

            {/* Green floating "Gửi" button at bottom right corner when user has typed text */}
            {text.trim().length > 0 && (
              <button
                onClick={handleSubmit}
                className="absolute bottom-3 right-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in-75 duration-200"
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TrackingPage = () => {
  const navigate = useNavigate();
  const { petList } = usePetProfile();
  const { globalBookingList, updateBooking } = useBookingHistory();
  const { customerProfile, saveCustomerProfile } = useCustomerProfile();

  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const handleCallConfirm = () => {
    setShowCallModal(false);
    window.location.href = `tel:${HOTLINE_NUMBER}`;
  };

  const handleSendMessage = (msg) => {
    setSuccessNotice(true);
    toast.success('Đã gửi tin nhắn thành công', { duration: 3000 });
    setTimeout(() => {
      setSuccessNotice(false);
    }, 3000);
  };

  const [isCameraUnlocked, setIsCameraUnlocked] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, addon: null, option: null });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() => getPermissionStatus());
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);

  const handleEnablePhoneNotif = async () => {
    try {
      const res = await requestNotificationPermission();
      setNotifPermission(res);
      if (res === 'granted') {
        toast.success('Đã bật thông báo về điện thoại thành công! 🔔');
        await testPhoneNotification(firstPet?.name || 'Miu');
      } else if (res === 'denied') {
        toast.error('Trình duyệt đang chặn thông báo. Vui lòng cho phép trong cài đặt trình duyệt.');
      }
    } catch (e) {
      toast.error('Lỗi khi kích hoạt: ' + e.message);
    }
  };

  const handleTestNotification = async () => {
    setIsSendingTestNotif(true);
    try {
      await testPhoneNotification(firstPet?.name || 'Miu');
      toast.success('Đã gửi thông báo thử về điện thoại! Hãy kiểm tra thanh thông báo 🔔');
      setNotifPermission('granted');
    } catch (err) {
      toast.error(err.message || 'Lỗi gửi thông báo');
    } finally {
      setIsSendingTestNotif(false);
    }
  };

  const isLoggedIn = Boolean(customerProfile);

  const handleAuthSubmit = (formData) => {
    saveCustomerProfile(formData);
    setIsAuthOpen(false);
    toast.success(`Chào mừng ${formData.fullName || 'bạn'}! 🐾`);
  };

  // Find active booking
  const activeBooking = globalBookingList.find(b => calculateStatus(b.checkIn, b.checkOut) === 'Đang lưu trú');

  const resolvedPets = activeBooking
    ? (activeBooking.petIds || []).map(id => petList.find(p => p.id === id)).filter(Boolean)
        .concat(activeBooking.petProfiles || []).filter((p, i, arr) => arr.findIndex(q => q.id === p.id) === i)
    : [];

  const daysRemaining = activeBooking ? getDaysRemaining(activeBooking.checkOut) : 0;
  const firstPet = resolvedPets[0];

  const handleCameraConfirm = () => {
    setIsVerifying(true);
    setTimeout(() => {
      toast.success('Thanh toán thành công! Camera đã được mở 🎉');
      setIsCameraUnlocked(true);
      setShowCameraModal(false);
      setIsVerifying(false);
    }, 2000);
  };

  const handleAddonRequest = (addonKey, option) => {
    setConfirmModal({ open: true, addon: addonKey, option });
  };

  const handleAddonConfirm = () => {
    const addon = ADDONS[confirmModal.addon];
    
    // Save to context
    if (activeBooking) {
      const newAddon = {
        id: Date.now().toString(),
        type: confirmModal.addon,
        option: confirmModal.option,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      updateBooking(activeBooking.id, {
        addons: [...(activeBooking.addons || []), newAddon]
      });
    }

    setConfirmModal({ open: false, addon: null, option: null });
    if (confirmModal.addon === 'play' || ADDONS[confirmModal.addon]?.options?.find(o => o.value === confirmModal.option)?.price === 'Tư vấn') {
      toast.success('Yêu cầu đã gửi! Nhân viên sẽ liên hệ sớm nhé 😊');
    } else {
      toast.success(`Yêu cầu "${addon.title}" đã gửi thành công! Phí sẽ cộng vào hoá đơn.`);
    }
  };

  // Login wall
  if (!isLoggedIn) {
    return (
      <>
        <div className="w-full min-h-screen bg-bg-cream flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            <div className="w-28 h-28 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
              <PawPrint className="w-12 h-12 text-primary opacity-40" />
            </div>
            <h1 className="text-3xl font-extrabold text-text-dark font-title mb-3">Theo Dõi Lưu Trú</h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              Đăng nhập để xem trạng thái lưu trú, nhật ký chăm sóc hàng ngày và camera trực tiếp của bé mèo.
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-primary/30 cursor-pointer"
            >
              Đăng nhập / Tạo hồ sơ
            </button>
          </div>
        </div>
        <CustomerWelcomeModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSubmit={handleAuthSubmit} />
      </>
    );
  }

  return (
    <div className="w-full min-h-screen bg-bg-cream pb-16">
      {/* Modals */}
      {showCameraModal && (
        <CameraModal
          onClose={() => !isVerifying && setShowCameraModal(false)}
          onConfirm={handleCameraConfirm}
          isVerifying={isVerifying}
        />
      )}
      {confirmModal.open && (
        <ConfirmModal
          addon={confirmModal.addon}
          selectedOption={confirmModal.option}
          onConfirm={handleAddonConfirm}
          onClose={() => setConfirmModal({ open: false, addon: null, option: null })}
        />
      )}
      {/* Call Confirmation Modal */}
      <CallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        onConfirm={handleCallConfirm}
      />

      {/* Staff Chat Modal */}
      <StaffChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        onSend={handleSendMessage}
      />

      {/* ── Top Success Notification Banner (3 seconds) ── */}
      {successNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md border-2 border-emerald-500 text-emerald-950 px-6 py-3.5 rounded-2xl shadow-2xl shadow-emerald-900/15 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-bold text-sm text-gray-800">Đã gửi tin nhắn thành công</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
        {/* Navigation */}
        <PetDashboardNav
          title="Theo dõi lưu trú"
          subtitle="Cập nhật tình hình bé mèo trong suốt thời gian lưu trú."
        />

        {/* ── Phone Notification Banner ── */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              notifPermission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-light text-primary'
            }`}>
              {notifPermission === 'granted' ? <BellRing className="w-6 h-6 animate-bounce" /> : <Smartphone className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-text-dark text-sm sm:text-base">
                  Thông báo theo dõi mèo về điện thoại
                </h4>
                {notifPermission === 'granted' ? (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối điện thoại
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Chưa bật
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                Nhận thông báo ngay khi bé ăn xong, đi vệ sinh, uống thuốc hoặc có ảnh/video mới (chuông & rung trực tiếp trên máy).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            {notifPermission !== 'granted' ? (
              <button
                onClick={handleEnablePhoneNotif}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/25 active:scale-95 text-sm cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                Bật thông báo về điện thoại
              </button>
            ) : (
              <button
                onClick={handleTestNotification}
                disabled={isSendingTestNotif}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 px-4 py-2.5 rounded-xl transition-all active:scale-95 text-sm cursor-pointer"
              >
                {isSendingTestNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                Thử phát thông báo về máy
              </button>
            )}
          </div>
        </div>

        {!activeBooking ? (
          /* ── Empty State ── */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
            <EmptyState navigate={navigate} />
          </div>
        ) : (
          /* ── Active Stay ── */
          <>
            {/* ── Summary Banner ── */}
            <div className="bg-gradient-to-r from-[#ecfdf5] to-[#d1fae5] border border-primary/20 rounded-2xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Pet avatar (clickable → pet profile) */}
              <button
                onClick={() => navigate('/pet-profile')}
                title="Xem hồ sơ mèo"
                className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-md shrink-0 hover:scale-105 transition-transform cursor-pointer group relative"
              >
                {firstPet?.imagePreview
                  ? <img src={firstPet.imagePreview} alt={firstPet.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-primary-light flex items-center justify-center"><PawPrint className="w-8 h-8 text-primary" /></div>}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <button
                    onClick={() => navigate('/pet-profile')}
                    className="text-xl font-extrabold text-text-dark font-title hover:text-primary transition-colors cursor-pointer"
                  >
                    {resolvedPets.map(p => p.name).join(', ') || 'Bé mèo'}
                  </button>
                  <span className="bg-primary text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Đang lưu trú</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {activeBooking.selectedPackage?.name || 'Gói lưu trú'}
                  {activeBooking.selectedRoom?.name ? ` • Phòng ${activeBooking.selectedRoom.name}` : ''}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                    <span>{formatDate(activeBooking.checkIn)} — {formatDate(activeBooking.checkOut)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-amber-600">Còn {daysRemaining} ngày</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => toast('Tính năng gia hạn sẽ sớm ra mắt! Vui lòng liên hệ nhân viên.', { icon: '🔔' })}
                  className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-secondary transition-colors shadow-md shadow-primary/25 cursor-pointer text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Gia hạn lưu trú
                </button>
              </div>
            </div>

            {/* ── Warning Banner (abnormal events) ── */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-800 text-sm mb-0.5">Lưu ý từ nhân viên chăm sóc</p>
                <p className="text-amber-700 text-sm leading-relaxed">
                  Bé ăn ít hơn bình thường vào bữa trưa và có vẻ stress nhẹ. Chúng mình đang theo dõi sát và sẽ liên hệ ngay nếu có gì bất thường.
                </p>
                <button
                  onClick={() => setShowCallModal(true)}
                  className="mt-3 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-400/30 active:scale-[0.97] cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Liên hệ nhân viên ngay
                </button>
              </div>
            </div>

            {/* ── 2-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── LEFT: Main content ── */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stepper */}
                <Stepper currentStep={3} />

                {/* Care Log */}
                <CareLogTimeline bookingId={activeBooking.id} petId={firstPet?.id} />
              </div>

              {/* ── RIGHT: Sidebar ── */}
              <div className="space-y-6">
                {/* Camera Block */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    Camera trực tiếp
                  </h3>

                  {/* Status */}
                  <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-sm font-medium ${isCameraUnlocked ? 'bg-primary-light text-primary' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${isCameraUnlocked ? 'bg-primary animate-pulse' : 'bg-gray-300'}`} />
                    {isCameraUnlocked
                      ? 'Camera đang hoạt động (đã bật)'
                      : 'Cần mua thêm: 10.000đ/ngày'}
                  </div>

                  {/* Feed */}
                  <div className="relative rounded-xl overflow-hidden mb-4 bg-gray-100 aspect-video flex items-center justify-center border border-gray-200">
                    {isCameraUnlocked ? (
                      <>
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 z-10">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          LIVE
                        </div>
                        <img src={cameraFeed} alt="Camera live" className="w-full h-full object-cover" />
                      </>
                    ) : (
                      <>
                        <img src={cameraFeed} alt="Camera preview" className="w-full h-full object-cover blur-sm opacity-40" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-white text-xs font-bold">Chưa mở khoá</span>
                        </div>
                      </>
                    )}
                  </div>

                  {!isCameraUnlocked ? (
                    <button
                      onClick={() => setShowCameraModal(true)}
                      className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-md shadow-accent/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <Camera className="w-4 h-4" />
                      Xem camera (10.000đ/ngày)
                    </button>
                  ) : (
                    <div className="text-center text-xs text-gray-500 font-medium">
                      ✅ Camera đã bao gồm trong gói của bé
                    </div>
                  )}
                </div>

                {/* Package & Addon Management */}
                <ServiceManagement 
                  booking={activeBooking} 
                  isAdmin={false} 
                  onRequestAddon={handleAddonRequest} 
                />

                {/* Chat with staff */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-600 mb-2.5 font-medium">Cần yêu cầu dịch vụ riêng hoặc hỗ trợ chăm sóc?</p>
                  <button
                    onClick={() => setShowChatModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-primary/25 hover:shadow-lg active:scale-[0.98] cursor-pointer text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat với nhân viên
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
