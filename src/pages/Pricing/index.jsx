import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { packagesList } from '../../mockData/servicesData';

const Pricing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Tất cả');

  const filteredPackages = packagesList.filter(pkg => {
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
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-dark font-title mb-4">Gói lưu trú</h1>
          <p className="text-gray-600 text-lg max-w-2xl">Mỗi gói dịch vụ đều được thiết kế để mang lại sự thoải mái và an toàn nhất cho bé mèo.</p>
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
                className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
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
              <div key={plan.id || idx} className={`${plan.bg} ${plan.border} border rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow`}>
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
                  onClick={() => navigate('/booking', { state: { preSelectedPackageId: plan.id } })}
                  className="block w-full text-center bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 mt-auto"
                >
                  Đặt ngay
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-bg-cream rounded-3xl border border-gray-100 mb-20">
            <p className="text-gray-500 font-medium">Hiện tại chưa có gói dịch vụ nào trong danh mục này.</p>
          </div>
        )}

        {/* FAQs */}
        <div className="max-w-3xl">
          <h2 className="text-2xl font-extrabold text-text-dark font-title mb-6">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {[
              'Có cần đặt cọc không?',
              'Thời gian nhận và trả bé như thế nào?',
              'Có nhận mèo đang bệnh không?'
            ].map((question, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-5 bg-bg-cream cursor-pointer hover:border-primary transition-colors flex justify-between items-center">
                <h4 className="font-semibold text-text-dark">{question}</h4>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
};

export default Pricing;
