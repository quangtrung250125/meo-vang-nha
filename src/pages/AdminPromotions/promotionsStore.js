// Store và dữ liệu mẫu cho thẻ "Khuyến mãi & Điểm thưởng" trong Giao diện Admin
// Quản lý trạng thái thông qua localStorage để duy trì tương tác chân thực

export const PROMO_TABS = [
  { id: 'all-promotions', label: 'Tất cả ưu đãi' },
  { id: 'vouchers', label: 'Mã giảm giá' },
  { id: 'gifts-combos', label: 'Quà tặng & Combo' },
  { id: 'minigame', label: 'Minigame Boss Vui' },
  { id: 'loyalty-tiers', label: 'Điểm thưởng & hạng' },
  { id: 'referral', label: 'Giới thiệu bạn bè' },
  { id: 'analytics-roi', label: 'Hiệu quả' },
];

export const CUSTOMER_GROUPS = [
  { id: 'all', label: 'Tất cả đối tượng' },
  { id: 'new', label: 'Khách mới' },
  { id: 'returning', label: 'Quay lại' },
  { id: 'loyal', label: 'Thân thiết' },
  { id: 'vip', label: 'VIP' },
  { id: 'at_risk', label: 'Nguy cơ rời bỏ' },
];

export const PROMO_STATUSES = [
  { id: 'all', label: 'Tất cả trạng thái' },
  { id: 'active', label: 'Đang chạy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'upcoming', label: 'Sắp diễn ra', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'paused', label: 'Tạm dừng', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'ended', label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-600 border-gray-200' },
];

// Định dạng tiền tệ 1.000.000đ
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0đ';
  return Number(amount).toLocaleString('vi-VN') + 'đ';
};

// Định dạng ngày dd/mm/yyyy
export const formatDateVN = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && dateInput.includes('/')) return dateInput;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Key LocalStorage
const STORAGE_KEYS = {
  PROMOTIONS: 'mvn_admin_promotions_v1',
  VOUCHERS: 'mvn_admin_vouchers_v1',
  GIFTS_COMBOS: 'mvn_admin_gifts_combos_v1',
  MINIGAME_SETTINGS: 'mvn_admin_minigame_settings_v1',
  MINIGAME_PRIZES: 'mvn_admin_minigame_prizes_v1',
  LOYALTY_TIERS: 'mvn_admin_loyalty_tiers_v1',
  LOYALTY_RULES: 'mvn_admin_loyalty_rules_v1',
  CUSTOMER_POINTS: 'mvn_admin_customer_points_v1',
  POINTS_AUDIT_LOGS: 'mvn_admin_points_audit_logs_v1',
  REFERRAL_SETTINGS: 'mvn_admin_referral_settings_v1',
  REFERRAL_LOGS: 'mvn_admin_referral_logs_v1',
  ANALYTICS_DATA: 'mvn_admin_promo_analytics_v1',
};

