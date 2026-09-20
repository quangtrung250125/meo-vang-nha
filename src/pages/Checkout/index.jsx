import React from 'react';
import { Banknote, CreditCard, Landmark, PawPrint } from 'lucide-react';

const Checkout = () => {
  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-extrabold text-text-dark font-title mb-8">Thanh toán</h1>
            
            {/* Invoice */}
            <div className="mb-10">
              <h2 className="text-lg font-bold text-text-dark mb-4">Danh sách chi phí</h2>
              <div className="bg-bg-cream border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-4 px-6 font-medium text-gray-500 w-1/2">Dịch vụ</th>
                      <th className="py-4 px-6 font-medium text-gray-500 text-center">Số lượng</th>
                      <th className="py-4 px-6 font-medium text-gray-500 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-50">
                      <td className="py-4 px-6">Lưu trú (4 ngày)</td>
                      <td className="py-4 px-6 text-center">1</td>
                      <td className="py-4 px-6 text-right">800.000đ</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-4 px-6">Tắm cắt</td>
                      <td className="py-4 px-6 text-center">1</td>
                      <td className="py-4 px-6 text-right">150.000đ</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-4 px-6">Camera (4 ngày)</td>
                      <td className="py-4 px-6 text-center">1</td>
                      <td className="py-4 px-6 text-right">40.000đ</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 px-6">Phụ phí</td>
                      <td className="py-4 px-6 text-center">1</td>
                      <td className="py-4 px-6 text-right">30.000đ</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="p-6 bg-gray-50/50 space-y-4">
                  <div className="flex justify-between items-center text-text-dark">
                    <span className="font-bold">Tổng cộng</span>
                    <span className="font-bold">1.020.000đ</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Đã thanh toán (đặt cọc)</span>
                    <span>- 200.000đ</span>
                  </div>
                  <div className="flex justify-between items-center text-primary pt-4 border-t border-gray-200">
                    <span className="font-bold text-lg">Cần thanh toán</span>
                    <span className="font-bold text-xl bg-primary-light px-3 py-1 rounded-md">820.000đ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h2 className="text-lg font-bold text-text-dark mb-4">Phương thức thanh toán</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <label className="flex items-center justify-center gap-3 border-2 border-primary bg-primary-light text-primary rounded-xl p-4 cursor-pointer">
                  <input type="radio" name="payment" defaultChecked className="hidden" />
                  <Banknote className="w-5 h-5" />
                  <span className="font-bold text-sm">Tiền mặt</span>
                </label>
                <label className="flex items-center justify-center gap-3 border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary transition-colors text-gray-600">
                  <input type="radio" name="payment" className="hidden" />
                  <Landmark className="w-5 h-5" />
                  <span className="font-medium text-sm">Chuyển khoản</span>
                </label>
                <label className="flex items-center justify-center gap-3 border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary transition-colors text-gray-600">
                  <input type="radio" name="payment" className="hidden" />
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium text-sm">Thẻ</span>
                </label>
              </div>

              <button className="w-full bg-accent text-white font-bold py-4 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30">
                Thanh toán
              </button>
            </div>
          </div>

          {/* Right Column - Success Message */}
          <div className="lg:col-span-1 border border-gray-100 rounded-2xl bg-bg-cream p-8 shadow-sm flex flex-col items-center justify-center text-center h-fit">
            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
              <PawPrint className="w-16 h-16" />
            </div>
            <h2 className="text-xl font-bold text-text-dark font-title mb-4">Cảm ơn bạn đã sử dụng dịch vụ!</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Mèo đã được bàn giao an toàn.<br/>
              Rất mong được gặp lại bạn và bé trong những lần sau!
            </p>
            <button className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30 mb-4">
              Đánh giá dịch vụ
            </button>
            <button className="w-full bg-bg-cream text-text-dark border border-gray-200 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              Về trang chủ
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
