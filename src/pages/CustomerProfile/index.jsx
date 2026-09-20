import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Award, Calendar, Receipt, Edit3, Save, CheckCircle, 
  ShieldCheck, Heart, Sparkles, PawPrint, Eye, ArrowRight, 
  Clock, MapPin, Phone, Mail, Gift, ChevronRight, Download, 
  RefreshCw, Star, Info, AlertCircle, Camera, Check, CreditCard,
  UserCheck
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import InvoiceModal from '../../components/InvoiceModal';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

// Mock point transactions
const INITIAL_POINT_HISTORY = [
  { id: 1, date: '19/09/2026', desc: 'Hoàn tất lưu trú phòng VIP Hoàng Gia (4 ngày)', points: '+120', type: 'earn', code: '#MVN-2026-8891' },
  { id: 2, date: '02/09/2026', desc: 'Dịch vụ Spa tắm tỉa dưỡng lông 2 bé', points: '+50', type: 'earn', code: '#MVN-2026-8420' },
  { id: 3, date: '15/08/2026', desc: 'Thưởng sinh nhật khách hàng thân thiết', points: '+100', type: 'earn', code: '#PROMO-BIRTHDAY' },
  { id: 4, date: '10/08/2026', desc: 'Đổi voucher giảm giá 100.000đ khi đặt phòng', points: '-200', type: 'spend', code: '#REDEEM-VOUCHER' },
  { id: 5, date: '25/07/2026', desc: 'Lưu trú phòng Deluxe Sen Đá (3 ngày)', points: '+90', type: 'earn', code: '#MVN-2026-7734' },
];

// Mock sample transactions with full invoice data
const SAMPLE_TRANSACTIONS = [
  {
    id: 'MVN-2026-8891',
    code: '#MVN-2026-8891',
    date: '19/09/2026 14:30',
    service: 'Lưu trú phòng VIP Hoàng Gia (4 ngày) + Combo Spa',
    roomName: 'Phòng VIP Hoàng Gia',
    stayPeriod: '15/09/2026 - 19/09/2026',
    petNames: 'Bé Miu Miu & Bánh Bao',
    customerName: 'ducan',
    customerPhone: '0376131531',
    customerEmail: 'ducan12345atm@gmail.com',
    customerTier: 'Thành viên Vàng',
    amount: 1060000,
    subTotal: 1400000,
    discount: 140000,
    deposit: 200000,
    total: 1060000,
    paymentMethod: 'Chuyển khoản VietQR',
    status: 'Đã thanh toán',
    items: [
      { name: 'Lưu trú phòng VIP Hoàng Gia', note: 'Phòng máy lạnh, view ban công kính, trụ cào móng', qty: '4 ngày', price: 250000, total: 1000000 },
      { name: 'Combo Spa Tắm & Cắt tỉa dưỡng lông', note: 'Sữa tắm thảo mộc hữu cơ cho mèo', qty: '1 bé', price: 200000, total: 200000 },
      { name: 'Camera AI Quan sát 24/7', note: 'Đặc quyền miễn phí theo gói VIP', qty: '4 ngày', price: 0, total: 0 },
      { name: 'Thực đơn Hạt Cao Cấp & Pate Me-O', note: 'Khẩu phần 3 bữa/ngày', qty: '4 ngày', price: 50000, total: 200000 },
    ]
  },
  {
    id: 'MVN-2026-8420',
    code: '#MVN-2026-8420',
    date: '02/09/2026 10:15',
    service: 'Combo Spa Tắm & Cắt móng vệ sinh tai',
    roomName: 'Dịch vụ Spa tại khách sạn',
    stayPeriod: '02/09/2026',
    petNames: 'Bé Miu Miu',
    customerName: 'ducan',
    customerPhone: '0376131531',
    customerEmail: 'ducan12345atm@gmail.com',
    customerTier: 'Thành viên Vàng',
    amount: 315000,
    subTotal: 350000,
    discount: 35000,
    deposit: 0,
    total: 315000,
    paymentMethod: 'Ví MoMo',
    status: 'Đã thanh toán',
    items: [
      { name: 'Gói Spa Chăm sóc toàn diện', note: 'Tắm thơm thảo dược, sấy lông, vệ sinh tai kẽ chân', qty: '1 lần', price: 250000, total: 250000 },
      { name: 'Cắt móng & Đeo vòng bảo vệ', note: 'Cắt tỉa an toàn không đau', qty: '1 lần', price: 100000, total: 100000 },
    ]
  },
  {
    id: 'MVN-2026-7734',
    code: '#MVN-2026-7734',
    date: '25/07/2026 17:00',
    service: 'Lưu trú phòng Deluxe Sen Đá (3 ngày)',
    roomName: 'Phòng Deluxe Sen Đá',
    stayPeriod: '22/07/2026 - 25/07/2026',
    petNames: 'Bé Bánh Bao',
    customerName: 'ducan',
    customerPhone: '0376131531',
    customerEmail: 'ducan12345atm@gmail.com',
    customerTier: 'Thành viên Vàng',
    amount: 540000,
    subTotal: 600000,
    discount: 60000,
    deposit: 0,
    total: 540000,
    paymentMethod: 'Tiền mặt tại quầy',
    status: 'Đã thanh toán',
    items: [
      { name: 'Lưu trú phòng Deluxe Sen Đá', note: 'Không gian ấm cúng có đệm nhung', qty: '3 ngày', price: 200000, total: 600000 },
    ]
  }
];

