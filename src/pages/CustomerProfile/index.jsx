import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  User, Award, Calendar, Receipt, Edit3, Save, CheckCircle, 
  ShieldCheck, Heart, Sparkles, PawPrint, Eye, ArrowRight, 
  Clock, MapPin, Phone, Mail, Gift, ChevronRight, Download, 
  RefreshCw, Star, Info, AlertCircle, Camera, Check, CreditCard,
  UserCheck, Crown, Bell, Smartphone, Send, ShieldAlert, Laptop
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useBookingHistory, isBookingOfCustomer } from '../../contexts/BookingHistoryContext';
import { usePetProfile } from '../../contexts/PetContext';
import { BOOKING_STATUS_CONFIG, getBookingStatus } from '../../utils/bookingStatus';
import InvoiceModal from '../../components/InvoiceModal';
import { useLoyalty } from '../../contexts/LoyaltyContext';
import { buildInvoice } from '../../utils/bookingInvoice';
import { LEDGER_TYPES, referralLinkFor } from '../../utils/loyalty';
import { ADDONS } from '../../components/ServiceManagement';
import {
  getPushSubscriptionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  testServerPushNotification,
  isPushNotificationSupported
} from '../../services/pushNotificationService';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { customerProfile, authenticatedCustomer, isAdmin, saveCustomerProfile } = useCustomerProfile();
  const { globalBookingList = [] } = useBookingHistory() || {};
  const { petList = [] } = usePetProfile() || {};

  const activeCustomer = authenticatedCustomer || customerProfile || {
    fullName: 'Khách hàng',
    phone: '',
    email: '',
    tier: 'bronze',
    points: 0,
    address: '',
    birthday: '',
    memberSince: '—',
    activeCatsCount: 0,
    avatar: DEFAULT_AVATAR
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'info';
  const [activeTab, setActiveTab] = useState(initialTab); // 'info' | 'tier' | 'history' | 'transactions' | 'notifications'
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Web Push Notification State
  const [pushStatus, setPushStatus] = useState({
    supported: true,
    permission: 'default',
    isSubscribed: false,
    subscription: null,
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [activeDevices, setActiveDevices] = useState([]);

  // Tải trạng thái Push Notification
  const refreshPushStatus = async () => {
    try {
      const status = await getPushSubscriptionStatus();
      setPushStatus(status);

      const userId = activeCustomer.id || activeCustomer.phone || 'ducan';
      const res = await fetch(`/api/notifications/status?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveDevices(data.devices || []);
      }
    } catch (e) {
      console.warn('Lỗi kiểm tra trạng thái Push Notification:', e);
    }
  };

  useEffect(() => {
    refreshPushStatus();
  }, [activeCustomer.id, activeCustomer.phone]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['info', 'tier', 'history', 'transactions', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Xử lý bật nhận thông báo
  const handleEnablePush = async () => {
    setIsSubscribing(true);
    try {
      const userId = activeCustomer.id || activeCustomer.phone || 'ducan';
      await subscribeToPush(userId);
      toast.success('🎉 Đã bật Web Push thành công! Bạn sẽ nhận được thông báo ngay cả khi đóng web.', {
        duration: 5000,
        icon: '🔔',
      });
      await refreshPushStatus();
    } catch (err) {
      toast.error(err.message || 'Không thể kích hoạt thông báo đẩy!', { duration: 6000 });
      await refreshPushStatus();
    } finally {
      setIsSubscribing(false);
    }
  };

  // Xử lý tắt nhận thông báo
  const handleDisablePush = async () => {
    setIsSubscribing(true);
    try {
      await unsubscribeFromPush();
      toast.success('Đã tắt nhận thông báo đẩy trên thiết bị này.');
      await refreshPushStatus();
    } catch (err) {
      toast.error('Lỗi khi tắt thông báo: ' + err.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Xử lý gửi thông báo thử nghiệm thực tế từ máy chủ
  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
      const userId = activeCustomer.id || activeCustomer.phone || 'ducan';
      const firstPetName = petList?.[0]?.name || activeCustomer.pets?.[0]?.name || 'Mimi';
      await testServerPushNotification(userId, firstPetName);
      toast.success('🚀 Đã gửi thông báo từ máy chủ! Kiểm tra thanh thông báo trên điện thoại hoặc máy tính của bạn.', {
        duration: 5000,
        icon: '🐱',
      });
    } catch (err) {
      toast.error('Gửi thử thất bại: ' + err.message);
    } finally {
      setIsTestingPush(false);
    }
  };

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
      customerTier: `Hạng ${tierName}`,
    };
    setSelectedInvoice(completeInvoice);
    setIsInvoiceOpen(true);
  };

  const myBookings = globalBookingList.filter(b => isBookingOfCustomer(b, activeCustomer, isAdmin));

  // Điểm thưởng, hạng, mã giới thiệu thật (máy chủ tính từ các đơn đã check-out)
  const { loyalty, loading: loyaltyLoading } = useLoyalty();
  const points = Number(loyalty?.points) || 0;
  const tierName = loyalty?.tier?.name || 'Đồng';
  const tierBenefits = loyalty?.tier?.benefits || [];
  const nextTier = loyalty?.nextTier || null;
  const spend = Number(loyalty?.spending?.spend) || 0;
  const completedCount = Number(loyalty?.spending?.completedCount) || 0;
  const referralCode = loyalty?.referralCode || '';
  const referralLink = referralCode ? referralLinkFor(referralCode, typeof window !== 'undefined' ? window.location.origin : undefined) : '';
  const referralSettings = loyalty?.referralSettings || {};
  const referrals = loyalty?.referrals || [];
  const referredCount = Number(loyalty?.referredCount) || 0;
  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã sao chép ${label}!`);
    } catch {
      toast.error('Trình duyệt chặn sao chép, bạn hãy bôi đen và sao chép thủ công.');
    }
  };

  // Hóa đơn thật của từng đơn (đã trừ mã giảm giá, điểm thưởng)
  const realTransactions = myBookings
    .filter(b => b.code || b.id)
    .map((b) => {
      const inv = buildInvoice(b, ADDONS);
      const positive = (inv?.lines || []).filter(l => l.amount > 0);
      const discounts = (inv?.lines || []).filter(l => l.amount < 0);
      const created = b.createdAt ? new Date(b.createdAt) : null;
      return {
        id: b.code || b.id,
        code: `#${b.code || b.id}`,
        date: created && !Number.isNaN(created.getTime()) ? created.toLocaleString('vi-VN') : '',
        createdAt: b.createdAt || '',
        service: (b.packages || []).join(' + ') || b.selectedPackage?.name || 'Lưu trú khách sạn mèo',
        roomName: b.roomId || b.selectedRoom?.id || '',
        stayPeriod: `${b.checkIn || ''} - ${inv?.checkOut || b.checkOut || ''} (${inv?.nights || 1} đêm)`,
        petNames: b.catNames || '',
        paymentMethod: b.paymentStatus || 'Chuyển khoản VietQR',
        status: BOOKING_STATUS_CONFIG[getBookingStatus(b)]?.label || 'Sắp tới',
        amount: inv?.total || 0,
        subTotal: positive.reduce((sum, l) => sum + l.amount, 0),
        discountLines: discounts.map(l => ({ label: l.label, amount: -l.amount })),
        deposit: inv?.received || 0,
        depositLabel: inv?.isPaidInFull ? 'Đã thanh toán' : 'Đã chuyển (cọc)',
        total: inv?.total || 0,
        totalLabel: 'Tổng phải thanh toán',
        promo: b.promo || null,
        items: positive.map(l => ({ name: l.label, note: l.detail, qty: '', price: l.amount, total: l.amount })),
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const transactionList = realTransactions;

  // Số bé đang gửi và ngày tham gia lấy từ dữ liệu thật thay vì số mẫu
  const todayStr = new Date().toISOString().slice(0, 10);
  const activeCatsCount = activeCustomer.activeCatsCount ?? myBookings
    .filter(b => b.checkIn && b.checkOut && b.checkIn <= todayStr && todayStr < b.checkOut
      && !['check-out', 'cancelled', 'Đã hủy', 'Đã hoàn tất', 'hoàn tất'].includes(b.status))
    .reduce((sum, b) => sum + (Number(b.cats) || b.petProfiles?.length || 1), 0);
  const memberSince = activeCustomer.memberSince
    || (activeCustomer.createdAt ? new Date(activeCustomer.createdAt).toLocaleDateString('vi-VN') : '—');

  const combinedBoardingList = myBookings.map(b => ({
    id: b.id || 'MVN-NEW',
    petNames: b.catNames || b.petName || 'Bé Miu Miu',
    roomName: b.selectedRoom?.name || b.roomType || 'Phòng Deluxe',
    packageDesc: b.selectedPackage?.name || b.serviceType || 'Lưu trú Khách Sạn',
    checkIn: b.checkIn || b.checkInDate || '',
    checkOut: b.checkOut || b.checkOutDate || '',
    status: BOOKING_STATUS_CONFIG[getBookingStatus(b)]?.label || 'Sắp tới',
    image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&auto=format&fit=crop&q=80',
    invoiceId: b.code || b.id || ''
  }));

  // Rút gọn tên bạn bè để bảo mật thông tin cá nhân (VD: "Nguyễn Văn A" -> "Nguyễn A.")
  const maskRefereeName = (name) => {
    if (!name) return 'Bạn mới';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first} ${last[0]}.`;
  };

  // Thẻ mã giới thiệu: khách A chia sẻ mã cho bạn (khách B) nhập khi tạo tài khoản
  const referralCard = (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 text-left space-y-3" data-testid="referral-card">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-orange-500" />
        <p className="text-sm font-black text-gray-900">Mã giới thiệu bạn mới</p>
      </div>
      {referralCode ? (
        <>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center justify-between gap-2 bg-white border-2 border-dashed border-orange-300 rounded-xl px-3 py-2">
              <span className="font-mono text-base font-black tracking-widest text-orange-600" data-testid="referral-code">{referralCode}</span>
              <button
                type="button"
                onClick={() => copyText(referralCode, 'mã giới thiệu')}
                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer transition shadow-xs"
              >
                Sao chép mã
              </button>
            </div>
            <button
              type="button"
              onClick={() => copyText(referralLink, 'đường link giới thiệu')}
              className="px-3 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>🔗 Sao chép link</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Gửi mã này cho bạn bè. Bạn bè nhập mã khi tạo tài khoản và hoàn tất (check-out) đơn đầu tiên thì bạn được ghi nhận
            đã giới thiệu 1 người{Number(referralSettings.referrerRewardPoints) > 0 && referralSettings.enabled !== false ? ` và nhận ${referralSettings.referrerRewardPoints} điểm thưởng` : ''}.
          </p>
          <div className="flex items-center justify-between text-xs bg-white rounded-xl px-3 py-2 border border-orange-100">
            <span className="text-gray-500">Đã giới thiệu thành công</span>
            <span className="font-black text-emerald-600" data-testid="referred-count">{referredCount} người</span>
          </div>
          {referrals.length > 0 && (
            <ul className="space-y-1.5 text-[11px]">
              {referrals.map((r, i) => (
                <li key={i} className="flex justify-between items-center gap-2 py-1 border-b border-orange-100/50 last:border-b-0">
                  <span className="font-semibold text-gray-700 truncate">{maskRefereeName(r.refereeName)}</span>
                  <span className={r.status === 'completed' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-semibold'}>
                    {r.status === 'completed' ? `Đã hoàn thành đơn đầu tiên${r.rewardPoints ? ` (+${r.rewardPoints} điểm)` : ''}` : 'Đang chờ đơn đầu tiên'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-500">{loyaltyLoading ? 'Đang tải mã giới thiệu...' : (activeCustomer?.id ? 'Chưa tải được mã giới thiệu, vui lòng tải lại trang.' : 'Đăng nhập để nhận mã giới thiệu của bạn.')}</p>
      )}
    </div>
  );

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
                <span className="px-3 py-0.5 bg-[#eab308] text-[#713f12] font-black text-xs rounded-md shadow-xs flex items-center gap-1" data-testid="profile-tier">
                  <span>👑</span>
                  <span>Hạng {tierName}</span>
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
                  <span>Đang gửi: <strong className="text-white font-black">{activeCatsCount} bé mèo</strong></span>
                </span>

                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 flex items-center gap-1.5 border border-white/10">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Điểm tích lũy: <strong className="text-amber-300 font-black" data-testid="profile-points">{points.toLocaleString('vi-VN')} điểm</strong></span>
                </span>

                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 flex items-center gap-1.5 border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-blue-300" />
                  <span>Thành viên từ: <strong className="text-white font-bold">{memberSince}</strong></span>
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
            onClick={() => {
              setActiveTab('transactions');
              setSearchParams({ tab: 'transactions' });
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-[#00B16A] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Lịch sử giao dịch & Hóa đơn</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('notifications');
              setSearchParams({ tab: 'notifications' });
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#00B16A] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Thông báo đẩy (Web Push)</span>
            {pushStatus.isSubscribed && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-white animate-pulse" />
            )}
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
                  <span className="font-bold text-amber-700 text-xs">Hạng {tierName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Điểm thưởng
                  </span>
                  <span className="font-black text-emerald-600 text-xs">{points.toLocaleString('vi-VN')} điểm</span>
                </div>
              </div>

              <div className="w-full mt-5">{referralCard}</div>

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
                  <p className="text-amber-100">Mã giới thiệu: <span className="font-mono text-white">{referralCode || '—'}</span></p>
                </div>
                <div className="flex justify-between items-end border-t border-amber-300/40 pt-4">
                  <div>
                    <p className="text-xs text-amber-100 uppercase">Điểm tích lũy</p>
                    <p className="text-3xl font-black" data-testid="tier-card-points">{points.toLocaleString('vi-VN')} <span className="text-sm font-normal">Điểm</span></p>
                    <p className="text-[11px] text-amber-100">1 điểm = {(Number(loyalty?.rules?.valuePerPoint) || 1000).toLocaleString('vi-VN')}đ khi trừ vào hóa đơn</p>
                  </div>
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black border border-white/30 tracking-wider uppercase">
                    👑 Hạng {tierName}
                  </span>
                </div>
              </div>

              {/* VIP Benefits */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-gray-900">Đặc quyền hạng {tierName} của bạn</h3>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  {tierBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                  <p>Chi tiêu đã hoàn tất: <strong className="text-gray-900">{spend.toLocaleString('vi-VN')}đ</strong> · {completedCount} đơn đã check-out</p>
                  {nextTier ? (
                    <>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.min(100, Number(loyalty?.tierProgress) || 0)}%` }} />
                      </div>
                      <p>
                        Lên hạng <strong>{nextTier.name}</strong> khi chi tiêu từ {Number(nextTier.minSpend || 0).toLocaleString('vi-VN')}đ
                        {Number(nextTier.minBookings) > 0 ? ` hoặc đủ ${nextTier.minBookings} đơn hoàn tất` : ''}.
                      </p>
                    </>
                  ) : (
                    <p className="font-bold text-emerald-600">Bạn đang ở hạng cao nhất.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Points History */}
              <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-1">Lịch sử tích điểm & dùng điểm</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Mỗi {(Number(loyalty?.rules?.spendForOnePoint) || 10000).toLocaleString('vi-VN')}đ của đơn đã check-out được 1 điểm (nhân hệ số hạng). Dùng điểm ở bước thanh toán khi đặt phòng.
                </p>
                <div className="divide-y divide-gray-100" data-testid="points-history">
                  {(loyalty?.ledger || []).length === 0 && (
                    <p className="py-6 text-sm text-gray-400 text-center">Chưa có giao dịch điểm nào. Hoàn tất đơn gửi mèo đầu tiên để nhận điểm!</p>
                  )}
                  {(loyalty?.ledger || []).map(item => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-bold text-gray-800">{item.reason}</p>
                        <p className="text-xs text-gray-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{item.at ? new Date(item.at).toLocaleString('vi-VN') : ''}</span>
                          <span>•</span>
                          <span className="font-medium text-gray-600">{LEDGER_TYPES[item.type]?.label || item.type}</span>
                          {item.bookingCode && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">#{item.bookingCode}</span>
                            </>
                          )}
                          {item.balanceAfter !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-gray-500 font-medium">Số dư: <strong className="text-gray-700">{Number(item.balanceAfter).toLocaleString('vi-VN')}</strong></span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-black text-sm block ${item.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.delta >= 0 ? '+' : ''}{item.delta} điểm
                        </span>
                        {item.balanceAfter !== undefined && (
                          <span className="text-[11px] text-gray-400 font-medium block">
                            Số dư: {Number(item.balanceAfter).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>{referralCard}</div>
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
                        const inv = transactionList.find(t => t.id === stay.invoiceId) || transactionList[0];
                        if (inv) openInvoice(inv);
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
              {transactionList.length === 0 && (
                <p className="py-8 text-sm text-gray-400 text-center">Bạn chưa có hóa đơn nào. Đặt phòng cho bé để bắt đầu nhé!</p>
              )}
              {transactionList.map((trans) => (
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
                    <p className="text-xs text-gray-500">Bé: {trans.petNames} • {trans.paymentMethod}{trans.status && trans.discountLines ? ` • ${trans.status}` : ''}</p>
                    {trans.discountLines?.length > 0 && (
                      <p className="text-xs font-semibold text-emerald-700">
                        Đã giảm: {trans.discountLines.map(d => `${d.label} -${d.amount.toLocaleString('vi-VN')}đ`).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <div className="text-left lg:text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{trans.discountLines ? 'Tổng phải thanh toán' : 'Số tiền thanh toán'}</p>
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

        {/* TAB 5: CÀI ĐẶT THÔNG BÁO ĐẨY (WEB PUSH NOTIFICATION) */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Status & Control Banner Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      pushStatus.isSubscribed
                        ? 'bg-emerald-100 text-[#00B16A]'
                        : pushStatus.permission === 'denied'
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    <Bell className="w-7 h-7" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-title">
                        Thông báo đẩy trực tiếp (Web Push)
                      </h3>

                      {/* Status Badge */}
                      {pushStatus.isSubscribed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Đã bật thông báo</span>
                        </span>
                      ) : pushStatus.permission === 'denied' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Đã bị chặn trên trình duyệt</span>
                        </span>
                      ) : !pushStatus.supported ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-800">
                          <span>Không hỗ trợ Push API</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                          <span>Chưa bật thông báo</span>
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
                      {pushStatus.isSubscribed
                        ? 'Thiết bị này đã được kết nối với máy chủ Mèo Vắng Nhà. Bạn sẽ nhận thông báo âm thanh và tin nhắn đẩy ngay cả khi đã tắt website hoặc đang dùng ứng dụng khác!'
                        : pushStatus.permission === 'denied'
                        ? 'Quyền thông báo đang bị chặn. Vui lòng nhấn vào biểu tượng Ổ khóa trên thanh địa chỉ URL để mở lại quyền cho trang web.'
                        : 'Bật thông báo đẩy để nhận ngay báo cáo tình hình của bé mèo, ảnh chụp mới nhất và nhắc lịch nhận phòng chu đáo.'}
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                  {pushStatus.isSubscribed ? (
                    <>
                      <button
                        onClick={handleTestPush}
                        disabled={isTestingPush}
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#00B16A] hover:bg-[#009458] text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isTestingPush ? 'Đang gửi...' : 'Gửi thông báo thử'}</span>
                      </button>

                      <button
                        onClick={handleDisablePush}
                        disabled={isSubscribing}
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <span>Tắt thông báo</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEnablePush}
                      disabled={isSubscribing || !pushStatus.supported}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#00B16A] hover:bg-[#009458] text-white font-black text-sm shadow-lg shadow-emerald-700/30 active:scale-95 transition cursor-pointer disabled:opacity-50"
                    >
                      <Bell className="w-5 h-5 animate-bounce" />
                      <span>{isSubscribing ? 'Đang kích hoạt...' : 'Bật thông báo ngay'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Device Info Summary */}
              <div className="pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">Thiết bị hiện tại</p>
                    <p className="text-gray-500 truncate max-w-xs">{navigator.userAgent.slice(0, 32)}...</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Laptop className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">Số thiết bị liên kết</p>
                    <p className="text-gray-500">{activeDevices.length || (pushStatus.isSubscribed ? 1 : 0)} thiết bị đang nhận</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">Chuẩn bảo mật VAPID</p>
                    <p className="text-gray-500">Mã hóa đầu cuối End-to-End</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Scenarios Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>🐱 Các thông báo bạn sẽ nhận được</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                    <span>🎉 Xác nhận đặt phòng</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Ngay khi phòng được xếp và duyệt thành công, máy bạn sẽ nhận thông báo tức thời.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-800 font-extrabold text-sm">
                    <span>⏰ Nhắc lịch nhận phòng</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Nhắc trước giờ đưa bé đến để ba mẹ chủ động sắp xếp thời gian tiện lợi.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
                    <span>🍽️ Nhật ký ăn uống & Chăm sóc</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Nhân viên cập nhật khi bé ăn pate, vui chơi hoặc được vệ sinh chải lông.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-800 font-extrabold text-sm">
                    <span>📸 Ảnh & Video mới của bé</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Bấm vào thông báo để xem trực tiếp các khoảnh khắc đáng yêu của bé tại phòng.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                    <span>🏠 Hoàn tất lưu trú (Check-out)</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Thông báo tổng kết kỳ nghỉ dưỡng và hóa đơn thanh toán điện tử.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-800 font-extrabold text-sm">
                    <span>🎁 Ưu đãi & Quà tặng Thứ Tư</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Nhận thông báo tặng Pate miễn phí định kỳ vào mỗi Thứ Tư hàng tuần.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Guidelines for Android & iOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Android Instructions */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-gray-900 font-black text-base">
                  <span className="text-xl">🤖</span>
                  <span>Hướng dẫn trên điện thoại Android</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Android hỗ trợ Web Push Notification trực tiếp trên <strong>Google Chrome, Cốc Cốc, Brave, Samsung Internet</strong>.
                </p>
                <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
                  <li>Chỉ cần bấm nút <strong>"Bật thông báo ngay"</strong> ở trên.</li>
                  <li>Khi hộp thoại hiện ra, chọn <strong>"Cho phép" (Allow)</strong>.</li>
                  <li>Có thể cài đặt ứng dụng vào màn hình chính bằng cách bấm <strong>"Thêm vào Màn hình chính"</strong> trong menu trình duyệt.</li>
                </ul>
              </div>

              {/* iOS Instructions */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-gray-900 font-black text-base">
                  <span className="text-xl">🍎</span>
                  <span>Hướng dẫn trên iPhone & iPad (iOS 16.4+)</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apple hỗ trợ Web Push cho PWA từ iOS 16.4 trở lên theo các bước chuẩn:
                </p>
                <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Mở website bằng trình duyệt <strong>Safari</strong>.</li>
                  <li>Bấm vào biểu tượng <strong>Chia sẻ (Share 📤)</strong> ở thanh dưới cùng của Safari.</li>
                  <li>Cuộn xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen ➕)</strong>.</li>
                  <li>Mở icon <strong>Mèo Vắng Nhà</strong> vừa xuất hiện trên màn hình chính và bấm nút <strong>"Bật thông báo"</strong>.</li>
                </ol>
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
