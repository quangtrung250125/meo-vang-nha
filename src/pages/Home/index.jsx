import React from 'react';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, Heart, Video, ShieldCheck, PawPrint } from 'lucide-react';

const Home = () => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-primary-light pt-12 pb-20 relative overflow-hidden rounded-b-[3rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-dark leading-tight mb-6 font-title">
                Mèo được chăm sóc như ở nhà
              </h1>
              <p className="text-lg text-gray-600 mb-8 font-medium">
                Lưu trú • Spa • Tắm cắt • Theo dõi sức khoẻ
              </p>
              <Link 
                to="/booking" 
                className="inline-block bg-accent text-white font-bold px-8 py-3.5 rounded-full hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30"
              >
                Đặt phòng ngay
              </Link>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-[4/3] bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                <img src="/images/hero_banner.png" alt="Mèo được chăm sóc như ở nhà" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: HomeIcon, title: 'Phòng sạch sẽ', subtitle: 'an toàn' },
            { icon: Heart, title: 'Chăm sóc tận tâm', subtitle: 'chuyên nghiệp' },
            { icon: Video, title: 'Camera theo dõi', subtitle: '24/7' },
            { icon: ShieldCheck, title: 'Thông tin minh bạch', subtitle: 'rõ ràng' },
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
        <h2 className="text-3xl font-extrabold text-text-dark mb-10 font-title">Các dịch vụ nổi bật</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Lưu trú khách sạn', desc: 'Chăm sóc chu đáo', image: '/images/service_hotel.png' },
            { title: 'Spa - Tắm cắt', desc: 'Cho các nấm ngọc', image: '/images/service_spa.png' },
            { title: 'Chăm sóc đặc biệt', desc: 'Chăm sóc mèo bầu, ốm', image: '/images/service_care.png' },
          ].map((service, idx) => (
            <div key={idx} className="bg-bg-cream rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
              <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
                 <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-text-dark mb-2">{service.title}</h3>
                <p className="text-gray-500 mb-6">{service.desc}</p>
                <Link to="/services" className="text-sm font-bold text-primary hover:text-secondary uppercase tracking-wide">
                  Xem chi tiết
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
            <img 
              src="/images/logo.png" 
              alt="Mèo Vắng Nhà" 
              className="h-14 w-14 object-cover rounded-2xl shadow-md border border-gray-200"
            />
            <h2 className="text-3xl font-bold text-text-dark font-title">Mèo Vắng Nhà</h2>
          </div>
          <p className="text-primary font-medium tracking-wide">Nơi những chú mèo được yêu thương</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
