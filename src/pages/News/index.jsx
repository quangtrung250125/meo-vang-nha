import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Clock, 
  Calendar, 
  User, 
  ArrowRight, 
  Sparkles, 
  Filter, 
  PawPrint, 
  MessageSquareHeart,
  ChevronRight
} from 'lucide-react';
import { newsCategories, articlesList } from '../../mockData/newsData';
import VaccinationChecker from './VaccinationChecker';
import ArticleReaderModal from './ArticleReaderModal';

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingArticle, setReadingArticle] = useState(null);

  // Filter articles based on Category & Search
  const filteredArticles = useMemo(() => {
    return articlesList.filter(article => {
      const matchCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const featuredArticle = articlesList.find(a => a.featured) || articlesList[0];

  return (
    <div className="w-full pb-20">
      {/* Header Banner */}
      <section className="bg-primary-light pt-12 pb-24 text-center rounded-b-[3rem] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <BookOpen className="w-4 h-4" />
            Cẩm nang thú y & Nuôi mèo khoa học
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-dark font-title mb-4 leading-tight">
            Tin Tức & Kinh Nghiệm Chăm Sóc Mèo
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Giải đáp mọi băn khoăn của Sen: từ dinh dưỡng khi mèo biếng ăn, cách chọn cát chuẩn, đến lịch tiêm chủng an toàn.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm: biếng ăn, cách chọn cát, lịch tiêm phòng..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white shadow-lg shadow-primary/5 text-text-dark text-sm placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary border border-emerald-100 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-xs font-semibold text-gray-400 hover:text-gray-600"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Background Subtle Icons */}
        <PawPrint className="absolute -top-6 -left-6 w-36 h-36 text-emerald-600/10 pointer-events-none -rotate-12" />
        <PawPrint className="absolute -bottom-10 -right-6 w-44 h-44 text-emerald-600/10 pointer-events-none rotate-12" />
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 space-y-12">
        
        {/* Category Pills */}
        <div className="flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-gray-100 max-w-full overflow-x-auto">
            {newsCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Article (Chỉ hiển thị khi đang ở tab Tất cả và không search) */}
        {selectedCategory === 'all' && !searchQuery && featuredArticle && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 rounded-2xl overflow-hidden aspect-[16/10] bg-gray-100 relative group cursor-pointer"
                   onClick={() => setReadingArticle(featuredArticle)}>
                <img 
                  src={featuredArticle.coverImage} 
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-4 left-4 bg-accent text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bài viết tâm điểm
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-primary mb-3">
                  <span className="bg-primary-light px-2.5 py-1 rounded-full">{featuredArticle.categoryName}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredArticle.readTime}
                  </span>
                </div>

                <h2 
                  onClick={() => setReadingArticle(featuredArticle)}
                  className="text-2xl sm:text-3xl font-extrabold font-title text-text-dark mb-4 leading-snug cursor-pointer hover:text-primary transition-colors"
                >
                  {featuredArticle.title}
                </h2>

                <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <User className="w-4 h-4 text-primary" />
                    <span>{featuredArticle.author.split('(')[0]}</span>
                  </div>

                  <button
                    onClick={() => setReadingArticle(featuredArticle)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-secondary transition-all cursor-pointer shadow-sm shadow-primary/20"
                  >
                    Đọc bài viết
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Vaccination Checker Tool */}
        <section>
          <VaccinationChecker />
        </section>

        {/* Articles Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold font-title text-text-dark">
                {selectedCategory === 'all' ? 'Tất cả bài viết hướng dẫn' : `Chuyên mục: ${newsCategories.find(c => c.id === selectedCategory)?.name}`}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Tìm thấy {filteredArticles.length} bài viết hữu ích cho Sen
              </p>
            </div>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
                >
                  {/* Card Thumbnail */}
                  <div 
                    className="aspect-[16/10] bg-gray-100 overflow-hidden relative cursor-pointer"
                    onClick={() => setReadingArticle(article)}
                  >
                    <img 
                      src={article.coverImage} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-text-dark text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
                      {article.categoryName}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {article.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTime}
                      </span>
                    </div>

                    <h4 
                      onClick={() => setReadingArticle(article)}
                      className="font-bold text-lg font-title text-text-dark mb-2.5 line-clamp-2 leading-snug cursor-pointer group-hover:text-primary transition-colors"
                    >
                      {article.title}
                    </h4>

                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                      {article.excerpt}
                    </p>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400 truncate max-w-[150px]">
                        {article.author.split('(')[0]}
                      </span>

                      <button
                        onClick={() => setReadingArticle(article)}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:text-secondary group-hover:translate-x-1 transition-all cursor-pointer"
                      >
                        Đọc tiếp
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-bold">Không tìm thấy bài viết nào phù hợp.</p>
              <p className="text-xs text-gray-400 mt-1">Hãy thử tìm kiếm bằng từ khóa khác như "biếng ăn", "cát", "tiêm phòng".</p>
            </div>
          )}
        </section>

        {/* CTA Banner: Cần tư vấn từ Bác sĩ */}
        <section className="bg-bg-beige rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-100">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center justify-center md:justify-start gap-1.5">
              <MessageSquareHeart className="w-4 h-4" />
              Tư vấn chăm sóc trực tiếp
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-title text-text-dark">
              Boss của bạn đang gặp vấn đề sức khỏe?
            </h3>
            <p className="text-gray-600 text-sm max-w-lg leading-relaxed">
              Đội ngũ bác sĩ thú y & bảo mẫu tại Mèo Vắng Nhà luôn sẵn sàng hỗ trợ tư vấn chế độ dinh dưỡng và theo dõi sức khỏe 24/7.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:0909123456"
              className="px-6 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-secondary transition-all shadow-md shadow-primary/20 text-center"
            >
              Gọi hotline tư vấn
            </a>
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-white border border-gray-200 text-text-dark text-sm font-bold hover:bg-gray-50 transition-all text-center"
            >
              Chat qua Zalo
            </a>
          </div>
        </section>

      </div>

      {/* Reader Modal */}
      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
        />
      )}
    </div>
  );
};

export default News;
