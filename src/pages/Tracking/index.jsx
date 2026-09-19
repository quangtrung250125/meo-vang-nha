import React, { useState, useEffect } from 'react';
import { PawPrint, Clock, MapPin, Bell, User, Loader2, Sparkles, AlertTriangle, Calendar, MessageCircle, ChevronDown, Video, Utensils, Droplets, Smile, ChevronRight, Check } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import PetDashboardNav from '../../components/PetDashboardNav';
import cameraFeed from '../../assets/images/camera_feed.png';
import { usePetProfile } from '../../contexts/PetContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';

const MOCK_CARE_LOG = [
  { id: 1, time: '14:30', title: 'Quan sát Tâm trạng', desc: 'Bé vui vẻ, thích chơi với cần câu lông chim.', icon: Smile, color: 'text-purple-500', status: 'Bình thường' },
  { id: 2, time: '11:00', title: 'Dọn vệ sinh', desc: 'Phân khô, nước tiểu lượng bình thường. Cát đã được thay mới.', icon: Droplets, color: 'text-blue-500', status: 'Bình thường' },
  { id: 3, time: '08:00', title: 'Ăn sáng', desc: 'Ăn hết khẩu phần (Pate ức gà mix hạt).', icon: Utensils, color: 'text-orange-500', status: 'Bình thường' },
  { id: 4, time: '07:30', title: 'Kiểm tra sức khỏe', desc: 'Thân nhiệt ổn định, không có dấu hiệu bất thường.', icon: HeartPulse, color: 'text-red-500', status: 'Bình thường' },
];

const MOCK_SERVICES = [
  { id: 'upgrade', title: 'Nâng cấp phòng', desc: 'Không gian rộng rãi hơn cho bé', price: '+20.000đ/ngày', options: ['Phòng VVIP (+10k)', 'Phòng Deluxe (+20k)'] },
  { id: 'food', title: 'Thêm bữa phụ', desc: 'Bổ sung dinh dưỡng', price: '+15.000đ/bữa', options: ['Pate cá ngừ', 'Súp thưởng', 'Thịt sấy'] },
  { id: 'play', title: 'Dịch vụ chải lông & Massage', desc: 'Giúp bé thư giãn tối đa', price: 'Liên hệ', isNew: true, options: ['Massage 15p', 'Chải lông rụng'] },
];

const Tracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { petList } = usePetProfile();
  
  // Developer Toggle for Demo
  const [demoState, setDemoState] = useState('active'); // 'empty' or 'active'
  
  const [selectedService, setSelectedService] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Progress Steps
  const steps = [
    { label: 'Đặt cọc giữ phòng', completed: true },
    { label: 'Check-in', completed: true },
    { label: 'Đang chăm sóc', completed: true, current: true },
    { label: 'Chuẩn bị check-out', completed: false },
    { label: 'Bàn giao', completed: false },
  ];

  const handleRequestService = (service) => {
    setSelectedService(service);
  };

  const confirmService = () => {
    setIsConfirming(true);
    setTimeout(() => {
      toast.success(`Đã gửi yêu cầu ${selectedService.title}!`);
      setIsConfirming(false);
      setSelectedService(null);
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen bg-bg-cream pb-20 relative">
      <Toaster position="top-center" />
      
      {/* Dev Toggle Bubble */}
      <div className="fixed bottom-4 left-4 bg-white p-2 rounded-xl shadow-lg border border-gray-200 z-50 flex items-center gap-2 text-sm font-bold">
        <span className="text-gray-500 mr-2 text-xs">Dev Toggle:</span>
        <button 
          onClick={() => setDemoState('empty')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${demoState === 'empty' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
        >
          Rỗng
        </button>
        <button 
          onClick={() => setDemoState('active')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${demoState === 'active' ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-600'}`}
        >
          Có mèo lưu trú
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PetDashboardNav 
          title="Theo dõi lưu trú" 
          subtitle="Cập nhật tình hình lưu trú, chăm sóc và các dịch vụ thêm cho bé mèo của bạn theo thời gian thực." 
        />

        {demoState === 'empty' ? (
          /* ================= EMPTY STATE ================= */
          <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center min-h-[400px] shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <PawPrint className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-text-dark mb-2 text-center">Hiện không có mèo đang lưu trú</h2>
            <p className="text-gray-500 text-center max-w-md mb-8">Bạn chưa gửi bé mèo nào tại Mèo Vắng Nhà. Đặt lịch ngay để chúng mình chuẩn bị phòng và chăm sóc bé chu đáo nhé.</p>
            <button 
              onClick={() => navigate('/booking')}
              className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center gap-2 text-lg"
            >
              + Đặt lịch lưu trú
            </button>
          </div>
        ) : (
          /* ================= ACTIVE STATE ================= */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* LEFT COLUMN: Main Info & Tracking */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Pet Info Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <Link to="/pet-profile" className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-md">
                        <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" alt="Mimi" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    </Link>
                    <div>
                      <Link to="/pet-profile" className="text-2xl font-extrabold text-text-dark hover:text-primary transition-colors flex items-center gap-2">
                        Bé Mimi <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm font-medium">
                        <span className="text-primary bg-primary-light px-2.5 py-0.5 rounded-full">Gói Mèo Sang Chảnh</span>
                        <span className="text-gray-500">Phòng Deluxe (P-201)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>Nhận: 20/09/2026</span>
                        <span className="text-gray-300">•</span>
                        <span>Trả: 25/09/2026</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch sm:items-end gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
                    <div className="bg-[#FFF9F0] text-orange-600 font-bold px-4 py-2 rounded-xl text-center flex flex-col sm:items-end">
                      <span className="text-xs uppercase tracking-wider opacity-80 mb-0.5">Còn lại</span>
                      <span className="text-xl">5 Ngày</span>
                    </div>
                    <button className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-text-dark font-bold rounded-xl transition-colors border border-gray-200 text-sm text-center">
                      Gia hạn lưu trú
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning Banner (Demo) */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl rounded-l-md flex gap-4">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h4 className="text-red-800 font-bold">Lưu ý chăm sóc</h4>
                  <p className="text-red-700 text-sm mt-1">Sáng nay bé ăn hơi ít so với bình thường. Nhân viên đang theo dõi sát sao và thử đổi vị pate khác vào bữa trưa.</p>
                  <button className="text-red-600 text-sm font-bold mt-2 underline hover:text-red-800">Liên hệ nhân viên ngay</button>
                </div>
              </div>

              {/* Journey Stepper */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 overflow-hidden">
                <h3 className="text-xl font-bold text-text-dark font-title mb-8">Hành trình lưu trú</h3>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 -translate-y-1/2 rounded-full hidden sm:block"></div>
                  <div className="absolute top-1/2 left-0 w-[50%] h-1.5 bg-primary -translate-y-1/2 rounded-full hidden sm:block transition-all duration-1000"></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex sm:flex-col items-center gap-4 sm:gap-3 z-10 w-full sm:w-1/5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 ${
                          step.current ? 'bg-primary border-primary-light text-white shadow-lg shadow-primary/30' :
                          step.completed ? 'bg-primary border-white text-white' : 'bg-gray-100 border-white text-gray-300'
                        } transition-all`}>
                          {step.completed && !step.current ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> : <span className="font-bold">{idx + 1}</span>}
                        </div>
                        <div className="sm:text-center flex-1">
                          <p className={`font-bold text-sm ${step.current ? 'text-primary' : step.completed ? 'text-text-dark' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                          {step.current && <span className="text-[10px] uppercase font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full mt-1 inline-block sm:hidden md:inline-block">Hiện tại</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Care Log */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-text-dark font-title">Nhật ký chăm sóc</h3>
                  <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 flex items-center gap-2 cursor-pointer hover:bg-gray-200 transition-colors">
                    Hôm nay <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                <div className="relative before:absolute before:inset-0 before:ml-[1.2rem] before:-translate-x-px md:before:ml-[1.2rem] before:h-full before:w-0.5 before:bg-gray-100">
                  <div className="space-y-8 relative">
                    {MOCK_CARE_LOG.map((log) => (
                      <div key={log.id} className="relative flex gap-6">
                        <div className="absolute left-0 w-10 h-10 rounded-full bg-white ring-4 ring-gray-50 flex items-center justify-center shadow-sm z-10 shrink-0">
                          <log.icon className={`w-5 h-5 ${log.color}`} />
                        </div>
                        <div className="ml-14 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-bold text-text-dark">{log.title}</h4>
                              {log.status === 'Bình thường' ? (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">Bình thường</span>
                              ) : (
                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">Cần theo dõi</span>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg w-max">{log.time}</span>
                          </div>
                          <p className="text-gray-600 bg-gray-50 p-4 rounded-2xl text-sm leading-relaxed border border-gray-100">{log.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Camera */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-text-dark font-title flex items-center gap-2">
                    <Video className="w-6 h-6 text-primary" /> Camera trực tiếp
                  </h3>
                  <span className="text-xs font-bold text-primary bg-primary-light px-3 py-1 rounded-full uppercase tracking-wide">Đã bao gồm trong gói</span>
                </div>
                <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden relative min-h-[250px] flex items-center justify-center shadow-inner group cursor-pointer">
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse flex items-center gap-1.5 z-10 shadow-md">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div> LIVE
                  </div>
                  <img src={cameraFeed} alt="Live Camera" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                        <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     </div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">Chạm vào màn hình để xem toàn màn hình hoặc xoay góc camera.</p>
              </div>

            </div>

            {/* RIGHT COLUMN: Package & Add-ons */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Current Package Block */}
              <div className="bg-primary-light rounded-3xl p-6 shadow-sm border border-green-100">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Gói đang sử dụng
                </h3>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h4 className="font-extrabold text-text-dark text-xl mb-1">Gói Mèo Sang Chảnh</h4>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-2xl font-black text-accent">135.000đ</span>
                    <span className="text-gray-500 font-medium mb-1">/ngày</span>
                  </div>
                  <ul className="space-y-3">
                    {['Phòng VIP ấm cúng', '3 bữa chính/ngày', 'Cát Bentonite dọn 1 lần/ngày', 'Camera riêng 24/24'].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Add-on Services Block */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-text-dark font-title mb-6">Dịch vụ thêm</h3>
                
                <div className="space-y-4">
                  {MOCK_SERVICES.map((service) => (
                    <div key={service.id} className="border border-gray-100 rounded-2xl p-4 hover:border-primary/30 hover:bg-primary-light/10 transition-colors relative overflow-hidden group">
                      {service.isNew && (
                        <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full z-10">Đề xuất mới</div>
                      )}
                      <h4 className="font-bold text-text-dark mb-1">{service.title}</h4>
                      <p className="text-xs text-gray-500 mb-3">{service.desc}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <select className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary text-gray-700 w-[140px]">
                          {service.options.map((opt, i) => <option key={i}>{opt}</option>)}
                        </select>
                        <span className="font-bold text-accent text-sm">{service.price}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleRequestService(service)}
                        className="w-full py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl text-sm hover:bg-primary hover:text-white transition-colors border border-gray-200 group-hover:border-transparent"
                      >
                        Yêu cầu dịch vụ
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      {demoState === 'active' && (
        <button className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-accent text-white p-4 rounded-full shadow-xl shadow-accent/40 hover:scale-110 hover:bg-accent-hover transition-all z-40 flex items-center justify-center group">
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-bold ml-0 group-hover:ml-3">Nhắn tin cho nhân viên</span>
        </button>
      )}

      {/* Confirmation Modal */}
      {isConfirming || selectedService ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            {isConfirming ? (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-bold text-text-dark">Đang xử lý yêu cầu...</h3>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-text-dark text-center mb-2">Xác nhận yêu cầu</h3>
                <p className="text-gray-600 text-center text-sm mb-6 leading-relaxed">
                  Bạn có muốn thêm dịch vụ <span className="font-bold text-text-dark">{selectedService?.title}</span>? Phí dịch vụ sẽ được cộng vào hoá đơn thanh toán khi bạn đón bé.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmService}
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    Đồng ý thêm
                  </button>
                  <button 
                    onClick={() => setSelectedService(null)}
                    className="w-full py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

    </div>
  );
};

export default Tracking;