// Dữ liệu mẫu ban đầu (Seed Data)
export const initialPromotions = [
  {
    id: 'promo-1',
    name: 'Tuần Lễ Vàng: Đón Boss Lần Đầu',
    description: 'Dành riêng cho khách hàng mới lần đầu gửi bé tại Mèo Vắng Nhà. Giảm ngay 20% tổng hóa đơn đặt phòng.',
    type: 'percentage', // percentage, fixed, gift, combo
    discountValue: 20,
    discountDisplay: 'GIẢM 20%',
    code: 'NEWFRIEND20',
    minBookingDays: 2,
    minOrderValue: 300000,
    targetGroup: 'new', // new, returning, loyal, vip, at_risk, all
    targetGroupLabel: 'Khách mới',
    targetBadgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    validUntil: '31/12/2026',
    status: 'active', // active, upcoming, paused, ended
    isHot: true,
    budgetTotal: 15000000,
    budgetUsed: 6200000,
    usageLimit: 150,
    usageCount: 62,
    image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80',
    terms: 'Chỉ áp dụng cho đơn đầu tiên của SĐT. Thời gian lưu trú tối thiểu 2 ngày.',
  },
  {
    id: 'promo-2',
    name: 'Mùa Hè Mát Lạnh - Nghỉ Dưỡng Thảnh Thơi',
    description: 'Ưu đãi trọn gói lưu trú phòng máy lạnh 24/7, tặng kèm gói Spa thảo mộc làm mát và pate cao cấp.',
    type: 'percentage',
    discountValue: 25,
    discountDisplay: 'GIẢM 25%',
    code: 'SUMMERBOSS',
    minBookingDays: 3,
    minOrderValue: 600000,
    targetGroup: 'all',
    targetGroupLabel: 'Tất cả khách',
    targetBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    startDate: '2026-10-15',
    endDate: '2026-11-15',
    validUntil: '15/11/2026',
    status: 'active',
    isHot: true,
    budgetTotal: 25000000,
    budgetUsed: 14750000,
    usageLimit: 200,
    usageCount: 118,
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    terms: 'Áp dụng cho đơn từ 3 ngày trở lên. Không cộng dồn với mã giảm giá khác.',
  },
  {
    id: 'promo-3',
    name: 'Combo Gửi 3 Ngày - Tặng Gói Spa Cắt Tỉa',
    description: 'Đặt phòng Cao Cấp hoặc VIP từ 3 ngày trở lên, tặng miễn phí 01 suất Spa vệ sinh tai, cắt móng và chải lông.',
    type: 'combo',
    discountValue: 150000,
    discountDisplay: 'QUÀ TẶNG 150K',
    code: 'SPAGIFT',
    minBookingDays: 3,
    minOrderValue: 800000,
    targetGroup: 'loyal',
    targetGroupLabel: 'Thân thiết',
    targetBadgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    startDate: '2026-10-01',
    endDate: '2026-11-20',
    validUntil: '20/11/2026',
    status: 'active',
    isHot: false,
    budgetTotal: 10000000,
    budgetUsed: 4500000,
    usageLimit: 60,
    usageCount: 30,
    image: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=600&q=80',
    terms: 'Áp dụng cho phòng Cao Cấp/VIP. Giới hạn 60 suất.',
  },
  {
    id: 'promo-4',
    name: 'Đặc Quyền Khách Hàng VIP: Giảm 15% Cuối Tuần',
    description: 'Ưu đãi dành riêng cho khách hàng hạng VIP khi đặt phòng vào các ngày cuối tuần (Thứ 6, 7, CN).',
    type: 'percentage',
    discountValue: 15,
    discountDisplay: 'GIẢM 15%',
    code: 'WEEKENDVIP',
    minBookingDays: 2,
    minOrderValue: 500000,
    targetGroup: 'vip',
    targetGroupLabel: 'Khách VIP',
    targetBadgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    validUntil: '30/11/2026',
    status: 'active',
    isHot: false,
    budgetTotal: 8000000,
    budgetUsed: 3150000,
    usageLimit: 50,
    usageCount: 21,
    image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80',
    terms: 'Chỉ dành cho tài khoản đã đạt hạng Vàng và Kim Cương.',
  },
  {
    id: 'promo-5',
    name: 'Chăm Sóc Quay Lại: Nhớ Boss Quá Đi Thôi',
    description: 'Tặng mã giảm trực tiếp 80.000đ dành cho khách hàng đã hơn 45 ngày chưa gửi lại bé mèo.',
    type: 'fixed',
    discountValue: 80000,
    discountDisplay: '-80.000đ',
    code: 'MISSCAT80',
    minBookingDays: 2,
    minOrderValue: 400000,
    targetGroup: 'at_risk',
    targetGroupLabel: 'Nguy cơ rời bỏ',
    targetBadgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    startDate: '2026-10-10',
    endDate: '2026-11-25',
    validUntil: '25/11/2026',
    status: 'active',
    isHot: false,
    budgetTotal: 6000000,
    budgetUsed: 1920000,
    usageLimit: 75,
    usageCount: 24,
    image: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80',
    terms: 'Chỉ áp dụng cho khách hàng có lần đặt phòng gần nhất cách đây trên 45 ngày.',
  },
  {
    id: 'promo-6',
    name: 'Chào Đón Mùa Lễ Hội Giáng Sinh 2026',
    description: 'Chương trình đặt phòng sớm cho kỳ nghỉ lễ Noel và Tết Dương Lịch. Tặng set quà đồ chơi và pate đặc biệt.',
    type: 'gift',
    discountValue: 120000,
    discountDisplay: 'SET QUÀ NOEL',
    code: 'XMAS2026',
    minBookingDays: 3,
    minOrderValue: 700000,
    targetGroup: 'all',
    targetGroupLabel: 'Tất cả khách',
    targetBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    startDate: '2026-12-01',
    endDate: '2026-12-31',
    validUntil: '31/12/2026',
    status: 'upcoming',
    isHot: true,
    budgetTotal: 20000000,
    budgetUsed: 0,
    usageLimit: 100,
    usageCount: 0,
    image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
    terms: 'Chương trình bắt đầu nhận đặt trước từ 01/12/2026.',
  },
  {
    id: 'promo-7',
    name: 'Flash Sale Ngày Hội Thú Cưng 09/09',
    description: 'Chiến dịch siêu giảm giá 30% phòng VIP trong 24 giờ mừng ngày hội thú cưng toàn quốc.',
    type: 'percentage',
    discountValue: 30,
    discountDisplay: 'GIẢM 30%',
    code: 'FLASHPET99',
    minBookingDays: 1,
    minOrderValue: 200000,
    targetGroup: 'all',
    targetGroupLabel: 'Tất cả khách',
    targetBadgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    startDate: '2026-09-09',
    endDate: '2026-09-10',
    validUntil: '10/09/2026',
    status: 'ended',
    isHot: false,
    budgetTotal: 12000000,
    budgetUsed: 12000000,
    usageLimit: 100,
    usageCount: 100,
    image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80',
    terms: 'Chương trình đã kết thúc.',
  },
];

