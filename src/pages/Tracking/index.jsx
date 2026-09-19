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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const calculateStatus = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 'ChÆ°a rÃµ';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const inDate = new Date(checkIn); inDate.setHours(0, 0, 0, 0);
  const outDate = new Date(checkOut); outDate.setHours(23, 59, 59, 999);
  if (today < inDate) return 'Sáº¯p tá»›i';
  if (today >= inDate && today <= outDate) return 'Äang lÆ°u trÃº';
  return 'ÄÃ£ hoÃ n táº¥t';
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

// â”€â”€â”€ Mock Care Log Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CARE_LOGS = [
  {
    date: 'HÃ´m nay, 19/09',
    logs: [
      { time: '08:00', type: 'eating', icon: Utensils, label: 'Cho Äƒn sÃ¡ng', detail: 'Ä‚n háº¿t 3/4 kháº©u pháº§n pate cÃ¡ há»“i', status: 'normal', tag: 'BÃ¬nh thÆ°á»ng' },
      { time: '09:30', type: 'hygiene', icon: Droplets, label: 'Dá»n vá»‡ sinh', detail: 'PhÃ¢n khÃ´, nÆ°á»›c tiá»ƒu bÃ¬nh thÆ°á»ng', status: 'normal', tag: 'BÃ¬nh thÆ°á»ng' },
      { time: '12:00', type: 'eating', icon: Utensils, label: 'Cho Äƒn trÆ°a', detail: 'Chá»‰ Äƒn má»™t Ã­t, bá» má»©a pháº§n cÃ²n láº¡i', status: 'watch', tag: 'Cáº§n theo dÃµi' },
      { time: '15:00', type: 'mood', icon: Smile, label: 'Quan sÃ¡t tÃ¢m tráº¡ng', detail: 'BÃ© náº±m má»™t chá»—, cÃ³ váº» nhá»› nhÃ , kÃªu nhá»', status: 'watch', tag: 'Cáº§n theo dÃµi' },
      { time: '18:00', type: 'eating', icon: Utensils, label: 'Cho Äƒn tá»‘i', detail: 'Ä‚n ngon, Äƒn háº¿t sáº¡ch bá»¯a tá»‘i', status: 'normal', tag: 'BÃ¬nh thÆ°á»ng' },
      { time: '19:30', type: 'health', icon: HeartPulse, label: 'Kiá»ƒm tra sá»©c khá»e', detail: 'Nhá»‹p thá»Ÿ Ä‘á»u, thÃ¢n nhiá»‡t bÃ¬nh thÆ°á»ng', status: 'normal', tag: 'BÃ¬nh thÆ°á»ng' },
    ]
  },
  {
    date: 'HÃ´m qua, 18/09',
    logs: [
      { time: '08:00', type: 'eating', icon: Utensils, label: 'Cho Äƒn sÃ¡ng', detail: 'Ä‚n háº¿t sáº¡ch, ngoan láº¯m!', status: 'normal', tag: 'BÃ¬nh thÆ°á»ng' },
      { time: '10:00', type: 'hygiene', icon: Droplets, label: 'Dá»n vá»‡ sinh', detail: 'Má»i thá»© bÃ¬nh thÆ°á»ng', status: 'normal', tag: 'BÃ¬nh thÆ°á»ng' },
      { time: '14:00', type: 'mood', icon: Smile, label: 'Quan sÃ¡t tÃ¢m tráº¡ng', detail: 'BÃ© chÆ¡i vui vá»›i Ä‘á»“ chÆ¡i lÃ´ng vÅ©', status: 'normal', tag: 'BÃ¬nh thÆ°á»ng' },
      { time: '18:00', type: 'eating', icon: Utensils, label: 'Cho Äƒn tá»‘i', detail: 'Ä‚n tá»‘t, Äƒn háº¿t 2 bá»¯a chÃ­nh', status: 'normal', tag: 'BÃ¬nh thÆ°á»ng' },
    ]
  }
];

