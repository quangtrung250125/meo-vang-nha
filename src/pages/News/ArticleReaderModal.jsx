import React from 'react';
import { X, Clock, Calendar, User, Share2, Tag, BookOpen, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const ArticleReaderModal = ({ article, onClose }) => {
  if (!article) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép liên kết bài viết!', {
      icon: '🔗',
      style: { borderRadius: '12px', background: '#333', color: '#fff' }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-light text-primary">
              {article.categoryName}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Chia sẻ bài viết"
              className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Cover Image */}
          <div className="rounded-2xl overflow-hidden aspect-[16/9] max-h-72 w-full bg-gray-100 shadow-inner">
            <img 
              src={article.coverImage} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title & Metadata */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-dark font-title leading-tight mb-3">
              {article.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pb-4 border-b border-gray-100">
              <span className="flex items-center gap-1.5 font-medium text-text-dark">
                <User className="w-3.5 h-3.5 text-primary" />
                {article.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {article.date}
              </span>
            </div>
          </div>

          {/* Excerpt */}
          <p className="text-base text-gray-700 italic bg-bg-cream p-4 rounded-2xl border-l-4 border-primary">
            "{article.excerpt}"
          </p>

          {/* Article Sections */}
          <div className="space-y-6 text-gray-800 text-sm sm:text-base leading-relaxed">
            {article.sections.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-lg sm:text-xl font-bold font-title text-text-dark text-emerald-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  {sec.heading}
                </h3>
                <div className="whitespace-pre-line text-gray-600 pl-2">
                  {sec.content}
                </div>
              </div>
            ))}
          </div>

          {/* Doctor's Note Alert */}
          {article.doctorNote && (
            <div className="p-5 rounded-2xl bg-primary-light/50 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <CheckCircle className="w-4 h-4" />
                Ghi chú từ Bác sĩ Thú y Mèo Vắng Nhà
              </div>
              <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
                {article.doctorNote}
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1 mr-2">
              <Tag className="w-3.5 h-3.5" /> Từ khóa:
            </span>
            {article.tags.map((tag, idx) => (
              <span 
                key={idx}
                className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">© Mèo Vắng Nhà - Cẩm nang thú y</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors cursor-pointer shadow-xs"
          >
            Đóng bài viết
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleReaderModal;