export const initialVouchers = [
  {
    id: 'vouch-1',
    code: 'NEWFRIEND20',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 200000,
    displayValue: 'Giảm 20% (tối đa 200k)',
    promoName: 'Tuần Lễ Vàng: Đón Boss Lần Đầu',
    promoId: 'promo-1',
    usageCount: 62,
    maxUsage: 150,
    limitPerCustomer: 1,
    minBookingDays: 2,
    minOrderValue: 300000,
    targetGroup: 'new',
    validUntil: '31/12/2026',
    status: 'active', // active, exhausted, expired
  },
  {
    id: 'vouch-2',
    code: 'SUMMERBOSS',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 350000,
    displayValue: 'Giảm 25% (tối đa 350k)',
    promoName: 'Mùa Hè Mát Lạnh - Nghỉ Dưỡng Thảnh Thơi',
    promoId: 'promo-2',
    usageCount: 118,
    maxUsage: 200,
    limitPerCustomer: 2,
    minBookingDays: 3,
    minOrderValue: 600000,
    targetGroup: 'all',
    validUntil: '15/11/2026',
    status: 'active',
  },
  {
    id: 'vouch-3',
    code: 'MEOMEO50',
    discountType: 'fixed',
    discountValue: 50000,
    maxDiscount: 50000,
    displayValue: 'Giảm trực tiếp 50.000đ',
    promoName: 'Voucher Giảm 50K Tiền Phòng',
    promoId: 'promo-2',
    usageCount: 85,
    maxUsage: 100,
    limitPerCustomer: 2,
    minBookingDays: 2,
    minOrderValue: 400000,
    targetGroup: 'all',
    validUntil: '15/11/2026',
    status: 'active',
  },
  {
    id: 'vouch-4',
    code: 'WEEKENDVIP',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 300000,
    displayValue: 'Giảm 15% Cuối tuần',
    promoName: 'Đặc Quyền Khách Hàng VIP',
    promoId: 'promo-4',
    usageCount: 21,
    maxUsage: 50,
    limitPerCustomer: 3,
    minBookingDays: 2,
    minOrderValue: 500000,
    targetGroup: 'vip',
    validUntil: '30/11/2026',
    status: 'active',
  },
  {
    id: 'vouch-5',
    code: 'MISSCAT80',
    discountType: 'fixed',
    discountValue: 80000,
    maxDiscount: 80000,
    displayValue: 'Giảm trực tiếp 80.000đ',
    promoName: 'Chăm Sóc Quay Lại',
    promoId: 'promo-5',
    usageCount: 24,
    maxUsage: 75,
    limitPerCustomer: 1,
    minBookingDays: 2,
    minOrderValue: 400000,
    targetGroup: 'at_risk',
    validUntil: '25/11/2026',
    status: 'active',
  },
  {
    id: 'vouch-6',
    code: 'FLASHPET99',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 250000,
    displayValue: 'Giảm 30% Flash Sale',
    promoName: 'Flash Sale Ngày Hội Thú Cưng',
    promoId: 'promo-7',
    usageCount: 100,
    maxUsage: 100,
    limitPerCustomer: 1,
    minBookingDays: 1,
    minOrderValue: 200000,
    targetGroup: 'all',
    validUntil: '10/09/2026',
    status: 'exhausted',
  },
];

