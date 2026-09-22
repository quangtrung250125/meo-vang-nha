import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Clock, ChevronRight, Link as LinkIcon, Lock, LogIn, X, PawPrint } from 'lucide-react';
import { useCustomerProfile } from '../contexts/CustomerContext';

// ─── Login Gate Modal ────────────────────────────────────────────────────────

const LoginGateModal = ({ onClose, onGoLogin }) => (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      onClick={e => e.stopPropagation()}
    >
      {/* Header gradient */}
      <div className="bg-gradient-to-br from-primary to-secondary px-6 pt-8 pb-10 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Icon */}
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
          <div className="relative">
            <PawPrint className="w-9 h-9 text-white opacity-60" />
            <Lock className="w-5 h-5 text-white absolute -bottom-1 -right-1 drop-shadow" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-white font-title mb-1">
          Yêu cầu đăng nhập
        </h2>
        <p className="text-white/80 text-sm">
          Theo dõi lưu trú
        </p>
      </div>

      {/* Body */}
      <div className="-mt-6 bg-white rounded-t-3xl px-6 pt-6 pb-6">
        <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">
          Khách vui lòng <strong className="text-text-dark">đăng nhập / đăng ký tài khoản</strong> để sử dụng tính năng này và theo dõi bé mèo trong suốt thời gian lưu trú.
        </p>

        {/* Benefits */}
        <div className="space-y-2.5 mb-6">
          {[
            '🐾 Xem trạng thái lưu trú theo thời gian thực',
            '📋 Nhật ký chăm sóc hàng ngày của bé',
            '📷 Truy cập camera quan sát bé yêu',
            '➕ Yêu cầu dịch vụ thêm ngay trên app',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onGoLogin}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98] cursor-pointer"
          >
            <LogIn className="w-5 h-5" />
            Đăng nhập / Đăng ký
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl transition-colors cursor-pointer text-sm"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const PetDashboardNav = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerProfile } = useCustomerProfile();
  const [showLoginGate, setShowLoginGate] = useState(false);

  const isLoggedIn = Boolean(customerProfile);
  const isProfileActive = location.pathname.includes('/pet-profile');
  const isTrackingActive = location.pathname.includes('/tracking');

  const handleTrackingClick = () => {
    if (!isLoggedIn) {
      setShowLoginGate(true);
    } else {
      navigate('/tracking');
    }
  };

  const handleGoLogin = () => {
    setShowLoginGate(false);
    navigate('/pet-profile');
  };

  return (
    <>
      {/* Login Gate Modal */}
      {showLoginGate && (
        <LoginGateModal
          onClose={() => setShowLoginGate(false)}
          onGoLogin={handleGoLogin}
        />
      )}

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
                <h3 className="font-bold text-lg text-text-dark">Hồ sơ mèo</h3>
                <p className="text-sm text-gray-500 hidden sm:block">Thông tin sức khỏe, tính cách &amp; lịch sử lưu trú</p>
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
            onClick={handleTrackingClick}
            className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border-2 relative ${
              isTrackingActive
                ? 'bg-[#e5f5f0] border-primary shadow-sm'
                : isLoggedIn
                ? 'bg-white border-gray-100 hover:border-gray-300'
                : 'bg-white border-gray-100 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isTrackingActive ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-text-dark">Theo dõi lưu trú</h3>
                  {/* Lock badge if not logged in */}
                  {!isLoggedIn && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" />
                      Đăng nhập
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 hidden sm:block">Trạng thái lưu trú hiện tại &amp; dịch vụ thêm</p>
              </div>
            </div>
            {!isTrackingActive && (
              <div className={`flex items-center text-sm font-semibold ${isLoggedIn ? 'text-primary' : 'text-gray-400'}`}>
                {isLoggedIn ? (
                  <>Xem lưu trú <ChevronRight className="w-4 h-4 ml-1" /></>
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LinkIcon className="w-4 h-4 shrink-0" />
          <p>Mỗi bé mèo trong "Theo dõi lưu trú" liên kết trực tiếp tới hồ sơ riêng – bấm vào tên hoặc ảnh để mở Hồ sơ mèo.</p>
        </div>
      </div>
    </>
  );
};

export default PetDashboardNav;
