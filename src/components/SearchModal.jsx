import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Tag, Sparkles, Hotel, ShowerHead, Gift, Car, ShieldAlert, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';

const searchableData = [
  {
    id: 'hotel-vip',
    title: 'Khách Sạn Mèo Cao Cấp & Phòng VIP',
    type: 'Dịch vụ',
    desc: 'Điều hòa 24/7, camera trực tiếp, dọn vệ sinh 2 lần/ngày, đồ chơi riêng biệt.',
    link: '/services',
    action: 'navigate',
    icon: Hotel,
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'spa-herbal',
    title: 'Spa Grooming & Tắm Thảo Dược',
    type: 'Dịch vụ',
    desc: 'Liệu trình thư giãn lông da, trị ve rận nấm bằng thảo dược tự nhiên, cắt tỉa móng.',
    link: '/services',
    action: 'navigate',
    icon: ShowerHead,
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'condo-room',
    title: 'Căn hộ Cat-Condo Đôi Mới Ra Mắt',
    type: 'Cập nhật',
    desc: 'Phòng đa tầng rộng rãi cho 2-3 bé mèo với cầu trượt, trụ cào móng và camera HD.',
    link: '/services',
    action: 'navigate',
    icon: Sparkles,
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'loyalty-points',
    title: 'Chương Trình Đổi Điểm Thưởng & Tích Điểm VIP',
    type: 'Ưu đãi',
    desc: 'Tích 1% - 5% chi tiêu để nâng hạng Đồng, Vàng, Kim Cương và quy đổi voucher quà tặng.',
    action: 'policy',
    policyKey: 'membership',
    icon: Gift,
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'transport-service',
    title: 'Dịch Vụ Đưa Đón Mèo Tận Nhà 24/7',
    type: 'Dịch vụ',
    desc: 'Xe chuyên dụng an toàn, thoáng mát. Nhận và trả mèo ngoài giờ khi đặt hẹn trước.',
    link: '/services',
    action: 'navigate',
    icon: Car,
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'policy-terms',
    title: 'Khung Giờ Hoạt Động & Quy Định Nhận Trả Ngoài Giờ',
    type: 'Chính sách',
    desc: 'Giờ mở cửa: 08:30 - 19:30. Đón trả ngoài khung giờ cần liên hệ trước ít nhất 2 giờ.',
    action: 'policy',
    policyKey: 'terms',
    icon: FileText,
    badgeColor: 'bg-gray-100 text-gray-700',
  },
  {
    id: 'policy-privacy',
    title: 'Chính Sách Bảo Mật Thông Tin & Sức Khỏe',
    type: 'Chính sách',
    desc: 'Cam kết bảo mật dữ liệu chủ nuôi, kiểm tra sức khỏe và tiêm phòng vắc-xin cho bé.',
    action: 'policy',
    policyKey: 'privacy',
    icon: ShieldAlert,
    badgeColor: 'bg-teal-100 text-teal-700',
  },
];

const hotTags = [
  'Phòng VIP Mèo',
  'Tắm Spa thảo dược',
  'Quy đổi điểm thưởng',
  'Đưa đón ngoài giờ',
  'Cat-Condo',
  'Bảng giá dịch vụ',
];

const SearchModal = () => {
  const { isSearchOpen, closeSearch, openPolicy } = useUI();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          closeSearch();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const filteredResults = query.trim()
    ? searchableData.filter(
        item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.desc.toLowerCase().includes(query.toLowerCase()) ||
          item.type.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelectResult = (item) => {
    closeSearch();
    if (item.action === 'policy') {
      openPolicy(item.policyKey || 'points');
    } else if (item.link) {
      navigate(item.link);
    }
  };

  const handleTagClick = (tag) => {
    setQuery(tag);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 transition-all duration-300 animate-in fade-in"
      onClick={closeSearch}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-amber-100 transform transition-all duration-300 scale-100 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3 flex-1 mr-3">
            <Search className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm dịch vụ hotel, spa, lịch đón trả, khuyến mãi..."
              className="w-full text-base sm:text-lg focus:outline-none text-gray-800 placeholder-gray-400 font-medium bg-transparent"
            />
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-gray-400 hover:text-gray-600 mr-2 px-2 py-1 bg-gray-100 rounded-md"
            >
              Xóa
            </button>
          )}
          <button
            onClick={closeSearch}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng tìm kiếm (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hot Search Suggestions */}
        {!query.trim() && (
          <div className="mt-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Từ khóa tìm kiếm phổ biến</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTagClick(tag)}
                  className="text-xs bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full hover:bg-amber-100 hover:text-amber-900 font-medium transition-colors cursor-pointer active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Gợi ý xem nhanh
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {searchableData.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-amber-50/70 border border-transparent hover:border-amber-100 text-left transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate group-hover:text-amber-900">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{item.type}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Search Results */}
        {query.trim() && (
          <div className="mt-4 max-h-80 overflow-y-auto space-y-2 divide-y divide-gray-100 pr-1">
            {filteredResults.length > 0 ? (
              filteredResults.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    className="w-full text-left block p-3.5 rounded-2xl hover:bg-amber-50/80 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-amber-950 text-sm group-hover:text-amber-600 transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${item.badgeColor}`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed pl-9">
                      {item.desc}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p>Không tìm thấy kết quả phù hợp cho "{query}"</p>
                <p className="text-gray-400 mt-1">Thử tìm kiếm với các từ khóa: VIP, Spa, Đưa đón, Điểm thưởng...</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Shortcut Helper */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
          <span>Tìm kiếm nhanh các dịch vụ Mèo Vắng Nhà</span>
          <span>Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono text-[10px]">Esc</kbd> để đóng</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