// â”€â”€â”€ Stepper Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STEPS = [
  { id: 1, label: 'Äáº·t cá»c giá»¯ phÃ²ng', short: 'Äáº·t cá»c', icon: 'ðŸ’³' },
  { id: 2, label: 'Check-in', short: 'Check-in', icon: 'ðŸ ' },
  { id: 3, label: 'Äang lÆ°u trÃº & chÄƒm sÃ³c', short: 'LÆ°u trÃº', icon: 'ðŸ±' },
  { id: 4, label: 'Chuáº©n bá»‹ check-out', short: 'Chuáº©n bá»‹', icon: 'ðŸ“¦' },
  { id: 5, label: 'BÃ n giao & thanh toÃ¡n', short: 'Thanh toÃ¡n', icon: 'âœ…' },
];

// â”€â”€â”€ Add-on Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ADDONS = {
  room: {
    title: 'Äá»•i / NÃ¢ng cáº¥p phÃ²ng',
    icon: Home,
    description: 'NÃ¢ng cáº¥p khÃ´ng gian lÆ°u trÃº cho bÃ© thÃªm thoáº£i mÃ¡i vÃ  sang xá»‹n hÆ¡n.',
    options: [
      { value: 'vvip', label: 'NÃ¢ng lÃªn phÃ²ng VVIP (+10.000Ä‘/ngÃ y)', price: '+10.000Ä‘/ngÃ y' },
      { value: 'deluxe', label: 'NÃ¢ng lÃªn phÃ²ng Deluxe (+20.000Ä‘/ngÃ y)', price: '+20.000Ä‘/ngÃ y' },
    ],
  },
  food: {
    title: 'Cho Äƒn thÃªm',
    icon: Utensils,
    description: 'ThÃªm bá»¯a phá»¥ hoáº·c nÃ¢ng cáº¥p kháº©u pháº§n Äƒn cho bÃ© thÃªm dinh dÆ°á»¡ng.',
    options: [
      { value: 'extra_meal', label: 'ThÃªm 1 bá»¯a phá»¥ (+15.000Ä‘/ngÃ y)', price: '+15.000Ä‘/ngÃ y' },
      { value: 'upgrade_portion', label: 'NÃ¢ng kháº©u pháº§n Äƒn (+20.000Ä‘/ngÃ y)', price: '+20.000Ä‘/ngÃ y' },
      { value: 'premium_food', label: 'NÃ¢ng lÃªn thá»©c Äƒn premium (+35.000Ä‘/ngÃ y)', price: '+35.000Ä‘/ngÃ y' },
    ],
  },
  play: {
    title: 'Cho chÆ¡i thÃªm',
    icon: Sparkles,
    isNew: true,
    description: 'Dá»‹ch vá»¥ Ä‘áº·c biá»‡t giÃºp bÃ© vui váº», giáº£i trÃ­ vÃ  giáº£m stress trong thá»i gian lÆ°u trÃº.',
    options: [
      { value: 'play_session', label: 'Buá»•i chÆ¡i riÃªng 30 phÃºt (liÃªn há»‡ Ä‘á»ƒ biáº¿t giÃ¡)', price: 'TÆ° váº¥n' },
      { value: 'toy_rental', label: 'ThuÃª thÃªm Ä‘á»“ chÆ¡i cao cáº¥p (liÃªn há»‡ Ä‘á»ƒ biáº¿t giÃ¡)', price: 'TÆ° váº¥n' },
    ],
  },
};

// â”€â”€â”€ Confirmation Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          <h3 className="text-xl font-bold text-text-dark">XÃ¡c nháº­n yÃªu cáº§u</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="bg-[#F0FDF8] rounded-2xl p-4 mb-6 border border-primary/20">
          <p className="text-sm text-gray-600 mb-1 font-medium">{ADDONS[addon].title}</p>
          <p className="text-text-dark font-bold">{opt?.label}</p>
          {opt?.price !== 'TÆ° váº¥n' && (
            <p className="text-primary font-bold text-lg mt-1">{opt?.price}</p>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            {opt?.price === 'TÆ° váº¥n'
              ? 'NhÃ¢n viÃªn sáº½ liÃªn há»‡ Ä‘á»ƒ tÆ° váº¥n vÃ  xÃ¡c nháº­n giÃ¡ trÆ°á»›c khi thá»±c hiá»‡n.'
              : 'PhÃ­ dá»‹ch vá»¥ sáº½ Ä‘Æ°á»£c cá»™ng vÃ o hoÃ¡ Ä‘Æ¡n thanh toÃ¡n khi Ä‘Ã³n bÃ© vá».'}
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
            Huá»·
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-secondary transition-colors shadow-lg shadow-primary/25"
          >
            XÃ¡c nháº­n yÃªu cáº§u
          </button>
        </div>
      </div>
    </div>
  );
};