export const initialGiftsCombos = [
  {
    id: 'gift-1',
    name: 'Combo Gửi 3 Ngày Tặng Spa Móng & Tai',
    type: 'combo', // combo, gift, points_redeem
    typeLabel: 'Combo Ưu Đãi',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    content: '01 Suất Spa làm sạch tai, cắt móng và chải lông bằng lược hơi nước an toàn.',
    value: 150000,
    pointsRequired: null,
    condition: 'Đặt phòng Cao Cấp hoặc VIP từ 3 ngày trở lên',
    stockTotal: 60,
    stockUsed: 30,
    enabled: true,
  },
  {
    id: 'gift-2',
    name: 'Tiệc Pate Cá Hồi Monge Cao Cấp (02 lon)',
    type: 'gift',
    typeLabel: 'Quà tặng kèm',
    badgeCls: 'bg-orange-50 text-orange-700 border-orange-200',
    content: '02 Lon Pate Monge nhập khẩu Italy vị cá hồi hoặc thịt gà organic bồi bổ cho Boss.',
    value: 90000,
    pointsRequired: null,
    condition: 'Đơn đặt phòng từ 600.000đ hoặc lưu trú từ 2 ngày',
    stockTotal: 100,
    stockUsed: 54,
    enabled: true,
  },
  {
    id: 'gift-3',
    name: 'Đồ Chơi Gặm Nhồi Cỏ Mèo Catnip Hữu Cơ',
    type: 'gift',
    typeLabel: 'Quà tặng kèm',
    badgeCls: 'bg-orange-50 text-orange-700 border-orange-200',
    content: 'Đồ chơi nhồi cỏ catnip cao cấp hình cá hề giúp bé giảm căng thẳng khi lưu trú.',
    value: 65000,
    pointsRequired: null,
    condition: 'Áp dụng cho mọi bé check-in phòng VIP',
    stockTotal: 80,
    stockUsed: 35,
    enabled: true,
  },
  {
    id: 'gift-4',
    name: 'Đổi Điểm: Voucher 100.000đ Giảm Trừ Tiền Phòng',
    type: 'points_redeem',
    typeLabel: 'Đổi điểm thưởng',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    content: 'Mã giảm trực tiếp 100.000đ vào hóa đơn đặt phòng cho kỳ lưu trú tiếp theo.',
    value: 100000,
    pointsRequired: 100,
    condition: 'Dành cho khách hàng có từ 100 điểm thưởng trở lên',
    stockTotal: 200,
    stockUsed: 62,
    enabled: true,
  },
  {
    id: 'gift-5',
    name: 'Đổi Điểm: Gói Tắm & Sấy Spa Thảo Mộc Toàn Diện',
    type: 'points_redeem',
    typeLabel: 'Đổi điểm thưởng',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    content: '01 Lần tắm dưỡng bằng sữa tắm thảo mộc dịu nhẹ, sấy êm ái chống ồn và massage cơ thể.',
    value: 220000,
    pointsRequired: 200,
    condition: 'Dành cho thành viên hạng Vàng & Kim Cương có từ 200 điểm',
    stockTotal: 50,
    stockUsed: 18,
    enabled: true,
  },
  {
    id: 'gift-6',
    name: 'Đổi Điểm: Balo Phi Hành Gia Vận Chuyển Mèo',
    type: 'points_redeem',
    typeLabel: 'Đổi điểm thưởng',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    content: 'Balo vận chuyển mèo thông thoáng, kính trong suốt cao cấp tiện lợi khi đi chơi.',
    value: 350000,
    pointsRequired: 350,
    condition: 'Dành cho thành viên có từ 350 điểm',
    stockTotal: 15,
    stockUsed: 8,
    enabled: true,
  },
];

export const initialMinigameSettings = {
  enabled: true,
  freePlaysPerDay: 1,
  maxPointsPerSpin: 50,
  monthlyGiftBudget: 6000000,
  totalPlaysThisMonth: 1284,
  participatingCustomers: 342,
  pointsAwardedThisMonth: 12450,
  prizesWonThisMonth: 186,
};

export const initialMinigamePrizes = [
  {
    id: 'prize-1',
    name: 'Giảm 20% Tiền Phòng',
    shortName: 'Giảm 20%',
    type: 'voucher',
    code: 'LUCKY20',
    winRate: 15, // %
    awardedCount: 28,
    totalLimit: 60,
    color: '#10B981',
    enabled: true,
  },
  {
    id: 'prize-2',
    name: 'Tặng 1 Lon Pate Cao Cấp',
    shortName: 'Pate Cao Cấp',
    type: 'gift',
    code: 'PATEVIP',
    winRate: 20,
    awardedCount: 42,
    totalLimit: 100,
    color: '#F97316',
    enabled: true,
  },
  {
    id: 'prize-3',
    name: 'Thưởng 50 Điểm Thành Viên',
    shortName: '+50 Điểm',
    type: 'points',
    code: 'POINTS50',
    winRate: 15,
    awardedCount: 36,
    totalLimit: 100,
    color: '#8B5CF6',
    enabled: true,
  },
  {
    id: 'prize-4',
    name: 'Voucher Giảm 50.000đ',
    shortName: 'Giảm 50K',
    type: 'voucher',
    code: 'LUCKY50K',
    winRate: 15,
    awardedCount: 32,
    totalLimit: 80,
    color: '#0D9488',
    enabled: true,
  },
  {
    id: 'prize-5',
    name: 'Spa Cắt Móng & Vệ Sinh Tai',
    shortName: 'Spa Móng & Tai',
    type: 'service',
    code: 'FREESPA',
    winRate: 10,
    awardedCount: 18,
    totalLimit: 40,
    color: '#EAB308',
    enabled: true,
  },
  {
    id: 'prize-6',
    name: 'Đồ Chơi Cỏ Mèo Catnip',
    shortName: 'Cỏ Mèo Catnip',
    type: 'gift',
    code: 'CATNIPFUN',
    winRate: 10,
    awardedCount: 30,
    totalLimit: 50,
    color: '#EC4899',
    enabled: true,
  },
  {
    id: 'prize-7',
    name: 'Chúc Bạn May Mắn Lần Sau',
    shortName: 'May Mắn Lần Sau',
    type: 'no_prize',
    code: '',
    winRate: 15,
    awardedCount: 220,
    totalLimit: 9999,
    color: '#94A3B8',
    enabled: true,
  },
];

