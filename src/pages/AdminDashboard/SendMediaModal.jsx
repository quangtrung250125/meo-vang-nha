import React, { useState } from 'react';
import { Camera, Video, X, Send, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_PHOTOS = [
  {
    url: '/images/505485728_122132721272409942_315058818274445695_n.jpg',
    label: 'Bé chơi đùa năng động',
    tag: 'Vui chơi',
  },
  {
    url: '/images/526874705_122136638054409942_8543058970535826489_n.jpg',
    label: 'Bé ăn hạt ngon miệng',
    tag: 'Bữa ăn',
  },
  {
    url: '/images/527387932_122136638030409942_5720953043007181021_n.jpg',
    label: 'Thư giãn trong phòng ấm',
    tag: 'Nghỉ ngơi',
  },
  {
    url: '/images/560112782_122140781234409942_864390583376155211_n.jpg',
    label: 'Spa & chải lông mượt mà',
    tag: 'Chăm sóc',
  },
  {
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    label: 'Khoảnh khắc đáng yêu',
    tag: 'Khoảnh khắc',
  },
];

const SendMediaModal = ({ isOpen, onClose, cat, onSendMedia }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(PRESET_PHOTOS[0].url);
  const [customUrl, setCustomUrl] = useState('');
  const [caption, setCaption] = useState(
    cat ? `Bé ${cat.catName} hôm nay rất ngoan, ăn uống đầy đủ và tinh thần rất vui vẻ ạ! 🐾❤️` : ''
  );
  const [mediaTag, setMediaTag] = useState('Khoảnh khắc trong ngày');

  if (!isOpen || !cat) return null;

  const activePhoto = customUrl.trim() || selectedPhoto;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!activePhoto) {
      toast.error('Vui lòng chọn hoặc nhập link ảnh/video!');
      return;
    }

    onSendMedia(cat, {
      imageUrl: activePhoto,
      caption: caption.trim() || `Hình ảnh mới nhất của bé ${cat.catName}`,
      tag: mediaTag,
    });

    toast.success(`Đã gửi ảnh khoảnh khắc của bé ${cat.catName} tới chủ nuôi! 📸`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight font-title">
                Gửi ảnh & video khoảnh khắc
              </h3>
              <p className="text-white/80 text-xs mt-0.5">
                Bé: <b>{cat.catName}</b> (Phòng {cat.room}) • Khách: {cat.ownerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Preview ảnh đang chọn */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Xem trước hình ảnh / video gửi khách
            </label>
            <div className="relative h-52 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-inner group">
              <img
                src={activePhoto}
                alt="Selected"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <div className="absolute top-2 right-2 bg-black/60 text-white backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-full">
                {mediaTag}
              </div>
            </div>
          </div>

          {/* Chọn nhanh từ thư viện ảnh chụp thực tế */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Chọn nhanh ảnh khoảnh khắc thực tế
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_PHOTOS.map((p, idx) => {
                const isSelected = selectedPhoto === p.url && !customUrl.trim();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPhoto(p.url);
                      setCustomUrl('');
                      setMediaTag(p.tag);
                    }}
                    className={`relative rounded-xl overflow-hidden h-14 border-2 transition-all cursor-pointer ${
                      isSelected ? 'border-orange-500 ring-2 ring-orange-200 scale-95' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-500/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nhập link ảnh tùy chỉnh */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Hoặc nhập link URL ảnh/video khác
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://... (link ảnh hoặc video clip của bé)"
              className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Lời nhắn gửi khách */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Lời nhắn gửi chủ nuôi (khách hàng sẽ thấy trên app)
            </label>
            <textarea
              rows="3"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="VD: Bé ăn ngoan, chơi đùa vui vẻ..."
              className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Gửi ngay cho khách
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendMediaModal;
