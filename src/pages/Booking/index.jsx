import React, { useState } from 'react';
import Step1Dates from './Step1Dates';
import Step2Packages from './Step2Packages';
import Step3PetProfile from './Step3PetProfile';
import Step4Checkout from './Step4Checkout';
import Step5Success from './Step5Success';
import { Calendar, Package, PawPrint, CreditCard, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
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

  return (
    <div className="min-h-screen bg-bg-cream pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-dark font-title mb-4">
            Đặt Phòng Cho Boss
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Chỉ với vài bước đơn giản, bé mèo của bạn sẽ có một kỳ nghỉ tuyệt vời tại Mèo Vắng Nhà.
          </p>
        </div>

        {/* Stepper (Only show on steps 1-4) */}
        {currentStep < 5 && renderStepper()}

        {/* Main Form Area */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100">
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
            <Step4Checkout data={bookingData} updateData={updateData} onNext={handleNext} onPrev={handlePrev} />
          )}
          {currentStep === 5 && (
            <Step5Success data={bookingData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