// â”€â”€â”€ Camera QR Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CameraModal = ({ onClose, onConfirm, isVerifying }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
        <X className="w-4 h-4 text-gray-500" />
      </button>
      <h3 className="text-xl font-bold text-text-dark text-center mb-2">Thanh toÃ¡n phÃ­ xem Camera</h3>
      <p className="text-gray-500 text-center mb-6 text-sm">QuÃ©t mÃ£ QR bÃªn dÆ°á»›i Ä‘á»ƒ thanh toÃ¡n vÃ  xem camera trá»±c tiáº¿p.</p>
      <div className="bg-gray-50 rounded-2xl p-4 flex justify-center mb-6 border border-gray-100">
        <img
          src="https://img.vietqr.io/image/mbbank-111122223333-compact2.png?amount=10000&addInfo=Thanh%20toan%20Camera%20Miu&accountName=MEO%20VANG%20NHA"
          alt="QR Code"
          className="w-48 h-48 object-contain"
        />
      </div>
      <p className="text-center font-bold text-accent text-2xl mb-8">10.000 VNÄ / ngÃ y</p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onConfirm}
          disabled={isVerifying}
          className={`w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-secondary transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2 ${isVerifying ? 'opacity-80 cursor-wait' : ''}`}
        >
          {isVerifying && <Loader2 className="w-5 h-5 animate-spin" />}
          {isVerifying ? 'Äang kiá»ƒm tra giao dá»‹ch...' : 'TÃ´i Ä‘Ã£ chuyá»ƒn khoáº£n'}
        </button>
        <button onClick={onClose} disabled={isVerifying} className="w-full bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
          Há»§y
        </button>
      </div>
    </div>
  </div>
);

// â”€â”€â”€ Empty State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EmptyState = ({ navigate }) => (
  <div className="flex flex-col items-center justify-center text-center py-20 px-4">
    <div className="relative mb-8">
      <div className="w-32 h-32 bg-gradient-to-br from-primary-light to-[#a7f3d0] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
        <PawPrint className="w-14 h-14 text-primary opacity-40" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-100">
        <span className="text-2xl">ðŸ¾</span>
      </div>
    </div>

    <h2 className="text-2xl font-extrabold text-text-dark font-title mb-3">
      Hiá»‡n khÃ´ng cÃ³ mÃ¨o Ä‘ang lÆ°u trÃº
    </h2>
    <p className="text-gray-500 max-w-sm leading-relaxed mb-8">
      Khi bÃ© mÃ¨o cá»§a báº¡n Ä‘ang Ä‘Æ°á»£c chÃºng mÃ¬nh chÄƒm sÃ³c, má»i thÃ´ng tin lÆ°u trÃº, nháº­t kÃ½ chÄƒm sÃ³c vÃ  camera sáº½ hiá»‡n táº¡i Ä‘Ã¢y.
    </p>

    <button
      onClick={() => navigate('/booking')}
      className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-secondary transition-all shadow-lg shadow-primary/30 active:scale-[0.98] cursor-pointer text-base"
    >
      <CalendarDays className="w-5 h-5" />
      Äáº·t lá»‹ch lÆ°u trÃº
      <ArrowRight className="w-4 h-4" />
    </button>

    <p className="text-xs text-gray-400 mt-4">Chá»‰ máº¥t vÃ i phÃºt Ä‘á»ƒ Ä‘áº·t lá»‹ch cho bÃ© yÃªu!</p>
  </div>
);

// â”€â”€â”€ Stepper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Stepper = ({ currentStep = 3 }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
    <h3 className="font-bold text-text-dark mb-5 flex items-center gap-2">
      <Zap className="w-4 h-4 text-primary" />
      HÃ nh trÃ¬nh lÆ°u trÃº
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
            {isActive && <span className="ml-auto text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">Hiá»‡n táº¡i</span>}
          </div>
        );
      })}
    </div>
  </div>
);

