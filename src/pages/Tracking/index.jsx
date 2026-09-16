import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Droplets, 
  Smile, 
  HeartPulse, 
  Loader2, 
  Sparkles, 
  Video, 
  Camera as CameraIcon, 
  Mic, 
  MicOff, 
  Moon, 
  Sun, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { usePetProfile } from '../../contexts/PetContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import cameraFeed from '../../assets/images/camera_feed.png';

const trackingData = {
  eating: { 
    status: 'Bỏ ăn', 
    meals: '1/3 bữa', 
    details: 'Chỉ ăn một ít thức ăn mềm, không động vào hạt cứng. Đã bổ sung súp thưởng dinh dưỡng lúc 14:00.',
    dietPlan: 'Sáng: Hạt Royal Canin (15g) - Trưa: Pate Cá Hồi Ciao (1 gói) - Tối: Hạt dinh dưỡng + Men vi sinh',
    waterIntake: 'Khoảng 120ml nước sạch (Đạt 80% tiêu chuẩn)'
  },
  hygiene: { 
    status: 'Bình thường', 
    times: '2/2 lần', 
    details: 'Phân khuôn khô, nước tiểu lượng bình thường, không có dấu hiệu bế tắc đường tiểu.',
    litterBox: 'Cát đậu nành hữu cơ, dọn dẹp và khử trùng 3 lần/ngày lúc 08:30, 14:00 và 20:00.',
    cleaningNotes: 'Đã thay mới 30% cát và khử mùi ion lúc 14:15.'
  },
  mood: { 
    status: 'Stress', 
    activities: 'Nằm một chỗ trong ổ bông, kêu meo meo khi có tiếng động lớn. Buổi chiều đã chịu để nhân viên gãi cằm 5 phút.',
    stressScore: 'Trung bình (Cần theo dõi thêm)',
    interactionTime: '30 phút chơi với bóng lăn và cần câu lông vũ.'
  },
  health: { 
    status: 'Bình thường', 
    details: 'Nhịp thở đều, thân nhiệt ổn định (38.5°C), mắt mũi sạch sẽ không rỉ dịch.',
    temp: '38.5°C',
    weight: '4.5 kg'
  },
  timelineLogs: [
    { type: 'eating', time: '08:00', text: 'Ăn sáng (Bỏ mứa một ít hạt)' },
    { type: 'hygiene', time: '10:30', text: 'Đi vệ sinh (Tiểu bình thường)' },
    { type: 'mood', time: '12:00', text: 'Ngủ trưa trên đệm êm, cuộn tròn' },
    { type: 'mood', time: '15:00', text: 'Hơi stress, trốn trong góc khi có khách' },
    { type: 'eating', time: '18:00', text: 'Ăn tối (Đã ăn hết 1 gói pate cá hồi)' },
    { type: 'health', time: '19:00', text: 'Kiểm tra nhiệt độ & cân nặng (Ổn định 38.5°C)' }
  ]
};

const tabKeys = {
  overview: 'Tổng quan',
  eating: 'Ăn uống',
  hygiene: 'Vệ sinh',
  mood: 'Tâm trạng',
  camera: 'Camera'
};

const reverseTabKeys = {
  'Tổng quan': 'overview',
  'Ăn uống': 'eating',
  'Vệ sinh': 'hygiene',
  'Tâm trạng': 'mood',
  'Camera': 'camera'
};

const Tracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCameraUnlocked, setIsCameraUnlocked] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Camera interactive states
  const [isNightMode, setIsNightMode] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));

  const location = useLocation();
  const navigate = useNavigate();
  const { petList } = usePetProfile();
  const { globalBookingList } = useBookingHistory();

  // Tab mapping with URL params
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => {
    return tabKeys[tabParam] || 'Tổng quan';
  });

  useEffect(() => {
    if (tabParam && tabKeys[tabParam]) {
      setActiveTab(tabKeys[tabParam]);
    }
  }, [tabParam]);

  // Keep time updated for live camera feed
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current active booking
  const [selectedBookingId, setSelectedBookingId] = useState(() => {
    if (location.state?.bookingData?.id) return location.state.bookingData.id;
    const active = globalBookingList.find(b => b.dynamicStatus === 'Đang lưu trú');
    return active ? active.id : (globalBookingList[0]?.id || 'demo');
  });

  const bookingData = globalBookingList.find(b => b.id === selectedBookingId) || location.state?.bookingData || globalBookingList[0] || {
    id: 'MVN-88231',
    checkIn: '2026-09-14',
    checkOut: '2026-09-19',
    dynamicStatus: 'Đang lưu trú',
    selectedPackage: { name: 'Gói VIP Hoàng Gia' },
    selectedRoom: { name: 'Deluxe Suite 01' },
    petProfiles: [{ name: 'Bé Bơ', breed: 'Mèo Anh Lông Ngắn' }]
  };

  const dynamicPets = (bookingData.petIds || []).map(id => petList.find(p => p.id === id)).filter(Boolean);
  const resolvedPets = dynamicPets.length > 0 ? dynamicPets : (bookingData.petProfiles || []);
  const petsName = resolvedPets.map(p => p.name).join(', ') || 'các bé';
  
  const formatDateRange = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '';
    const format = (d) => {
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return d;
    };
    return `${format(checkIn)} - ${format(checkOut)}`;
  };
  
  const getBadgeColorHeader = (status) => {
    switch (status) {
      case 'Đang lưu trú': return 'bg-primary-light text-primary border border-primary/20';
      case 'Sắp tới': return 'bg-red-50 text-red-500 border border-red-200';
      case 'Đã hoàn tất': return 'bg-green-50 text-green-600 border border-green-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleSelectTab = (tabName) => {
    setActiveTab(tabName);
    const key = reverseTabKeys[tabName] || 'overview';
    setSearchParams({ tab: key });
  };

  const handlePaymentConfirm = () => {
    setIsVerifying(true);
    setTimeout(() => {
      toast.success('Thanh toán thành công! Camera đã được mở khóa 24/7.');
      setIsCameraUnlocked(true);
      setShowQRModal(false);
      setIsVerifying(false);
    }, 1500);
  };

  const handleSnapshot = () => {
    toast.success('Đã lưu ảnh chụp camera khoảnh khắc của bé!');
  };

  const toggleMic = () => {
    if (!isCameraUnlocked) {
      setShowQRModal(true);
      return;
    }
    setIsMicOn(!isMicOn);
    if (!isMicOn) {
      toast.success('Đang kết nối micro. Bạn có thể nói chuyện với bé!');
    } else {
      toast('Đã tắt micro');
    }
  };

  const getStatusColor = (status) => {
    const badStatuses = ['Bỏ ăn', 'Tiêu chảy', 'Stress'];
    if (badStatuses.includes(status)) {
      return 'text-red-500 shake-animation font-extrabold';
    }
    if (['Bình thường', 'Vui vẻ', 'Ổn định'].includes(status)) {
      return 'text-primary font-bold';
    }
    return 'text-gray-600';
  };

  const sortedTimeline = [...trackingData.timelineLogs].sort((a, b) => b.time.localeCompare(a.time));

  const getIconForType = (type) => {
    switch (type) {
      case 'eating': return <Utensils className="w-4 h-4 text-orange-500" />;
      case 'hygiene': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'mood': return <Smile className="w-4 h-4 text-purple-500" />;
      case 'health': return <HeartPulse className="w-4 h-4 text-red-500" />;
      default: return <Sparkles className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = ['Tổng quan', 'Ăn uống', 'Vệ sinh', 'Tâm trạng', 'Camera'];

  const renderTabContent = () => {
    // TAB: TỔNG QUAN
    if (activeTab === 'Tổng quan') {
      return (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 animate-in fade-in slide-in-from-bottom-4">
            {[
              { icon: Utensils, title: 'Ăn uống', status: trackingData.eating.status, sub: trackingData.eating.meals, tabTarget: 'Ăn uống', color: 'text-amber-500', bg: 'bg-amber-50' },
              { icon: Droplets, title: 'Đi vệ sinh', status: trackingData.hygiene.status, sub: trackingData.hygiene.times, tabTarget: 'Vệ sinh', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: Smile, title: 'Tâm trạng', status: trackingData.mood.status, sub: 'Cần vuốt ve', tabTarget: 'Tâm trạng', color: 'text-purple-500', bg: 'bg-purple-50' },
              { icon: Video, title: 'Camera', status: isCameraUnlocked ? 'Trực tiếp 24/7' : 'Đang khóa', sub: 'Nhấn để xem', tabTarget: 'Camera', color: 'text-red-500', bg: 'bg-red-50' },
            ].map((stat, idx) => (
              <div 
                key={idx} 
                onClick={() => handleSelectTab(stat.tabTarget)}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 group-hover:text-primary transition-colors">Chi tiết →</span>
                </div>
                <h3 className="font-semibold text-gray-500 text-sm">{stat.title}</h3>
                <p className={`text-xl font-bold my-1 ${getStatusColor(stat.status)}`}>{stat.status}</p>
                <p className="text-xs text-gray-400">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Log and Camera preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6">
            
            {/* Timeline */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-dark font-title">Nhật ký hôm nay</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Cập nhật tự động bởi điều dưỡng viên Mèo Vắng Nhà</p>
                </div>
                <button 
                  onClick={() => toast.success('Đã cập nhật nhật ký mới nhất!')}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary-light/50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Làm mới
                </button>
              </div>

              <div className="border-l-2 border-gray-100 ml-4 pl-6 space-y-7 relative">
                {sortedTimeline.map((item, idx) => (
                  <div key={idx} className="relative flex items-center gap-4">
                    <div className="absolute -left-[35px] w-8 h-8 rounded-full bg-white ring-4 ring-bg-cream flex items-center justify-center shadow-xs border border-gray-100">
                      {getIconForType(item.type)}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 w-16 text-center shrink-0">
                      {item.time}
                    </span>
                    <span className="text-sm font-medium text-text-dark">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Camera Card */}
            <div className="lg:col-span-1 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-text-dark font-title">Camera trực tiếp</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    {isCameraUnlocked ? 'LIVE' : 'KHÓA'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Phòng {bookingData.selectedRoom?.name || 'Deluxe'}</p>

                <div className="bg-gray-900 rounded-2xl overflow-hidden relative aspect-video mb-4 flex items-center justify-center border border-gray-200 shadow-inner group">
                  {isCameraUnlocked ? (
                    <>
                      <img src={cameraFeed} alt="Live Camera" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                        {currentTime}
                      </div>
                    </>
                  ) : (
                    <>
                      <img src={cameraFeed} alt="Camera Feed" className="w-full h-full object-cover blur-sm opacity-40" />
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-xs gap-2 text-center p-4">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                          <Video className="w-5 h-5" />
                        </div>
                        <span className="text-white font-bold text-xs">Chưa kích hoạt gói xem</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {isCameraUnlocked ? (
                <button 
                  onClick={() => handleSelectTab('Camera')}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition-colors text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  Mở toàn màn hình Camera
                </button>
              ) : (
                <button 
                  onClick={() => setShowQRModal(true)}
                  className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-hover transition-colors text-sm shadow-lg shadow-accent/25"
                >
                  Mở khóa Camera (10k/ngày)
                </button>
              )}
            </div>

          </div>
        </>
      );
    }

    // TAB: CAMERA RIÊNG BIỆT
    if (activeTab === 'Camera') {
      return (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-text-dark font-title">Camera giám sát 24/7</h2>
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1.5 border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  TRỰC TIẾP • 1080P HD
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Góc quay phòng: <strong>{bookingData.selectedRoom?.name || 'Deluxe 01'}</strong> • Đang theo dõi: <strong>{petsName}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsNightMode(!isNightMode)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${isNightMode ? 'bg-indigo-900 text-white border-indigo-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
              >
                {isNightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {isNightMode ? 'Chế độ đêm (Hồng ngoại)' : 'Chế độ ngày'}
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Main Video Player */}
          <div className="relative w-full aspect-video bg-gray-950 rounded-3xl overflow-hidden border-2 border-gray-200 shadow-2xl mb-6">
            {isCameraUnlocked ? (
              <>
                <img 
                  src={cameraFeed} 
                  alt="Live Camera Room" 
                  className={`w-full h-full object-cover transition-all duration-300 ${isNightMode ? 'filter grayscale contrast-125 brightness-90 hue-rotate-180' : ''}`} 
                />
                
                {/* Live Overlays */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span>{currentTime}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-emerald-400">CAM-01 • 30 FPS</span>
                </div>

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Bảo mật riêng tư
                </div>

                {isMicOn && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-accent text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-xl animate-pulse">
                    <Mic className="w-4 h-4" />
                    Bé đang nghe giọng của bạn qua loa phòng...
                  </div>
                )}
              </>
            ) : (
              <>
                <img src={cameraFeed} alt="Camera Locked" className="w-full h-full object-cover blur-md opacity-30" />
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent mb-4 shadow-lg">
                    <Video className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Camera Chưa Mở Khóa</h3>
                  <p className="text-gray-300 max-w-md text-sm mb-6">
                    Để đảm bảo đường truyền cao cấp và bảo mật riêng tư tuyệt đối, dịch vụ truyền phát video 24/7 chỉ với chi phí 10.000 VNĐ/ngày.
                  </p>
                  <button 
                    onClick={() => setShowQRModal(true)}
                    className="bg-accent hover:bg-accent-hover text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-accent/30 text-sm"
                  >
                    Mở khóa ngay (10.000 VNĐ)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Interactive Control Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <button 
              onClick={handleSnapshot}
              className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gray-50 hover:bg-primary-light hover:text-primary text-text-dark font-bold text-sm border border-gray-200 transition-all cursor-pointer"
            >
              <CameraIcon className="w-4 h-4 text-primary" />
              Chụp ảnh khoảnh khắc
            </button>

            <button 
              onClick={toggleMic}
              className={`flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl font-bold text-sm border transition-all cursor-pointer ${
                isMicOn 
                  ? 'bg-accent text-white border-accent shadow-md shadow-accent/25' 
                  : 'bg-gray-50 hover:bg-gray-100 text-text-dark border-gray-200'
              }`}
            >
              {isMicOn ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-accent" />}
              {isMicOn ? 'Tắt mic nói chuyện' : 'Nói chuyện với bé (Mic 2 chiều)'}
            </button>

            <button 
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.documentElement.requestFullscreen?.();
                }
              }}
              className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-text-dark font-bold text-sm border border-gray-200 transition-all cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-gray-500" />
              Toàn màn hình
            </button>
          </div>
        </div>
      );
    }

    // TAB: ĂN UỐNG, VỆ SINH, TÂM TRẠNG
    const tabMapData = {
      'Ăn uống': { data: trackingData.eating, icon: Utensils, color: 'text-amber-500', bg: 'bg-amber-50' },
      'Vệ sinh': { data: trackingData.hygiene, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
      'Tâm trạng': { data: trackingData.mood, icon: Smile, color: 'text-purple-500', bg: 'bg-purple-50' }
    };

    const currentTabInfo = tabMapData[activeTab];
    if (!currentTabInfo) return null;
    const { data: currentData, icon: Icon, color, bg } = currentTabInfo;

    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-dark font-title">Chi tiết {activeTab} của bé {petsName}</h2>
            <p className="text-sm text-gray-500">Cập nhật lúc: {currentTime} hôm nay</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bg-cream rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Tình trạng hiện tại</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Trạng thái:</span>
                <span className={`text-lg font-bold ${getStatusColor(currentData.status)}`}>{currentData.status}</span>
              </div>
              {currentData.meals && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-gray-600 font-medium">Khẩu phần đã ăn:</span>
                  <span className="font-bold text-text-dark">{currentData.meals}</span>
                </div>
              )}
              {currentData.times && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-gray-600 font-medium">Số lần trong ngày:</span>
                  <span className="font-bold text-text-dark">{currentData.times}</span>
                </div>
              )}
              {currentData.stressScore && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-gray-600 font-medium">Mức độ căng thẳng:</span>
                  <span className="font-bold text-amber-600">{currentData.stressScore}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-bg-cream rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Ghi chú từ nhân viên</h3>
            <p className="text-text-dark text-sm leading-relaxed mb-4">{currentData.details}</p>
            {currentData.dietPlan && (
              <div className="text-xs bg-white p-3 rounded-xl border border-gray-100 text-gray-600 space-y-1">
                <strong>Thực đơn hôm nay:</strong>
                <p>{currentData.dietPlan}</p>
              </div>
            )}
            {currentData.litterBox && (
              <div className="text-xs bg-white p-3 rounded-xl border border-gray-100 text-gray-600 space-y-1">
                <strong>Vệ sinh khay cát:</strong>
                <p>{currentData.litterBox}</p>
              </div>
            )}
            {currentData.interactionTime && (
              <div className="text-xs bg-white p-3 rounded-xl border border-gray-100 text-gray-600 space-y-1">
                <strong>Thời gian tương tác:</strong>
                <p>{currentData.interactionTime}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick action jump to camera */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">Muốn kiểm tra tận mắt bé đang làm gì?</p>
          <button 
            onClick={() => handleSelectTab('Camera')}
            className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Video className="w-4 h-4" />
            Chuyển ngay sang Camera trực tiếp
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-bg-cream pb-16">
      <Toaster position="top-center" />
      
      {/* QR Payment Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-text-dark text-center mb-2">Mở khóa Camera 24/7</h3>
            <p className="text-gray-600 text-center mb-6 text-xs">
              Quét mã QR để mở luồng camera bảo mật kết nối trực tiếp đến phòng lưu trú của bé.
            </p>
            
            <div className="bg-gray-50 rounded-2xl p-4 flex justify-center mb-4 border border-gray-100">
              <img 
                src="https://img.vietqr.io/image/mbbank-111122223333-compact2.png?amount=10000&addInfo=Thanh%20toan%20Camera%20Miu&accountName=MEO%20VANG%20NHA" 
                alt="QR Code" 
                className="w-48 h-48 object-contain" 
              />
            </div>

            <p className="text-center font-extrabold text-accent text-2xl mb-6">10.000 VNĐ <span className="text-xs text-gray-400 font-normal">/ngày</span></p>

            <div className="flex flex-col gap-2.5">
              <button 
                onClick={handlePaymentConfirm}
                disabled={isVerifying}
                className={`w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-secondary transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2 cursor-pointer ${isVerifying ? 'opacity-80 cursor-wait' : ''}`}
              >
                {isVerifying && <Loader2 className="w-5 h-5 animate-spin" />}
                {isVerifying ? 'Đang kiểm tra giao dịch...' : 'Tôi đã chuyển khoản'}
              </button>
              <button 
                onClick={() => setShowQRModal(false)}
                disabled={isVerifying}
                className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header & Pet Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-text-dark font-title">Theo dõi {petsName}</h1>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${getBadgeColorHeader(bookingData.dynamicStatus)}`}>
                {bookingData.dynamicStatus || 'Đang lưu trú'}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Mã booking: <strong className="text-text-dark">{bookingData.id}</strong> • Thời gian: {formatDateRange(bookingData.checkIn, bookingData.checkOut)}
            </p>
          </div>

          {/* Booking Selector Dropdown if multiple bookings exist */}
          {globalBookingList.length > 1 && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Đổi bé mèo:</span>
              <select 
                value={selectedBookingId} 
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="text-xs font-bold text-text-dark bg-transparent focus:outline-hidden cursor-pointer"
              >
                {globalBookingList.map((b) => {
                  const pName = b.petProfiles?.map(p => p.name).join(', ') || b.id;
                  return (
                    <option key={b.id} value={b.id}>
                      {pName} ({b.dynamicStatus})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
        
        {/* Tabs Bar */}
        <div className="flex space-x-2 bg-white p-1.5 rounded-2xl shadow-xs border border-gray-100 mb-8 overflow-x-auto whitespace-nowrap w-full sm:w-fit">
          {tabs.map((tab, idx) => {
            const isTabActive = activeTab === tab;
            return (
              <button 
                key={idx}
                onClick={() => handleSelectTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isTabActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {tab === 'Camera' && (
                  <span className={`w-2 h-2 rounded-full ${isTabActive ? 'bg-white' : 'bg-red-500'} animate-pulse`}></span>
                )}
                {tab}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {renderTabContent()}

      </div>
    </div>
  );
};

export default Tracking;
