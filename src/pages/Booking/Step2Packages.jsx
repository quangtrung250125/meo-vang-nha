import React, { useState } from 'react';
import { packagesList } from '../../mockData/servicesData';

const Step2Packages = ({ data, updateData, onNext, onPrev }) => {
  const [error, setError] = useState('');

  const handleNextClick = () => {
    if (!data.selectedPackage) {
      setError('Vui lòng chọn 1 gói dịch vụ để tiếp tục.');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      <h2 className="text-2xl font-bold text-text-dark font-title">2. Chọn gói dịch vụ</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packagesList.map((pkg) => (
          <div 
            key={pkg.id}
            onClick={() => {
              updateData({ selectedPackage: pkg });
              setError('');
            }}
            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${data.selectedPackage?.id === pkg.id ? 'border-primary bg-primary-light' : 'border-gray-100 bg-bg-cream hover:border-primary/40'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-text-dark">{pkg.name}</h3>
              <span className="font-bold text-primary">{pkg.priceString}/ngày</span>
            </div>
            <p className="text-sm text-gray-500">{pkg.desc}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <div className="pt-6 border-t border-gray-100 flex justify-between">
        <button 
          onClick={onPrev}
          className="bg-white border border-gray-200 text-gray-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Quay lại
        </button>
        <button 
          onClick={handleNextClick}
          disabled={!data.selectedPackage}
          className={`font-bold px-8 py-3 rounded-xl transition-all ${data.selectedPackage ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
};

export default Step2Packages;
