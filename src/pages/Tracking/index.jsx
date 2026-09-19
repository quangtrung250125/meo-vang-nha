import React, { useState } from 'react';
import {
  PawPrint, CalendarDays, Clock, Camera, CheckCircle2,
  AlertTriangle, ChevronRight, MessageCircle,
  Utensils, Droplets, Smile, HeartPulse, Sparkles,
  Loader2, ArrowRight, Home, Phone, Video,
  Package, Plus, ChevronDown, X, RefreshCw,
  Zap, Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePetProfile } from '../../contexts/PetContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import PetDashboardNav from '../../components/PetDashboardNav';
import CustomerWelcomeModal from '../../components/CustomerWelcomeModal';
import { toast } from 'react-hot-toast';
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

const CARE_LOGS = [
  {
    date: 'Hôm nay, 19/09',
    logs: [
      { time: '08:00', type: 'eating', icon: Utensils, label: 'Cho ăn sáng', detail: 'Ăn hết 3/4 khẩu phần pate cá hồi', status: 'normal', tag: 'Bình thường' },
      { time: '09:30', type: 'hygiene', icon: Droplets, label: 'Dọn vệ sinh', detail: 'Phân khô, nước tiểu bình thường', status: 'normal', tag: 'Bình thường' },
      { time: '12:00', type: 'eating', icon: Utensils, label: 'Cho ăn trưa', detail: 'Chỉ ăn một ít, bỏ mứa phần còn lại', status: 'watch', tag: 'Cần theo dõi' },
      { time: '15:00', type: 'mood', icon: Smile, label: 'Quan sát tâm trạng', detail: 'Bé nằm một chỗ, có vẻ nhớ nhà, kêu nhỏ', status: 'watch', tag: 'Cần theo dõi' },
      { time: '18:00', type: 'eating', icon: Utensils, label: 'Cho ăn tối', detail: 'Ăn ngon, ăn hết sạch bữa tối', status: 'normal', tag: 'Bình thường' },
      { time: '19:30', type: 'health', icon: HeartPulse, label: 'Kiểm tra sức khỏe', detail: 'Nhịp thở đều, thân nhiệt bình thường', status: 'normal', tag: 'Bình thường' },
    ]
  },
  {
    date: 'Hôm qua, 18/09',
    logs: [
      { time: '08:00', type: 'eating', icon: Utensils, label: 'Cho ăn sáng', detail: 'Ăn hết sạch, ngoan lắm!', status: 'normal', tag: 'Bình thường' },
      { time: '10:00', type: 'hygiene', icon: Droplets, label: 'Dọn vệ sinh', detail: 'Mọi thứ bình thường', status: 'normal', tag: 'Bình thường' },
      { time: '14:00', type: 'mood', icon: Smile, label: 'Quan sát tâm trạng', detail: 'Bé chơi vui với đồ chơi lông vũ', status: 'normal', tag: 'Bình thường' },
      { time: '18:00', type: 'eating', icon: Utensils, label: 'Cho ăn tối', detail: 'Ăn tốt, ăn hết 2 bữa chính', status: 'normal', tag: 'Bình thường' },
    ]
  }
];

// ─── Stepper Steps ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Đặt cọc giữ phòng', short: 'Đặt cọc', icon: '💳' },
  { id: 2, label: 'Check-in', short: 'Check-in', icon: '🏠' },
  { id: 3, label: 'Đang lưu trú & chăm sóc', short: 'Lưu trú', icon: '🐱' },
  { id: 4, label: 'Chuẩn bị check-out', short: 'Chuẩn bị', icon: '📦' },
  { id: 5, label: 'Bàn giao & thanh toán', short: 'Thanh toán', icon: '✅' },
];

// ─── Add-on Modals ───────────────────────────────────────────────────────────

const ADDONS = {
  room: {
    title: 'Đổi / Nâng cấp phòng',
    icon: Home,
    description: 'Nâng cấp không gian lưu trú cho bé thêm thoải mái và sang xịn hơn.',
    options: [
      { value: 'vvip', label: 'Nâng lên phòng VVIP (+10.000đ/ngày)', price: '+10.000đ/ngày' },
      { value: 'deluxe', label: 'Nâng lên phòng Deluxe (+20.000đ/ngày)', price: '+20.000đ/ngày' },
    ],
  },
  food: {
    title: 'Cho ăn thêm',
    icon: Utensils,
    description: 'Thêm bữa phụ hoặc nâng cấp khẩu phần ăn cho bé thêm dinh dưỡng.',
    options: [
      { value: 'extra_meal', label: 'Thêm 1 bữa phụ (+15.000đ/ngày)', price: '+15.000đ/ngày' },
      { value: 'upgrade_portion', label: 'Nâng khẩu phần ăn (+20.000đ/ngày)', price: '+20.000đ/ngày' },
      { value: 'premium_food', label: 'Nâng lên thức ăn premium (+35.000đ/ngày)', price: '+35.000đ/ngày' },
    ],
  },
  play: {
    title: 'Cho chơi thêm',
    icon: Sparkles,
    isNew: true,
    description: 'Dịch vụ đặc biệt giúp bé vui vẻ, giải trí và giảm stress trong thời gian lưu trú.',
    options: [
      { value: 'play_session', label: 'Buổi chơi riêng 30 phút (liên hệ để biết giá)', price: 'Tư vấn' },
      { value: 'toy_rental', label: 'Thuê thêm đồ chơi cao cấp (liên hệ để biết giá)', price: 'Tư vấn' },
    ],
  },
};

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

