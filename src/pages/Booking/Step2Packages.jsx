import React, { useMemo } from 'react';
import { packagesList, promotionInfo, ROOM_SURCHARGES } from '../../mockData/servicesData';
import { Flame, Check, Sparkles, Bath, Car, BedDouble, X } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROOM_TYPE_LABELS = {
  VIP: 'Phòng VIP',
  VVIP: 'Phòng VVIP',
  DELUXE: 'Phòng Deluxe',
};

const ROOM_TYPE_COLORS = {
  VIP:    'text-orange-600 bg-orange-50 border-orange-200',
  VVIP:   'text-purple-600 bg-purple-50 border-purple-200',
  DELUXE: 'text-sky-600 bg-sky-50 border-sky-200',
};

/**
 * Tính giá gói lưu trú có tính phụ phí phòng.
 */
function calcPricing(pkg, roomType) {
  const surcharge    = ROOM_SURCHARGES?.[roomType] ?? 0;
  const baseOrig     = pkg.baseOriginalPrice ?? pkg.originalPrice;
  const basePrc      = pkg.basePrice         ?? pkg.price;
  const originalPrice = baseOrig + surcharge;
  const price         = basePrc  + Math.round(surcharge * 0.9);
  const savings       = originalPrice - price;
  const fmt = (n) => n.toLocaleString('vi-VN') + 'đ';
  return { price, originalPrice, priceString: fmt(price), originalPriceString: fmt(originalPrice), savingsString: fmt(savings), surcharge };
}

