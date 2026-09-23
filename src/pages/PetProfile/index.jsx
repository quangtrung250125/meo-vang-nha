import React, { useState } from 'react';
import {
  Info, Plus, Lock, PawPrint, BookOpen, History,
  ChevronDown, ChevronUp, CalendarDays, Utensils,
  Heart, Star, CheckCircle2, Clock, Sparkles, User2,
  Camera, Cat
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePetProfile } from '../../contexts/PetContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useBookingHistory, isBookingOfCustomer } from '../../contexts/BookingHistoryContext';
import PetForm from '../../components/PetForm';
import PetDashboardNav from '../../components/PetDashboardNav';
import AuthModal from '../../components/AuthModal';

// ─────────────────────────────────────────────
// Tạo nhật ký lưu trú mock theo ngày
// ─────────────────────────────────────────────
const MOODS = ['😸 Vui vẻ, ham chơi', '😴 Ngủ ngon, thư giãn', '🐱 Khỏe mạnh, bình thường', '😺 Tò mò, khám phá phòng', '🥰 Cưng xỉu, ngoan ngoãn'];
const FOODS = ['Ăn hết sạch 3 bữa 🍽️', 'Ăn tốt, còn dư ít pate', 'Ăn ngon miệng, thích súp thưởng', 'Ăn đủ 2 bữa chính + 1 bữa phụ'];
const ACTIVITIES = ['Chơi với đồ chơi lông vũ', 'Leo cây cào móng, tập thể dục', 'Nhìn ra cửa sổ ngắm chim', 'Ngủ cuộn tròn trong ổ ấm', 'Khám phá góc phòng mới'];
const NOTES = [
  'Bé ngoan, không quấy phá. Sức khỏe ổn định.',
  'Bé tự chải lông, dấu hiệu thư giãn tốt.',
  'Bé đến gần nhân viên, có vẻ quen môi trường rồi!',
  'Bé vui vẻ, hay phát ra tiếng purr dễ thương.',
  'Bé ổn định, không có dấu hiệu bất thường.'
];

const generateJournalEntries = (checkIn, checkOut, petName) => {
  if (!checkIn || !checkOut) return [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const entries = [];
  const current = new Date(start);
  let day = 1;

  while (current <= end && entries.length < 30) {
    const idx = (day - 1) % 5;
    entries.push({
      day,
      dateStr: current.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }),
      mood: MOODS[idx],
      food: FOODS[idx % FOODS.length],
      activity: ACTIVITIES[idx % ACTIVITIES.length],
      note: `${petName || 'Bé'}: ${NOTES[idx]}`,
    });
    current.setDate(current.getDate() + 1);
    day++;
  }
  return entries;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Đang lưu trú': return 'bg-primary-light text-primary';
    case 'Sắp tới': return 'bg-red-50 text-red-500';
    case 'Đã hoàn tất': return 'bg-green-50 text-green-600';
    default: return 'bg-gray-100 text-gray-500';
  }
};

const calculateStatus = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 'Chưa rõ';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const inDate = new Date(checkIn); inDate.setHours(0, 0, 0, 0);
  const outDate = new Date(checkOut); outDate.setHours(23, 59, 59, 999);
  if (today < inDate) return 'Sắp tới';
  if (today >= inDate && today <= outDate) return 'Đang lưu trú';
  return 'Đã hoàn tất';
};

