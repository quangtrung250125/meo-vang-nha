import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Layers, 
  Sparkles, 
  Camera, 
  Gift, 
  Truck, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Info,
  Flame,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BoardingRoomGallery from './BoardingRoomGallery';
import { ROOM_TYPES } from '../../mockData/boardingServicesData';

const BoardingServiceCard = ({ 
  pkg, 
  isExpanded, 
  onToggleExpand
}) => {
  const navigate = useNavigate();

  // State cho lựa chọn nâng cấp phòng
  const [selectedRoomId, setSelectedRoomId] = useState(pkg.defaultRoomId);
  
  // State cho phụ phí camera (đối với gói 3 & gói 4)
  const [hasCameraAddon, setHasCameraAddon] = useState(false);

  // Lấy thông tin phòng hiện tại theo lựa chọn (mặc định hoặc nâng cấp)
  const currentRoomInfo = useMemo(() => {
    return ROOM_TYPES[selectedRoomId] || ROOM_TYPES[pkg.defaultRoomId];
  }, [selectedRoomId, pkg.defaultRoomId]);

  // Tìm phụ phí của phòng đang chọn
  const roomUpgradeOption = useMemo(() => {
    return pkg.availableUpgrades?.find(u => u.roomId === selectedRoomId) || { surcharge: 0 };
  }, [pkg.availableUpgrades, selectedRoomId]);

  const roomSurcharge = roomUpgradeOption.surcharge || 0;
  const cameraSurcharge = (pkg.features.camera.canAddCamera && hasCameraAddon) ? (pkg.features.camera.cameraSurcharge || 10000) : 0;

  // Tính tổng chi phí/ngày theo thời gian thực
  const totalDailyCost = pkg.basePrice + roomSurcharge + cameraSurcharge;
  const formatCurrency = (val) => val.toLocaleString('vi-VN') + 'đ';

  const handleBooking = (e) => {
    e.stopPropagation();
    navigate('/booking', {
      state: {
        preSelectedPackageId: pkg.id,
        preSelectedPackageName: pkg.name,
        selectedRoomType: currentRoomInfo.shortName,
        totalDailyCost: totalDailyCost,
        hasCameraAddon: hasCameraAddon
      }
    });
  };

  return (
    <div 
      className={`bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl ${
        isExpanded ? 'border-primary/60 shadow-lg ring-2 ring-primary/10' : 'border-gray-200/90 hover:border-gray-300'
      }`}
    >
      {/* 1. Header Accordion Clickable */}
      <div 
        onClick={onToggleExpand}
        className={`p-5 sm:p-6 cursor-pointer select-none transition-colors ${
          isExpanded ? 'bg-gradient-to-r from-orange-50/70 via-white to-orange-50/30' : 'bg-white hover:bg-gray-50/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Package Title & Highlights */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-primary text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {pkg.highlightBadge}
              </span>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                Phòng mặc định: {ROOM_TYPES[pkg.defaultRoomId]?.name}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-text-dark font-title tracking-tight">
              {pkg.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1 sm:line-clamp-none">
              {pkg.tagline}
            </p>
          </div>

          {/* Pricing & Toggle Button */}
          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
            <div className="text-left sm:text-right">
              <div className="flex items-baseline gap-1 sm:justify-end">
                <span className="text-2xl sm:text-3xl font-black text-accent font-title">
                  {formatCurrency(totalDailyCost)}
                </span>
                <span className="text-xs font-semibold text-gray-500">{pkg.period}</span>
              </div>
              {roomSurcharge > 0 && (
                <p className="text-[11px] text-emerald-600 font-bold">
                  (Đã gồm nâng cấp +{formatCurrency(roomSurcharge)})
                </p>
              )}
            </div>

            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-xs group-hover:border-primary transition-all">
              {isExpanded ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>

        </div>
      </div>

      {/* 2. Collapsible Expanded Content */}
      {isExpanded && (
        <div className="p-5 sm:p-7 border-t border-gray-100 bg-[#FAF9F7]/40 space-y-7 animate-in fade-in duration-300">
          
          {/* Main Grid: Gallery & Room Upgrades */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Col: Room Photo Gallery / Carousel (5 cols) */}
            <div className="lg:col-span-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Ảnh phòng thực tế:
                </span>
                <span className="text-xs font-bold text-primary">
                  {currentRoomInfo.capacity}
                </span>
              </div>

              <BoardingRoomGallery 
                roomInfo={currentRoomInfo} 
                currentSelectedRoomName={currentRoomInfo.name}
              />

              <p className="text-xs text-gray-600 mt-2.5 leading-relaxed italic bg-white p-3 rounded-xl border border-gray-200/80">
                "{currentRoomInfo.description}"
              </p>
            </div>

            {/* Right Col: Room Upgrade Selector + Amenities List (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Room Upgrade Options Radio/Toggle (if package allows upgrades) */}
              {pkg.availableUpgrades && pkg.availableUpgrades.length > 1 && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-text-dark flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-accent" />
                      Tùy chọn nâng cấp phòng:
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      Bấm để đổi phòng & xem ảnh
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {pkg.availableUpgrades.map((upgrade) => {
                      const isSelected = selectedRoomId === upgrade.roomId;
                      return (
                        <div
                          key={upgrade.roomId}
                          onClick={() => setSelectedRoomId(upgrade.roomId)}
                          className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex sm:flex-col items-center sm:items-start gap-3 relative ${
                            isSelected
                              ? 'border-primary bg-primary-light/40 shadow-xs ring-1 ring-primary/30'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {/* Mini Thumbnail */}
                          <img
                            src={upgrade.image}
                            alt={upgrade.label}
                            className="w-12 h-12 sm:w-full sm:h-20 rounded-lg object-cover border border-gray-100 shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name={`room-upgrade-${pkg.id}`}
                                checked={isSelected}
                                onChange={() => setSelectedRoomId(upgrade.roomId)}
                                className="w-3.5 h-3.5 text-primary accent-primary cursor-pointer"
                              />
                              <p className="text-xs font-bold text-text-dark truncate">
                                {ROOM_TYPES[upgrade.roomId]?.name}
                              </p>
                            </div>

                            <span className={`inline-block text-[11px] font-black mt-1 ${
                              upgrade.surcharge > 0 ? 'text-accent' : 'text-emerald-600'
                            }`}>
                              {upgrade.surchargeString}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Camera Addon Toggle for Package 3 and 4 */}
              {pkg.features.camera.canAddCamera && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-accent flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-text-dark">
                        Bổ sung Camera riêng 24/24 trong phòng
                      </h5>
                      <p className="text-[11px] text-gray-500">
                        Theo dõi trực tiếp bé qua app bất cứ lúc nào (+10.000đ/ngày)
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasCameraAddon} 
                      onChange={(e) => setHasCameraAddon(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              )}

              {/* 6 Core Amenities List */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-text-dark">
                    Danh mục tiện ích trọn gói:
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* 1. Ăn uống */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-accent flex items-center justify-center shrink-0 mt-0.5">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-dark">Ăn uống:</p>
                      <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                        {pkg.features.food.detail}
                      </p>
                    </div>
                  </div>

                  {/* 2. Cát vệ sinh */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-dark">Cát vệ sinh:</p>
                      <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                        {pkg.features.litter.detail}
                      </p>
                    </div>
                  </div>

                  {/* 3. Dọn dẹp vệ sinh */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-dark">Dọn dẹp vệ sinh:</p>
                      <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                        {pkg.features.cleaning.detail}
                      </p>
                    </div>
                  </div>

                  {/* 4. Camera */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-dark">Camera theo dõi:</p>
                      <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                        {pkg.features.camera.detail}
                      </p>
                    </div>
                  </div>

                  {/* 5. Bonus quà tặng */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-dark">Quà tặng đặc biệt:</p>
                      <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                        {pkg.features.bonus.detail}
                      </p>
                    </div>
                  </div>

                  {/* 6. Đưa đón tận nơi */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-dark">Đưa đón thú cưng:</p>
                      <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                        {pkg.features.transport.detail}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Bottom Live Price Calculator Bar & CTA */}
          <div className="bg-gradient-to-r from-orange-100/80 via-white to-amber-100/70 p-4 sm:p-6 rounded-2xl border border-orange-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Calculation formula details */}
            <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-gray-600">
                <span>Gói gốc: <strong className="text-text-dark">{pkg.priceString}</strong></span>
                {roomSurcharge > 0 && (
                  <>
                    <span>+</span>
                    <span>Nâng {currentRoomInfo.name}: <strong className="text-accent">+{formatCurrency(roomSurcharge)}</strong></span>
                  </>
                )}
                {cameraSurcharge > 0 && (
                  <>
                    <span>+</span>
                    <span>Camera: <strong className="text-accent">+{formatCurrency(cameraSurcharge)}</strong></span>
                  </>
                )}
              </div>

              <div className="flex items-baseline justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Tổng chi phí tính lại:
                </span>
                <span className="text-2xl sm:text-3xl font-black text-accent font-title">
                  {formatCurrency(totalDailyCost)}
                </span>
                <span className="text-xs font-bold text-gray-500">{pkg.period}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleBooking}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-accent/25 hover:shadow-lg active:scale-95 cursor-pointer text-sm sm:text-base"
              >
                <span>Đặt phòng gói này</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default BoardingServiceCard;
