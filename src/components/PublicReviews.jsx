import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { publicReviews } from '../services/reviewsApi';
import { useReviews } from '../contexts/ReviewsContext';
import { publicReview } from '../utils/bookingReview';
import { SAMPLE_REVIEWS } from '../mockData/sampleReviews';

export default function PublicReviews() {
  const context = useReviews();
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (context?.isDemo) return;
    let active = true;
    publicReviews().then(data => {
      if (active) setItems(data.reviews || []);
    }).catch(() => {});
    return () => { active = false; };
  }, [context?.isDemo]);
  const published = context?.isDemo
    ? context.reviews.filter(r => r.published && r.publicConsent).map(publicReview)
    : items;
  const average = published.length
    ? (published.reduce((sum, r) => sum + r.rating, 0) / published.length).toFixed(1)
    : '';
  const actualReviews = published.map((review, index) => ({
    id: 'approved-' + index,
    name: review.authorName,
    avatar: (review.authorName || 'Khách').trim().split(/\s+/).at(-1)?.[0] || 'K',
    color: 'bg-primary',
    rating: review.rating,
    service: review.service || 'Lưu trú',
    date: new Date(review.createdAt).toLocaleDateString('vi-VN'),
    petName: review.petNames,
    review: review.comment || 'Đánh giá ' + review.rating + '/5 sao.',
    highlight: false,
    isSample: false,
  }));
  const reviews = [...actualReviews, ...SAMPLE_REVIEWS];
  return (
      <section id="customer-reviews" className="bg-bg-cream/70 py-16 scroll-mt-24" aria-label="Đánh giá từ khách hàng">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Đánh giá từ khách hàng</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-dark font-title mb-4">
              Khách Hàng Nói Gì Về Chúng Tôi?
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              {published.length ? <><strong className="text-xl font-black text-text-dark">{average}/5</strong> · {published.length} đánh giá đã duyệt</> : 'Những chia sẻ về trải nghiệm chăm sóc và kỳ nghỉ của các bé'}
            </p>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, idx) => (
              <div
                key={review.id || 'sample-' + idx}
                className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col ${
                  review.highlight ? 'border-primary/30 ring-1 ring-primary/20' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">{review.rating}.0</span>
                  {review.highlight && (
                    <span className="ml-auto text-[10px] font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full">
                      ✨ Nổi bật
                    </span>
                  )}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-5 italic">
                  &ldquo;{review.review}&rdquo;
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {review.service}
                  </span>
                  <span className="text-[11px] text-gray-400">{review.date}</span>
                  <span className="text-[10px] text-gray-400">{review.isSample ? 'Mẫu minh họa' : 'Đánh giá đã duyệt'}</span>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className={`w-10 h-10 rounded-full ${review.color} flex items-center justify-center text-white font-extrabold text-sm shrink-0`}>
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-dark">{review.name}</p>
                    <p className="text-xs text-gray-400">🐾 {review.petName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 bg-primary hover:bg-[#cf750c] text-white font-bold px-8 py-3.5 rounded-full transition-all shadow-lg shadow-orange-300 active:scale-95"
            >
              Đặt phòng ngay — nhận ưu đãi 10%
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

  );
}