export const initialLoyaltyTiers = [
  {
    id: 'tier-bronze',
    name: 'Đồng',
    nameEn: 'Bronze',
    color: 'from-amber-600 to-amber-700',
    badgeCls: 'bg-amber-100 text-amber-800 border-amber-300',
    minSpend: 0,
    minBookings: 0,
    multiplier: 1.0,
    customerCount: 142,
    benefits: [
      'Tích lũy 1 điểm cho mỗi 10.000đ chi tiêu',
      'Nhận ưu đãi chào mừng thành viên mới',
      'Được tham gia minigame Boss Vui mỗi ngày',
    ],
  },
  {
    id: 'tier-silver',
    name: 'Bạc',
    nameEn: 'Silver',
    color: 'from-slate-400 to-slate-500',
    badgeCls: 'bg-slate-100 text-slate-800 border-slate-300',
    minSpend: 1500000,
    minBookings: 3,
    multiplier: 1.2,
    customerCount: 68,
    benefits: [
      'Tích lũy x1.2 điểm (thưởng thêm 20% điểm)',
      'Tặng 01 lon pate cao cấp cho mỗi lần lưu trú từ 2 ngày',
      'Ưu tiên giữ phòng trong mùa cao điểm',
    ],
  },
  {
    id: 'tier-gold',
    name: 'Vàng',
    nameEn: 'Gold',
    color: 'from-amber-400 to-yellow-500',
    badgeCls: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    minSpend: 4000000,
    minBookings: 8,
    multiplier: 1.5,
    customerCount: 24,
    benefits: [
      'Tích lũy x1.5 điểm (thưởng thêm 50% điểm)',
      'Giảm trực tiếp 5% tiền phòng quanh năm',
      'Tặng 01 suất Spa vệ sinh tai & cắt móng miễn phí mỗi đợt gửi',
      'Hỗ trợ check-in sớm hoặc check-out trễ 2 giờ miễn phí',
    ],
  },
  {
    id: 'tier-diamond',
    name: 'Kim cương',
    nameEn: 'Diamond',
    color: 'from-cyan-400 to-blue-600',
    badgeCls: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    minSpend: 10000000,
    minBookings: 15,
    multiplier: 2.0,
    customerCount: 8,
    benefits: [
      'Tích lũy x2.0 điểm (gấp đôi điểm tích lũy)',
      'Giảm 10% tiền phòng và 15% dịch vụ spa',
      'Tặng phòng VIP riêng biệt có camera 24/7 toàn thời gian',
      'Đưa đón bé tận nhà miễn phí trong bán kính 5km',
      'Quà tặng sinh nhật đặc biệt dành riêng cho bé mèo',
    ],
  },
];

export const initialLoyaltyRules = {
  spendForOnePoint: 10000, // 10.000đ = 1 điểm
  valuePerPoint: 1000, // 1 điểm = 1.000đ khi đổi
  pointExpiryMonths: 12, // Điểm có hạn 12 tháng
  minPointsToRedeem: 50, // Tối thiểu 50 điểm mới được đổi
  maxRedeemPercentPerOrder: 30, // Tối đa đổi 30% giá trị đơn hàng
  reviewPeriodMonths: 6, // Chu kỳ xét lại hạng
  downgradeMonths: 6, // Hạ hạng nếu không đặt phòng sau 6 tháng
  autoUpgradeOnOrderCompleted: true,
};

export const initialCustomerPoints = [
  {
    id: 'cust-1',
    fullName: 'Lê Thu Trang',
    phone: '0988123456',
    catNames: ['Mochi', 'Bánh Bao'],
    tier: 'gold',
    tierName: 'Vàng',
    currentPoints: 285,
    expiringPoints: 45,
    expiryDate: '15/12/2026',
    pointsToNextTier: 215, // Cần 500 điểm để lên Kim cương
    nextTierName: 'Kim cương',
    totalSpent: 4850000,
    totalBookings: 9,
    lastBookingDate: '18/10/2026',
  },
  {
    id: 'cust-2',
    fullName: 'Trần Văn Minh',
    phone: '0912345678',
    catNames: ['Miso'],
    tier: 'silver',
    tierName: 'Bạc',
    currentPoints: 140,
    expiringPoints: 0,
    expiryDate: '31/03/2027',
    pointsToNextTier: 60,
    nextTierName: 'Vàng',
    totalSpent: 2200000,
    totalBookings: 4,
    lastBookingDate: '20/10/2026',
  },
  {
    id: 'cust-3',
    fullName: 'Nguyễn Thị Lan',
    phone: '0934567890',
    catNames: ['Bé Cam'],
    tier: 'diamond',
    tierName: 'Kim cương',
    currentPoints: 720,
    expiringPoints: 80,
    expiryDate: '28/11/2026',
    pointsToNextTier: 0,
    nextTierName: 'Hạng cao nhất',
    totalSpent: 12600000,
    totalBookings: 18,
    lastBookingDate: '22/10/2026',
  },
  {
    id: 'cust-4',
    fullName: 'Phạm Quốc Bảo',
    phone: '0977654321',
    catNames: ['Luna'],
    tier: 'silver',
    tierName: 'Bạc',
    currentPoints: 95,
    expiringPoints: 20,
    expiryDate: '30/11/2026',
    pointsToNextTier: 105,
    nextTierName: 'Vàng',
    totalSpent: 1750000,
    totalBookings: 3,
    lastBookingDate: '15/10/2026',
  },
  {
    id: 'cust-5',
    fullName: 'Vũ Thanh Tú',
    phone: '0909876543',
    catNames: ['Bé Đen'],
    tier: 'bronze',
    tierName: 'Đồng',
    currentPoints: 35,
    expiringPoints: 0,
    expiryDate: '30/06/2027',
    pointsToNextTier: 65,
    nextTierName: 'Bạc',
    totalSpent: 450000,
    totalBookings: 1,
    lastBookingDate: '12/10/2026',
  },
  {
    id: 'cust-6',
    fullName: 'Hoàng Bích Ngân',
    phone: '0966554433',
    catNames: ['Kitty'],
    tier: 'bronze',
    tierName: 'Đồng',
    currentPoints: 50,
    expiringPoints: 0,
    expiryDate: '15/07/2027',
    pointsToNextTier: 50,
    nextTierName: 'Bạc',
    totalSpent: 620000,
    totalBookings: 1,
    lastBookingDate: '10/10/2026',
  },
];

