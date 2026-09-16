import React, { useState } from 'react';
import { Check, ChevronDown, Flame, Percent, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { packagesList, promotionInfo } from '../../mockData/servicesData';

const faqs = [
  {
    question: 'Có cần đặt cọc không?',
    answer:
      'Nếu bạn đặt lịch sát ngày (khoảng 2–3 ngày tới) thì không cần cọc. Nếu đặt lịch xa hoặc vào dịp lễ, cửa hàng sẽ nhận cọc trước 200.000đ để giữ phòng. Phần còn lại thanh toán khi đón bé về — riêng trường hợp gửi theo tháng sẽ thanh toán trước với tiệm.',
  },
  {
    question: 'Thời gian nhận và trả bé như thế nào?',
    answer:
      'Cửa hàng sẽ xác nhận lại thông tin của bé khi nhận (check-in), và khi đón về bạn sẽ kiểm tra tình trạng bé trước khi thanh toán và nhận bàn giao (check-out). Thông thường, tiệm sẽ nhận bé từ 8h sáng và trả bé trước 20h tối. Với trường hợp khách muốn check-in/check-out không nằm trong khung giờ trên, khách hàng cần nhắn tin riêng với tiệm để thống nhất chốt lịch cụ thể.',
  },
  {
    question: 'Có nhận mèo đang bệnh không?',
    answer:
      'Trước khi gửi, bên mình luôn cần bạn cung cấp thông tin sức khỏe, bệnh nền hoặc tiền sử bệnh (nếu có) để chuẩn bị chăm sóc phù hợp nhất cho bé. Với những trường hợp bé đang có vấn đề sức khỏe, bạn vui lòng liên hệ trước để bên mình tư vấn phương án phù hợp, đảm bảo an toàn cho bé trong suốt thời gian lưu trú.',
  },
  {
    question: 'Cần cung cấp thông tin gì khi gửi bé lần đầu?',
    answer:
      'Bạn chỉ cần cho bên mình biết tình trạng sức khỏe hiện tại, bé đã tiêm phòng chưa, có bệnh nền/tiền sử bệnh gì không, cùng tính cách và thói quen sinh hoạt của bé để bên mình chăm sóc đúng ý nhất.',
  },
  {
    question: 'Gửi nhiều lần thì có cần cung cấp lại thông tin không?',
    answer:
      'Không cần đâu ạ. Trong lần đầu sử dụng dịch vụ của tiệm, thông tin của bé sẽ được lưu lại cho những lần gửi sau, bạn chỉ cần xác nhận hoặc cập nhật nếu có gì thay đổi.',
  },
  {
    question: 'Có thể theo dõi tình trạng bé trong lúc lưu trú không?',
    answer:
      'Có. Bạn có thể xem qua camera trực tiếp với chi phí 10.000đ/ngày, hoặc nhận video cập nhật qua kênh liên hệ của cửa hàng.',
  },
  {
    question: 'Nếu bé có dấu hiệu bất thường thì xử lý ra sao?',
    answer:
      'Nhân viên sẽ theo dõi và đánh giá mức độ (stress, bỏ ăn...), sau đó liên hệ chủ nuôi. Nếu cần thiết, cửa hàng sẽ hỗ trợ gọi thú y đến tận nơi, hoặc xin phép đưa bé đi khám nếu tình trạng nặng hơn.',
  },
  {
    question: 'Cần báo trước bao lâu để đặt lịch?',
    answer:
      'Ngày thường chỉ cần báo trước khoảng 2–5 ngày. Riêng dịp lễ, Tết nên đặt trước 1–2 tháng vì phòng thường kín khá sớm.',
  },
  {
    question: 'Bé có được tắm trong thời gian lưu trú không?',
    answer:
      'Có ạ, bên mình có dịch vụ tắm cho bé. Tuy nhiên với những bé quá khó tắm (dữ, chống cự nhiều), bên mình xin phép không tắm để đảm bảo an toàn cho cả bé và nhân viên.',
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-extrabold text-text-dark font-title mb-6">Câu hỏi thường gặp</h2>
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className={`border rounded-xl bg-bg-cream overflow-hidden transition-all duration-200 ${
              openIndex === idx
                ? 'border-primary shadow-sm'
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full flex justify-between items-center p-5 text-left cursor-pointer"
            >
              <h4 className="font-semibold text-text-dark pr-4">{faq.question}</h4>
              <ChevronDown
                className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${
                  openIndex === idx ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === idx && (
              <div className="px-5 pb-5">
                <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Pricing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [openFaq, setOpenFaq] = useState(null);

  const tabs = [
    { label: 'Tất cả', value: 'Tất cả' },
    { label: '🔥 Ưu đãi 10%', value: 'Ưu đãi 10%', isSpecial: true },
    { label: 'Lưu trú', value: 'Lưu trú' },
    { label: 'Spa - Tắm cắt', value: 'Spa - Tắm cắt' },
    { label: 'Dịch vụ khác', value: 'Dịch vụ khác' },
  ];

  const filteredPackages = packagesList.filter((pkg) => {
    if (activeTab === 'Tất cả') return true;
    if (activeTab === 'Ưu đãi 10%') return pkg.isPromo;
    return pkg.category === activeTab;
  });

  const faqs = [
    {
      q: 'Chương trình ưu đãi giảm giá 10% áp dụng như thế nào?',
      a: 'Chương trình giảm 10% được áp dụng tự động cho toàn bộ dịch vụ lưu trú, spa và tiện ích khi khách hàng đặt phòng trực tuyến qua website.'
    },
    {
      q: 'Có cần đặt cọc trước khi đến không?',
      a: 'Để giữ phòng và giữ nguyên mức giá ưu đãi 10%, bạn chỉ cần đặt trước một khoản cọc nhỏ qua hệ thống hoặc chuyển khoản.'
    },
    {
      q: 'Thời gian nhận và trả bé mèo như thế nào?',
      a: 'Khách sạn hoạt động từ 8:00 đến 21:00 hàng ngày. Bạn có thể linh hoạt đưa đón bé trong khung giờ này.'
    },
    {
      q: 'Khách sạn có hỗ trợ chăm sóc mèo có chế độ đặc biệt không?',
      a: 'Có, các bé mèo cần uống thuốc, có khẩu phần kiêng hoặc cần chăm sóc y tế đều được đội ngũ chuyên viên theo dõi sát sao.'
    }
  ];

  return (
    <div className="w-full bg-[#FAF8F5]/60 min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-primary-light via-primary-light/60 to-transparent pt-12 pb-20 text-center relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<<<<<<< HEAD
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-dark font-title mb-4">
            Bảng giá
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            Mỗi gói dịch vụ đều được thiết kế để mang lại sự thoải mái và an toàn nhất cho bé mèo.
=======
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-primary/20 text-primary font-bold text-xs uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            Bảng giá minh bạch - Tiết kiệm tối đa
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-dark font-title mb-4">
            Bảng Giá Dịch Vụ
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Đang áp dụng ưu đãi <strong className="text-accent">giảm ngay 10%</strong> cho tất cả các gói dịch vụ khi đặt lịch trực tuyến.
>>>>>>> be7d5d7d7f77c5ac4ae47b2d488d1bdd7b6a79dc
          </p>
        </div>
      </section>

      {/* Main Content */}
<<<<<<< HEAD
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-12 relative z-10">

        {/* Tabs */}
        <div className="flex justify-start mb-12">
          <div className="flex space-x-2 bg-bg-cream p-2 rounded-full shadow-sm border border-gray-100">
            {['Tất cả', 'Lưu trú', 'Spa - Tắm cắt', 'Dịch vụ khác'].map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
=======
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 -mt-10 relative z-10">
        
        {/* Banner Alert 10% Off */}
        <div className="mb-10 bg-gradient-to-r from-emerald-50 via-white to-orange-50 border border-primary/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              %
            </div>
            <div>
              <p className="text-sm font-bold text-text-dark">
                Giá hiển thị bên dưới đã bao gồm mức chiết khấu ưu đãi 10%.
              </p>
              <p className="text-xs text-gray-500">
                Nhập mã <span className="font-bold text-accent">{promotionInfo.code}</span> hoặc đặt trực tiếp để nhận trọn vẹn ưu đãi.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/booking')}
            className="shrink-0 bg-primary hover:bg-secondary text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Đặt lịch ngay
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center sm:justify-start mb-10 overflow-x-auto pb-2 scrollbar-none">
          <div className="inline-flex space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-200/80">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.value;
              return (
                <button 
                  key={tab.value} 
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-5 sm:px-7 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSelected 
                      ? tab.isSpecial 
                        ? 'bg-gradient-to-r from-accent to-[#FF7B47] text-white shadow-md shadow-accent/30 scale-105' 
                        : 'bg-primary text-white shadow-md shadow-primary/25 scale-105'
                      : tab.isSpecial 
                        ? 'text-accent hover:bg-orange-50 font-bold border border-dashed border-accent/40' 
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
>>>>>>> be7d5d7d7f77c5ac4ae47b2d488d1bdd7b6a79dc
          </div>
        </div>

        {/* Pricing Cards Grid */}
        {filteredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {filteredPackages.map((plan, idx) => (
<<<<<<< HEAD
              <div
                key={plan.id || idx}
                className={`${plan.bg} ${plan.border} border rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="text-center border-b border-black/5 pb-6 mb-6">
                  <h3 className="text-lg font-bold text-text-dark mb-2">{plan.name}</h3>
                  <div className="flex items-center justify-center text-text-dark">
                    <span className="text-2xl font-bold">{plan.priceString}</span>
                    <span className="text-gray-500 text-sm ml-1">{plan.period}</span>
=======
              <div 
                key={plan.id || idx} 
                className={`bg-white border-2 ${plan.isBestChoice ? 'border-accent shadow-lg ring-2 ring-accent/20' : 'border-gray-200/80'} rounded-3xl p-6 flex flex-col shadow-sm hover:shadow-xl transition-all relative group`}
              >
                {/* 10% Discount Badge */}
                {plan.isPromo && (
                  <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-accent to-[#FF7B47] text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>ƯU ĐÃI GIẢM 10%</span>
>>>>>>> be7d5d7d7f77c5ac4ae47b2d488d1bdd7b6a79dc
                  </div>
                )}

                {plan.isBestChoice && (
                  <div className="absolute -top-3.5 right-6 bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                    KHUYÊN DÙNG
                  </div>
                )}

                <div className="border-b border-gray-100 pb-6 mb-6 mt-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {plan.category}
                  </span>
                  <h3 className="text-2xl font-bold text-text-dark mb-3 font-title">{plan.name}</h3>
                  
                  {/* Price info */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-accent">{plan.priceString}</span>
                    <span className="text-gray-500 text-sm font-medium">{plan.period}</span>
                    
                    {plan.originalPriceString && (
                      <span className="text-sm text-gray-400 line-through ml-auto font-medium">
                        {plan.originalPriceString}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-100">
                    <span>Tiết kiệm: {plan.savingsString}</span>
                  </div>

                  <p className="text-gray-500 text-xs mt-3 leading-relaxed">
                    {plan.desc}
                  </p>
                </div>
<<<<<<< HEAD

                <ul className="space-y-4 mb-8 flex-1">
=======
                
                <ul className="space-y-3 mb-8 flex-1">
>>>>>>> be7d5d7d7f77c5ac4ae47b2d488d1bdd7b6a79dc
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
<<<<<<< HEAD

                <button
                  onClick={() =>
                    navigate('/booking', { state: { preSelectedPackageId: plan.id } })
                  }
                  className="block w-full text-center bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 mt-auto"
=======
                
                <button 
                  onClick={() => navigate('/booking', { state: { preSelectedPackageId: plan.id } })}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-2xl transition-all shadow-md mt-auto active:scale-98 ${
                    plan.isBestChoice 
                      ? 'bg-accent hover:bg-accent-hover text-white shadow-accent/25 hover:shadow-accent/40' 
                      : 'bg-primary hover:bg-secondary text-white shadow-primary/20 hover:shadow-primary/30'
                  }`}
>>>>>>> be7d5d7d7f77c5ac4ae47b2d488d1bdd7b6a79dc
                >
                  <span>Đặt ngay với giá ưu đãi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
<<<<<<< HEAD
          <div className="text-center py-20 bg-bg-cream rounded-3xl border border-gray-100 mb-20">
            <p className="text-gray-500 font-medium">
              Hiện tại chưa có gói dịch vụ nào trong danh mục này.
            </p>
=======
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 mb-20">
            <p className="text-gray-500 font-medium">Hiện tại chưa có gói dịch vụ nào trong danh mục này.</p>
>>>>>>> be7d5d7d7f77c5ac4ae47b2d488d1bdd7b6a79dc
          </div>
        )}

        {/* FAQs */}
<<<<<<< HEAD
        <FAQSection />
=======
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-text-dark font-title mb-2">Câu hỏi thường gặp</h2>
            <p className="text-gray-500 text-sm">Giải đáp mọi thắc mắc về dịch vụ và chương trình ưu đãi giảm 10%.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className={`border rounded-2xl bg-white transition-all overflow-hidden ${isOpen ? 'border-primary shadow-sm' : 'border-gray-200/80 hover:border-gray-300'}`}
                >
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex justify-between items-center gap-4 focus:outline-none"
                  >
                    <h4 className="font-bold text-text-dark text-base">{faq.q}</h4>
                    <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
>>>>>>> be7d5d7d7f77c5ac4ae47b2d488d1bdd7b6a79dc

      </section>
    </div>
  );
};

export default Pricing;