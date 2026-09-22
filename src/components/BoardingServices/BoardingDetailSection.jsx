import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import BoardingServiceCard from './BoardingServiceCard';
import { BOARDING_PACKAGES } from '../../mockData/boardingServicesData';

const BoardingDetailSection = () => {
  // Mặc định mở gói đầu tiên (Mèo Quý Tộc) và cho phép mở đồng thời nhiều gói
  const [expandedIds, setExpandedIds] = useState(['p1']);

  const handleToggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleExpandAll = () => {
    setExpandedIds(BOARDING_PACKAGES.map(p => p.id));
  };

  const handleCollapseAll = () => {
    setExpandedIds([]);
  };

  return (
    <section id="boarding-packages-detail" className="w-full my-12 scroll-mt-20">
      
      {/* 1. Header Banner of Boarding Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 px-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Khách sạn thú cưng tiêu chuẩn 5 sao</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-dark font-title tracking-tight mb-4">
          Chi Tiết Dịch Vụ Lưu Trú Cho Mèo
        </h2>

        <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
          Khám phá 4 gói dịch vụ lưu trú được thiết kế riêng biệt theo từng nhu cầu của bé mèo. 
          Chọn gói, xem ảnh phòng thực tế, nâng cấp hạng phòng và theo dõi tổng chi phí tự động.
        </p>

        {/* Quick Action Controls */}
        <div className="flex items-center justify-center mt-6">
          <button
            type="button"
            onClick={expandedIds.length === BOARDING_PACKAGES.length ? handleCollapseAll : handleExpandAll}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-xs transition-all cursor-pointer"
          >
            {expandedIds.length === BOARDING_PACKAGES.length ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-primary" />
                <span>Thu gọn tất cả gói</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
                <span>Mở rộng xem tất cả gói</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. 4 Boarding Package Cards Accordion */}
      <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6">
        {BOARDING_PACKAGES.map((pkg) => (
          <BoardingServiceCard
            key={pkg.id}
            pkg={pkg}
            isExpanded={expandedIds.includes(pkg.id)}
            onToggleExpand={() => handleToggleExpand(pkg.id)}
          />
        ))}
      </div>

    </section>
  );
};

export default BoardingDetailSection;
