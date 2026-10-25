import React, { useState } from 'react';
import { X, Calendar, CheckCircle, Copy, Check, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PromoDetailModal = ({ promo, onClose }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!promo) return null;

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Đã sao chép mã ưu đãi ${code}!`, {
      icon: '🎉',
      style: { borderRadius: '12px', background: '#10B981', color: '#fff' }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Image */}
        <div className="relative aspect-[16/9] w-full bg-gray-100">
          <img 
            src={promo.image} 
            alt={promo.title}
            className="w-full h-full object-cover" 
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
            {promo.discount}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-2 ${promo.badgeColor}`}>
              {promo.badge}
            </span>
            <h3 className="text-xl font-bold font-title text-text-dark">
              {promo.title}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 leading-relaxed">
              {promo.description}
            </p>
          </div>

          {/* Voucher Box */}
          <div className="p-3.5 rounded-2xl bg-bg-cream border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400 font-semibold block">Mã voucher</span>
              <span className="font-mono text-base font-extrabold text-primary">{promo.code}</span>
            </div>
            <button
              onClick={() => handleCopy(promo.code)}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>

          {/* Valid until & Min stay */}
          <div className="flex items-center justify-between text-xs text-gray-500 py-2 border-y border-gray-100">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-accent" />
              Hạn dùng: <strong className="text-text-dark">{promo.validUntil}</strong>
            </span>
            <span>
              Lưu trú tối thiểu: <strong className="text-text-dark">{promo.minBookingDays} ngày</strong>
            </span>
          </div>

          {/* Terms List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Điều kiện áp dụng
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              {Array.isArray(promo.terms) ? (
                promo.terms.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></span>
                    <span>{term}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></span>
                  <span>{promo.terms}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClose();
                navigate('/booking');
              }}
              className="w-full py-3 rounded-xl bg-accent text-white text-xs sm:text-sm font-bold hover:bg-accent-hover transition-colors shadow-md shadow-accent/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đặt phòng ngay với ưu đãi này</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoDetailModal;