// ── Section header ────────────────────────────────────────────────────────────
const SectionTitle = ({ icon: Icon, color, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="font-bold text-text-dark text-base">{title}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

// ── Package Card ──────────────────────────────────────────────────────────────
const PackageCard = ({ pkg, pricing, isSelected, onClick, badge }) => (
  <div
    onClick={onClick}
    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
      isSelected
        ? 'border-primary bg-primary-light/40 shadow-md ring-2 ring-primary/20'
        : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-bg-cream'
    }`}
  >
    {pkg.isPromo && (
      <div className="absolute -top-2.5 right-4 bg-accent text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
        -10%
      </div>
    )}
    {badge && (
      <div className="absolute -top-2.5 left-4 bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
        {badge}
      </div>
    )}
    <div>
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-base text-text-dark">{pkg.name}</h3>
        <div className="text-right shrink-0 ml-2">
          <span className="font-black text-lg text-accent">{pricing.priceString}</span>
          <span className="text-xs text-gray-500">{pkg.period}</span>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs mb-3">
        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
          Tiết kiệm {pricing.savingsString}
        </span>
        <span className="text-gray-400 line-through">{pricing.originalPriceString}</span>
      </div>
      <p className="text-xs text-gray-600 mb-4 leading-relaxed">{pkg.desc}</p>
    </div>
    <div className="space-y-1.5 pt-3 border-t border-gray-100">
      {pkg.features?.slice(0, 3).map((feat, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
          <Check className="w-3.5 h-3.5 text-primary shrink-0 stroke-[2.5]" />
          <span>{feat}</span>
        </div>
      ))}
    </div>
    {isSelected && (
      <div className="mt-3 flex items-center gap-1.5 text-primary text-xs font-bold">
        <Sparkles className="w-3.5 h-3.5" />
        Đã chọn
      </div>
    )}
  </div>
);

// ── Main Step 2 ───────────────────────────────────────────────────────────────
const Step2Packages = ({ data, updateData, onNext, onPrev }) => {
  // Lấy loại phòng từ selectedRoom (VIP / VVIP / DELUXE)
  const roomType = (data.selectedRoom?.type ?? data.selectedRoom?.id?.split('-')[0] ?? 'VIP').toUpperCase();

  // Lọc gói lưu trú theo hạng phòng đã chọn
  const lodgingPkgs = useMemo(
    () => packagesList.filter(
      (p) => p.category === 'Lưu trú' && (p.forRoomTypes?.includes(roomType) ?? true)
    ),
    [roomType]
  );

  // Gói spa tắm cắt
  const spaPkgs = useMemo(() => packagesList.filter((p) => p.category === 'Spa - Tắm cắt'), []);

  // Gói dịch vụ khác
  const extraPkgs = useMemo(() => packagesList.filter((p) => p.category === 'Dịch vụ khác'), []);

  const selectedLodging = data.selectedLodging || null;
  const selectedSpa     = data.selectedSpa     || null;
  const selectedExtra   = data.selectedExtra   || null;

  // Khi chọn gói lưu trú — tính lại giá theo phòng và lưu vào cả selectedPackage (tương thích Step4)
  const handleSelectLodging = (pkg) => {
    const pricing = calcPricing(pkg, roomType);
    updateData({
      selectedLodging: { ...pkg, ...pricing },
      selectedPackage: { ...pkg, ...pricing },
    });
  };

  const handleSelectSpa = (pkg) => {
    updateData({ selectedSpa: selectedSpa?.id === pkg.id ? null : pkg });
  };

  const handleSelectExtra = (pkg) => {
    updateData({ selectedExtra: selectedExtra?.id === pkg.id ? null : pkg });
  };

  const handleNextClick = () => {
    if (!selectedLodging) return;
    onNext();
  };

  // Tóm tắt giỏ dịch vụ đã chọn
  const summary = [
    selectedLodging && { label: selectedLodging.name, price: selectedLodging.priceString, period: selectedLodging.period, color: 'text-primary' },
    selectedSpa     && { label: selectedSpa.name,     price: selectedSpa.priceString,     period: selectedSpa.period,     color: 'text-purple-600' },
    selectedExtra   && { label: selectedExtra.name,   price: selectedExtra.priceString,   period: selectedExtra.period,   color: 'text-sky-600' },
  ].filter(Boolean);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h2 className="text-2xl font-bold text-text-dark font-title">2. Chọn gói dịch vụ</h2>
          <div className="inline-flex items-center gap-1.5 bg-orange-100/80 text-accent text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Ưu đãi giảm giá 10% đã kích hoạt</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm">Chọn gói chăm sóc phù hợp nhất với nhu cầu của bé mèo.</p>
      </div>

      {/* Promo banner */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 border border-accent/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-black text-sm shrink-0">%</div>
        <div className="text-xs sm:text-sm text-gray-700">
          <span className="font-bold text-accent">Mã {promotionInfo.code}:</span> Toàn bộ gói dịch vụ đã được áp dụng chiết khấu 10% trực tiếp vào giá.
        </div>
      </div>

      {/* Hạng phòng đang chọn */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${ROOM_TYPE_COLORS[roomType] ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
        <BedDouble className="w-4 h-4" />
        Phòng đã chọn: <span className="font-extrabold">{ROOM_TYPE_LABELS[roomType] ?? roomType}</span>
        &nbsp;— gói bên dưới phù hợp với hạng phòng này
      </div>

      {/* ── SECTION 1: GÓI LƯU TRÚ (bắt buộc, chọn 1) ── */}
      <div>
        <SectionTitle
          icon={BedDouble}
          color="bg-primary-light text-primary"
          title="Gói lưu trú"
          subtitle="Bắt buộc — chọn 1 gói"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lodgingPkgs.map((pkg) => {
            const pricing = calcPricing(pkg, roomType);
            return (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                pricing={pricing}
                isSelected={selectedLodging?.id === pkg.id}
                onClick={() => handleSelectLodging(pkg)}
                badge={pkg.isBestChoice ? '👑 Cao cấp nhất' : pkg.isPopular ? '⭐ Phổ biến' : null}
              />
            );
          })}
        </div>
        {!selectedLodging && (
          <p className="text-red-500 text-xs font-medium mt-2">* Vui lòng chọn 1 gói lưu trú để tiếp tục.</p>
        )}
      </div>

      {/* ── SECTION 2: GÓI SPA (tùy chọn, tối đa 1) ── */}
      <div>
        <SectionTitle
          icon={Bath}
          color="bg-purple-100 text-purple-600"
          title="Gói Spa — Tắm & Cắt tỉa"
          subtitle="Tùy chọn — chọn tối đa 1 gói (click lại để bỏ chọn)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spaPkgs.map((pkg) => {
            const pricing = { price: pkg.price, originalPrice: pkg.originalPrice, priceString: pkg.priceString, originalPriceString: pkg.originalPriceString, savingsString: pkg.savingsString };
            const isSelected = selectedSpa?.id === pkg.id;
            return (
              <div key={pkg.id} className="relative">
                <PackageCard
                  pkg={pkg}
                  pricing={pricing}
                  isSelected={isSelected}
                  onClick={() => handleSelectSpa(pkg)}
                  badge={pkg.isPopular ? '⭐ Phổ biến' : null}
                />
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSelectSpa(pkg); }}
                    className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500 flex items-center justify-center transition-colors"
                    title="Bỏ chọn"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!selectedSpa && (
          <p className="text-gray-400 text-xs mt-2 italic">Không bắt buộc — bạn có thể bỏ qua.</p>
        )}
      </div>

      {/* ── SECTION 3: DỊCH VỤ KHÁC (tùy chọn, tối đa 1) ── */}
      <div>
        <SectionTitle
          icon={Car}
          color="bg-sky-100 text-sky-600"
          title="Dịch vụ khác"
          subtitle="Tùy chọn — chọn tối đa 1 gói (click lại để bỏ chọn)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {extraPkgs.map((pkg) => {
            const pricing = { price: pkg.price, originalPrice: pkg.originalPrice, priceString: pkg.priceString, originalPriceString: pkg.originalPriceString, savingsString: pkg.savingsString };
            const isSelected = selectedExtra?.id === pkg.id;
            return (
              <div key={pkg.id} className="relative">
                <PackageCard
                  pkg={pkg}
                  pricing={pricing}
                  isSelected={isSelected}
                  onClick={() => handleSelectExtra(pkg)}
                />
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSelectExtra(pkg); }}
                    className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500 flex items-center justify-center transition-colors"
                    title="Bỏ chọn"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!selectedExtra && (
          <p className="text-gray-400 text-xs mt-2 italic">Không bắt buộc — bạn có thể bỏ qua.</p>
        )}
      </div>

      {/* ── Giỏ dịch vụ đã chọn ── */}
      {summary.length > 0 && (
        <div className="bg-gradient-to-r from-primary-light/60 to-emerald-50 border border-primary/20 rounded-2xl p-4">
          <p className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Dịch vụ đã chọn ({summary.length} gói)
          </p>
          <div className="space-y-2">
            {summary.map((s, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 font-medium">{s.label}</span>
                <span className={`font-bold ${s.color}`}>{s.price}<span className="text-xs text-gray-400 font-normal">{s.period}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="pt-6 border-t border-gray-100 flex justify-between">
        <button
          onClick={onPrev}
          className="bg-white border border-gray-200 text-gray-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Quay lại
        </button>
        <button
          onClick={handleNextClick}
          disabled={!selectedLodging}
          className={`font-bold px-8 py-3 rounded-xl transition-all shadow-md ${
            selectedLodging
              ? 'bg-primary text-white hover:bg-secondary shadow-primary/20'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
};

export default Step2Packages;