// ─── Care Log ─────────────────────────────────────────────────────────────────

const CareLog = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
    <h3 className="font-bold text-text-dark mb-5 flex items-center gap-2">
      <CalendarDays className="w-4 h-4 text-primary" />
      Nhật ký chăm sóc
    </h3>
    <div className="space-y-6">
      {CARE_LOGS.map((day, dayIdx) => (
        <div key={dayIdx}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{day.date}</p>
          <div className="border-l-2 border-gray-100 pl-4 space-y-4">
            {day.logs.map((log, logIdx) => {
              const Icon = log.icon;
              const isWatch = log.status === 'watch';
              return (
                <div key={logIdx} className="relative flex items-start gap-3">
                  <div className="absolute -left-[21px] w-4 h-4 rounded-full bg-white ring-2 ring-gray-100 flex items-center justify-center mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${isWatch ? 'bg-amber-400' : 'bg-primary'}`} />
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <span className="text-xs font-bold text-gray-400 font-mono">{log.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        log.type === 'eating' ? 'bg-orange-50' :
                        log.type === 'hygiene' ? 'bg-blue-50' :
                        log.type === 'mood' ? 'bg-purple-50' : 'bg-red-50'
                      }`}>
                        <Icon className={`w-3.5 h-3.5 ${
                          log.type === 'eating' ? 'text-orange-400' :
                          log.type === 'hygiene' ? 'text-blue-400' :
                          log.type === 'mood' ? 'text-purple-400' : 'text-red-400'
                        }`} />
                      </div>
                      <span className="text-sm font-semibold text-text-dark">{log.label}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isWatch
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-primary-light text-primary'
                      }`}>
                        {log.tag}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{log.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Package Block ────────────────────────────────────────────────────────────

const PackageBlock = ({ booking }) => {
  const pkg = booking?.selectedPackage;
  const room = booking?.selectedRoom;
  const perks = [
    { icon: Utensils, text: '3 bữa ăn/ngày (sáng, trưa, tối)' },
    { icon: Droplets, text: 'Dọn vệ sinh 2 lần/ngày' },
    { icon: Camera, text: 'Camera included' },
    { icon: Home, text: 'Đưa đón miễn phí trong bán kính 5km' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        Gói đang sử dụng
      </h3>
      <div className="flex items-center gap-4 mb-5 p-4 bg-gradient-to-r from-primary/5 to-[#a7f3d0]/20 rounded-xl border border-primary/10">
        <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
          <span className="text-2xl">🐱</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-dark text-base">{pkg?.name || 'Gói Tiêu Chuẩn'}</p>
          <p className="text-primary font-bold text-sm">{pkg?.price || '150.000đ'}/ngày</p>
          {room && <p className="text-xs text-gray-500 mt-0.5">Phòng: {room.name}</p>}
        </div>
      </div>
      <div className="space-y-2.5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quyền lợi đi kèm</p>
        {perks.map((perk, i) => {
          const Icon = perk.icon;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm text-gray-700">{perk.text}</span>
              <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Add-on Card ─────────────────────────────────────────────────────────────

const AddonCard = ({ addonKey, onRequest }) => {
  const addon = ADDONS[addonKey];
  const [selected, setSelected] = useState('');
  const Icon = addon.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-text-dark text-sm">{addon.title}</h4>
            {addon.isNew && (
              <span className="text-[10px] font-black bg-accent text-white px-2 py-0.5 rounded-full tracking-wide">ĐỀ XUẤT MỚI</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">{addon.description}</p>
      <div className="relative mb-3">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer pr-8"
        >
          <option value="">— Chọn tuỳ chọn —</option>
          {addon.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      <button
        onClick={() => selected && onRequest(addonKey, selected)}
        disabled={!selected}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
          selected
            ? 'bg-primary text-white hover:bg-secondary shadow-md shadow-primary/20 cursor-pointer'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Plus className="w-4 h-4" />
        Yêu cầu dịch vụ
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TrackingPage = () => {
  const navigate = useNavigate();
  const { petList } = usePetProfile();
  const { globalBookingList } = useBookingHistory();
  const { customerProfile, saveCustomerProfile } = useCustomerProfile();

  const [isCameraUnlocked, setIsCameraUnlocked] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, addon: null, option: null });
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
        {/* Navigation */}
        <PetDashboardNav
          title="Theo dõi lưu trú"
          subtitle="Cập nhật tình hình bé mèo trong suốt thời gian lưu trú."
        />

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
                  onClick={() => toast('Đang chuyển đến Zalo nhân viên...')}
                  className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-800 underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
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
                <CareLog />
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

                {/* Package Block */}
                <PackageBlock booking={activeBooking} />

                {/* Add-on Services */}
                <div>
                  <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2 px-1">
                    <Gift className="w-4 h-4 text-accent" />
                    Dịch vụ thêm
                    <span className="text-xs text-gray-400 font-normal">(cộng vào hoá đơn cuối)</span>
                  </h3>
                  <div className="space-y-4">
                    {Object.keys(ADDONS).map(key => (
                      <AddonCard key={key} addonKey={key} onRequest={handleAddonRequest} />
                    ))}
                  </div>
                </div>

                {/* Contact button */}
                <button
                  onClick={() => toast('Đang mở Zalo chat với nhân viên...')}
                  className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary font-bold py-4 rounded-2xl hover:bg-primary hover:text-white transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  Nhắn tin cho nhân viên
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