// â”€â”€â”€ Care Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CareLog = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
    <h3 className="font-bold text-text-dark mb-5 flex items-center gap-2">
      <CalendarDays className="w-4 h-4 text-primary" />
      Nháº­t kÃ½ chÄƒm sÃ³c
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

// â”€â”€â”€ Package Block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PackageBlock = ({ booking }) => {
  const pkg = booking?.selectedPackage;
  const room = booking?.selectedRoom;
  const perks = [
    { icon: Utensils, text: '3 bá»¯a Äƒn/ngÃ y (sÃ¡ng, trÆ°a, tá»‘i)' },
    { icon: Droplets, text: 'Dá»n vá»‡ sinh 2 láº§n/ngÃ y' },
    { icon: Camera, text: 'Camera included' },
    { icon: Home, text: 'ÄÆ°a Ä‘Ã³n miá»…n phÃ­ trong bÃ¡n kÃ­nh 5km' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        GÃ³i Ä‘ang sá»­ dá»¥ng
      </h3>
      <div className="flex items-center gap-4 mb-5 p-4 bg-gradient-to-r from-primary/5 to-[#a7f3d0]/20 rounded-xl border border-primary/10">
        <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
          <span className="text-2xl">ðŸ±</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-dark text-base">{pkg?.name || 'GÃ³i TiÃªu Chuáº©n'}</p>
          <p className="text-primary font-bold text-sm">{pkg?.price || '150.000Ä‘'}/ngÃ y</p>
          {room && <p className="text-xs text-gray-500 mt-0.5">PhÃ²ng: {room.name}</p>}
        </div>
      </div>
      <div className="space-y-2.5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quyá»n lá»£i Ä‘i kÃ¨m</p>
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

// â”€â”€â”€ Add-on Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
              <span className="text-[10px] font-black bg-accent text-white px-2 py-0.5 rounded-full tracking-wide">Äá»€ XUáº¤T Má»šI</span>
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
          <option value="">â€” Chá»n tuá»³ chá»n â€”</option>
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
        YÃªu cáº§u dá»‹ch vá»¥
      </button>
    </div>
  );
};

// â”€â”€â”€ Call Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HOTLINE = '0904957555';
const HOTLINE_DISPLAY = '090 495 75 55';

