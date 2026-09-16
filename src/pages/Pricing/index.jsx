import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { packagesList } from '../../mockData/servicesData';

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

  const filteredPackages = packagesList.filter((pkg) => {
    if (activeTab === 'Tất cả') return true;
    if (activeTab === 'Lưu trú') return ['p1', 'p2', 'p3'].includes(pkg.id);
    if (activeTab === 'Spa - Tắm cắt') return ['p4'].includes(pkg.id);
    return false;
  });

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-primary-light pt-12 pb-24 rounded-b-[3rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-dark font-title mb-4">
            Bảng giá
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            Mỗi gói dịch vụ đều được thiết kế để mang lại sự thoải mái và an toàn nhất cho bé mèo.
          </p>
        </div>
      </section>

      {/* Main Content */}
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
          </div>
        </div>

        {/* Pricing Cards */}
        {filteredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
            {filteredPackages.map((plan, idx) => (
              <div
                key={plan.id || idx}
                className={`${plan.bg} ${plan.border} border rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="text-center border-b border-black/5 pb-6 mb-6">
                  <h3 className="text-lg font-bold text-text-dark mb-2">{plan.name}</h3>
                  <div className="flex items-center justify-center text-text-dark">
                    <span className="text-2xl font-bold">{plan.priceString}</span>
                    <span className="text-gray-500 text-sm ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() =>
                    navigate('/booking', { state: { preSelectedPackageId: plan.id } })
                  }
                  className="block w-full text-center bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 mt-auto"
                >
                  Đặt ngay
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-bg-cream rounded-3xl border border-gray-100 mb-20">
            <p className="text-gray-500 font-medium">
              Hiện tại chưa có gói dịch vụ nào trong danh mục này.
            </p>
          </div>
        )}

        {/* FAQs */}
        <FAQSection />

      </section>
    </div>
  );
};

export default Pricing;