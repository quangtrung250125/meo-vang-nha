import React, { useEffect } from 'react';
import { X, Coins, Crown, ShieldCheck, ScrollText, CheckCircle2, Award, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

const policiesContent = {
  points: {
    id: 'points',
    label: 'Đổi Điểm Thưởng',
    title: 'Chính Sách Đổi Điểm Thưởng',
    icon: Coins,
    render: () => (
      <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Award className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950 text-base">Tích lũy điểm thưởng không giới hạn</h4>
            <p className="text-xs text-amber-900 mt-1">
              Mỗi đơn dịch vụ lưu trú hay làm đẹp tại Mèo Vắng Nhà đều giúp bạn tích lũy điểm để quy đổi thành quà tặng và voucher giảm giá trực tiếp.
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-amber-950 text-sm mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">1</span>
            Quy Tắc Tích Điểm
          </h4>
          <p className="text-gray-600 text-xs sm:text-sm pl-7">
            Mỗi <strong className="text-amber-800">10,000 VNĐ</strong> chi tiêu thực tế tại Mèo Vắng Nhà sẽ được tích lũy <strong className="text-amber-800">1 điểm</strong> (tương đương tỷ lệ hoàn từ 1% đến 5% tùy theo hạng hội viên hiện tại của bạn).
          </p>
        </div>

        <div>
          <h4 className="font-bold text-amber-950 text-sm mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">2</span>
            Các Mốc Quy Đổi Điểm Thưởng Tiêu Biểu
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-7 pt-1">
            <div className="bg-white border-2 border-amber-100 rounded-2xl p-3.5 shadow-sm text-center">
              <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">100 Điểm</span>
              <p className="text-xs font-bold text-gray-800 mt-2">Voucher 50.000 VNĐ</p>
              <p className="text-[11px] text-gray-500 mt-1">Áp dụng cho mọi dịch vụ lưu trú tiếp theo</p>
            </div>
            <div className="bg-white border-2 border-amber-200 rounded-2xl p-3.5 shadow-sm text-center">
              <span className="text-xs font-extrabold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full">200 Điểm</span>
              <p className="text-xs font-bold text-gray-800 mt-2">Miễn Phí 01 Lượt Spa</p>
              <p className="text-[11px] text-gray-500 mt-1">Liệu trình Tắm Thảo Dược sấy chải dịu êm</p>
            </div>
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-3.5 shadow-sm text-center">
              <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">500 Điểm</span>
              <p className="text-xs font-bold text-gray-800 mt-2">01 Đêm Phòng VIP Condo</p>
              <p className="text-[11px] text-gray-500 mt-1">Trải nghiệm căn hộ VIP sang chảnh cho bé</p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h4 className="font-bold text-amber-950 text-sm mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">3</span>
            Thời Hạn & Điều Kiện Áp Dụng
          </h4>
          <ul className="list-disc pl-12 space-y-1 text-xs text-gray-600">
            <li>Điểm thưởng có giá trị tích lũy trong vòng <strong>12 tháng</strong> kể từ ngày cộng điểm.</li>
            <li>Điểm không có giá trị quy đổi thành tiền mặt nhưng có thể chuyển nhượng giữa các hồ sơ thú cưng cùng một chủ nuôi.</li>
            <li>Có thể kết hợp dùng điểm thưởng cùng với mã voucher tri ân giảm 10% lần 2.</li>
          </ul>
        </div>
      </div>
    ),
  },
  membership: {
    id: 'membership',
    label: 'Hội Viên VIP',
    title: 'Chương Trình Hội Viên Thân Thiết',
    icon: Crown,
    render: () => (
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p className="text-xs sm:text-sm text-gray-600">
          Hạng thẻ thành viên được nâng cấp tự động dựa trên tổng chi tiêu tích lũy của Quý khách trong năm:
        </p>

        <div className="space-y-3">
          {/* Bronze Tier */}
          <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/60 transition-all hover:bg-amber-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-700/10 text-amber-800 flex items-center justify-center font-bold">
                  🥉
                </div>
                <h5 className="font-bold text-amber-950 text-sm sm:text-base">Hạng Đồng (Mới Đăng Ký)</h5>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">Chi tiêu 0đ</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1 pl-10 list-disc">
              <li>Tích lũy <strong>1%</strong> tổng giá trị mỗi hóa đơn thanh toán.</li>
              <li>Nhận thông báo các chương trình khuyến mãi sớm nhất.</li>
            </ul>
          </div>

          {/* Gold Tier */}
          <div className="border-2 border-yellow-300 rounded-2xl p-4 bg-gradient-to-r from-amber-50 to-yellow-100/50 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-700 flex items-center justify-center font-bold">
                  👑
                </div>
                <h5 className="font-bold text-amber-950 text-sm sm:text-base">Hạng Vàng (VIP Member)</h5>
              </div>
              <span className="text-[11px] font-bold text-yellow-800 bg-yellow-200 px-2.5 py-0.5 rounded-full">Từ 3.000.000 VNĐ</span>
            </div>
            <ul className="text-xs text-gray-700 space-y-1.5 pl-10 list-disc">
              <li>Tích lũy <strong>3%</strong> chi tiêu trên mọi đơn dịch vụ.</li>
              <li><strong>Giảm trực tiếp 5%</strong> cho dịch vụ phòng lưu trú khách sạn.</li>
              <li>Ưu tiên đặt chỗ vào các dịp Lễ / Tết & miễn phụ thu đón trả ngoài giờ 1 tiếng.</li>
            </ul>
          </div>

          {/* Diamond Tier */}
          <div className="border-2 border-purple-300 rounded-2xl p-4 bg-gradient-to-r from-purple-50 via-amber-50 to-orange-50 transition-all shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-700 flex items-center justify-center font-bold">
                  💎
                </div>
                <h5 className="font-bold text-purple-950 text-sm sm:text-base">Hạng Kim Cương (Diamond VIP)</h5>
              </div>
              <span className="text-[11px] font-bold text-purple-800 bg-purple-200 px-2.5 py-0.5 rounded-full">Từ 8.000.000 VNĐ</span>
            </div>
            <ul className="text-xs text-gray-700 space-y-1.5 pl-10 list-disc">
              <li>Tích lũy <strong>5%</strong> chi tiêu tối đa.</li>
              <li><strong>Giảm trực tiếp 10%</strong> cho toàn bộ menu dịch vụ Spa và Khách sạn.</li>
              <li><strong>Miễn phí dịch vụ đưa đón thú cưng</strong> trong bán kính 5km.</li>
              <li>Tặng set quà Pate tươi hữu cơ & bánh thưởng cao cấp mỗi lần bé nhận phòng.</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  privacy: {
    id: 'privacy',
    label: 'Bảo Mật',
    title: 'Chính Sách Bảo Mật Thông Tin & Thú Cưng',
    icon: ShieldCheck,
    render: () => (
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p className="text-xs sm:text-sm text-gray-600">
          Mèo Vắng Nhà cam kết tôn trọng và bảo vệ tuyệt đối thông tin cá nhân cũng như sự an toàn của thú cưng:
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-gray-900 text-xs sm:text-sm">Bảo mật thông tin khách hàng</h5>
              <p className="text-xs text-gray-500 mt-0.5">
                Họ tên, số điện thoại, địa chỉ nhà chỉ dùng nội bộ phục vụ cho việc quản lý lịch hẹn, đưa đón mèo và gửi thông tin nhật ký lưu trú. Tuyệt đối không chia sẻ cho bên thứ ba.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-gray-900 text-xs sm:text-sm">Hình ảnh & Video của bé</h5>
              <p className="text-xs text-gray-500 mt-0.5">
                Camera HD tại phòng chỉ cấp quyền xem trực tiếp cho chủ nuôi. Mọi hình ảnh chụp check-in chỉ được đăng tải lên Fanpage/TikTok khi có sự đồng ý của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-gray-900 text-xs sm:text-sm">An toàn y tế & vô trùng</h5>
              <p className="text-xs text-gray-500 mt-0.5">
                100% phòng ốc và dụng cụ grooming được khử khuẩn bằng tia cực tím (UV) và cồn y tế sau mỗi lượt sử dụng để chống lây nhiễm chéo.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  terms: {
    id: 'terms',
    label: 'Điều Khoản Dịch Vụ',
    title: 'Điều Khoản Hoạt Động & Quy Định Lưu Trú',
    icon: ScrollText,
    render: () => (
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <div>
          <h4 className="font-bold text-amber-950 text-sm mb-1.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            1. Khung Giờ Mở Cửa & Đón/Trả Ngoài Giờ
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 pl-6">
            • Khung giờ tiêu chuẩn: <strong>08:30 - 19:30 hàng ngày</strong>.<br />
            • Trường hợp Quý khách cần nhận/trả bé trước 08:30 hoặc sau 19:30, xin vui lòng <strong>liên hệ hotline trước ít nhất 2 tiếng</strong> để nhân viên sắp xếp ca trực đón bé chu đáo.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-amber-950 text-sm mb-1.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            2. Điều Kiện Sức Khỏe Tiếp Nhận
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 pl-6">
            • Bé mèo đã được tiêm phòng tối thiểu 2 mũi vắc-xin cơ bản (hoặc có sổ theo dõi).<br />
            • Bé không trong giai đoạn mắc các bệnh truyền nhiễm cấp tính (giảm bạch cầu, viêm phúc mạc FIP thể ướt, hô hấp nặng...).<br />
            • Khách sạn hỗ trợ cho bé uống thuốc hoặc ăn thức ăn theo toa của bác sĩ riêng khi chủ nuôi gửi kèm.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-amber-950 text-sm mb-1.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            3. Hủy Lịch & Đổi Lịch Đặt Phòng
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 pl-6">
            • Quý khách có thể dời lịch miễn phí trước 24 giờ so với giờ check-in dự kiến.<br />
            • Tiền đặt cọc sẽ được bảo lưu trong tài khoản thành viên để sử dụng cho bất kỳ dịp nào khác.
          </p>
        </div>
      </div>
    ),
  },
};

const PolicyModal = () => {
  const { policyModal, closePolicy, openPolicy } = useUI();
  const { isOpen, activeTab } = policyModal;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closePolicy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPolicy = policiesContent[activeTab] || policiesContent.points;
  const TabIcon = currentPolicy.icon;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
      onClick={closePolicy}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-amber-100 overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border-b border-amber-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <TabIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-amber-950 font-title">
                {currentPolicy.title}
              </h3>
              <p className="text-xs text-amber-700 font-medium">Hệ thống Khách sạn & Spa Mèo Vắng Nhà</p>
            </div>
          </div>
          <button
            onClick={closePolicy}
            className="w-9 h-9 rounded-full bg-white hover:bg-amber-200 text-amber-900 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 px-4 pt-2 overflow-x-auto gap-2">
          {Object.values(policiesContent).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => openPolicy(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-amber-700 border-amber-500 shadow-sm'
                    : 'text-gray-500 hover:text-amber-700 border-transparent hover:bg-gray-100/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {currentPolicy.render()}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            Cần hỗ trợ thêm? Gọi ngay <a href="tel:0987654321" className="font-bold text-amber-600 hover:underline">0987 654 321</a>
          </p>
          <button
            onClick={closePolicy}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2 rounded-xl transition-all text-sm shadow-md cursor-pointer active:scale-95"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
