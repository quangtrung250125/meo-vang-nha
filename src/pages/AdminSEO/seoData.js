
export const SITE_SCORE = 76;

export const SCORE_HISTORY = [
  { month: 'T5', score: 58 },
  { month: 'T6', score: 63 },
  { month: 'T7', score: 67 },
  { month: 'T8', score: 71 },
  { month: 'T9', score: 74 },
  { month: 'T10', score: 76 },
];


export const RADAR_SCORES = {
  performance: 82,
  content: 75,
  technical: 90,
  mobile: 88,
  links: 68,
  social: 55,
};

export const RADAR_LABELS = {
  performance: 'Hiệu suất',
  content: 'Nội dung',
  technical: 'Kỹ thuật',
  mobile: 'Di động',
  links: 'Liên kết',
  social: 'Mạng xã hội',
};


export const scoreColor = (s) => {
  if (s >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', hex: '#10b981' };
  if (s >= 60) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', hex: '#f59e0b' };
  return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', hex: '#f43f5e' };
};


export const SEO_PAGES = [
  {
    id: 1,
    name: 'Trang chủ',
    url: '/',
    score: 91,
    title: { status: 'ok', value: 'Mèo Vắng Nhà – Khách sạn mèo cao cấp tại TP.HCM' },
    meta: { status: 'ok', value: 'Dịch vụ giữ mèo chuyên nghiệp, an toàn và yêu thương tại TP. Hồ Chí Minh.' },
    h1: { status: 'ok', value: 'Mèo Vắng Nhà' },
    speed: 94,
    mobile: 96,
    indexable: true,
  },
  {
    id: 2,
    name: 'Dịch vụ',
    url: '/services',
    score: 78,
    title: { status: 'ok', value: 'Dịch vụ giữ mèo – Mèo Vắng Nhà' },
    meta: { status: 'warn', value: 'Xem các gói dịch vụ.' },
    h1: { status: 'ok', value: 'Các dịch vụ của chúng tôi' },
    speed: 83,
    mobile: 90,
    indexable: true,
  },
  {
    id: 3,
    name: 'Đặt phòng',
    url: '/booking',
    score: 62,
    title: { status: 'warn', value: 'Đặt phòng' },
    meta: { status: 'error', value: null },
    h1: { status: 'ok', value: 'Đặt phòng cho bé' },
    speed: 74,
    mobile: 85,
    indexable: true,
  },
  {
    id: 4,
    name: 'Khuyến mãi',
    url: '/promotions',
    score: 55,
    title: { status: 'warn', value: 'Khuyến mãi' },
    meta: { status: 'error', value: null },
    h1: { status: 'error', value: null },
    speed: 80,
    mobile: 82,
    indexable: true,
  },
  {
    id: 5,
    name: 'Tin tức',
    url: '/news',
    score: 83,
    title: { status: 'ok', value: 'Tin tức – Mèo Vắng Nhà' },
    meta: { status: 'ok', value: 'Cập nhật tin tức, mẹo chăm sóc mèo từ đội ngũ Mèo Vắng Nhà.' },
    h1: { status: 'ok', value: 'Tin tức & Mẹo chăm sóc mèo' },
    speed: 89,
    mobile: 91,
    indexable: true,
  },
  {
    id: 6,
    name: 'Hồ sơ mèo',
    url: '/pet-profile',
    score: 48,
    title: { status: 'error', value: null },
    meta: { status: 'error', value: null },
    h1: { status: 'warn', value: 'Hồ sơ' },
    speed: 71,
    mobile: 79,
    indexable: false,
  },
];

export const SEO_ISSUES = [
  {
    id: 1,
    level: 'error',
    category: 'content',
    title: 'Thiếu thẻ meta description',
    description: '3 trang chưa có thẻ meta description: /booking, /promotions, /pet-profile',
    pages: ['/booking', '/promotions', '/pet-profile'],
    impact: 'Cao',
  },
  {
    id: 2,
    level: 'error',
    category: 'content',
    title: 'Thiếu thẻ H1',
    description: '2 trang chưa có thẻ H1: /promotions, /pet-profile',
    pages: ['/promotions', '/pet-profile'],
    impact: 'Cao',
  },
  {
    id: 3,
    level: 'error',
    category: 'content',
    title: 'Thiếu thẻ Title',
    description: 'Trang /pet-profile chưa có thẻ title.',
    pages: ['/pet-profile'],
    impact: 'Cao',
  },
  {
    id: 4,
    level: 'warn',
    category: 'content',
    title: 'Meta description quá ngắn',
    description: 'Trang /services có meta description chỉ 18 ký tự (khuyến nghị 120–160 ký tự).',
    pages: ['/services'],
    impact: 'Trung bình',
  },
  {
    id: 5,
    level: 'warn',
    category: 'content',
    title: 'Title trang quá ngắn',
    description: 'Trang /booking và /promotions có title dưới 30 ký tự.',
    pages: ['/booking', '/promotions'],
    impact: 'Trung bình',
  },
  {
    id: 6,
    level: 'warn',
    category: 'performance',
    title: 'Tốc độ tải trang chậm',
    description: 'Trang /pet-profile (71 điểm) và /booking (74 điểm) có tốc độ dưới 80 điểm.',
    pages: ['/pet-profile', '/booking'],
    impact: 'Trung bình',
  },
  {
    id: 7,
    level: 'warn',
    category: 'social',
    title: 'Thiếu Open Graph tags',
    description: '4 trang chưa cấu hình đầy đủ OG tags cho chia sẻ mạng xã hội.',
    pages: ['/booking', '/promotions', '/pet-profile', '/services'],
    impact: 'Trung bình',
  },
  {
    id: 8,
    level: 'warn',
    category: 'links',
    title: 'Thiếu internal linking',
    description: 'Trang /pet-profile và /booking có ít hơn 3 internal links.',
    pages: ['/pet-profile', '/booking'],
    impact: 'Thấp',
  },

  {
    id: 9,
    level: 'info',
    category: 'technical',
    title: 'Thêm structured data (Schema.org)',
    description: 'Thêm LocalBusiness và PetCare schema để tăng khả năng hiển thị rich snippet.',
    pages: ['/', '/services'],
    impact: 'Cao',
  },
  {
    id: 10,
    level: 'info',
    category: 'performance',
    title: 'Tối ưu hình ảnh',
    description: 'Chuyển đổi sang định dạng WebP để tăng tốc độ tải trang thêm ~20%.',
    pages: ['/', '/services', '/news'],
    impact: 'Trung bình',
  },
  {
    id: 11,
    level: 'info',
    category: 'social',
    title: 'Thêm Twitter Card meta tags',
    description: 'Cấu hình Twitter Card để bài đăng trên X/Twitter hiển thị đẹp hơn.',
    pages: ['/', '/news'],
    impact: 'Thấp',
  },
];


export const KEYWORDS = [
  { id: 1, keyword: 'khách sạn mèo HCM', rank: 3, volume: 1200, trend: 'up', change: 2 },
  { id: 2, keyword: 'giữ mèo TP HCM', rank: 5, volume: 890, trend: 'up', change: 3 },
  { id: 3, keyword: 'dịch vụ trông mèo Hồ Chí Minh', rank: 8, volume: 650, trend: 'stable', change: 0 },
  { id: 4, keyword: 'khách sạn thú cưng TPHCM', rank: 12, volume: 1800, trend: 'down', change: -2 },
  { id: 5, keyword: 'chăm sóc mèo tại nhà', rank: 15, volume: 2100, trend: 'up', change: 5 },
  { id: 6, keyword: 'mèo vắng nhà', rank: 1, volume: 320, trend: 'stable', change: 0 },
  { id: 7, keyword: 'pet hotel cat HCM', rank: 7, volume: 440, trend: 'up', change: 1 },
  { id: 8, keyword: 'giá trông mèo theo ngày', rank: 18, volume: 560, trend: 'down', change: -4 },
];


export const SEO_SUMMARY = {
  errors: SEO_ISSUES.filter(i => i.level === 'error').length,
  warnings: SEO_ISSUES.filter(i => i.level === 'warn').length,
  suggestions: SEO_ISSUES.filter(i => i.level === 'info').length,
  pagesOk: SEO_PAGES.filter(p => p.score >= 80).length,
  pagesTotal: SEO_PAGES.length,
  lastScanned: '26/10/2026 09:30',
};
