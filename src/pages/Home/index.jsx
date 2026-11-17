import PublicReviews from '../../components/PublicReviews';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home as HomeIcon, Heart, Video, ShieldCheck, PawPrint, 
  Sparkles, ArrowRight, ChevronLeft, ChevronRight, Gift, Tag, BookOpen, Star, Award
} from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import { useUI } from '../../contexts/UIContext';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { usePetProfile } from '../../contexts/PetContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { calculateMembership } from '../../utils/membership';
import { useLoyalty } from '../../contexts/LoyaltyContext';
import { fetchPublicPromotions } from '../../services/loyaltyApi';
import { articlesList } from '../../mockData/newsData';

const Home = () => {
  const [activeBanner, setActiveBanner] = useState(0);
  const [promotions, setPromotions] = useState([]);
  const { customerProfile } = useCustomerProfile();
  const { petList } = usePetProfile();
  const { globalBookingList } = useBookingHistory();
  const { openPolicy } = useUI();

  const membership = calculateMembership(globalBookingList);
  // Khách đã đăng nhập: điểm & hạng thật từ máy chủ
  const { loyalty } = useLoyalty();
  const points = loyalty ? Number(loyalty.points) || 0 : membership.points;
  const tier = loyalty?.tier?.name ? `HẠNG ${String(loyalty.tier.name).toUpperCase()}` : membership.tier;
  const displayOwner = customerProfile?.fullName || 'Khách Hàng Mới';
  const displayPetCode = petList && petList.length > 0 ? `MVN-${String(petList[0].id).slice(-5)}` : 'MVN-XXXXX';

  const banners = [
    {
      eyebrow: 'Mèo Vắng Nhà',
      title: 'Mèo được chăm sóc như ở nhà',
      description: 'Lưu trú • Spa • Tắm cắt • Theo dõi sức khoẻ 24/7 với ưu đãi 10% tháng này.',
      action: 'Đặt phòng ngay',
      href: '/booking',
      badge: 'Ưu đãi HOT: Giảm 10%',
      tone: 'banner-coral',
      image: '/images/560112782_122140781234409942_864390583376155211_n.jpg',
      imageAlt: 'Hai bé mèo thư giãn trong khu lưu trú Mèo Vắng Nhà',
    },
    {
      eyebrow: 'Ưu đãi đặc biệt',
      title: 'Thứ 4 vui vẻ, bé nhận pate miễn phí',
      description: 'Các bé lưu trú tại Mèo Vắng Nhà vào Thứ Tư sẽ được tặng pate theo sở thích.',
      action: 'Đặt lịch Thứ 4',
      href: '/booking',
      badge: 'Tặng Pate miễn phí',
      tone: 'banner-amber',
      image: '/images/526874705_122136638054409942_8543058970535826489_n.jpg',
      imageAlt: 'Bé mèo cam thân thiện tại Mèo Vắng Nhà',
    },
    {
      eyebrow: 'Chăm sóc trọn vẹn',
      title: 'Một kỳ nghỉ thật êm cho bé mèo',
      description: 'Không gian riêng tư, bữa ăn đủ đầy và đội ngũ theo dõi bé mỗi ngày.',
      action: 'Xem dịch vụ',
      href: '/services',
      badge: 'An tâm 24/7',
      tone: 'banner-mint',
      image: '/images/633897691_122148006272409942_7289595756946259928_n.jpg',
      imageAlt: 'Phòng lưu trú riêng cho mèo tại Mèo Vắng Nhà',
    },
    {
      eyebrow: 'Không gian thân thiện',
      title: 'Mỗi bé một góc riêng để nghỉ ngơi',
      description: 'Khu phòng nhiều tầng, sạch sẽ và ấm áp để bé tự do khám phá như ở nhà.',
      action: 'Khám phá không gian',
      href: '/services',
      badge: 'Phòng riêng cho bé',
      tone: 'banner-sky',
      image: '/images/633536334_122148006308409942_5181008727467306300_n.jpg',
      imageAlt: 'Không gian phòng lưu trú ấm áp cho mèo',
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner(current => (current + 1) % banners.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    let mounted = true;
    fetchPublicPromotions()
      .then((items) => {
        if (mounted) setPromotions(items);
      })
      .catch((error) => {
        if (mounted) console.error('[Home] Không tải được khuyến mãi:', error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const goToBanner = (direction) => {
    setActiveBanner(current => (current + direction + banners.length) % banners.length);
  };

  return (
    <div className="w-full">
      {/* 1. Hero Carousel Banner */}
      <section className={`promo-carousel ${banners[activeBanner].tone}`} aria-label="Ưu đãi nổi bật">
        <div className="promo-carousel__inner">
          <ThemeToggle className="promo-carousel__theme-toggle" />
          <div className="promo-carousel__content">
            <p className="promo-carousel__eyebrow">{banners[activeBanner].eyebrow}</p>
            <span className="promo-carousel__badge">{banners[activeBanner].badge}</span>
            <h1>{banners[activeBanner].title}</h1>
            <p className="promo-carousel__description">{banners[activeBanner].description}</p>
            <Link to={banners[activeBanner].href} className="promo-carousel__action">{banners[activeBanner].action}<ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="promo-carousel__visual">
            <img src={banners[activeBanner].image} alt={banners[activeBanner].imageAlt} />
            <div className="promo-carousel__paw">✦</div>
          </div>
          <button type="button" className="promo-carousel__arrow promo-carousel__arrow--prev" onClick={() => goToBanner(-1)} aria-label="Ưu đãi trước"><ChevronLeft /></button>
          <button type="button" className="promo-carousel__arrow promo-carousel__arrow--next" onClick={() => goToBanner(1)} aria-label="Ưu đãi tiếp theo"><ChevronRight /></button>
          <div className="promo-carousel__dots">
            {banners.map((banner, index) => <button key={banner.title} type="button" className={index === activeBanner ? 'is-active' : ''} onClick={() => setActiveBanner(index)} aria-label={`Xem banner ${index + 1}`} />)}
          </div>
        </div>
      </section>

      {/* 2. Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: HomeIcon, title: 'Phòng sạch sẽ', subtitle: 'an toàn, vô trùng' },
            { icon: Heart, title: 'Chăm sóc tận tâm', subtitle: 'chuyên nghiệp 24/7' },
            { icon: Video, title: 'Camera theo dõi', subtitle: 'xem trực tiếp qua App' },
            { icon: Gift, title: 'Tặng Pate Thứ 4', subtitle: 'lưu trú thứ tư tặng pate' },
          ].map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center p-6 bg-bg-cream rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <feature.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-bold text-text-dark">{feature.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{feature.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Popular Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Dịch vụ chuẩn 5 sao</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title">Dịch Vụ Nổi Bật</h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1 text-primary hover:text-secondary font-bold text-sm mt-3 sm:mt-0"
          >
            Xem tất cả dịch vụ & bảng giá <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: 'Lưu trú khách sạn', 
              desc: 'Phòng Deluxe & VIP sạch bóng, máy lọc không khí, camera 24/7, thực đơn pate tươi thơm ngon.',
              image: '/images/505485728_122132721272409942_315058818274445695_n.jpg',
              tag: 'Phổ biến nhất'
            },
            { 
              title: 'Spa - Tắm Cắt Tỉa', 
              desc: 'Combo tắm sấy bồng bềnh, cắt tỉa vệ sinh tai móng cho các hoàng thượng không bị hoảng sợ.',
              image: '/images/527387932_122136638030409942_5720953043007181021_n.jpg',
              tag: 'Ưu đãi -10%'
            },
            { 
              title: 'Chăm sóc đặc biệt', 
              desc: 'Thực đơn riêng theo khẩu vị, hỗ trợ mèo nhút nhát, có nhân viên túc trực chăm sóc suốt kỳ nghỉ.',
              image: '/images/633897691_122148006272409942_7289595756946259928_n.jpg',
              tag: 'Tận tâm'
            },
          ].map((service, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {service.tag}
                </span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-text-dark mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm mb-6 flex-1">{service.desc}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <Link to="/booking" className="text-sm font-bold text-accent hover:text-accent-hover flex items-center gap-1">
                    Đặt lịch ngay <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link to="/services" className="text-xs text-gray-400 hover:text-primary font-semibold">
                    Chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. THẺ KHUYẾN MÃI & MINIGAME NỔI BẬT */}
      <section className="bg-gradient-to-b from-orange-50/60 to-white py-16 border-y border-orange-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
                <Tag className="w-4 h-4" />
                <span>Chương trình ưu đãi đang diễn ra</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title">
                Khuyến Mãi & Minigame Vòng Quay 🔥
              </h2>
            </div>
            <Link
              to="/promotions"
              className="inline-flex items-center gap-1 text-primary hover:text-secondary font-bold text-sm mt-3 sm:mt-0"
            >
              Xem tất cả {promotions.length} ưu đãi & quay thưởng <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {promotions.slice(0, 3).map((promo) => (
              <div 
                key={promo.id}
                className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                      {promo.badge || 'HOT'}
                    </span>
                    <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      {promo.code}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-dark mb-2">{promo.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed mb-4">{promo.desc || promo.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">HSD: {promo.validUntil}</span>
                  <Link
                    to="/promotions"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-accent"
                  >
                    Nhận mã ngay <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Banner dẫn tới Vòng quay may mắn */}
          <div className="mt-8 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0 backdrop-blur-sm">
                🎡
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black font-title">Vòng Quay May Mắn — 100% Trúng Thưởng!</h3>
                <p className="text-white/90 text-sm mt-1">Quay ngay để nhận voucher giảm tới 50.000đ, miễn phí tắm sấy và pate hảo hạng cho mèo cưng.</p>
              </div>
            </div>
            <Link
              to="/promotions"
              className="px-8 py-3.5 bg-white text-orange-600 font-extrabold rounded-2xl shadow-lg hover:bg-amber-50 transition active:scale-95 shrink-0 text-sm"
            >
              Vào Vòng Quay Ngay 🎁
            </Link>
          </div>
        </div>
      </section>

      {/* 5. THẺ TIN TỨC & CẨM NANG CHĂM SÓC MÈO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Kiến thức hữu ích cho Sen</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title">
              Cẩm Nang & Tin Tức Mới Nhất 📖
            </h2>
          </div>
          <Link
            to="/news"
            className="inline-flex items-center gap-1 text-primary hover:text-secondary font-bold text-sm mt-3 sm:mt-0"
          >
            Xem tất cả cẩm nang & tra cứu lịch tiêm <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articlesList.slice(0, 3).map((article) => (
            <div 
              key={article.id}
              className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                <img 
                  src={article.image || '/images/505485728_122132721272409942_315058818274445695_n.jpg'} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {article.category || 'Kinh nghiệm'}
                </span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-xs text-gray-400 mb-2">{article.date || 'Tháng 9, 2026'}</p>
                <h3 className="text-lg font-bold text-text-dark mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-500 text-xs flex-1 line-clamp-3 leading-relaxed mb-4">
                  {article.summary || article.desc}
                </p>
                <Link 
                  to="/news" 
                  className="text-xs font-bold text-primary hover:text-secondary flex items-center gap-1 pt-4 border-t border-gray-50"
                >
                  Đọc tiếp cẩm nang <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PublicReviews />

      {/* 7. VIP Card & Membership Banner */}
      <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 py-16 border-t border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold uppercase tracking-wider mb-4">
                <Award className="w-4 h-4 text-amber-700" />
                Hội viên Mèo Vắng Nhà Club
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title mb-4">
                Tích Điểm Đổi Quà & Thăng Hạng VIP
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Mỗi 100.000đ chi tiêu tại Mèo Vắng Nhà được tích lũy điểm tự động. Nâng hạng Bạc, Vàng, Kim Cương để hưởng đặc quyền giảm giá đến 15% trọn đời và ưu tiên phòng mùa lễ Tết.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/customer-profile"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-[#cf750c] text-white font-bold px-6 py-3 rounded-2xl transition shadow-md"
                >
                  <Award className="w-4 h-4" />
                  Xem Hồ Sơ & Thẻ VIP Của Bạn
                </Link>
                <button
                  onClick={() => openPolicy('membership')}
                  className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold px-6 py-3 rounded-2xl border border-gray-200 transition"
                >
                  Quy định tích điểm
                </button>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="w-full max-w-md bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-100">MÈO VẮNG NHÀ VIP CARD</p>
                    <h3 className="text-xl font-black font-title">HỘI VIÊN THÂN THIẾT</h3>
                  </div>
                  <PawPrint className="text-3xl opacity-80" />
                </div>
                <div className="mb-8 text-xs space-y-1">
                  <p className="text-amber-100">Chủ nuôi: <span className="font-semibold text-white">{displayOwner}</span></p>
                  <p className="text-amber-100">Mã bé cưng: <span className="font-mono text-white">{displayPetCode}</span></p>
                </div>
                <div className="flex justify-between items-end border-t border-amber-300/40 pt-4">
                  <div>
                    <p className="text-[10px] text-amber-100 uppercase">Điểm tích lũy</p>
                    <p className="text-2xl font-black">{points.toLocaleString()} <span className="text-xs font-normal">Điểm</span></p>
                  </div>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold border border-white/30">
                    {tier}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer Brand Banner */}
      <section className="bg-bg-beige py-16">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center">
          <div className="mb-3">
            <img src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" alt="Mèo Vắng Nhà" className="homepage-logo h-16 w-auto object-contain" />
          </div>
          <p className="text-primary font-medium tracking-wide">
            Nơi những chú mèo được yêu thương — Đặt trước để nhận ưu đãi 10%
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
