import React, { useState } from 'react';
import { Tag, Check, CheckCircle2, ShieldCheck, Sparkles, Percent } from 'lucide-react';
import { promotionInfo } from '../../mockData/servicesData';

const Step4Checkout = ({ data, onNext, onPrev }) => {
  const [couponCode, setCouponCode] = useState(promotionInfo.code);
  const [isCouponApplied, setIsCouponApplied] = useState(true);
  const [couponMessage, setCouponMessage] = useState('Đã áp dụng mã ưu đãi giảm 10%!');

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
  const discountedPackagePrice = data.selectedPackage?.price || 0;
  const originalPackagePrice = data.selectedPackage?.originalPrice || Math.round(discountedPackagePrice / 0.9);
  const cameraPrice = 10000; // Giá camera mỗi ngày

  // Subtotal without discount
  const originalPackageTotal = originalPackagePrice * days;
  const cameraTotal = cameraPrice * days;
  const grossTotal = originalPackageTotal + cameraTotal;

  // Discount calculation
  const discountAmount = isCouponApplied 
    ? (originalPackageTotal - (discountedPackagePrice * days)) 
    : 0;

  const total = grossTotal - discountAmount;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === promotionInfo.code || couponCode.trim().toUpperCase() === 'SALE10') {
      setIsCouponApplied(true);
      setCouponMessage('Áp dụng mã thành công! Giảm 10% chi phí dịch vụ.');
    } else {
      setIsCouponApplied(false);
      setCouponMessage('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  const handleSubmit = () => {
    onNext();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-dark font-title">4. Xác nhận & Báo giá ưu đãi</h2>
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Ưu đãi 10% hợp lệ</span>
        </div>
      </div>
      
      <div className="bg-bg-cream border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-text-dark text-lg mb-4 border-b border-gray-200/60 pb-3 flex items-center gap-2">
          <span>Thông tin đặt lịch</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-6 bg-white p-4 rounded-2xl border border-gray-100">
          <div>
            <span className="text-gray-400 block text-xs font-semibold uppercase">Thời gian</span>
            <span className="font-bold text-text-dark">{data.checkIn} → {data.checkOut} ({days} ngày)</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs font-semibold uppercase">Số lượng mèo</span>
            <span className="font-bold text-text-dark">{data.catCount} bé</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs font-semibold uppercase">Phòng & Gói dịch vụ</span>
            <span className="font-bold text-primary">{data.selectedRoom?.name} • {data.selectedPackage?.name}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs font-semibold uppercase">Tên các bé</span>
            <span className="font-bold text-text-dark">{data.petProfiles?.map(p => p.name).join(', ') || 'Chưa đặt tên'}</span>
          </div>
        </div>

        {/* Voucher Input Box */}
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-emerald-50 p-4 rounded-2xl border border-orange-200/80">
          <label className="block text-xs font-bold uppercase text-gray-700 mb-2 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-accent" />
            <span>Mã ưu đãi / Khuyến mãi</span>
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Nhập mã khuyến mãi (VD: MEOXINH10)"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold uppercase tracking-wider focus:outline-none focus:border-accent bg-white"
            />
            <button 
              type="button"
              onClick={handleApplyCoupon}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Áp dụng
            </button>
          </div>
          {couponMessage && (
            <p className={`text-xs mt-2 font-semibold ${isCouponApplied ? 'text-emerald-700' : 'text-red-500'}`}>
              {couponMessage}
            </p>
          )}
        </div>

        <h3 className="font-bold text-text-dark text-lg mb-4 border-b border-gray-200/60 pb-3">
          Chi tiết chi phí
        </h3>
        
        <div className="space-y-3 text-gray-700 mb-6 text-sm">
          <div className="flex justify-between">
            <span>Tiền dịch vụ ({days} ngày x {originalPackagePrice.toLocaleString()}đ):</span>
            <span className="font-medium text-gray-500 line-through">
              {originalPackageTotal.toLocaleString()}đ
            </span>
          </div>

          {isCouponApplied && discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <span className="flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Ưu đãi giảm giá 10% ({promotionInfo.code}):
              </span>
              <span>- {discountAmount.toLocaleString()}đ</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Dịch vụ Camera 24/7 ({days} ngày x {cameraPrice.toLocaleString()}đ):</span>
            <span className="font-medium">{cameraTotal.toLocaleString()}đ</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-5 border-t-2 border-gray-200/80">
          <div>
            <span className="text-sm font-bold text-gray-400 uppercase block">Tổng thanh toán dự kiến</span>
            <span className="text-xs text-emerald-600 font-bold">
              {isCouponApplied ? `Đã tiết kiệm ${discountAmount.toLocaleString()}đ` : ''}
            </span>
          </div>
          <span className="text-3xl font-black text-accent">{total.toLocaleString()}đ</span>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-between">
        <button 
          onClick={onPrev}
          className="bg-white border border-gray-200 text-gray-600 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Quay lại
        </button>
        <button 
          onClick={handleSubmit}
          className="bg-accent hover:bg-accent-hover text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-accent/30 active:scale-95 flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>GỬI YÊU CẦU ĐẶT LỊCH</span>
        </button>
      </div>
    </div>
  );
};

export default Step4Checkout;