export const initialPointsAuditLogs = [
  {
    id: 'log-1',
    timestamp: '2026-10-22 14:30',
    customerId: 'cust-3',
    customerName: 'Nguyễn Thị Lan',
    action: 'add',
    amount: 150,
    reason: 'Tích điểm tự động từ đơn đặt phòng #MVN-9842 hoàn tất',
    actor: 'Hệ thống tự động',
  },
  {
    id: 'log-2',
    timestamp: '2026-10-21 10:15',
    customerId: 'cust-1',
    customerName: 'Lê Thu Trang',
    action: 'add',
    amount: 50,
    reason: 'Thưởng sinh nhật bé Mochi theo chính sách thành viên Vàng',
    actor: 'Admin 0962606249',
  },
  {
    id: 'log-3',
    timestamp: '2026-10-20 16:45',
    customerId: 'cust-2',
    customerName: 'Trần Văn Minh',
    action: 'subtract',
    amount: 50,
    reason: 'Đổi quà: Voucher giảm 50.000đ khi đặt phòng',
    actor: 'Khách hàng đổi thưởng',
  },
  {
    id: 'log-4',
    timestamp: '2026-10-18 09:00',
    customerId: 'cust-4',
    customerName: 'Phạm Quốc Bảo',
    action: 'add',
    amount: 25,
    reason: 'Bù điểm chăm sóc do phản hồi thời gian trả phòng chậm 15 phút',
    actor: 'Admin 0962606249',
  },
];

export const initialReferralSettings = {
  enabled: true,
  referrerRewardPoints: 100, // Người giới thiệu nhận 100 điểm
  refereeRewardDiscount: '15%', // Người được giới thiệu giảm 15%
  refereeVoucherCode: 'REFNEW15',
  rewardTrigger: 'first_booking_completed', // Sau khi đơn đầu hoàn tất
  monthlyLimitPerUser: 5, // Tối đa 5 lượt/tháng
  totalReferrals: 128,
  completedBookings: 84,
  pointsRewarded: 8400,
  revenueGenerated: 42600000, // 42.6 triệu
};

export const initialReferralLogs = [
  {
    id: 'ref-1',
    referrerName: 'Lê Thu Trang',
    referrerPhone: '0988123456',
    refereeName: 'Nguyễn Hải Đăng',
    refereePhone: '0944112233',
    catName: 'Bơ Bơ',
    referralCode: 'SENMOCHI',
    bookingLink: 'https://meovangnha.store/booking?ref=SENMOCHI',
    createdAt: '2026-10-18',
    status: 'completed', // completed, pending_completion, registered
    statusLabel: 'Đã hoàn tất đơn',
    statusCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    orderCode: 'MVN-8821',
    orderTotal: 650000,
    rewardGiven: 'Đã cộng 100 điểm cho Trang',
  },
  {
    id: 'ref-2',
    referrerName: 'Trần Văn Minh',
    referrerPhone: '0912345678',
    refereeName: 'Đỗ Thảo Vy',
    refereePhone: '0978334455',
    catName: 'Bông Lan',
    referralCode: 'SENMISO',
    bookingLink: 'https://meovangnha.store/booking?ref=SENMISO',
    createdAt: '2026-10-21',
    status: 'pending_completion',
    statusLabel: 'Đang lưu trú (Chờ hoàn tất)',
    statusCls: 'bg-sky-50 text-sky-700 border-sky-200',
    orderCode: 'MVN-9104',
    orderTotal: 900000,
    rewardGiven: 'Dự kiến +100 điểm khi check-out',
  },
  {
    id: 'ref-3',
    referrerName: 'Nguyễn Thị Lan',
    referrerPhone: '0934567890',
    refereeName: 'Phan Quốc Việt',
    refereePhone: '0919223344',
    catName: 'Cà Rốt',
    referralCode: 'SENCAM',
    bookingLink: 'https://meovangnha.store/booking?ref=SENCAM',
    createdAt: '2026-10-23',
    status: 'registered',
    statusLabel: 'Mới đăng ký tài khoản',
    statusCls: 'bg-amber-50 text-amber-700 border-amber-200',
    orderCode: 'Chưa đặt phòng',
    orderTotal: 0,
    rewardGiven: 'Chờ đặt phòng đầu tiên',
  },
  {
    id: 'ref-4',
    referrerName: 'Lê Thu Trang',
    referrerPhone: '0988123456',
    refereeName: 'Vũ Mai Phương',
    refereePhone: '0903889900',
    catName: 'Bún Riêu',
    referralCode: 'SENMOCHI',
    bookingLink: 'https://meovangnha.store/booking?ref=SENMOCHI',
    createdAt: '2026-10-12',
    status: 'completed',
    statusLabel: 'Đã hoàn tất đơn',
    statusCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    orderCode: 'MVN-7612',
    orderTotal: 850000,
    rewardGiven: 'Đã cộng 100 điểm cho Trang',
  },
];

