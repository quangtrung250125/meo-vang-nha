import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, Heart, Video, ShieldCheck, PawPrint, Sparkles, ArrowRight, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { promotionInfo } from '../../mockData/servicesData';
import ThemeToggle from '../../components/ThemeToggle';

const Home = () => {
  const [activeBanner, setActiveBanner] = useState(0);
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

  const goToBanner = (direction) => {
    setActiveBanner(current => (current + direction + banners.length) % banners.length);
  };

  return (
    <div className="w-full">
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

      {/* Features Grid */}
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

      {/* Popular Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Chương trình ưu đãi tháng này</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title">Các dịch vụ nổi bật</h2>
          </div>
          <Link
            to="/services"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-primary hover:text-secondary font-bold text-sm"
          >
            <span>Xem toàn bộ dịch vụ (-10%)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Lưu trú khách sạn',
              desc: 'Không gian riêng tư, vô trùng, bữa ăn dinh dưỡng và camera 24/7.',
              image: '/images/service_hotel.png',
              price: 'Từ 180.000đ/ngày',
              originalPrice: '200.000đ',
              discount: '-10%'
            },
            {
              title: 'Spa - Tắm cắt chuyên sâu',
              desc: 'Tắm nano thảo mộc khử mùi, vệ sinh toàn diện và tạo phom lông xinh.',
              image: '/images/service_spa.png',
              price: 'Từ 198.000đ/lần',
              originalPrice: '220.000đ',
              discount: '-10%'
            },
            {
              title: 'Chăm sóc VIP & Đưa đón',
              desc: 'Phòng VIP lớn, chế độ ăn organic, massage và xe đón tận nhà an toàn.',
              image: '/images/service_care.png',
              price: 'Từ 135.000đ/dịch vụ',
              originalPrice: '150.000đ',
              discount: '-10%'
            },
          ].map((service, idx) => (
            <div key={idx} className="bg-bg-cream rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                    {service.discount}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-text-dark mb-2">{service.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">{service.desc}</p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-lg font-black text-accent">{service.price}</span>
                    <span className="text-xs text-gray-400 line-through">{service.originalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <Link
                  to="/services"
                  className="block text-center w-full py-3 bg-white border border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  Xem chi tiết & Đặt ngay
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ĐÁNH GIÁ CỦA KHÁCH HÀNG ── */}
      <section className="py-20 bg-gradient-to-b from-[#fef9ee] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Đánh giá thực tế
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title mb-3">
              Khách hàng nói gì về chúng tôi?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              Hơn 12.000 bé mèo đã được chăm sóc — đây là cảm nhận của những ba mẹ tin tưởng Mèo Vắng Nhà.
            </p>
            {/* Overall rating */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-6 h-6 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-2xl font-black text-text-dark">4.9</span>
              <span className="text-sm text-gray-400 font-medium">/ 5.0 (200+ đánh giá)</span>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Nguyễn Thị Lan',
                avatar: 'L',
                color: 'bg-rose-500',
                rating: 5,
                service: 'Lưu trú',
                date: 'Tháng 9, 2026',
                petName: 'Bơ (Maine Coon)',
                review: 'Gửi Bơ ở đây lần đầu mà yên tâm hết sức! Camera 24/24 xem được, nhân viên nhắn tin cập nhật tình hình từng bữa ăn. Bé ăn ngon ngủ khoẻ, về nhà còn có vẻ nhớ chỗ 😂 Sẽ gửi lại lần sau!',
                highlight: true,
              },
              {
                name: 'Trần Minh Đức',
                avatar: 'Đ',
                color: 'bg-primary',
                rating: 5,
                service: 'Spa - Tắm cắt',
                date: 'Tháng 8, 2026',
                petName: 'Mochi (Scottish Fold)',
                review: 'Tắm xong lông Mochi mượt và thơm hẳn, không bị ướt tai hay viêm tai sau đó. Nhân viên làm rất nhẹ nhàng, bé khá hợp tác. Giá cả phù hợp, sẽ book thường xuyên.',
                highlight: false,
              },
              {
                name: 'Phạm Thảo Vy',
                avatar: 'V',
                color: 'bg-violet-500',
                rating: 5,
                service: 'Gói Mèo Quý Tộc',
                date: 'Tháng 9, 2026',
                petName: 'Sữa (British Shorthair)',
                review: 'Gói Quý Tộc đáng đồng tiền! 3 bữa chính + 1 bữa phụ đa dạng, phòng Deluxe sạch bóng. Đặc biệt tính năng thoại 2 chiều giúp mình "nói chuyện" với Sữa mỗi tối rất dễ thương. 10/10!',
                highlight: false,
              },
              {
                name: 'Lê Quang Huy',
                avatar: 'H',
                color: 'bg-emerald-500',
                rating: 5,
                service: 'Lưu trú',
                date: 'Tháng 7, 2026',
                petName: 'Tiger (Tabby)',
                review: 'Đi công tác 10 ngày, gửi Tiger ở đây không lo gì cả. Mỗi ngày đều có ảnh và video update. Lần gửi từ 5 ngày còn được tắm miễn phí, Tiger về sạch thơm. Dịch vụ đón trả rất tiện.',
                highlight: false,
              },
              {
                name: 'Ngô Bảo Châu',
                avatar: 'C',
                color: 'bg-amber-500',
                rating: 5,
                service: 'Combo Tắm Sấy',
                date: 'Tháng 8, 2026',
                petName: 'Chè (Persian)',
                review: 'Chè lông dài hay bị rối và khó tắm lắm nhưng bên này xử lý rất pro, sấy xong lông phồng đẹp, không bị xoắn. Nhân viên kiên nhẫn với bé dù Chè hay hờn dỗi 😄 Rất hài lòng!',
                highlight: false,
              },
              {
                name: 'Hoàng Thu Hương',
                avatar: 'H',
                color: 'bg-sky-500',
                rating: 5,
                service: 'Gói Mèo Sang Chảnh',
                date: 'Tháng 9, 2026',
                petName: 'Milo (Ragdoll)',
                review: 'Phòng VIP sạch sẽ, thoáng mát. Milo ăn full pate mỗi ngày, nhân viên gửi ảnh bé đang ăn dễ thương lắm. Ưu đãi -10% lần 2 áp dụng đúng, mình đã gửi 3 lần rồi và lần nào cũng vừa ý!',
                highlight: true,
              },
            ].map((review, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col ${
                  review.highlight ? 'border-primary/30 ring-1 ring-primary/20' : 'border-gray-100'
                }`}
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">{review.rating}.0</span>
                  {review.highlight && (
                    <span className="ml-auto text-[10px] font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full">
                      ✨ Nổi bật
                    </span>
                  )}
                </div>

                {/* Review text */}
                <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-5 italic">
                  "{review.review}"
                </p>

                {/* Service tag + date */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {review.service}
                  </span>
                  <span className="text-[11px] text-gray-400">{review.date}</span>
                </div>

                {/* Reviewer */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className={`w-10 h-10 rounded-full ${review.color} flex items-center justify-center text-white font-extrabold text-sm shrink-0`}>
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-dark">{review.name}</p>
                    <p className="text-xs text-gray-400">🐾 {review.petName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm mb-4">Hơn 200 đánh giá 5⭐ từ khách hàng trên Google & Facebook</p>
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white font-bold px-8 py-3.5 rounded-full transition-all shadow-lg shadow-primary/30 active:scale-95"
            >
              Đặt phòng ngay — nhận ưu đãi 10%
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <section className="bg-bg-beige py-16">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center">
          <div className="mb-3">
            <img src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" alt="Mèo Vắng Nhà" className="homepage-logo" />
          </div>
          <p className="text-primary font-medium tracking-wide">Nơi những chú mèo được yêu thương — Đặt trước để nhận ưu đãi 10%</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
