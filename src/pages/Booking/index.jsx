import React, { useState } from 'react';
import Step1Dates from './Step1Dates';
import Step2Packages from './Step2Packages';
import Step3PetProfile from './Step3PetProfile';
import Step4Checkout from './Step4Checkout';
import Step5Success from './Step5Success';
import { Calendar, Package, PawPrint, CreditCard, CheckCircle, ShieldCheck, LogIn } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { useUI } from '../../contexts/UIContext';
import AuthModal from '../../components/AuthModal';
import NotificationBar from '../../components/NotificationBar';
import { packagesList } from '../../mockData/servicesData';

const steps = [
  { id: 1, title: 'Ngày & Phòng', icon: Calendar },
  { id: 2, title: 'Dịch vụ', icon: Package },
  { id: 3, title: 'Hồ sơ mèo', icon: PawPrint },
  { id: 4, title: 'Xác nhận', icon: CreditCard },
  { id: 5, title: 'Hoàn tất', icon: CheckCircle },
];

const Booking = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const location = useLocation();
  const { isAuthenticated, authenticatedCustomer } = useCustomerProfile();
  const { isAuthOpen, openAuth, closeAuth } = useUI();
  
  const [bookingData, setBookingData] = useState(() => {
    const preSelectedId = location.state?.preSelectedPackageId;
    const initialPackage = preSelectedId 
      ? packagesList.find(p => p.id === preSelectedId) || null
      : null;
      
    return {
      checkIn: '',
      checkOut: '',
      catCount: 1,
      selectedRoom: null,
      selectedPackage: initialPackage,
      petProfiles: [],
      totalPrice: 0,
    };
  });

  const updateData = (newData) => {
    setBookingData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  // Render stepper logic
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-cream pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl p-6 sm:p-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-primary shadow-sm">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-text-dark font-title mb-4">
              Đăng nhập để đặt phòng
            </h1>
            <p className="text-gray-600 text-base max-w-xl mx-auto leading-relaxed mb-8">
              Khách hàng cần đăng nhập hoặc tạo tài khoản để đặt phòng. Sau khi đăng nhập, bạn sẽ dễ dàng theo dõi bé mèo trong suốt thời gian lưu trú và shop sẽ quản lý hồ sơ khách hàng rõ ràng hơn, đồng thời hạn chế trùng phòng cùng thời điểm.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={openAuth}
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập / Đăng ký
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-600 font-bold px-6 py-3 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
        <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
      </div>
    );
  }

  const renderStepper = () => {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between relative">
          {/* Progress Bar Background */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
          {/* Active Progress Bar */}
          <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                    isActive ? 'bg-primary border-primary-light text-white scale-110 shadow-lg' : 
                    isCompleted ? 'bg-primary border-primary text-white' : 
                    'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`mt-3 text-xs md:text-sm font-bold whitespace-nowrap ${
                  isActive ? 'text-primary' : 
                  isCompleted ? 'text-text-dark' : 
                  'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleBackToStep1 = (conflictedRoomId) => {
    setBookingData((prev) => ({
      ...prev,
      selectedRoom: null,
      conflictedRoomId: conflictedRoomId || prev.selectedRoom?.id || null,
    }));
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-bg-cream pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-text-dark font-title mb-4">
            Đặt Phòng Cho Boss
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Chỉ với vài bước đơn giản, bé mèo của bạn sẽ có một kỳ nghỉ tuyệt vời tại Mèo Vắng Nhà.
          </p>
        </div>

        {/* Thanh bật thông báo đẩy cho điện thoại & máy tính */}
        <NotificationBar />

        {/* Stepper (Only show on steps 1-4) */}
        {currentStep < 5 && renderStepper()}

        {/* Main Form Area */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100">
          {authenticatedCustomer && (
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
              <span className="font-semibold">Khách hàng: {authenticatedCustomer.fullName || 'Khách mới'}</span>
              <span className="text-emerald-600">Hồ sơ đang được đồng bộ</span>
            </div>
          )}
          {currentStep === 1 && (
            <Step1Dates data={bookingData} updateData={updateData} onNext={handleNext} />
          )}
          {currentStep === 2 && (
            <Step2Packages data={bookingData} updateData={updateData} onNext={handleNext} onPrev={handlePrev} />
          )}
          {currentStep === 3 && (
            <Step3PetProfile data={bookingData} updateData={updateData} onNext={handleNext} onPrev={handlePrev} />
          )}
          {currentStep === 4 && (
            <Step4Checkout
              data={bookingData}
              updateData={updateData}
              onNext={handleNext}
              onPrev={handlePrev}
              onBackToStep1={handleBackToStep1}
            />
          )}
          {currentStep === 5 && (
            <Step5Success
              data={bookingData}
              onBackToStep1={handleBackToStep1}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
