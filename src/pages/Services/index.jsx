import React, { useState } from 'react';
import { PawPrint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { packagesList } from '../../mockData/servicesData';

const Services = () => {
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
      <section className="bg-primary-light pt-12 pb-24 text-center rounded-b-[3rem]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-dark font-title mb-4">Dịch vụ của chúng tôi</h1>
          <p className="text-gray-600 text-lg">Đa dạng gói dịch vụ, phù hợp với từng nhu cầu của bé mèo.</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-12 relative z-10">
        
        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-2 bg-bg-cream p-2 rounded-full shadow-sm border border-gray-100">
            {['Tất cả', 'Lưu trú', 'Spa - Tắm cắt', 'Dịch vụ khác'].map((tab, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {filteredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {filteredPackages.map((service, idx) => (
              <div key={service.id || idx} className="bg-bg-cream rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow p-4 flex flex-col group">
                <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                   <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="px-2 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-text-dark mb-2">{service.name}</h3>
                  <p className="font-bold text-gray-800 mb-2">Từ {service.priceString}/ngày</p>
                  <p className="text-gray-400 text-sm mb-6 flex-1">{service.desc}</p>
                  <button 
                    onClick={() => navigate('/booking', { state: { preSelectedPackageId: service.id } })}
                    className="block w-full text-center bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-sm shadow-accent/30"
                  >
                    Đặt ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-bg-cream rounded-3xl border border-gray-100 mb-20">
            <PawPrint className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Hiện tại chưa có dịch vụ nào trong danh mục này.</p>
          </div>
        )}

        {/* Contact Banner */}
        <div className="bg-bg-beige rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-8 md:mb-0">
            <h3 className="text-3xl font-bold text-text-dark font-title mb-4">Bạn cần tư vấn thêm?</h3>
            <p className="text-gray-600 mb-8 max-w-md">Để lại thông tin hoặc liên hệ trực tiếp để được đội ngũ chuyên gia hỗ trợ.</p>
            <button className="bg-accent text-white font-bold px-8 py-3.5 rounded-full hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30">
              Liên hệ ngay
            </button>
          </div>
          <div className="hidden md:flex w-64 h-64 bg-white/50 rounded-full items-center justify-center">
            <PawPrint className="w-32 h-32 text-primary opacity-20" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
