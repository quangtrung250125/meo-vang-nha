import React, { useState } from 'react';
import { Utensils, Droplets, Smile, HeartPulse, Loader2, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePetProfile } from '../../contexts/PetContext';
import cameraFeed from '../../assets/images/camera_feed.png';

const trackingData = {
  eating: { status: 'Bỏ ăn', meals: '1/3 bữa', details: 'Chỉ ăn một ít thức ăn mềm, không động vào hạt cứng.' },
  hygiene: { status: 'Bình thường', times: '2/2 lần', details: 'Phân khô, nước tiểu lượng bình thường.' },
  mood: { status: 'Stress', activities: 'Nằm một chỗ, kêu meo meo khi có tiếng động lớn.' },
  health: { status: 'Bình thường', details: 'Nhịp thở đều, thân nhiệt ổn định.' },
  timelineLogs: [
    { type: 'eating', time: '08:00', text: 'Ăn sáng (Bỏ mứa)' },
    { type: 'hygiene', time: '10:30', text: 'Đi vệ sinh (Tiểu)' },
    { type: 'mood', time: '15:00', text: 'Stress, trốn trong góc' },
    { type: 'eating', time: '18:00', text: 'Ăn tối (Chỉ ăn 1 chút)' },
    { type: 'health', time: '19:00', text: 'Kiểm tra nhiệt độ (Bình thường)' }
  ]
};

