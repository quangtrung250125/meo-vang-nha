import React, { useState } from 'react';
import { 
  Gift, 
  Sparkles, 
  Tag, 
  Clock, 
  Copy, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  Trophy, 
  Percent,
  Calendar,
  ChevronRight,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  promotionCategories, 
  featuredCampaign, 
  promotionsList 
} from '../../mockData/promotionsData';
import LuckyWheel from './LuckyWheel';
import PromoDetailModal from './PromoDetailModal';

const Promotions = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [claimedVouchers, setClaimedVouchers] = useState([
    { code: featuredCampaign.code, name: 'Mã Giảm 25% Mùa Hè', discount: '25%' }
  ]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã ${code}!`, {
      icon: '🎉',
      style: { borderRadius: '12px', background: '#10B981', color: '#fff' }
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClaimPrize = (prize) => {
    setClaimedVouchers((prev) => {
      if (prev.some((v) => v.code === prize.code)) return prev;
      return [...prev, { code: prize.code, name: prize.text, discount: prize.shortName }];
    });
  };

  const filteredPromos = promotionsList.filter((item) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'minigame') return false;
    return item.category === selectedCategory;
  });

  const scrollToMinigame = () => {
    const el = document.getElementById('minigame-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full pb-20">
      {/* Header Banner */}
      <section className="bg-primary-light pt-12 pb-24 text-center rounded-b-[3rem] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Flame className="w-4 h-4 text-accent" />
            Ưu Đãi & Chiến Dịch Khuyến Mãi 2026
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-dark font-title mb-4 leading-tight">
            Hoạt Động Khuyến Mãi & Minigame
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Săn voucher giảm giá phòng lên đến 30%, nhận quà tặng spa, pate cao cấp và tham gia vòng quay may mắn rinh quà ngay!
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToMinigame}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-all shadow-md shadow-accent/20 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Chơi Minigame Vòng Quay May Mắn</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/booking')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-text-dark font-bold text-sm hover:bg-gray-50 transition-all border border-gray-200 cursor-pointer"
            >
              <span>Đặt phòng ngay</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 space-y-12">
        
        {/* Featured Big Campaign Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl overflow-hidden relative border border-emerald-500/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-amber-400 text-emerald-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  {featuredCampaign.badge}
                </span>
                <span className="bg-white/20 backdrop-blur-md text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  Còn {featuredCampaign.daysLeft} ngày kết thúc
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-title leading-tight">
                {featuredCampaign.title}
              </h2>

              <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed">
                {featuredCampaign.subtitle}
              </p>

              <div className="space-y-2 pt-2">
                {featuredCampaign.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Promo Code & Action */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <div className="bg-black/30 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                  <span className="text-xs text-gray-300 font-medium">Mã ưu đãi:</span>
                  <span className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wider">
                    {featuredCampaign.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(featuredCampaign.code)}
                    className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white cursor-pointer"
                    title="Sao chép mã"
                  >
                    {copiedCode === featuredCampaign.code ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className="px-6 py-3 rounded-2xl bg-amber-400 text-emerald-950 font-black text-sm hover:bg-amber-300 transition-all shadow-lg shadow-black/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>Áp dụng ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl overflow-hidden aspect-[4/3] bg-black/20 shadow-inner border-2 border-white/20">
              <img 
                src={featuredCampaign.image} 
                alt={featuredCampaign.title} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-gray-100">
            {promotionCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (cat.id === 'minigame') scrollToMinigame();
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Promotions Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold font-title text-text-dark">
                {selectedCategory === 'all' ? 'Tất cả chương trình ưu đãi' : promotionCategories.find(c => c.id === selectedCategory)?.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Các gói ưu đãi tốt nhất dành riêng cho Sen và bé mèo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPromos.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
                  <img 
                    src={promo.image} 
                    alt={promo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-primary font-black text-xs px-3 py-1 rounded-full shadow-sm">
                    {promo.discount}
                  </div>
                  <div className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${promo.badgeColor}`}>
                    {promo.badge}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <h4 className="font-bold text-lg font-title text-text-dark mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {promo.title}
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
                    {promo.description}
                  </p>

                  <div className="text-xs text-gray-400 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      Hạn đến: <strong className="text-text-dark font-medium">{promo.validUntil}</strong>
                    </span>
                    <span>Tối thiểu: <strong className="text-text-dark font-medium">{promo.minBookingDays} ngày</strong></span>
                  </div>

                  {/* Voucher code box & Copy */}
                  <div className="p-2.5 rounded-2xl bg-bg-cream border border-gray-100 flex items-center justify-between mb-4">
                    <span className="font-mono text-sm font-extrabold text-primary pl-2">
                      {promo.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(promo.code)}
                      className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCode === promo.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === promo.code ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setSelectedPromo(promo)}
                      className="py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors text-center cursor-pointer"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/booking')}
                      className="py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-colors text-center shadow-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Áp dụng ngay</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Minigame Lucky Wheel Component */}
        <section>
          <LuckyWheel onClaimPrize={handleClaimPrize} />
        </section>

        {/* My Saved Vouchers Box */}
        {claimedVouchers.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-accent" />
                <h3 className="text-xl font-bold font-title text-text-dark">Ví Mã Ưu Đãi Của Bạn</h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {claimedVouchers.length} mã khả dụng
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {claimedVouchers.map((v, i) => (
                <div 
                  key={i} 
                  className="p-3.5 rounded-2xl bg-bg-cream border border-emerald-200/70 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-text-dark block">{v.name}</span>
                    <span className="font-mono text-sm font-black text-primary">{v.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(v.code)}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-primary hover:border-primary transition-colors cursor-pointer"
                    title="Sao chép"
                  >
                    {copiedCode === v.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Detail Modal */}
      {selectedPromo && (
        <PromoDetailModal
          promo={selectedPromo}
          onClose={() => setSelectedPromo(null)}
        />
      )}
    </div>
  );
};

export default Promotions;
