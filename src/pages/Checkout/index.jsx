import React, { useState } from 'react';
import { Banknote, CreditCard, Landmark, PawPrint, Tag, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('cash');

  return (
    <div className="w-full bg-[#FAF8F5]/60 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-extrabold text-text-dark font-title">Hóa đơn thanh toán</h1>
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã áp dụng ưu đãi 10%</span>
              </div>
            </div>
            
            {/* Invoice */}
            <div className="mb-10">
              <h2 className="text-lg font-bold text-text-dark mb-4">Danh sách chi phí dịch vụ</h2>
              <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="py-4 px-6 font-semibold text-gray-500 text-sm w-1/2">Dịch vụ</th>
                      <th className="py-4 px-6 font-semibold text-gray-500 text-sm text-center">Số lượng</th>
                      <th className="py-4 px-6 font-semibold text-gray-500 text-sm text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm">
                    <tr className="border-b border-gray-50">
                      <td className="py-4 px-6 font-medium">Lưu trú phòng Tiêu chuẩn (4 ngày)</td>
                      <td className="py-4 px-6 text-center">1</td>
                      <td className="py-4 px-6 text-right font-medium">1.000.000đ</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-4 px-6 font-medium">Spa & Tắm cắt chuyên sâu</td>
                      <td className="py-4 px-6 text-center">1</td>
                      <td className="py-4 px-6 text-right font-medium">220.000đ</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-4 px-6 font-medium">Dịch vụ Camera theo dõi (4 ngày)</td>
                      <td className="py-4 px-6 text-center">1</td>
                      <td className="py-4 px-6 text-right font-medium">40.000đ</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="p-6 bg-gray-50/70 space-y-3">
                  <div className="flex justify-between items-center text-gray-600 text-sm">
                    <span>Tổng tiền dịch vụ gốc:</span>
                    <span>1.260.000đ</span>
                  </div>

                  {/* 10% discount item */}
                  <div className="flex justify-between items-center text-emerald-700 font-bold text-sm bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4" />
                      Ưu đãi giảm giá 10% (Mã: MEOXINH10):
                    </span>
                    <span>- 122.000đ</span>
                  </div>

                  <div className="flex justify-between items-center text-text-dark font-bold text-base pt-2">
                    <span>Tổng sau giảm giá:</span>
                    <span>1.138.000đ</span>
                  </div>

                  <div className="flex justify-between items-center text-gray-500 text-sm">
                    <span>Đã thanh toán (đặt cọc trước):</span>
                    <span>- 200.000đ</span>
                  </div>

                  <div className="flex justify-between items-center text-primary pt-4 border-t border-gray-200">
                    <span className="font-bold text-lg">Còn lại cần thanh toán:</span>
                    <span className="font-black text-2xl text-accent bg-orange-50 border border-orange-200 px-4 py-1.5 rounded-xl">
                      938.000đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h2 className="text-lg font-bold text-text-dark mb-4">Phương thức thanh toán</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <label 
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-3 border-2 rounded-2xl p-4 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary-light text-primary font-bold shadow-sm' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}
                >
                  <input type="radio" name="payment" checked={paymentMethod === 'cash'} readOnly className="hidden" />
                  <Banknote className="w-5 h-5" />
                  <span className="text-sm">Tiền mặt</span>
                </label>
                <label 
                  onClick={() => setPaymentMethod('transfer')}
                  className={`flex items-center justify-center gap-3 border-2 rounded-2xl p-4 cursor-pointer transition-all ${paymentMethod === 'transfer' ? 'border-primary bg-primary-light text-primary font-bold shadow-sm' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}
                >
                  <input type="radio" name="payment" checked={paymentMethod === 'transfer'} readOnly className="hidden" />
                  <Landmark className="w-5 h-5" />
                  <span className="text-sm">Chuyển khoản QR</span>
                </label>
                <label 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-3 border-2 rounded-2xl p-4 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary-light text-primary font-bold shadow-sm' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}
                >
                  <input type="radio" name="payment" checked={paymentMethod === 'card'} readOnly className="hidden" />
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm">Thẻ ATM / Visa</span>
                </label>
              </div>

              <button 
                onClick={() => alert('Thanh toán thành công! Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ.')}
                className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-accent/30 active:scale-95 text-lg"
              >
                Xác nhận thanh toán 938.000đ
              </button>
            </div>
          </div>

          {/* Right Column - Feedback & Return */}
          <div className="lg:col-span-1 border border-gray-200/80 rounded-3xl bg-white p-8 shadow-sm flex flex-col items-center justify-center text-center h-fit">
            <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center mb-6 text-primary">
              <PawPrint className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-text-dark font-title mb-2">Cảm ơn bạn đã tin chọn Mèo Vắng Nhà!</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Bé mèo đã được chăm sóc chu đáo với tiêu chuẩn tốt nhất và áp dụng ưu đãi chiết khấu 10%.
            </p>
            <button 
              onClick={() => alert('Cảm ơn bạn đã gửi đánh giá 5 sao!')}
              className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:bg-accent-hover transition-colors shadow-md shadow-accent/20 mb-3"
            >
              Đánh giá dịch vụ ⭐⭐⭐⭐⭐
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-bg-cream text-text-dark border border-gray-200 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Về trang chủ
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