const Tracking = () => {
  const [isCameraUnlocked, setIsCameraUnlocked] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('Tổng quan');
  const location = useLocation();
  const navigate = useNavigate();
  const { petList } = usePetProfile();
  const bookingData = location.state?.bookingData;

  if (!bookingData) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-bg-cream">
        <h2 className="text-2xl font-bold text-text-dark mb-4">Vui lòng chọn một bé mèo từ danh sách booking</h2>
        <button onClick={() => navigate('/my-booking')} className="px-6 py-3 bg-primary text-white rounded-xl font-bold">
          Quay lại Danh sách
        </button>
      </div>
    );
  }

  const dynamicPets = (bookingData.petIds || []).map(id => petList.find(p => p.id === id)).filter(Boolean);
  const resolvedPets = dynamicPets.length > 0 ? dynamicPets : (bookingData.petProfiles || []);
  const petsName = resolvedPets.map(p => p.name).join(', ') || 'các bé';
  
  const formatDateRange = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '';
    const format = (d) => {
      const [year, month, day] = d.split('-');
      return `${day}/${month}/${year}`;
    }
    return `${format(checkIn)} - ${format(checkOut)}`;
  };
  
  const getBadgeColorHeader = (status) => {
    switch (status) {
      case 'Đang lưu trú': return 'bg-primary-light text-primary';
      case 'Sắp tới': return 'bg-red-50 text-red-500';
      case 'Đã hoàn tất': return 'bg-green-50 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handlePaymentConfirm = () => {
    setIsVerifying(true);
    setTimeout(() => {
      toast.success('Thanh toán thành công! Camera đã được mở.');
      setIsCameraUnlocked(true);
      setShowQRModal(false);
      setIsVerifying(false);
    }, 2000);
  };

  const getStatusColor = (status) => {
    const badStatuses = ['Bỏ ăn', 'Tiêu chảy', 'Stress'];
    if (badStatuses.includes(status)) {
      return 'text-red-500 shake-animation';
    }
    if (['Bình thường', 'Vui vẻ'].includes(status)) {
      return 'text-green-500';
    }
    return 'text-gray-600';
  };

  // Algorithm to sort timeline: newest to oldest based on time string
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

  const tabs = ['Tổng quan', 'Ăn uống', 'Vệ sinh', 'Tâm trạng', 'Sức khỏe'];

  const renderTabContent = () => {
    if (activeTab === 'Tổng quan') {
      return (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
            {[
              { icon: Utensils, title: 'Ăn uống', status: trackingData.eating.status, sub: `(${trackingData.eating.meals})` },
              { icon: Droplets, title: 'Đi vệ sinh', status: trackingData.hygiene.status, sub: `(${trackingData.hygiene.times})` },
              { icon: Smile, title: 'Tâm trạng', status: trackingData.mood.status, sub: '' },
              { icon: HeartPulse, title: 'Sức khỏe', status: trackingData.health.status, sub: '' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-bg-cream border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-dark">{stat.title}</h3>
                </div>
                <p className={`text-xl font-bold mb-1 ${getStatusColor(stat.status)}`}>{stat.status}</p>
                <p className="text-xs text-gray-400">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Log and Camera */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6">
            {/* Timeline */}
            <div className="lg:col-span-2 bg-bg-cream border border-gray-100 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-text-dark font-title mb-8">Nhật ký hôm nay</h2>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[3.5rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent hidden-before">
                <div className="border-l-2 border-gray-100 ml-6 pl-8 space-y-8 relative">
                  {sortedTimeline.map((item, idx) => (
                    <div key={idx} className="relative flex items-center gap-6">
                      <div className="absolute -left-12 w-8 h-8 rounded-full bg-white ring-4 ring-gray-50 flex items-center justify-center shadow-sm">
                        {getIconForType(item.type)}
                      </div>
                      <span className="text-sm font-semibold text-gray-400 w-12 shrink-0">{item.time}</span>
                      <span className="text-text-dark font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Camera */}
            <div className="lg:col-span-1 bg-bg-cream border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col">
              <h2 className="text-xl font-bold text-text-dark font-title mb-6">Camera trực tiếp</h2>
              <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden relative min-h-[200px] mb-6 flex items-center justify-center border border-gray-200">
                {isCameraUnlocked ? (
                  <>
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse flex items-center gap-1 z-10 shadow-md">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      LIVE
                    </div>
                    <img src={cameraFeed} alt="Live Camera" className="w-full h-full object-cover" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-10 gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <span className="text-white font-medium text-sm">Chưa mở khóa</span>
                  </div>
                )}
                {!isCameraUnlocked && <img src={cameraFeed} alt="Camera Feed" className="w-full h-full object-cover blur-sm opacity-50" />}
              </div>
              
              {!isCameraUnlocked && (
                <button 
                  onClick={() => setShowQRModal(true)}
                  className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30"
                >
                  Xem camera (10k/ngày)
                </button>
              )}
            </div>
          </div>
        </>
      );
    }

    // Specific Detail Content
    const currentData = 
      activeTab === 'Ăn uống' ? trackingData.eating :
      activeTab === 'Vệ sinh' ? trackingData.hygiene :
      activeTab === 'Tâm trạng' ? trackingData.mood :
      activeTab === 'Sức khỏe' ? trackingData.health : null;

    if (!currentData) return null;

    return (
      <div className="bg-bg-cream border border-gray-100 rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
        <h2 className="text-2xl font-bold text-text-dark font-title mb-6">Chi tiết {activeTab}</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <span className="text-gray-500 font-semibold w-24 shrink-0">Trạng thái:</span>
            <span className={`text-lg font-bold ${getStatusColor(currentData.status)}`}>{currentData.status}</span>
          </div>
          
          {currentData.meals && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 border-t border-gray-100 pt-6">
              <span className="text-gray-500 font-semibold w-24 shrink-0">Bữa ăn:</span>
              <span className="text-text-dark">{currentData.meals}</span>
            </div>
          )}
          
          {currentData.times && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 border-t border-gray-100 pt-6">
              <span className="text-gray-500 font-semibold w-24 shrink-0">Số lần:</span>
              <span className="text-text-dark">{currentData.times}</span>
            </div>
          )}

          {currentData.activities && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 border-t border-gray-100 pt-6">
              <span className="text-gray-500 font-semibold w-24 shrink-0">Biểu hiện:</span>
              <span className="text-text-dark">{currentData.activities}</span>
            </div>
          )}

          {currentData.details && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 border-t border-gray-100 pt-6">
              <span className="text-gray-500 font-semibold w-24 shrink-0">Ghi chú:</span>
              <span className="text-text-dark leading-relaxed">{currentData.details}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Toaster position="top-center" />
      
      {/* QR Payment Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-text-dark text-center mb-2">Thanh toán phí xem Camera</h3>
            <p className="text-gray-600 text-center mb-6 text-sm">Vui lòng quét mã QR bên dưới để thanh toán 10.000 VNĐ.</p>
            
            <div className="bg-gray-50 rounded-2xl p-4 flex justify-center mb-6 border border-gray-100">
              <img src="https://img.vietqr.io/image/mbbank-111122223333-compact2.png?amount=10000&addInfo=Thanh%20toan%20Camera%20Miu&accountName=MEO%20VANG%20NHA" alt="QR Code" className="w-48 h-48 object-contain" />
            </div>

            <p className="text-center font-bold text-accent text-2xl mb-8">10.000 VNĐ</p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handlePaymentConfirm}
                disabled={isVerifying}
                className={`w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2 ${isVerifying ? 'opacity-80 cursor-wait' : ''}`}
              >
                {isVerifying && <Loader2 className="w-5 h-5 animate-spin" />}
                {isVerifying ? 'Đang kiểm tra giao dịch...' : 'Tôi đã chuyển khoản'}
              </button>
              <button 
                onClick={() => setShowQRModal(false)}
                disabled={isVerifying}
                className="w-full bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-extrabold text-text-dark font-title">Theo dõi {petsName}</h1>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${getBadgeColorHeader(bookingData.dynamicStatus)}`}>{bookingData.dynamicStatus || 'Không rõ'}</span>
        </div>
        <p className="text-gray-500 mb-8 text-sm">{formatDateRange(bookingData.checkIn, bookingData.checkOut)}</p>
        
        {/* Tabs */}
        <div className="flex space-x-2 bg-bg-cream p-1.5 rounded-full shadow-sm border border-gray-100 mb-8 overflow-x-auto whitespace-nowrap w-fit">
          {tabs.map((tab, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderTabContent()}

      </div>
    </div>
  );
};

export default Tracking;
