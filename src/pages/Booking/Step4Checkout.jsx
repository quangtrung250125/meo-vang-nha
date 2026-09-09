import React from 'react';

const Step4Checkout = ({ data, onNext, onPrev }) => {
  // Tính số ngày lưu trú
  const calculateDays = () => {
    if (!data.checkIn || !data.checkOut) return 0;
    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 1; // Mặc định ít nhất 1 ngày
  };

  const days = calculateDays();
  const roomPrice = data.selectedPackage?.price || 0;
  const cameraPrice = 10000; // Giá camera mỗi ngày
  const total = (roomPrice * days) + (cameraPrice * days);

  const handleSubmit = () => {
    onNext();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      <h2 className="text-2xl font-bold text-text-dark font-title">4. Xác nhận đặt phòng</h2>
      
      <div className="bg-bg-cream border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-text-dark mb-4 border-b border-gray-100 pb-2">Thông tin đặt lịch</h3>
        
        <div className="space-y-3 text-gray-600 mb-6">
          <div className="flex justify-between">
            <span>Thời gian:</span>
            <span className="font-medium text-text-dark">{data.checkIn} đến {data.checkOut} ({days} ngày)</span>
          </div>
          <div className="flex justify-between">
            <span>Số lượng mèo:</span>
            <span className="font-medium text-text-dark">{data.catCount} bé</span>
          </div>
          <div className="flex justify-between">
            <span>Phòng / Gói:</span>
            <span className="font-medium text-text-dark">{data.selectedRoom?.name} / {data.selectedPackage?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Tên các bé:</span>
            <span className="font-medium text-text-dark">{data.petProfiles?.map(p => p.name).join(', ')}</span>
          </div>
        </div>

        <h3 className="font-bold text-text-dark mb-4 border-b border-gray-100 pb-2">Chi phí dự kiến</h3>
        
        <div className="space-y-3 text-gray-600 mb-6">
          <div className="flex justify-between">
            <span>Tiền lưu trú ({days} x {roomPrice.toLocaleString()}đ):</span>
            <span className="font-medium">{(roomPrice * days).toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between">
            <span>Dịch vụ Camera ({days} x {cameraPrice.toLocaleString()}đ):</span>
            <span className="font-medium">{(cameraPrice * days).toLocaleString()}đ</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
          <span className="text-lg font-bold text-text-dark">Tổng cộng:</span>
          <span className="text-2xl font-extrabold text-primary">{total.toLocaleString()}đ</span>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-between">
        <button 
          onClick={onPrev}
          className="bg-white border border-gray-200 text-gray-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Quay lại
        </button>
        <button 
          onClick={handleSubmit}
          className="bg-accent text-white font-bold px-8 py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30"
        >
          GỬI YÊU CẦU ĐẶT LỊCH
        </button>
      </div>
    </div>
  );
};

export default Step4Checkout;