export const initialAnalyticsData = {
  summary: {
    views: 4860,
    redemptions: 342,
    incrementalRevenue: 158400000, // 158.4 triệu
    promotionsCost: 28600000, // 28.6 triệu
    netProfit: 129800000,
    roiPercent: 354, // (158.4m - 28.6m) / 28.6m * 100
  },
  weeklyUsage: [
    { week: 'Tuần 39 (22-28/09)', count: 42, revenue: 19500000 },
    { week: 'Tuần 40 (29/09-05/10)', count: 58, revenue: 27800000 },
    { week: 'Tuần 41 (06-12/10)', count: 76, revenue: 35200000 },
    { week: 'Tuần 42 (13-19/10)', count: 88, revenue: 41600000 },
    { week: 'Tuần 43 (20-26/10)', count: 78, revenue: 34300000 },
  ],
  customerDistribution: {
    newCustomersPercent: 44, // 44% khách mới
    returningCustomersPercent: 56, // 56% khách cũ
  },
  campaignPerformance: [
    {
      id: 'perf-1',
      campaignName: 'Tuần Lễ Vàng: Đón Boss Lần Đầu',
      type: 'Khách mới',
      redemptions: 62,
      incrementalRevenue: 34500000,
      promotionCost: 6200000,
      netProfit: 28300000,
      roi: 356,
      rating: 'Xuất sắc',
      ratingCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'perf-2',
      campaignName: 'Mùa Hè Mát Lạnh - Nghỉ Dưỡng Thảnh Thơi',
      type: 'Chiến dịch lớn',
      redemptions: 118,
      incrementalRevenue: 68400000,
      promotionCost: 14750000,
      netProfit: 53650000,
      roi: 264,
      rating: 'Hiệu quả cao',
      ratingCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'perf-3',
      campaignName: 'Combo Gửi 3 Ngày Tặng Spa',
      type: 'Combo dịch vụ',
      redemptions: 30,
      incrementalRevenue: 24000000,
      promotionCost: 4500000,
      netProfit: 19500000,
      roi: 333,
      rating: 'Xuất sắc',
      ratingCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'perf-4',
      campaignName: 'Đặc Quyền Khách Hàng VIP Cuối Tuần',
      type: 'Chăm sóc VIP',
      redemptions: 21,
      incrementalRevenue: 18900000,
      promotionCost: 3150000,
      netProfit: 15750000,
      roi: 400,
      rating: 'Xuất sắc',
      ratingCls: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'perf-5',
      campaignName: 'Chăm Sóc Quay Lại: Nhớ Boss',
      type: 'Giữ chân khách',
      redemptions: 24,
      incrementalRevenue: 12600000,
      promotionCost: 1920000,
      netProfit: 10680000,
      roi: 456,
      rating: 'Xuất sắc',
      ratingCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ],
};

// Helper đọc/ghi LocalStorage an toàn
export const loadFromStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Lỗi load key ${key}:`, err);
    return fallback;
  }
};

export const saveToStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Lỗi save key ${key}:`, err);
  }
};

// Hàm kiểm tra mã giảm giá khi khách đặt phòng
/**
 * Kiểm tra mã giảm giá khi khách đặt phòng
 * @param {Object} params
 * @param {string} params.voucherCode - Mã cần kiểm tra
 * @param {Object} [params.customer] - Khách hàng (có thể chứa segment, sĐT, bookingHistory)
 * @param {number} params.orderTotal - Tổng tiền phòng
 * @param {number} params.bookingDays - Số ngày gửi mèo
 * @param {number} [params.usedCountByCustomer] - Số lần khách này đã dùng mã
 * @returns {{ valid: boolean, message: string, discountAmount?: number, voucher?: Object }}
 */