const CallModal = ({ onClose, onConfirm }) => (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-secondary px-6 pt-8 pb-10 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
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
        <h2 className="text-xl font-extrabold text-white font-title mb-1">Gá»i cho nhÃ¢n viÃªn</h2>
        <p className="text-white/80 text-sm">MÃ¨o Váº¯ng NhÃ  Boutique Hotel</p>
      </div>

      {/* Body */}
      <div className="-mt-6 bg-white rounded-t-3xl px-6 pt-6 pb-6">
        <p className="text-gray-500 text-center text-sm leading-relaxed mb-4">
          Báº¡n sáº½ Ä‘Æ°á»£c káº¿t ná»‘i trá»±c tiáº¿p vá»›i nhÃ¢n viÃªn chÄƒm sÃ³c Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£ nhanh nháº¥t.
        </p>

        {/* Hotline display */}
        <div className="bg-primary-light/50 border border-primary/20 rounded-2xl py-4 px-5 mb-6 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Hotline há»— trá»£ 24/7</p>
          <p className="text-3xl font-black text-primary tracking-wide">{HOTLINE_DISPLAY}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98] cursor-pointer text-base"
          >
            <Phone className="w-5 h-5" />
            Gá»i ngay
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl transition-colors cursor-pointer text-sm"
          >
            Äá»ƒ sau
          </button>
        </div>
      </div>
    </div>
  </div>
);

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  const [showCallModal, setShowCallModal] = useState(false);

  const handleCall = () => {
    setShowCallModal(false);
    window.location.href = `tel:${HOTLINE}`;
  };

  const isLoggedIn = Boolean(customerProfile);

  const handleAuthSubmit = (formData) => {
    saveCustomerProfile(formData);
    setIsAuthOpen(false);
    toast.success(`ChÃ o má»«ng ${formData.fullName || 'báº¡n'}! ðŸ¾`);
  };

  // Find active booking
  const activeBooking = globalBookingList.find(b => calculateStatus(b.checkIn, b.checkOut) === 'Äang lÆ°u trÃº');

  const resolvedPets = activeBooking
    ? (activeBooking.petIds || []).map(id => petList.find(p => p.id === id)).filter(Boolean)
        .concat(activeBooking.petProfiles || []).filter((p, i, arr) => arr.findIndex(q => q.id === p.id) === i)
    : [];

  const daysRemaining = activeBooking ? getDaysRemaining(activeBooking.checkOut) : 0;
  const firstPet = resolvedPets[0];

  const handleCameraConfirm = () => {
    setIsVerifying(true);
    setTimeout(() => {
      toast.success('Thanh toÃ¡n thÃ nh cÃ´ng! Camera Ä‘Ã£ Ä‘Æ°á»£c má»Ÿ ðŸŽ‰');
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
    if (confirmModal.addon === 'play' || ADDONS[confirmModal.addon]?.options?.find(o => o.value === confirmModal.option)?.price === 'TÆ° váº¥n') {
      toast.success('YÃªu cáº§u Ä‘Ã£ gá»­i! NhÃ¢n viÃªn sáº½ liÃªn há»‡ sá»›m nhÃ© ðŸ˜Š');
    } else {
      toast.success(`YÃªu cáº§u "${addon.title}" Ä‘Ã£ gá»­i thÃ nh cÃ´ng! PhÃ­ sáº½ cá»™ng vÃ o hoÃ¡ Ä‘Æ¡n.`);
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
            <h1 className="text-3xl font-extrabold text-text-dark font-title mb-3">Theo DÃµi LÆ°u TrÃº</h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              ÄÄƒng nháº­p Ä‘á»ƒ xem tráº¡ng thÃ¡i lÆ°u trÃº, nháº­t kÃ½ chÄƒm sÃ³c hÃ ng ngÃ y vÃ  camera trá»±c tiáº¿p cá»§a bÃ© mÃ¨o.
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-primary/30 cursor-pointer"
            >
              ÄÄƒng nháº­p / Táº¡o há»“ sÆ¡
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
      {showCallModal && (
        <CallModal
          onClose={() => setShowCallModal(false)}
          onConfirm={handleCall}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
        {/* Navigation */}
        <PetDashboardNav
          title="Theo dÃµi lÆ°u trÃº"
          subtitle="Cáº­p nháº­t tÃ¬nh hÃ¬nh bÃ© mÃ¨o trong suá»‘t thá»i gian lÆ°u trÃº."
        />

        {!activeBooking ? (
          /* â”€â”€ Empty State â”€â”€ */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
            <EmptyState navigate={navigate} />
          </div>
        ) : (
          /* â”€â”€ Active Stay â”€â”€ */
          <>
            {/* â”€â”€ Summary Banner â”€â”€ */}
            <div className="bg-gradient-to-r from-[#ecfdf5] to-[#d1fae5] border border-primary/20 rounded-2xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Pet avatar (clickable â†’ pet profile) */}
              <button
                onClick={() => navigate('/pet-profile')}
                title="Xem há»“ sÆ¡ mÃ¨o"
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
                    {resolvedPets.map(p => p.name).join(', ') || 'BÃ© mÃ¨o'}
                  </button>
                  <span className="bg-primary text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Äang lÆ°u trÃº</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {activeBooking.selectedPackage?.name || 'GÃ³i lÆ°u trÃº'}
                  {activeBooking.selectedRoom?.name ? ` â€¢ PhÃ²ng ${activeBooking.selectedRoom.name}` : ''}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                    <span>{formatDate(activeBooking.checkIn)} â€” {formatDate(activeBooking.checkOut)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-amber-600">CÃ²n {daysRemaining} ngÃ y</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => toast('TÃ­nh nÄƒng gia háº¡n sáº½ sá»›m ra máº¯t! Vui lÃ²ng liÃªn há»‡ nhÃ¢n viÃªn.', { icon: 'ðŸ””' })}
                  className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-secondary transition-colors shadow-md shadow-primary/25 cursor-pointer text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Gia háº¡n lÆ°u trÃº
                </button>
              </div>
            </div>

            {/* â”€â”€ Warning Banner (abnormal events) â”€â”€ */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-800 text-sm mb-0.5">LÆ°u Ã½ tá»« nhÃ¢n viÃªn chÄƒm sÃ³c</p>
                <p className="text-amber-700 text-sm leading-relaxed">
                  BÃ© Äƒn Ã­t hÆ¡n bÃ¬nh thÆ°á»ng vÃ o bá»¯a trÆ°a vÃ  cÃ³ váº» stress nháº¹. ChÃºng mÃ¬nh Ä‘ang theo dÃµi sÃ¡t vÃ  sáº½ liÃªn há»‡ ngay náº¿u cÃ³ gÃ¬ báº¥t thÆ°á»ng.
                </p>
                <button
                  onClick={() => setShowCallModal(true)}
                  className="mt-3 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-400/30 active:scale-[0.97] cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  LiÃªn há»‡ nhÃ¢n viÃªn ngay
                </button>
              </div>
            </div>

            {/* â”€â”€ 2-column layout â”€â”€ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* â”€â”€ LEFT: Main content â”€â”€ */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stepper */}
                <Stepper currentStep={3} />

                {/* Care Log */}
                <CareLog />
              </div>

              {/* â”€â”€ RIGHT: Sidebar â”€â”€ */}
              <div className="space-y-6">
                {/* Camera Block */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    Camera trá»±c tiáº¿p
                  </h3>

                  {/* Status */}
                  <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-sm font-medium ${isCameraUnlocked ? 'bg-primary-light text-primary' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${isCameraUnlocked ? 'bg-primary animate-pulse' : 'bg-gray-300'}`} />
                    {isCameraUnlocked
                      ? 'Camera Ä‘ang hoáº¡t Ä‘á»™ng (Ä‘Ã£ báº­t)'
                      : 'Cáº§n mua thÃªm: 10.000Ä‘/ngÃ y'}
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
                          <span className="text-white text-xs font-bold">ChÆ°a má»Ÿ khoÃ¡</span>
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
                      Xem camera (10.000Ä‘/ngÃ y)
                    </button>
                  ) : (
                    <div className="text-center text-xs text-gray-500 font-medium">
                      âœ… Camera Ä‘Ã£ bao gá»“m trong gÃ³i cá»§a bÃ©
                    </div>
                  )}
                </div>

                {/* Package Block */}
                <PackageBlock booking={activeBooking} />

                {/* Add-on Services */}
                <div>
                  <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2 px-1">
                    <Gift className="w-4 h-4 text-accent" />
                    Dá»‹ch vá»¥ thÃªm
                    <span className="text-xs text-gray-400 font-normal">(cá»™ng vÃ o hoÃ¡ Ä‘Æ¡n cuá»‘i)</span>
                  </h3>
                  <div className="space-y-4">
                    {Object.keys(ADDONS).map(key => (
                      <AddonCard key={key} addonKey={key} onRequest={handleAddonRequest} />
                    ))}
                  </div>
                </div>

                {/* Floating call button hint */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-2">Cáº§n há»— trá»£ kháº©n cáº¥p?</p>
                  <button
                    onClick={() => setShowCallModal(true)}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-primary/25 cursor-pointer text-sm mx-auto"
                  >
                    <Phone className="w-4 h-4" />
                    Gá»i hotline ngay
                  </button>
                  <p className="text-xs text-gray-400 mt-2 font-mono font-bold">{HOTLINE_DISPLAY}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Floating Call Button */}
      {activeBooking && (
        <button
          onClick={() => setShowCallModal(true)}
          title={Gọi hotline: }
          className="fixed bottom-6 right-6 z-40 group w-16 h-16 bg-primary hover:bg-secondary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25" />
          <Phone className="w-7 h-7 relative z-10" />
          <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-md">24/7</span>
          <span className="absolute right-[72px] bg-text-dark text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">Gọi nhân viên</span>
        </button>
      )}
    </div>
  );
};

export default TrackingPage;