import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Utensils, 
  Layers, 
  CheckCircle2, 
  Info, 
  Heart,
  Fish,
  ShieldCheck,
  Flame,
  Camera
} from 'lucide-react';
import { EXTRA_SERVICE_INFO } from '../../mockData/boardingServicesData';

const BoardingExtraInfoModal = ({ isOpen, onClose, initialTab = 'litter' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-orange-100 max-w-3xl w-full max-h-[90vh] flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#FFF5EB] via-[#FFF9F3] to-[#F3F9F5] px-6 py-5 border-b border-orange-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent to-[#FF8A50] text-white flex items-center justify-center shadow-md shadow-accent/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-dark font-title flex items-center gap-2">
                Thông Tin Thêm Về Tiện Ích
              </h3>
              <p className="text-xs text-gray-500">
                Chi tiết tiêu chuẩn cát vệ sinh & nguồn thực phẩm tại Mèo Vắng Nhà
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center border border-gray-200 shadow-sm transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 pb-2 bg-[#FAFAF9] border-b border-gray-100 flex gap-3">
          <button
            onClick={() => setActiveTab('litter')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'litter'
                ? 'bg-accent text-white shadow-md shadow-accent/25'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cát vệ sinh cho mèo</span>
          </button>

          <button
            onClick={() => setActiveTab('food')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'food'
                ? 'bg-accent text-white shadow-md shadow-accent/25'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Thực đơn & Thức ăn</span>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: CÁT VỆ SINH */}
          {activeTab === 'litter' && (
            <div className="space-y-6">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                  <span className="font-bold">Tiêu chuẩn vệ sinh:</span> Cát được lọc bụi kỹ trước khi đưa vào khay của bé. Khay cát được dọn sạch định kỳ 1 - 2 lần mỗi ngày (tùy gói dịch vụ) và thay mới 100% trước mỗi lượt khách.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {EXTRA_SERVICE_INFO.litters.map((litter) => (
                  <div 
                    key={litter.id}
                    className="bg-white rounded-2xl border-2 border-gray-100 hover:border-orange-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                  >
                    {/* Image with Tag */}
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden group">
                      <img 
                        src={litter.image} 
                        alt={litter.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/service_care.png';
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-accent text-xs font-black px-2.5 py-1 rounded-full shadow-sm border border-orange-100 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>{litter.badge}</span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                        Ảnh chụp sản phẩm
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-lg text-text-dark font-title mb-2">
                          {litter.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                          {litter.desc}
                        </p>

                        <div className="space-y-2 pt-3 border-t border-gray-100">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ưu điểm nổi trội:</p>
                          {litter.highlights.map((h, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: THỰC ĐƠN & ĐỒ ĂN */}
          {activeTab === 'food' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                  <span className="font-bold">Cam kết an toàn thực phẩm:</span> Nguyên liệu tươi mua trong ngày, pate tự nấu không muối/gia vị gây hại thận mèo, bảo quản tủ lạnh chuyên dụng và khay đựng inox khử khuẩn sau mỗi lần ăn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {EXTRA_SERVICE_INFO.foods.map((food) => (
                  <div 
                    key={food.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-[#FFFDF9] hover:bg-white hover:border-orange-200 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-accent">
                          {food.badge}
                        </span>
                        <Fish className="w-4 h-4 text-orange-400" />
                      </div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">
                        {food.name}
                      </h4>
                      <p className="text-[11px] text-primary font-semibold mb-2">
                        {food.type}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {food.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100/80 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Chuẩn dinh dưỡng</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 text-xs text-gray-600 leading-relaxed">
                💡 <span className="font-bold text-accent">Lưu ý cho Sen:</span> Với gói "Mèo Tự Túc", sen vui lòng chuẩn bị thức ăn đóng hộp hoặc chia sẵn thành từng bữa để trại bảo quản và phục vụ bé theo đúng khẩu phần quen thuộc ở nhà.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-black text-white text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            Đã hiểu & Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

export default BoardingExtraInfoModal;
