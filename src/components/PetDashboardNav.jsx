import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Clock, ChevronRight, Link as LinkIcon } from 'lucide-react';

const PetDashboardNav = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfileActive = location.pathname.includes('/pet-profile');
  const isTrackingActive = location.pathname.includes('/tracking');

  return (
    <div className="mb-8">
      {/* Dynamic Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-dark font-title mb-2">{title}</h1>
        <p className="text-gray-500">{subtitle}</p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Profile Card */}
        <div 
          onClick={() => navigate('/pet-profile')}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border-2 ${isProfileActive ? 'bg-primary-light/30 border-primary shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isProfileActive ? 'bg-primary-light/50 text-primary' : 'bg-gray-50 text-gray-400'}`}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isProfileActive ? 'text-text-dark' : 'text-text-dark'}`}>Hồ sơ mèo</h3>
              <p className="text-sm text-gray-500 hidden sm:block">Thông tin sức khỏe, tính cách & lịch sử lưu trú</p>
            </div>
          </div>
          {!isProfileActive && (
            <div className="flex items-center text-sm font-semibold text-primary">
              Xem hồ sơ <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          )}
        </div>

        {/* Tracking Card */}
        <div 
          onClick={() => navigate('/tracking')}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border-2 ${isTrackingActive ? 'bg-[#e5f5f0] border-primary shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isTrackingActive ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isTrackingActive ? 'text-text-dark' : 'text-text-dark'}`}>Theo dõi lưu trú</h3>
              <p className="text-sm text-gray-500 hidden sm:block">Trạng thái lưu trú hiện tại & dịch vụ thêm</p>
            </div>
          </div>
          {!isTrackingActive && (
            <div className="flex items-center text-sm font-semibold text-primary">
              Xem lưu trú <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <LinkIcon className="w-4 h-4 shrink-0" />
        <p>Mỗi bé mèo trong "Theo dõi lưu trú" liên kết trực tiếp tới hồ sơ riêng – bấm vào tên hoặc ảnh để mở Hồ sơ mèo.</p>
      </div>
    </div>
  );
};

export default PetDashboardNav;
