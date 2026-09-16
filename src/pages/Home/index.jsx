import React from 'react';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, Heart, Video, ShieldCheck, PawPrint, Flame, Sparkles, ArrowRight, Percent, Gift } from 'lucide-react';
import { promotionInfo } from '../../mockData/servicesData';


const Home = () => {
  // Chỉ hiện banner vào Thứ 4 (getDay() === 3: 0=CN, 1=T2, 2=T3, 3=T4...)
  const isWednesday = new Date().getDay() === 3;

  return (
    <div className="w-full">
      {/* Wednesday Pate Promo Banner - chỉ hiện vào Thứ 4 */}
      {isWednesday && <div style={{
        background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)',
        padding: '0',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '14px 16px',
          flexWrap: 'wrap',
        }}>
          {/* Sparkle decorations */}
          <span style={{ fontSize: '20px', animation: 'pulse 2s infinite' }}>✨</span>
          <span style={{
            fontSize: '22px',
          }}>🐱</span>
          <div style={{ textAlign: 'center' }}>
            <span style={{
              color: 'white',
              fontWeight: '900',
              fontSize: 'clamp(13px, 2.5vw, 17px)',
              letterSpacing: '0.02em',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              display: 'inline',
            }}>
              🎁&nbsp;<strong>ƯU ĐÃI THỨ 4:</strong>&nbsp;Các bé lưu trú tại Mèo Vắng Nhà vào&nbsp;<strong>Thứ Tư</strong>&nbsp;được tặng&nbsp;<strong>Pate theo sở thích</strong>&nbsp;miễn phí!
            </span>
          </div>
          <span style={{ fontSize: '22px' }}>🐾</span>
          <span style={{ fontSize: '20px', animation: 'pulse 2s infinite 0.5s' }}>✨</span>
          <a
            href="/booking"
            style={{
              background: 'white',
              color: '#f97316',
              fontWeight: '900',
              fontSize: '13px',
              padding: '6px 18px',
              borderRadius: '999px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '2px solid rgba(255,255,255,0.8)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Đặt phòng ngay →
          </a>
        </div>
        {/* Animated shimmer strip */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(255,255,255,0.4)',
        }} />
      </div>}
      {/* Hero Section */}
      <section className="bg-primary-light pt-12 pb-20 relative overflow-hidden rounded-b-[3rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              {/* Promo Banner Pill */}
              <div className="inline-flex items-center gap-2 bg-white/90 px-4 py-1.5 rounded-full border border-orange-200 text-accent font-bold text-xs uppercase tracking-wider mb-6 shadow-sm">
                <Flame className="w-4 h-4 fill-current animate-pulse text-accent" />
                <span>Ưu đãi HOT: Giảm 10% tất cả dịch vụ</span>
              </div>

              {/* Wednesday Pate Promo Pill */}
              <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-1.5 rounded-full border border-amber-300 text-amber-800 font-bold text-xs uppercase tracking-wider mb-6 shadow-sm ml-2">
                <Gift className="w-4 h-4 text-amber-600" />
                <span>🎁 Thứ 4: Tặng Pate Miễn Phí!</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-dark leading-tight mb-6 font-title">
                Mèo được chăm sóc như ở nhà
              </h1>
              <p className="text-lg text-gray-600 mb-8 font-medium">
                Lưu trú • Spa • Tắm cắt • Theo dõi sức khoẻ 24/7 với ưu đãi 10% tháng này.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <Link 
                  to="/booking" 
                  className="w-full sm:w-auto text-center bg-accent text-white font-bold px-8 py-3.5 rounded-full hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30 active:scale-95"
                >
                  Đặt phòng ngay (-10%)
                </Link>
                <Link 
                  to="/services" 
                  className="w-full sm:w-auto text-center bg-white border border-gray-200 text-text-dark font-bold px-8 py-3.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Xem danh mục dịch vụ
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-[4/3] bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                <img src="/images/hero_banner.png" alt="Mèo được chăm sóc như ở nhà" className="w-full h-full object-cover" />
                
                {/* Overlay discount badge */}
                <div className="absolute top-4 right-4 bg-accent text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 font-black text-sm">
                  <Percent className="w-5 h-5" />
                  <span>GIẢM 10% HÔM NAY</span>
                </div>
              </div>
            </div>
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

      {/* Footer Banner */}
      <section className="bg-bg-beige py-16">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <PawPrint className="h-10 w-10 text-primary" />
            <h2 className="text-3xl font-bold text-text-dark font-title">Mèo Vắng Nhà</h2>
          </div>
          <p className="text-primary font-medium tracking-wide">Nơi những chú mèo được yêu thương — Đặt trước để nhận ưu đãi 10%</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
