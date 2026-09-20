import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Award, Calendar, Receipt, Edit3, Save, CheckCircle, 
  ShieldCheck, Heart, Sparkles, PawPrint, Eye, ArrowRight, 
  Clock, MapPin, Phone, Mail, Gift, ChevronRight, Download, 
  RefreshCw, Star, Info, AlertCircle, Camera, Check, CreditCard
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import InvoiceModal from '../../components/InvoiceModal';

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
    customerName: 'Nguyễn Đức An',
    customerPhone: '0912 345 678',
    customerEmail: 'ducan070@gmail.com',
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
    customerName: 'Nguyễn Đức An',
    customerPhone: '0912 345 678',
    customerEmail: 'ducan070@gmail.com',
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
    customerName: 'Nguyễn Đức An',
    customerPhone: '0912 345 678',
    customerEmail: 'ducan070@gmail.com',
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
  const { user, customerProfile, updateProfile } = useAuth();
  const { globalBookingList } = useBookingHistory();
  const { petList } = usePetProfile();

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'tier' | 'history' | 'transactions'
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: customerProfile?.fullName || 'Nguyễn Đức An',
    phone: customerProfile?.phone || '0912 345 678',
    email: customerProfile?.email || user?.email || 'ducan070@gmail.com',
    address: customerProfile?.address || 'Số 45, Phố Đặng Văn Ngữ, Đống Đa, Hà Nội',
    birthday: customerProfile?.birthday || '1995-08-15',
    notes: customerProfile?.notes || 'Bé mèo Miu nhà mình hơi nhút nhát, cần chuồng yên tĩnh và phòng ấm áp.',
    avatar: customerProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  // Selected invoice for modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
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
    // Merge full customer info into the invoice
    const completeInvoice = {
      ...transaction,
      customerName: formData.fullName || transaction.customerName,
      customerPhone: formData.phone || transaction.customerPhone,
      customerEmail: formData.email || transaction.customerEmail,
      customerTier: customerProfile?.tier ? `Thành viên ${customerProfile.tier}` : 'Thành viên Vàng',
    };
    setSelectedInvoice(completeInvoice);
    setIsInvoiceOpen(true);
  };

  // Combine dynamic context bookings with default list
  const combinedBoardingList = [
    ...(globalBookingList.map(b => ({
      id: b.id || 'MVN-NEW',
      petNames: (b.petProfiles || []).map(p => p.name).join(', ') || 'Bé mèo',
      roomName: b.selectedRoom?.name ? `Phòng ${b.selectedRoom.name}` : 'Phòng Tiêu Chuẩn',
      packageDesc: b.selectedPackage?.name || 'Gói Chăm Sóc',
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      status: 'Đang lưu trú',
      image: b.petProfiles?.[0]?.imagePreview || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80',
      invoiceId: 'MVN-2026-8891'
    }))),
    ...DEFAULT_BOARDING_HISTORY
  ];

  const formatVND = (num) => Number(num || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="w-full min-h-screen bg-bg-cream pb-16">
      <Toaster position="top-center" />

      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 text-white relative overflow-hidden">
        {/* Decorative background pawprints */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex justify-between items-center px-12">
          <PawPrint className="w-96 h-96 -rotate-12" />
          <PawPrint className="w-96 h-96 rotate-12" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            
            {/* Left: Avatar & Customer Primary Info */}
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-white/20 shadow-xl bg-white/10 flex items-center justify-center">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt={formData.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-white/80" />
                  )}
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute -bottom-2 -right-2 p-2 bg-accent hover:bg-accent-hover text-white rounded-xl shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  title="Chỉnh sửa ảnh"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-title">{formData.fullName}</h1>
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                    👑 Hạng {customerProfile?.tier || 'Vàng'}
                  </span>
                </div>
                <p className="text-emerald-100 text-sm flex items-center justify-center sm:justify-start gap-2 mb-3">
                  <Mail className="w-3.5 h-3.5 opacity-80" /> {formData.email} • 
                  <Phone className="w-3.5 h-3.5 opacity-80" /> {formData.phone}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-emerald-200">
                  <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/10">
                    🐾 Đang gửi: <b className="text-white">2 bé mèo</b>
                  </span>
                  <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/10">
                    ⭐ Điểm tích lũy: <b className="text-amber-300 font-bold">{customerProfile?.points || 850} điểm</b>
                  </span>
                  <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/10">
                    📅 Thành viên từ: <b className="text-white">{customerProfile?.joinDate || '01/2025'}</b>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/booking"
                className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-bold rounded-2xl shadow-lg shadow-orange-950/20 transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <PawPrint className="w-4 h-4" />
                <span>Đặt phòng ngay</span>
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        
        {/* Navigation Tabs Bar */}
        <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-100 flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-primary text-white shadow-md shadow-emerald-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            onClick={() => setActiveTab('tier')}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'tier'
                ? 'bg-primary text-white shadow-md shadow-emerald-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Điểm & Hạng VIP</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-md shadow-emerald-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch sử gửi mèo</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-primary text-white shadow-md shadow-emerald-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Lịch sử giao dịch & Hóa đơn</span>
          </button>
        </div>

        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {/* Left Column: Quick Profile Summary Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden shadow-inner mb-4 border-2 border-emerald-100">
                  <img src={formData.avatar} alt={formData.fullName} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-text-dark">{formData.fullName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{formData.email}</p>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-left text-xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> Số điện thoại</span>
                    <span className="font-bold text-text-dark">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" /> Hạng thành viên</span>
                    <span className="font-bold text-amber-600">Hạng Vàng VIP</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /> Điểm thưởng</span>
                    <span className="font-bold text-primary">{customerProfile?.points || 850} điểm</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full mt-6 py-2.5 px-4 bg-emerald-50 text-primary hover:bg-primary hover:text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa thông tin'}</span>
                </button>
              </div>

              {/* Pets Quick Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-text-dark text-sm flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-primary" />
                    <span>Bé cưng của bạn ({petList.length || 2})</span>
                  </h4>
                  <Link to="/pet-profile" className="text-xs font-bold text-primary hover:underline">
                    Quản lý
                  </Link>
                </div>

                <div className="space-y-3">
                  {(petList.length > 0 ? petList : [
                    { id: '1', name: 'Miu Miu', breed: 'Mèo Anh Lông Ngắn', age: '2', gender: 'Cái', avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&auto=format&fit=crop&q=80' },
                    { id: '2', name: 'Bánh Bao', breed: 'Mèo Ba Tư Trắng', age: '1.5', gender: 'Đực', avatar: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=100&auto=format&fit=crop&q=80' }
                  ]).map((pet, idx) => (
                    <div key={pet.id || idx} className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shrink-0 border border-gray-200">
                        <img 
                          src={pet.imagePreview || pet.avatar || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&auto=format&fit=crop&q=80'} 
                          alt={pet.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-dark text-xs truncate">{pet.name}</p>
                        <p className="text-[11px] text-gray-400">{pet.breed || 'Mèo ta'} • {pet.age} tuổi</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        {pet.gender || 'Đã tiêm'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Information & Edit Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-text-dark font-title">Hồ sơ khách hàng</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Cập nhật thông tin để khách sạn liên hệ và đón bé thuận tiện nhất.
                    </p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-secondary transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-200 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Cập nhật</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-text-dark focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-text-dark focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-text-dark focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                      />
                    </div>

                    {/* Birthday */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-text-dark focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                      />
                    </div>

                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Địa chỉ nhà riêng / Đón trả mèo
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="VD: Số 45, Phố Đặng Văn Ngữ, Đống Đa, Hà Nội"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-text-dark focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                    />
                  </div>

                  {/* Avatar URL / Image */}
                  {isEditing && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Link ảnh đại diện (Avatar URL)
                      </label>
                      <input
                        type="url"
                        name="avatar"
                        value={formData.avatar}
                        onChange={handleInputChange}
                        placeholder="https://..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-text-dark focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  )}

                  {/* Special Notes */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Ghi chú / Yêu cầu đặc biệt cho Pet Hotel
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Thói quen ăn uống, dị ứng, tính cách đặc thù của các bé..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-text-dark focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-600 transition-colors resize-none"
                    />
                  </div>

                  {/* Actions when editing */}
                  {isEditing && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Lưu thay đổi</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ĐIỂM & HẠNG THÀNH VIÊN VIP */}
        {activeTab === 'tier' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* VIP Card Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Gold VIP Member Card Visual */}
              <div className="md:col-span-1">
                <div className="bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 text-white p-6 rounded-3xl shadow-xl shadow-amber-900/20 relative overflow-hidden flex flex-col justify-between min-h-[220px] border border-amber-300/30">
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-amber-200">MÈO VÀNG NHÀ VIP</p>
                      <h4 className="text-xl font-extrabold font-title flex items-center gap-1.5 mt-0.5">
                        <span>Hạng Vàng</span>
                        <span>👑</span>
                      </h4>
                    </div>
                    <PawPrint className="w-8 h-8 text-amber-200/80" />
                  </div>

                  <div className="relative z-10 my-4">
                    <p className="text-xs text-amber-100 font-mono tracking-wider">#VIP-8899-2026</p>
                    <p className="text-lg font-extrabold mt-1">{formData.fullName}</p>
                  </div>

                  <div className="flex justify-between items-end text-xs text-amber-100 relative z-10 pt-2 border-t border-amber-400/30">
                    <div>
                      <span className="text-[10px] text-amber-200/80 block">Điểm khả dụng</span>
                      <b className="text-base text-white font-extrabold">{customerProfile?.points || 850} điểm</b>
                    </div>
                    <span className="font-semibold text-[11px] bg-black/20 px-2.5 py-1 rounded-lg">Có giá trị trọn đời</span>
                  </div>
                </div>
              </div>

              {/* Tier Progress & Next Level */}
              <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-text-dark font-title">Tiến trình nâng hạng Kim Cương</h3>
                    <span className="text-xs font-bold text-primary bg-emerald-50 px-3 py-1 rounded-full">
                      850 / 1.000 điểm (85%)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-6">
                    Chỉ cần tích lũy thêm <b className="text-amber-600">150 điểm</b> (tương đương 1 kỳ lưu trú 3 ngày) để mở khóa đặc quyền Hạng Kim Cương!
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden p-0.5 mb-6 border border-gray-200">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-full transition-all duration-1000 shadow-inner"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                </div>

                {/* Next Tier Teaser */}
                <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 text-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-base shrink-0">
                    💎
                  </div>
                  <div>
                    <h5 className="font-bold text-amber-900">Đặc quyền sắp mở: Hạng Kim Cương</h5>
                    <p className="text-amber-700 text-[11px] mt-0.5">
                      Giảm trực tiếp 15% tất cả hóa đơn, đưa đón miễn phí bán kính 10km, tặng quà sinh nhật cao cấp cho mèo.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* 4 Tiers Privilege Comparison */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-text-dark font-title mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>Bảng quyền lợi thành viên Mèo Vàng Nhà</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Tier Bronze */}
                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🥉</span>
                    <div>
                      <h4 className="font-bold text-text-dark text-sm">Hạng Đồng</h4>
                      <p className="text-[11px] text-gray-400">0 - 299 điểm</p>
                    </div>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-2 mt-2 flex-1">
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Tích 1 điểm cho mỗi 10.000đ chi tiêu</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Tặng pate khai vị cho mèo khi check-in</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Giảm 3% dịch vụ spa tắm cắt</li>
                  </ul>
                </div>

                {/* Tier Silver */}
                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🥈</span>
                    <div>
                      <h4 className="font-bold text-text-dark text-sm">Hạng Bạc</h4>
                      <p className="text-[11px] text-gray-400">300 - 599 điểm</p>
                    </div>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-2 mt-2 flex-1">
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Giảm 5% toàn bộ hóa đơn</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Ưu tiên nhận phòng sớm miễn phí 2 tiếng</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Miễn phí chải lông & sấy dưỡng</li>
                  </ul>
                </div>

                {/* Tier Gold (Current) */}
                <div className="p-5 rounded-2xl border-2 border-amber-400 bg-amber-50/40 flex flex-col relative shadow-md">
                  <div className="absolute -top-3 right-4 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                    ĐANG ĐẠT
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">👑</span>
                    <div>
                      <h4 className="font-bold text-amber-950 text-sm">Hạng Vàng</h4>
                      <p className="text-[11px] text-amber-700">600 - 999 điểm</p>
                    </div>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-2 mt-2 flex-1">
                    <li className="flex items-start gap-1.5 font-semibold"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Giảm trực tiếp 10% mọi dịch vụ</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Đưa đón mèo miễn phí bán kính 5km</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Tặng voucher sinh nhật 200.000đ</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Miễn phí nâng cấp phòng VIP dịp lễ</li>
                  </ul>
                </div>

                {/* Tier Diamond */}
                <div className="p-5 rounded-2xl border border-cyan-200 bg-cyan-50/40 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">💎</span>
                    <div>
                      <h4 className="font-bold text-cyan-950 text-sm">Hạng Kim Cương</h4>
                      <p className="text-[11px] text-cyan-700">Từ 1.000 điểm</p>
                    </div>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-2 mt-2 flex-1">
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" /> Giảm trực tiếp 15% trọn đời</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" /> Đưa đón miễn phí 10km</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" /> Camera AI Full HD xem 24/7</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" /> Bác sĩ thú y kiểm tra sức khỏe tận nơi</li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Point History Table */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-text-dark font-title mb-4">Lịch sử biến động điểm</h3>
              
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Ngày</th>
                      <th className="py-3 px-4">Nội dung</th>
                      <th className="py-3 px-4">Mã đơn</th>
                      <th className="py-3 px-4 text-right">Biến động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {INITIAL_POINT_HISTORY.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-gray-500">{item.date}</td>
                        <td className="py-3 px-4 font-medium text-text-dark">{item.desc}</td>
                        <td className="py-3 px-4 text-gray-400 font-mono">{item.code}</td>
                        <td className="py-3 px-4 text-right font-extrabold">
                          <span className={item.type === 'earn' ? 'text-emerald-600' : 'text-red-500'}>
                            {item.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LỊCH SỬ GỬI MÈO */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-text-dark font-title">Lịch sử lưu trú của các bé</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Theo dõi danh sách các lần gửi mèo tại Mèo Vàng Nhà và trạng thái chăm sóc.
                </p>
              </div>
              <Link
                to="/booking"
                className="px-5 py-2.5 bg-primary hover:bg-secondary text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <PawPrint className="w-4 h-4" />
                <span>Đặt phòng mới</span>
              </Link>
            </div>

            <div className="space-y-4">
              {combinedBoardingList.map((stay, idx) => (
                <div 
                  key={stay.id || idx}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center gap-6"
                >
                  {/* Pet Image */}
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-emerald-100 shrink-0 shadow-inner">
                    <img src={stay.image} alt={stay.petNames} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left space-y-1">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                      <h4 className="text-lg font-bold text-text-dark">{stay.petNames}</h4>
                      <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                        stay.status === 'Đang lưu trú'
                          ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                          : stay.status === 'Sắp tới'
                          ? 'bg-amber-100 text-amber-700'
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

                    <p className="text-[11px] text-gray-400">Mã đơn lưu trú: #{stay.id}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                    {stay.status === 'Đang lưu trú' ? (
                      <button
                        onClick={() => navigate('/tracking', { state: { bookingData: stay } })}
                        className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-1.5 cursor-pointer"
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
                        className="px-4 py-2 bg-emerald-50 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Xem hóa đơn</span>
                      </button>
                    )}

                    <Link
                      to="/booking"
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors text-center border border-gray-200 cursor-pointer"
                    >
                      Đặt lại phòng này
                    </Link>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 4: LỊCH SỬ GIAO DỊCH & HÓA ĐƠN CHI TIẾT */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-text-dark font-title">Lịch sử giao dịch & Hóa đơn</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Bấm vào từng giao dịch để xem phiếu thanh toán điện tử chi tiết và in ấn.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Bảo mật giao dịch bởi PetHotel Pay</span>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-4">
                {SAMPLE_TRANSACTIONS.map((trans) => (
                  <div 
                    key={trans.id}
                    className="p-5 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50/60 transition-colors shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-extrabold text-primary bg-emerald-50 px-2.5 py-0.5 rounded-md">
                          {trans.code}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {trans.date}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          {trans.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-text-dark text-sm">{trans.service}</h4>
                      <p className="text-xs text-gray-500">
                        Bé mèo: <span className="font-semibold text-text-dark">{trans.petNames}</span> • 
                        Phương thức: <span className="font-semibold text-text-dark">{trans.paymentMethod}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      <div className="text-left lg:text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Số tiền thanh toán</p>
                        <p className="text-lg font-extrabold text-emerald-700">{formatVND(trans.amount)}</p>
                      </div>

                      <button
                        onClick={() => openInvoice(trans)}
                        className="px-4 py-2.5 bg-primary hover:bg-secondary text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem hóa đơn</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

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