const DEFAULT_BOARDING_HISTORY = [
  {
    id: 'MVN-2026-8891',
    petNames: 'Bé Miu Miu & Bánh Bao',
    roomName: 'Phòng VIP Hoàng Gia',
    packageDesc: 'Gói Chăm Sóc VIP Toàn Diện',
    checkIn: '2026-09-15',
    checkOut: '2026-09-19',
    status: 'Đã hoàn tất',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80',
    invoiceId: 'MVN-2026-8891'
  },
  {
    id: 'MVN-2026-9012',
    petNames: 'Bé Miu Miu',
    roomName: 'Phòng Sunshine View',
    packageDesc: 'Gói Tiêu Chuẩn Nghỉ Dưỡng',
    checkIn: '2026-09-20',
    checkOut: '2026-09-24',
    status: 'Đang lưu trú',
    image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&auto=format&fit=crop&q=80',
    invoiceId: 'MVN-2026-8891'
  },
  {
    id: 'MVN-2026-7734',
    petNames: 'Bé Bánh Bao',
    roomName: 'Phòng Deluxe Sen Đá',
    packageDesc: 'Gói Tiêu Chuẩn',
    checkIn: '2026-07-22',
    checkOut: '2026-07-25',
    status: 'Đã hoàn tất',
    image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&auto=format&fit=crop&q=80',
    invoiceId: 'MVN-2026-7734'
  }
];

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { customerProfile, authenticatedCustomer, saveCustomerProfile } = useCustomerProfile();
  const { globalBookingList = [] } = useBookingHistory() || {};
  const { petList = [] } = usePetProfile() || {};

  const activeCustomer = authenticatedCustomer || customerProfile || {
    fullName: 'ducan',
    phone: '0376131531',
    email: 'ducan12345atm@gmail.com',
    tier: 'gold',
    points: 850,
    address: 'Số 45, Phố Đặng Văn Ngữ, Đống Đa, Hà Nội',
    birthday: '1995-08-15',
    memberSince: '15/01/2025',
    activeCatsCount: 2,
    avatar: DEFAULT_AVATAR
  };

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'tier' | 'history' | 'transactions'
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: activeCustomer.fullName || 'ducan',
    phone: activeCustomer.phone || '0376131531',
    email: activeCustomer.email || 'ducan12345atm@gmail.com',
    address: activeCustomer.address || 'Số 45, Phố Đặng Văn Ngữ, Đống Đa, Hà Nội',
    birthday: activeCustomer.birthday || '1995-08-15',
    notes: activeCustomer.notes || 'Bé mèo Miu nhà mình hơi nhút nhát, cần chuồng yên tĩnh và phòng ấm áp.',
    avatar: activeCustomer.avatar || DEFAULT_AVATAR,
  });

  // Selected invoice for modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      if (saveCustomerProfile) {
        saveCustomerProfile({
          ...activeCustomer,
          ...formData
        });
      }
      setIsEditing(false);
      toast.success('Đã cập nhật thông tin hồ sơ thành công!', {
        icon: '🎉',
        style: { borderRadius: '16px', background: '#333', color: '#fff' }
      });
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu thông tin!');
    } finally {
      setIsSaving(false);
    }
  };

  const openInvoice = (transaction) => {
    const completeInvoice = {
      ...transaction,
      customerName: formData.fullName || transaction.customerName,
      customerPhone: formData.phone || transaction.customerPhone,
      customerEmail: formData.email || transaction.customerEmail,
      customerTier: activeCustomer.tier ? `Thành viên ${activeCustomer.tier}` : 'Thành viên Vàng',
    };
    setSelectedInvoice(completeInvoice);
    setIsInvoiceOpen(true);
  };

  const combinedBoardingList = [
    ...(globalBookingList.map(b => ({
      id: b.id || 'MVN-NEW',
      petNames: b.petName || 'Bé Miu Miu',
      roomName: b.roomType || 'Phòng Deluxe',
      packageDesc: b.serviceType || 'Lưu trú Khách Sạn',
      checkIn: b.checkInDate || '2026-09-20',
      checkOut: b.checkOutDate || '2026-09-24',
      status: 'Đang lưu trú',
      image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&auto=format&fit=crop&q=80',
      invoiceId: 'MVN-2026-8891'
    }))),
    ...DEFAULT_BOARDING_HISTORY
  ];

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <Toaster position="top-center" />

      {/* 1. TOP HERO BANNER (DARK EMERALD GREEN WITH BADGES) */}
      <div className="bg-[#004d40] bg-gradient-to-r from-[#003d33] via-[#004d40] to-[#005d4d] text-white py-10 px-4 sm:px-6 lg:px-8 shadow-md relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-1/4 -bottom-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* User Avatar with Orange Camera Badge */}
            <div className="relative group shrink-0">
              <img
                src={formData.avatar || DEFAULT_AVATAR}
                alt={formData.fullName}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/20 shadow-2xl"
              />
              <button
                onClick={() => {
                  const newUrl = prompt('Nhập URL ảnh đại diện mới:', formData.avatar);
                  if (newUrl) setFormData(prev => ({ ...prev, avatar: newUrl }));
                }}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 ring-2 ring-white cursor-pointer"
                title="Đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black font-title text-white">
                  {formData.fullName || 'ducan'}
                </h1>
                <span className="px-3 py-0.5 bg-[#eab308] text-[#713f12] font-black text-xs rounded-md shadow-xs flex items-center gap-1">
                  <span>👑</span>
                  <span>Hạng Vàng</span>
                </span>
              </div>

              <p className="text-sm text-emerald-100/90 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                <span>✉️ {formData.email || 'ducan12345atm@gmail.com'}</span>
                <span>•</span>
                <span>📞 {formData.phone || '0376131531'}</span>
              </p>

              {/* 3 Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 flex items-center gap-1.5 border border-white/10">
                  <PawPrint className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Đang gửi: <strong className="text-white font-black">{activeCustomer.activeCatsCount || 2} bé mèo</strong></span>
                </span>

                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 flex items-center gap-1.5 border border-white/10">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Điểm tích lũy: <strong className="text-amber-300 font-black">{activeCustomer.points || 850} điểm</strong></span>
                </span>

                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 flex items-center gap-1.5 border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-blue-300" />
                  <span>Thành viên từ: <strong className="text-white font-bold">{activeCustomer.memberSince || '15/01/2025'}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-extrabold text-sm transition-all shadow-lg shadow-orange-950/20 active:scale-95 cursor-pointer"
            >
              <PawPrint className="w-4 h-4" />
              <span>Đặt phòng ngay</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-200/70 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-[#00B16A] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            onClick={() => setActiveTab('tier')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'tier'
                ? 'bg-[#00B16A] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Điểm & Hạng VIP</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#00B16A] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch sử gửi mèo</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-[#00B16A] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Lịch sử giao dịch & Hóa đơn</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* TAB 1: THÔNG TIN CÁ NHÂN (MATCHING SCREENSHOT) */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Left Column Profile Summary Card */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-emerald-50 shadow-md">
                <img
                  src={formData.avatar || DEFAULT_AVATAR}
                  alt={formData.fullName}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-xl font-extrabold text-gray-900">{formData.fullName || 'ducan'}</h2>
              <p className="text-xs text-gray-400 mb-6">{formData.email || 'ducan12345atm@gmail.com'}</p>

              {/* Info summary rows */}
              <div className="w-full space-y-3.5 text-left text-sm pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2 text-xs">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Số điện thoại
                  </span>
                  <span className="font-bold text-gray-800 text-xs">{formData.phone || '0376131531'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2 text-xs">
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Hạng thành viên
                  </span>
                  <span className="font-bold text-amber-700 text-xs">Hạng Vàng VIP</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Điểm thưởng
                  </span>
                  <span className="font-black text-emerald-600 text-xs">{activeCustomer.points || 850} điểm</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="w-full mt-6 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#00B16A] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Đang chỉnh sửa...' : 'Chỉnh sửa thông tin'}</span>
              </button>
            </div>

            {/* Right Column Details Form Card */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-100">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 font-title">Hồ sơ khách hàng</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Cập nhật thông tin để khách sạn liên hệ và đón bé thuận tiện nhất.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00B16A] hover:bg-[#009458] text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Đang lưu...' : 'Cập nhật'}</span>
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Họ và Tên
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#00B16A] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#00B16A] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#00B16A] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Ngày sinh
                    </label>
                    <input
                      type="text"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleInputChange}
                      placeholder="15/08/1995"
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#00B16A] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Địa chỉ nhà riêng / Đón trả mèo
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Số 45, Phố Đặng Văn Ngữ, Đống Đa, Hà Nội"
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#00B16A] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Ghi chú / Yêu cầu đặc biệt cho Pet Hotel
                  </label>
                  <textarea
                    rows="3"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Bé Miu thích ăn pate gà, nhát người lạ..."
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#00B16A] transition"
                  />
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: ĐIỂM & HẠNG VIP */}
        {activeTab === 'tier' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* VIP Card Graphic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-100">MÈO VẮNG NHÀ VIP CARD</p>
                    <h3 className="text-2xl font-black font-title">HỘI VIÊN THÂN THIẾT</h3>
                  </div>
                  <PawPrint className="text-4xl opacity-80" />
                </div>
                <div className="mb-8 text-sm space-y-1">
                  <p className="text-amber-100">Chủ nuôi: <span className="font-bold text-white text-base">{formData.fullName}</span></p>
                  <p className="text-amber-100">Số điện thoại: <span className="font-mono text-white">{formData.phone}</span></p>
                  <p className="text-amber-100">Mã hội viên: <span className="font-mono text-white">MVN-88992</span></p>
                </div>
                <div className="flex justify-between items-end border-t border-amber-300/40 pt-4">
                  <div>
                    <p className="text-xs text-amber-100 uppercase">Điểm tích lũy</p>
                    <p className="text-3xl font-black">{activeCustomer.points || 850} <span className="text-sm font-normal">Điểm</span></p>
                  </div>
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black border border-white/30 tracking-wider">
                    👑 HẠNG VÀNG
                  </span>
                </div>
              </div>

              {/* VIP Benefits */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-gray-900">Đặc quyền Hạng Vàng của bạn</h3>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Giảm <strong>10%</strong> mọi hóa đơn dịch vụ lưu trú và spa.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Tặng kèm <strong>Pate cao cấp miễn phí</strong> vào Thứ 4 & Thứ 5 hàng tuần.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Ưu tiên giữ phòng trong các dịp Lễ Tết cao điểm.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Miễn phí xem <strong>Camera trực tiếp 24/7</strong> và nhật ký chăm sóc qua App.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Points History */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-4">Lịch sử tích điểm & đổi quà</h3>
              <div className="divide-y divide-gray-100">
                {INITIAL_POINT_HISTORY.map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-gray-800">{item.desc}</p>
                      <p className="text-xs text-gray-400">{item.date} • {item.code}</p>
                    </div>
                    <span className={`font-black ${item.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.points} điểm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LỊCH SỬ GỬI MÈO */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {combinedBoardingList.map((stay, idx) => (
              <div 
                key={stay.id || idx}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-center gap-6"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-inner">
                  <img src={stay.image} alt={stay.petNames} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 text-center md:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                    <h4 className="text-lg font-bold text-gray-900">{stay.petNames}</h4>
                    <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                      stay.status === 'Đang lưu trú'
                        ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {stay.status}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-700 font-bold">
                    {stay.roomName} • <span className="text-gray-500 font-normal">{stay.packageDesc}</span>
                  </p>

                  <p className="text-xs text-gray-600 flex items-center justify-center md:justify-start gap-1.5 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Thời gian: <b>{stay.checkIn}</b> đến <b>{stay.checkOut}</b></span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                  {stay.status === 'Đang lưu trú' ? (
                    <button
                      onClick={() => navigate('/tracking', { state: { bookingData: stay } })}
                      className="px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Xem Camera & Nhật ký</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const inv = SAMPLE_TRANSACTIONS.find(t => t.id === stay.invoiceId) || SAMPLE_TRANSACTIONS[0];
                        openInvoice(inv);
                      }}
                      className="px-4 py-2 bg-emerald-50 text-[#00B16A] hover:bg-[#00B16A] hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Xem hóa đơn</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: LỊCH SỬ GIAO DỊCH & HÓA ĐƠN */}
        {activeTab === 'transactions' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 animate-in fade-in duration-200">
            <h3 className="text-xl font-black text-gray-900 mb-2">Lịch sử hóa đơn điện tử</h3>
            <div className="space-y-4">
              {SAMPLE_TRANSACTIONS.map((trans) => (
                <div 
                  key={trans.id}
                  className="p-5 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 transition shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {trans.code}
                      </span>
                      <span className="text-xs text-gray-400">{trans.date}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">{trans.service}</h4>
                    <p className="text-xs text-gray-500">Bé: {trans.petNames} • {trans.paymentMethod}</p>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <div className="text-left lg:text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Số tiền thanh toán</p>
                      <p className="text-lg font-black text-emerald-700">{formatVND(trans.amount)}</p>
                    </div>

                    <button
                      onClick={() => openInvoice(trans)}
                      className="px-4 py-2 bg-[#00B16A] hover:bg-[#009458] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem hóa đơn</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Invoice Modal Pop-up */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default CustomerProfile;