export const validateVoucherForBooking = ({
  voucherCode,
  customer = {},
  orderTotal = 0,
  bookingDays = 1,
  usedCountByCustomer = 0,
  vouchersList = null,
}) => {
  if (!voucherCode || typeof voucherCode !== 'string') {
    return { valid: false, message: 'Vui lòng nhập mã giảm giá' };
  }

  const cleanCode = voucherCode.trim().toUpperCase();
  const allVouchers = vouchersList || loadFromStorage(STORAGE_KEYS.VOUCHERS, initialVouchers);
  const voucher = allVouchers.find((v) => v.code.toUpperCase() === cleanCode);

  if (!voucher) {
    return { valid: false, message: `Mã giảm giá "${cleanCode}" không tồn tại trên hệ thống` };
  }

  // 1. Kiểm tra trạng thái còn hiệu lực
  if (voucher.status === 'exhausted' || voucher.usageCount >= voucher.maxUsage) {
    return { valid: false, message: 'Mã giảm giá này đã hết lượt sử dụng', voucher };
  }

  if (voucher.status === 'expired') {
    return { valid: false, message: 'Mã giảm giá này đã hết hạn sử dụng', voucher };
  }

  // Kiểm tra ngày hết hạn
  if (voucher.validUntil) {
    const parts = voucher.validUntil.split('/');
    if (parts.length === 3) {
      const expiry = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 23, 59, 59);
      if (Date.now() > expiry.getTime()) {
        return { valid: false, message: `Mã giảm giá đã hết hạn vào ngày ${voucher.validUntil}`, voucher };
      }
    }
  }

  // 2. Kiểm tra giới hạn lượt dùng mỗi khách
  const limitPerCustomer = voucher.limitPerCustomer || 1;
  if (usedCountByCustomer >= limitPerCustomer) {
    return {
      valid: false,
      message: `Bạn đã sử dụng hết giới hạn (${limitPerCustomer} lần) cho mã này`,
      voucher,
    };
  }

  // 3. Kiểm tra đối tượng khách hàng áp dụng
  const targetGroup = voucher.targetGroup || 'all';
  const customerSegment = customer.segment || customer.group || 'all';

  if (targetGroup !== 'all') {
    // Nếu voucher yêu cầu khách mới
    if (targetGroup === 'new' && (customer.bookingCount > 0 || customerSegment === 'returning' || customerSegment === 'vip')) {
      return {
        valid: false,
        message: 'Mã ưu đãi này chỉ áp dụng cho khách hàng mới (đơn đầu tiên)',
        voucher,
      };
    }
    // Nếu voucher yêu cầu VIP
    if (targetGroup === 'vip' && customerSegment !== 'vip' && (customer.tier !== 'gold' && customer.tier !== 'diamond')) {
      return {
        valid: false,
        message: 'Mã này là đặc quyền dành riêng cho khách hàng VIP / Hạng Vàng & Kim cương',
        voucher,
      };
    }
    // Nếu voucher yêu cầu khách có nguy cơ rời bỏ / quay lại
    if (targetGroup === 'at_risk' && customerSegment !== 'at_risk') {
      return {
        valid: false,
        message: 'Mã ưu đãi này dành riêng cho nhóm khách hàng nhận được lời mời chăm sóc lại',
        voucher,
      };
    }
  }

  // 4. Kiểm tra điều kiện số ngày lưu trú tối thiểu
  if (voucher.minBookingDays && bookingDays < voucher.minBookingDays) {
    return {
      valid: false,
      message: `Đơn đặt phòng cần tối thiểu ${voucher.minBookingDays} ngày lưu trú để áp dụng mã này (hiện tại: ${bookingDays} ngày)`,
      voucher,
    };
  }

  // 5. Kiểm tra đơn hàng đạt giá trị tối thiểu
  if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
    return {
      valid: false,
      message: `Đơn hàng tối thiểu ${formatCurrency(voucher.minOrderValue)} mới đủ điều kiện (hiện tại: ${formatCurrency(orderTotal)})`,
      voucher,
    };
  }

  // Tính số tiền giảm thực tế
  let discountAmount = 0;
  if (voucher.discountType === 'percentage') {
    discountAmount = Math.round((orderTotal * voucher.discountValue) / 100);
    if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
      discountAmount = voucher.maxDiscount;
    }
  } else {
    discountAmount = voucher.discountValue || 0;
  }

  if (discountAmount > orderTotal) {
    discountAmount = orderTotal;
  }

  return {
    valid: true,
    message: `Áp dụng thành công! Giảm ${formatCurrency(discountAmount)}`,
    discountAmount,
    voucher,
  };
};

// Hàm xuất CSV / Excel UTF-8 có BOM chống lỗi font tiếng Việt
export const exportDataToExcelCSV = (headers, rows, filename = 'bao-cao-khuyen-mai.csv') => {
  const processCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(processCell).join(',');
  const bodyRows = rows.map((r) => r.map(processCell).join(',')).join('\r\n');
  const csvContent = '\uFEFF' + headerRow + '\r\n' + bodyRows;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export { STORAGE_KEYS };
