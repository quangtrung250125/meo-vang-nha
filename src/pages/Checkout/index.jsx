import React, { useState } from 'react';
import { 
  Banknote, 
  CreditCard, 
  Landmark, 
  PawPrint, 
  CheckCircle, 
  QrCode, 
  ArrowLeft,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { globalBookingList } = useBookingHistory();

  const [paymentMethod, setPaymentMethod] = useState('transfer'); // 'cash' | 'transfer' | 'card'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Retrieve booking data or fallback to active booking
  const booking = location.state?.bookingData || globalBookingList[0] || {
    id: 'MVN-88231',
    checkIn: '2026-09-14',
    checkOut: '2026-09-19',
    selectedPackage: { name: 'Gói VIP Hoàng Gia', price: 500000 },
    selectedRoom: { name: 'Phòng Deluxe Suite 01' },
    petProfiles: [{ name: 'Bé Bơ' }],
    totalPrice: 2500000,
    depositPaid: 1000000,
    remainingAmount: 1500000
  };

  const petNames = booking.petProfiles?.map(p => p.name).join(', ') || 'Bé Mèo';
  const totalDue = booking.remainingAmount || 820000;
  const qrTransferUrl = `https://img.vietqr.io/image/mbbank-111122223333-compact2.png?amount=${totalDue}&addInfo=Thanh%20toan%20${booking.id}&accountName=MEO%20VANG%20NHA`;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      toast.success('Thanh toán hoàn tất! Cảm ơn bạn đã tin tưởng Mèo Vắng Nhà.');
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen bg-bg-cream pb-16">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Breadcrumb / Back */}
        <div className="mb-6">
          <Link 
            to="/my-booking" 
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Danh sách booking
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-extrabold text-text-dark font-title mb-2">Thanh toán hóa đơn</h1>
            <p className="text-sm text-gray-500 mb-8">
              Mã booking: <strong className="text-text-dark font-mono">{booking.id}</strong> • Chăm sóc bé: <strong className="text-primary">{petNames}</strong>
            </p>
            
            {/* Invoice Breakdown */}
            <div className="mb-8">
              <h2 className="text-base font-bold text-text-dark mb-3">Danh sách chi phí</h2>
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-xs text-gray-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-6">Dịch vụ</th>
                      <th className="py-3.5 px-6 text-center">Số lượng</th>
                      <th className="py-3.5 px-6 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                    <tr>
                      <td className="py-4 px-6 font-medium">
                        {booking.selectedPackage?.name || 'Gói lưu trú tiêu chuẩn'}
                        <div className="text-[11px] text-gray-400 mt-0.5">{booking.selectedRoom?.name || 'Phòng Deluxe'}</div>
                      </td>
                      <td className="py-4 px-6 text-center">1 kỳ</td>
                      <td className="py-4 px-6 text-right font-semibold">{(booking.totalPrice || 1200000).toLocaleString('vi-VN')} đ</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium">Gói dịch vụ Camera 24/7 trực tuyến</td>
                      <td className="py-4 px-6 text-center">Bao gồm</td>
                      <td className="py-4 px-6 text-right font-semibold text-emerald-600">Miễn phí</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium">Khử trùng & Cát hữu cơ tiêu chuẩn</td>
                      <td className="py-4 px-6 text-center">Hàng ngày</td>
                      <td className="py-4 px-6 text-right font-semibold text-emerald-600">Miễn phí</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="p-6 bg-bg-cream/60 space-y-3 border-t border-gray-100 text-xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Tổng tiền dịch vụ:</span>
                    <span className="font-bold text-text-dark">{(booking.totalPrice || 1200000).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Đã đặt cọc trước (50%):</span>
                    <span className="font-bold text-emerald-600">- {(booking.depositPaid || 600000).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center text-primary pt-3 border-t border-gray-200">
                    <span className="font-bold text-sm text-text-dark">Số tiền cần thanh toán:</span>
                    <span className="font-extrabold text-xl text-accent bg-accent/10 px-3 py-1 rounded-xl">
                      {totalDue.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h2 className="text-base font-bold text-text-dark mb-3">Chọn phương thức thanh toán</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                
                {/* Chuyển khoản QR */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`flex items-center justify-center gap-2.5 rounded-2xl p-4 cursor-pointer transition-all border-2 text-xs font-bold ${
                    paymentMethod === 'transfer' 
                      ? 'border-primary bg-primary/10 text-primary shadow-xs' 
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Chuyển khoản QR</span>
                </button>

                {/* Tiền mặt */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-2.5 rounded-2xl p-4 cursor-pointer transition-all border-2 text-xs font-bold ${
                    paymentMethod === 'cash' 
                      ? 'border-primary bg-primary/10 text-primary shadow-xs' 
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Tiền mặt tại quầy</span>
                </button>

                {/* Thẻ */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2.5 rounded-2xl p-4 cursor-pointer transition-all border-2 text-xs font-bold ${
                    paymentMethod === 'card' 
                      ? 'border-primary bg-primary/10 text-primary shadow-xs' 
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Thẻ ATM / Visa</span>
                </button>

              </div>

              {/* QR display when transfer selected */}
              {paymentMethod === 'transfer' && (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 mb-6 flex flex-col sm:flex-row items-center gap-6 shadow-xs animate-in fade-in duration-150">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 shrink-0">
                    <img src={qrTransferUrl} alt="VietQR" className="w-36 h-36 object-contain" />
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600 text-center sm:text-left">
                    <div className="font-bold text-text-dark text-sm mb-1">Quét mã VietQR chuyển khoản nhanh 24/7</div>
                    <p>Ngân hàng: <strong>MBBank (Ngân hàng Quân Đội)</strong></p>
                    <p>Số tài khoản: <strong className="font-mono text-primary">111122223333</strong></p>
                    <p>Chủ tài khoản: <strong>MEO VANG NHA CO., LTD</strong></p>
                    <p>Nội dung chuyển khoản: <strong className="font-mono text-text-dark">Thanh toan {booking.id}</strong></p>
                    <p className="text-[11px] text-gray-400 pt-1">Hệ thống sẽ tự động xác thực ngay khi ngân hàng báo Có.</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!isPaid ? (
                <button 
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-accent/30 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isProcessing ? 'Đang xử lý giao dịch...' : `XÁC NHẬN THANH TOÁN (${totalDue.toLocaleString('vi-VN')} đ)`}
                </button>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                    <CheckCircle className="w-5 h-5" />
                    Đã thanh toán thành công!
                  </div>
                  <p className="text-xs text-emerald-600">Cảm ơn bạn đã tin tưởng dịch vụ Mèo Vắng Nhà.</p>
                </div>
              )}

            </div>
          </div>

          {/* Right Column - Status & Support */}
          <div className="lg:col-span-1 border border-gray-100 rounded-3xl bg-white p-6 sm:p-8 shadow-xs flex flex-col items-center justify-between text-center h-fit">
            <div>
              <div className="w-24 h-24 bg-primary-light/50 rounded-full flex items-center justify-center mx-auto mb-5 text-primary">
                <PawPrint className="w-12 h-12" />
              </div>
              
              <h3 className="text-lg font-bold text-text-dark font-title mb-2">
                Mèo Vắng Nhà đồng hành cùng bé!
              </h3>
              
              <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                Đội ngũ chăm sóc luôn túc trực 24/7 để đảm bảo các bé mèo luôn vui vẻ, an toàn và thoải mái nhất.
              </p>

              <div className="bg-bg-cream rounded-2xl p-4 text-xs text-left space-y-2 border border-gray-100 mb-6">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Bảo hiểm lưu trú thú cưng
                </div>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Camera giám sát riêng tư 24/7
                </div>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Bác sĩ thú y túc trực hỗ trợ
                </div>
              </div>
            </div>

            <div className="w-full space-y-2.5">
              <button 
                onClick={() => navigate('/tracking', { state: { bookingData: booking } })}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition-colors text-xs shadow-md shadow-primary/20 cursor-pointer"
              >
                Xem theo dõi mèo của bé
              </button>
              
              <Link 
                to="/"
                className="block w-full bg-gray-50 text-gray-700 border border-gray-200 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors text-xs"
              >
                Về trang chủ
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