// ─────────────────────────────────────────────
// Component: Booking Card kèm nhật ký
// ─────────────────────────────────────────────
const BookingCard = ({ booking, petList }) => {
  const [showJournal, setShowJournal] = useState(false);

  const dynamicPets = (booking.petIds || []).map(id => petList.find(p => p.id === id)).filter(Boolean);
  const resolvedPets = dynamicPets.length > 0 ? dynamicPets : (booking.petProfiles || []);
  const petsName = resolvedPets.map(p => p.name).join(', ') || 'Chưa rõ';
  const firstPetImage = resolvedPets[0]?.imagePreview;
  const status = calculateStatus(booking.checkIn, booking.checkOut);
  const journalEntries = generateJournalEntries(booking.checkIn, booking.checkOut, petsName);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border-2 border-gray-100">
          {firstPetImage
            ? <img src={firstPetImage} alt={petsName} className="w-full h-full object-cover" />
            : <PawPrint className="w-7 h-7 text-gray-300" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-text-dark">{petsName}</h3>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${getStatusBadge(status)}`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            {booking.selectedPackage?.name || 'Gói lưu trú'} 
            {booking.selectedRoom?.name ? ` • Phòng ${booking.selectedRoom.name}` : ''}
          </p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
            <span className="ml-2 text-gray-300">|</span>
            <span className="text-gray-400">#{booking.id?.slice(-6)}</span>
          </p>
        </div>

        {/* Journal Toggle Button */}
        {journalEntries.length > 0 && (
          <button
            onClick={() => setShowJournal(!showJournal)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 cursor-pointer shrink-0 ${
              showJournal
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white text-primary border-primary/30 hover:border-primary hover:bg-primary-light/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {showJournal ? 'Ẩn nhật ký' : 'Xem nhật ký'}
            {showJournal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Journal Entries */}
      {showJournal && journalEntries.length > 0 && (
        <div className="border-t border-gray-100 bg-[#FAFAF8] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-bold text-text-dark uppercase tracking-wider">Nhật Ký Lưu Trú</h4>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
            {journalEntries.map((entry) => (
              <div key={entry.day} className="flex gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary-light border-2 border-primary/30 flex items-center justify-center text-xs font-black text-primary">
                    {entry.day}
                  </div>
                  {entry.day < journalEntries.length && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[12px]" />
                  )}
                </div>

                {/* Entry content */}
                <div className="bg-white rounded-2xl border border-gray-100 p-3.5 flex-1 mb-2 shadow-xs">
                  <p className="text-xs font-bold text-gray-400 mb-2">{entry.dateStr}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{entry.mood}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{entry.food}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Star className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{entry.activity}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic border-t border-gray-50 pt-2">
                    📝 {entry.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const PetProfile = () => {
  const { petList, savePet } = usePetProfile();
  const { customerProfile, authenticatedCustomer, isAdmin, saveCustomerProfile, isAuthenticated } = useCustomerProfile();
  const { globalBookingList } = useBookingHistory();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isLoggedIn = isAuthenticated;

  const handleSavePet = (petData) => {
    setIsSaving(true);
    setTimeout(() => {
      savePet(petData);
      setIsSaving(false);
      setIsEditing(false);
      toast.success('Đã lưu hồ sơ thành công!');
    }, 800);
  };

  const handleAuthSubmit = async () => {
    setIsAuthOpen(false);
  };

  // ── LOGIN WALL ──────────────────────────────
  if (!isLoggedIn) {
    return (
      <>
        <div className="w-full min-h-screen bg-bg-cream flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-28 h-28 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10 border-4 border-white">
              <div className="relative">
                <Cat className="w-12 h-12 text-primary opacity-30" />
                <Lock className="w-6 h-6 text-primary absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full mb-4">
              <Lock className="w-3 h-3" />
              Yêu cầu đăng nhập
            </span>

            <h1 className="text-3xl font-extrabold text-text-dark font-title mb-3">
              Hồ Sơ Mèo Cưng
            </h1>
            <p className="text-gray-500 leading-relaxed mb-8">
              Đăng nhập để xem hồ sơ sức khỏe, lịch sử lưu trú và <strong>nhật ký chăm sóc hàng ngày</strong> của bé mèo.
            </p>

            {/* Benefits */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 text-left space-y-3">
              {[
                { icon: <PawPrint className="w-4 h-4 text-primary" />, text: 'Quản lý hồ sơ sức khỏe của các bé' },
                { icon: <History className="w-4 h-4 text-accent" />, text: 'Xem lịch sử các lần lưu trú' },
                { icon: <BookOpen className="w-4 h-4 text-emerald-500" />, text: 'Nhật ký chăm sóc từng ngày chi tiết' },
                { icon: <Camera className="w-4 h-4 text-blue-500" />, text: 'Theo dõi bé qua camera 24/24' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98] cursor-pointer text-base"
            >
              <User2 className="w-5 h-5" />
              Đăng nhập / Tạo hồ sơ
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Chỉ cần số điện thoại và mật khẩu đã đăng ký
            </p>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </>
    );
  }

  // ── LOGGED IN VIEW ──────────────────────────
  const activeCustomer = authenticatedCustomer || customerProfile;
  const displayName = activeCustomer?.fullName || activeCustomer?.name || 'bạn';
  const myBookings = globalBookingList.filter(b => isBookingOfCustomer(b, activeCustomer, isAdmin));
  const bookings = myBookings.map(b => ({
    ...b,
    dynamicStatus: calculateStatus(b.checkIn, b.checkOut),
  }));

  return (
    <div className="w-full min-h-screen bg-bg-cream pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 relative z-10">
        <PetDashboardNav 
          title="Hồ sơ của các bé" 
          subtitle="Quản lý thông tin thú cưng để chúng mình chăm sóc tốt hơn." 
        />
        {/* ── Tabs ── */}
        <div className="flex bg-white border border-gray-200 rounded-2xl p-1.5 mb-8 shadow-sm w-fit gap-1">
          {[
            { key: 'profile', label: 'Hồ sơ mèo', icon: <PawPrint className="w-4 h-4" /> },
            { key: 'history', label: `Lịch sử lưu trú (${bookings.length})`, icon: <History className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-gray-500 hover:text-primary hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Hồ sơ mèo ── */}
        {activeTab === 'profile' && (
          <>
            {isEditing ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <PetForm
                  initialData={editingPet}
                  onSave={handleSavePet}
                  onCancel={() => setIsEditing(false)}
                  isSaving={isSaving}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {/* Add new card */}
                <div
                  onClick={() => { setEditingPet(null); setIsEditing(true); }}
                  className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-light/30 transition-all min-h-[220px] group shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                    <Plus className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-text-dark font-bold text-lg group-hover:text-primary transition-colors">Thêm bé mèo mới</p>
                </div>

                {/* Existing pets */}
                {petList.map(pet => (
                  <div key={pet.id} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shadow-inner overflow-hidden shrink-0 border-2 border-white">
                        {pet.imagePreview
                          ? <img src={pet.imagePreview} alt={pet.name} className="w-full h-full object-cover" />
                          : <Info className="w-8 h-8 text-gray-400" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-text-dark">{pet.name}</h3>
                        <p className="text-gray-500 text-sm">{pet.age} tuổi • {pet.breed || 'Không rõ'}</p>
                        <span className="inline-block mt-1 bg-primary-light text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {pet.gender}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-50">
                      <button
                        onClick={() => { setEditingPet(pet); setIsEditing(true); }}
                        className="w-full bg-bg-cream text-primary font-bold py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors cursor-pointer"
                      >
                        Cập nhật thông tin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB: Lịch sử lưu trú ── */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            {bookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <PawPrint className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400">Chưa có lịch sử lưu trú</h3>
                <p className="text-gray-400 text-sm mt-2">Khi bé được gửi, nhật ký lưu trú sẽ hiển thị tại đây.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Tổng lần gửi', value: bookings.length, color: 'text-primary', bg: 'bg-primary-light/50' },
                    { label: 'Đang lưu trú', value: bookings.filter(b => b.dynamicStatus === 'Đang lưu trú').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Đã hoàn tất', value: bookings.filter(b => b.dynamicStatus === 'Đã hoàn tất').length, color: 'text-gray-600', bg: 'bg-gray-100' },
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} rounded-2xl p-4 text-center border border-white/60`}>
                      <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {bookings.map((booking, idx) => (
                  <BookingCard key={booking.id || idx} booking={booking} petList={petList} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PetProfile;
