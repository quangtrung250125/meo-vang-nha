import React, { useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';

export const HtmlBannerCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;
  const { openAuth } = useUI();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  const goToSlide = (index) => setCurrentSlide(index);

  return (
    <section id="promos" className="py-5 bg-amber-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden shadow-lg bg-stone-900 h-[280px] sm:h-[320px]">
                
                {/* Slide 1 */}
                <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center ${currentSlide === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80" alt="Sự kiện Mèo Vàng" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-900/60 to-transparent"></div>
                    <div className="relative z-10 max-w-xl px-6 sm:px-10 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-amber-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">Hot Event</span>
                            <span className="text-amber-300 text-xs font-medium"><i className="fa-regular fa-clock"></i> Kết thúc sau: <span className="font-bold text-white">03 ngày 14:20:10</span></span>
                        </div>
                        <h2 className="text-xl sm:text-3xl font-extrabold leading-snug mb-2">Chương Trình Tri Ân Khách Hàng Thân Thiết</h2>
                        <p className="text-xs sm:text-sm text-stone-200 mb-4 line-clamp-2">Giảm ngay 20% tổng hóa đơn Spa Thảo Dược & x2 điểm thưởng tích lũy cho tất cả các thành viên.</p>
                        <div className="flex items-center gap-3">
                            <button onClick={openAuth} className="bg-[#00B16A] hover:bg-[#009458] text-white px-4 py-2 rounded-xl font-bold text-xs shadow transition-all flex items-center gap-1.5">
                                <i className="fa-solid fa-gift"></i> Nhận Ưu Đãi Ngay
                            </button>
                        </div>
                    </div>
                </div>

                {/* Slide 2 */}
                <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center ${currentSlide === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img src="https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=1200&q=80" alt="Phòng Mới VIP" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-900/60 to-transparent"></div>
                    <div className="relative z-10 max-w-xl px-6 sm:px-10 text-white">
                        <span className="bg-emerald-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide mb-2 inline-block">Cập Nhật Phòng Mới</span>
                        <h2 className="text-xl sm:text-3xl font-extrabold leading-snug mb-2">Ra Mắt Không Gian Khách Sạn VIP Panorama</h2>
                        <p className="text-xs sm:text-sm text-stone-200 mb-4 line-clamp-2">Trang bị Camera AI quan sát 24/7, máy lọc không khí tiệt trùng Ion và thiết kế gỗ tự nhiên êm ái.</p>
                        <a href="/booking" className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow transition-all">
                            <i className="fa-solid fa-calendar-check"></i> Đặt Lịch Trải Nghiệm
                        </a>
                    </div>
                </div>

                {/* Slide 3 */}
                <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center ${currentSlide === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img src="https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=80" alt="Spa Dịch vụ mới" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-900/60 to-transparent"></div>
                    <div className="relative z-10 max-w-xl px-6 sm:px-10 text-white">
                        <span className="bg-purple-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide mb-2 inline-block">Dịch Vụ Mới</span>
                        <h2 className="text-xl sm:text-3xl font-extrabold leading-snug mb-2">Dịch Vụ Spa Tắm Sấy Thảo Dược Toàn Diện</h2>
                        <p className="text-xs sm:text-sm text-stone-200 mb-4 line-clamp-2">Nâng niu bộ lông mượt mà với dầu tắm thiên nhiên lành tính, hỗ trợ chăm sóc da nhạy cảm.</p>
                        <a href="/services" className="inline-flex items-center gap-1.5 bg-[#00B16A] hover:bg-[#009458] text-white px-4 py-2 rounded-xl font-bold text-xs shadow transition-all">
                            <i className="fa-solid fa-spa"></i> Xem Liệu Trình Spa
                        </a>
                    </div>
                </div>

                {/* Controls */}
                <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all z-20">
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all z-20">
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>

                {/* Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                    {[0, 1, 2].map(idx => (
                        <button key={idx} onClick={() => goToSlide(idx)} className={`${idx === currentSlide ? 'w-6 bg-[#00B16A]' : 'w-1.5 bg-white/60 hover:bg-white'} h-1.5 rounded-full transition-all`}></button>
                    ))}
                </div>
            </div>
        </div>
    </section>
  );
};

export const HtmlServices = () => {
  return (
    <section id="services" className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-8">
                <span className="text-[#00B16A] font-bold text-[11px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Dịch vụ chăm sóc mèo</span>
                <h2 className="text-2xl font-extrabold text-stone-800 mt-2">Dịch Vụ Nổi Bật Tại Mèo Vàng Nhà</h2>
                <p className="text-stone-500 text-xs sm:text-sm mt-1">Đem đến trải nghiệm an toàn, chu đáo và thư thái nhất cho hoàng thượng.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-100 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg mb-3 shadow-sm">
                        <i className="fa-solid fa-spa"></i>
                    </div>
                    <h3 className="text-base font-bold text-stone-800 mb-1">Spa & Grooming Thảo Dược</h3>
                    <p className="text-stone-600 text-xs leading-relaxed">Tắm sấy khử mùi, cắt mài móng, vệ sinh tai mắt và gỡ rối chải lông mượt mà với dòng sản phẩm tự nhiên.</p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#00B16A] text-white flex items-center justify-center text-lg mb-3 shadow-sm">
                        <i className="fa-solid fa-video"></i>
                    </div>
                    <h3 className="text-base font-bold text-stone-800 mb-1">Gửi Khách Sạn AI Camera 24/7</h3>
                    <p className="text-stone-600 text-xs leading-relaxed">Không gian lưu trú tiệt trùng, ấm cúng kèm camera giám sát trực tiếp cho chủ nuôi quan sát bất kể lúc nào.</p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-100 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-lg mb-3 shadow-sm">
                        <i className="fa-solid fa-truck-pickup"></i>
                    </div>
                    <h3 className="text-base font-bold text-stone-800 mb-1">Dịch Vụ Đưa Đón Tận Nơi</h3>
                    <p className="text-stone-600 text-xs leading-relaxed">Xe đưa đón chuyên dụng an toàn, êm ái, tiếp nhận đón và trả bé tận nhà theo khung giờ hẹn linh hoạt.</p>
                </div>
            </div>
        </div>
    </section>
  );
};
