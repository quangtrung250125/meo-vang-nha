import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Sparkles, 
  Image as ImageIcon 
} from 'lucide-react';

const BoardingRoomGallery = ({ roomInfo, currentSelectedRoomName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Safety check if roomInfo or images is empty
  const images = roomInfo?.images && roomInfo.images.length > 0
    ? roomInfo.images
    : [{ url: '/images/rooms/vip.png', title: roomInfo?.name || 'Phòng Mèo', desc: '' }];

  const activeImage = images[currentIndex] || images[0];

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full">
      {/* Main Image Container */}
      <div className="relative aspect-[4/3] sm:aspect-[16/11] bg-gray-900 rounded-2xl overflow-hidden shadow-inner group select-none">
        
        {/* Main Photo */}
        <img
          src={activeImage.url}
          alt={activeImage.title || currentSelectedRoomName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
          onClick={() => setIsLightboxOpen(true)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/service_hotel.png';
          }}
        />

        {/* Gradient shadow for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Room badge on top-left */}
        <div className="absolute top-3 left-3 z-10">
          <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentSelectedRoomName || roomInfo?.name}</span>
          </div>
        </div>

        {/* Expand / Lightbox Button on top-right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          title="Xem ảnh lớn"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-90 hover:opacity-100 cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Variant Navigation Controls (when room has > 1 image) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
              title="Ảnh trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
              title="Ảnh tiếp theo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Caption & Indicators at bottom */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-2">
          <div className="text-left text-white max-w-[80%]">
            <p className="text-xs sm:text-sm font-bold drop-shadow-md truncate">
              {activeImage.title}
            </p>
            {activeImage.desc && (
              <p className="text-[11px] text-gray-200 drop-shadow line-clamp-1">
                {activeImage.desc}
              </p>
            )}
          </div>

          {/* Pagination Counter */}
          {images.length > 1 && (
            <div className="bg-black/60 backdrop-blur-md text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/20 shrink-0">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>

      {/* Multiple variants switcher thumbnails */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 mt-2.5">
          {images.map((img, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`flex-1 flex items-center gap-2 p-1.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'border-accent bg-orange-50/80 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-gray-800 truncate">
                    {img.title}
                  </p>
                  <p className="text-[10px] text-gray-500">Biến thể {idx + 1}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImage.url}
              alt={activeImage.title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />

            <div className="mt-4 text-center text-white">
              <h4 className="text-lg font-bold">{activeImage.title}</h4>
              {activeImage.desc && (
                <p className="text-sm text-gray-300 mt-1">{activeImage.desc}</p>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-4 mt-3">
                <button
                  onClick={handlePrev}
                  className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white text-xs font-bold transition-all"
                >
                  ← Ảnh trước
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white text-xs font-bold transition-all"
                >
                  Ảnh sau →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardingRoomGallery;
