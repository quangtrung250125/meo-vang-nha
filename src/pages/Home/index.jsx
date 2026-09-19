import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Heart, 
  Video, 
  ShieldCheck, 
  PawPrint, 
  Flame, 
  Sparkles, 
  ArrowRight, 
  Percent, 
  Gift, 
  UserRound, 
  Cat, 
  MessageSquareText, 
  SearchCheck, 
  DatabaseZap,
  ChevronRight
} from 'lucide-react';
import { promotionInfo } from '../../mockData/servicesData';
import CustomerWelcomeModal from '../../components/CustomerWelcomeModal';
import { useCustomerProfile } from '../../contexts/CustomerContext';
import { usePetProfile } from '../../contexts/PetContext';
import { useUI } from '../../contexts/UIContext';

const Home = () => {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const { customerProfile, saveCustomerProfile } = useCustomerProfile();
  const { petList, savePet } = usePetProfile();
  const { openPolicy } = useUI();
  const isWednesday = new Date().getDay() === 3;

  useEffect(() => {
    if (!customerProfile) {
      const timer = setTimeout(() => setIsWelcomeOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [customerProfile]);

  const customerSummary = useMemo(() => {
    if (!customerProfile) return { owner: 'Khách mới', petCount: 0, labels: ['Khách hàng mới'] };
    return {
      owner: customerProfile.fullName || 'Khách hàng mới',
      petCount: Array.isArray(customerProfile.pets) ? customerProfile.pets.length : 0,
      labels: customerProfile.labels || ['Khách hàng mới'],
    };
  }, [customerProfile]);

  const handleProfileSubmit = async (profileData) => {
    const pet = {
      id: `crm-pet-${Date.now()}`,
      name: profileData.petName,
      age: profileData.age,
      gender: profileData.gender,
      breed: profileData.breed,
      health: {
        vaccinated: profileData.vaccinated,
        medicalCondition: profileData.allergies,
        medicalHistory: profileData.medicalHistory,
        medication: '',
        allergy: profileData.allergies,
      },
      habits: profileData.feeding,
      personality: { friendly: false, shy: false, stress: false, hardToReach: false, other: Boolean(profileData.personality), otherDetail: profileData.personality },
      specialRequests: profileData.specialCare,
      imagePreview: null,
      imageFile: null,
      createdFromWelcome: true,
      source: profileData.source,
    };

    const syncedProfile = {
      ...profileData,
      customerId: `customer-${Date.now()}`,
      labels: profileData.labels || ['Khách hàng mới'],
      pets: [pet],
    };

    saveCustomerProfile(syncedProfile);
    if (!petList.some(item => item.name === pet.name)) {
      savePet(pet);
    }
  };

  return (
    <div className="w-full">
      <CustomerWelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onSubmit={handleProfileSubmit}
      />

      {/* Wednesday Pate Promo Banner - chỉ hiện vào Thứ 4 */}
      {isWednesday && (
        <div style={{
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
            <span style={{ fontSize: '20px', animation: 'pulse 2s infinite' }}>✨</span>
            <span style={{ fontSize: '22px' }}>🐱</span>
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
            <Link
              to="/booking"
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
            >
              Đặt phòng ngay →
            </Link>
          </div>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255,255,255,0.4)',
          }} />
        </div>
      )}

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

      {/* NEW SECTION: TRẢI NGHIỆM CHUẨN 5 SAO CHO MÈO VÀNG (Exact match to Image 3) */}
      <section id="services-5star" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-amber-600 font-bold tracking-widest uppercase text-xs sm:text-sm mb-2">
            DỊCH VỤ ĐẲNG CẤP
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title">
            Trải Nghiệm Chuẩn 5 Sao Cho Mèo Vàng
          </h2>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">
            Chúng tôi nâng niu từng giấc ngủ, miếng ăn và đem lại không gian thoải mái nhất cho các bé.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Khách sạn */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100/70 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-[#fef3c7] text-[#d97706] rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-105 transition-transform">
                <i className="fa-solid fa-hotel"></i>
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-2.5 font-title">Khách Sạn Mèo Cao Cấp</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Phòng tiêu chuẩn & phòng VIP điều hòa 24/7, chế độ ăn hạt cao cấp & pate tươi hàng ngày, camera trực tiếp.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-500"></i>
                  <span>Dọn dẹp vệ sinh 2 lần/ngày</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-500"></i>
                  <span>Giờ chơi tự do tại Lounge Mèo</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-amber-900 font-bold text-sm">Chỉ từ 120k/ngày</span>
              <Link to="/booking" className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1">
                Đặt phòng <i className="fa-solid fa-angle-right"></i>
              </Link>
            </div>
          </div>

          {/* Card 2: Spa */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100/70 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-[#fef3c7] text-[#d97706] rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-105 transition-transform">
                <i className="fa-solid fa-shower"></i>
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-2.5 font-title">Spa Grooming & Tắm Thảo Dược</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Liệu trình tắm chải, sấy ấm dịu nhẹ, cắt tỉa móng, vệ sinh tai mắt và cắt tỉa lông tạo kiểu chuyên nghiệp.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-500"></i>
                  <span>Sữa tắm thảo dược trị nấm ve</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-500"></i>
                  <span>Massage thư giãn cơ thể</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-amber-900 font-bold text-sm">Chỉ từ 150k/lượt</span>
              <Link to="/services" className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1">
                Đặt Spa <i className="fa-solid fa-angle-right"></i>
              </Link>
            </div>
          </div>

          {/* Card 3: Đưa đón */}
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-orange-100/70 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-[#fef3c7] text-[#d97706] rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-105 transition-transform">
                <i className="fa-solid fa-car-side"></i>
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-2.5 font-title">Đưa Đón Tận Nơi 24/7</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Đội ngũ đưa đón thú cưng chuyên nghiệp bằng xe chuyên dụng an toàn, thoáng mát, đúng giờ cam kết.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-500"></i>
                  <span>Balo / Lồng vận chuyển đạt chuẩn</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-amber-500"></i>
                  <span>Hỗ trợ nhận/trả ngoài giờ khi hẹn trước</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-amber-900 font-bold text-sm">Liên hệ báo giá</span>
              <a href="tel:0987654321" className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1">
                Gọi xe ngay <i className="fa-solid fa-phone"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CRM / Customer Identification Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-[0.2em] mb-3">
            <DatabaseZap className="w-4 h-4" />
            <span>CRM & nhận diện khách hàng</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title">Từ lần đầu truy cập, hệ thống đã bắt đầu hiểu từng bé mèo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { icon: UserRound, title: 'Hồ sơ chủ nuôi', text: 'Tên, số điện thoại, email, kênh truy cập để xác định danh tính khách hàng.', accent: 'from-orange-50 to-amber-50' },
            { icon: Cat, title: 'Hồ sơ mèo', text: 'Tên, giống, tuổi, tính cách, tiêm vaccine, dị ứng, thói quen ăn uống và yêu cầu đặc biệt.', accent: 'from-amber-50 to-yellow-50' },
            { icon: MessageSquareText, title: 'Tương tác & chat', text: 'Lưu câu hỏi, yêu cầu tư vấn, ghi chú chăm sóc để bổ sung hồ sơ CRM.', accent: 'from-emerald-50 to-teal-50' },
            { icon: SearchCheck, title: 'Phân đoạn khách hàng', text: 'Gắn nhãn khách hàng mới, cũ, quay lại, nhiều mèo và ưu tiên chăm sóc.', accent: 'from-rose-50 to-pink-50' },
          ].map((item) => (
            <div key={item.title} className={`rounded-3xl border border-gray-100 bg-gradient-to-br ${item.accent} p-6 shadow-sm`}>
              <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-primary shadow-sm">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-3">{item.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>

        {customerProfile && (
          <div className="mt-8 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary-light via-white to-orange-50 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-2">Trạng thái CRM đang đồng bộ</p>
                <h3 className="text-2xl font-extrabold text-text-dark">{customerSummary.owner}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Đã tạo {customerSummary.petCount} hồ sơ mèo và gắn nhãn: {customerSummary.labels.join(', ')}.
                </p>
              </div>
              <Link to="/pet-profile" className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 font-bold text-white shadow-lg shadow-accent/30 hover:bg-accent-hover transition-colors">
                Xem hồ sơ mèo
              </Link>
            </div>
          </div>
        )}
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

      {/* NEW SECTION: CHƯƠNG TRÌNH KHÁCH HÀNG THÂN THIẾT (Exact match to Image 2) */}
      <section id="membership" className="bg-[#fef9ee] py-16 my-8 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-[#fef08a] text-[#854d0e] text-xs font-bold uppercase tracking-wider rounded-md mb-3">
                CHƯƠNG TRÌNH KHÁCH HÀNG THÂN THIẾT
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark mb-4 font-title leading-tight">
                Tích Điểm Hạng Thẻ - Nhận Ngàn Ưu Đãi
              </h2>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-6">
                Mỗi chi tiêu tại Mèo Vắng Nhà đều giúp bạn tích lũy điểm thưởng để thăng hạng VIP và quy đổi thành các voucher giảm giá, phần quà tặng Pate/Hạt cao cấp cho mèo yêu!
              </p>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-amber-100">
                  <i className="fa-solid fa-shield-cat text-amber-600 text-2xl mb-1"></i>
                  <h4 className="font-bold text-xs text-amber-950">ĐỒNG</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Tích 1% chi tiêu</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-amber-200">
                  <i className="fa-solid fa-crown text-yellow-500 text-2xl mb-1"></i>
                  <h4 className="font-bold text-xs text-amber-950">VÀNG</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Tích 3% + Ưu đãi 5%</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-amber-300">
                  <i className="fa-solid fa-gem text-purple-600 text-2xl mb-1"></i>
                  <h4 className="font-bold text-xs text-amber-950">KIM CƯƠNG</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Tích 5% + Ưu đãi 10%</p>
                </div>
              </div>

              <button 
                onClick={() => openPolicy('membership')}
                className="inline-flex items-center gap-2 bg-[#532b13] hover:bg-[#3d1e0c] text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <i className="fa-solid fa-circle-info"></i> Xem Quy Định Tích Điểm Chi Tiết
              </button>
            </div>

            {/* VIP Card Graphic Right */}
            <div className="relative flex justify-center">
              <div className="w-full max-w-md bg-gradient-to-tr from-[#e59b10] to-[#f5b82e] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-xs font-light uppercase tracking-widest text-amber-100">MÈO VẮNG NHÀ VIP CARD</p>
                    <h3 className="text-xl font-extrabold font-title">HỘI VIÊN THÂN THIẾT</h3>
                  </div>
                  <i className="fa-solid fa-paw text-3xl opacity-80"></i>
                </div>
                <div className="mb-8 text-xs space-y-1">
                  <p className="text-amber-100">Chủ nuôi: <span className="font-semibold text-white">Nguyễn Văn A</span></p>
                  <p className="text-amber-100">Mã bé cưng: <span className="font-mono text-white">MVN-88992</span></p>
                </div>
                <div className="flex justify-between items-end border-t border-amber-300/40 pt-4">
                  <div>
                    <p className="text-[10px] text-amber-100 uppercase">Điểm tích lũy</p>
                    <p className="text-2xl font-black">1,250 <span className="text-xs font-normal">Điểm</span></p>
                  </div>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold border border-white/30">
                    HẠNG VÀNG
                  </span>
                </div>
              </div>
            </div>
          </div>
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
