// Mock data cho Hoạt động khuyến mãi & Minigame

export const promotionCategories = [
  { id: 'all', name: 'Tất cả ưu đãi' },
  { id: 'campaigns', name: 'Chiến dịch hot' },
  { id: 'vouchers', name: 'Mã giảm giá' },
  { id: 'gifts', name: 'Quà tặng & Combo' },
  { id: 'minigame', name: 'Minigame Boss Vui' }
];

export const featuredCampaign = {
  id: 'camp-summer-2026',
  badge: 'Chiến Dịch Lớn Nhất Mùa',
  title: 'MÙA HÈ MÁT LẠNH - BOSS NGHỈ DƯỠNG SEN THẢNH THƠI',
  subtitle: 'Ưu đãi trọn gói lưu trú máy lạnh 24/7, tặng kèm gói Spa thảo mộc & nhật ký camera riêng biệt.',
  discountTag: 'Giảm đến 30%',
  code: 'SUMMERBOSS',
  expiryDate: '30/10/2026',
  daysLeft: 12,
  bgGradient: 'from-emerald-600 via-teal-600 to-amber-500',
  image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1000&q=80',
  highlights: [
    'Giảm trực tiếp 25% cho đặt phòng từ 3 ngày trở lên',
    'Tặng 01 buổi Spa tắm mát, sấy êm ái bằng thảo mộc trị giá 200.000đ',
    'Cung cấp pate hữu cơ cao cấp & cỏ mèo tươi mỗi ngày'
  ],
  terms: 'Áp dụng cho tất cả các loại phòng từ Tiêu Chuẩn trở lên. Không áp dụng đồng thời với voucher giảm giá khác.'
};

export const promotionsList = [
  {
    id: 'promo-1',
    category: 'campaigns',
    title: 'Tuần Lễ Vàng: Đón Boss Lần Đầu',
    description: 'Dành riêng cho khách hàng mới lần đầu gửi bé tại Mèo Vắng Nhà. Giảm ngay 20% tổng hóa đơn đặt phòng.',
    discount: 'GIẢM 20%',
    code: 'NEWFRIEND20',
    minBookingDays: 2,
    badge: 'Khách mới',
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    validUntil: '31/12/2026',
    image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80',
    terms: [
      'Chỉ áp dụng cho đơn đặt phòng đầu tiên của số điện thoại đăng ký.',
      'Áp dụng cho các gói phòng: Tiết Kiệm, Tiêu Chuẩn, Cao Cấp và VIP.',
      'Thời gian lưu trú tối thiểu 02 ngày.',
      'Không cộng gộp với các chương trình khuyến mãi khác.'
    ]
  },
  {
    id: 'promo-2',
    category: 'vouchers',
    title: 'Voucher Giảm 50K Tiền Phòng',
    description: 'Giảm trực tiếp 50.000đ vào hóa đơn cho mọi đơn đặt phòng từ 2 ngày trở lên.',
    discount: '-50.000đ',
    code: 'MEOMEO50',
    minBookingDays: 2,
    badge: 'Phổ biến',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    validUntil: '15/11/2026',
    image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80',
    terms: [
      'Áp dụng cho mọi khách hàng thân thiết và khách hàng mới.',
      'Áp dụng trên tổng giá trị hóa đơn từ 400.000đ.',
      'Mỗi tài khoản được sử dụng tối đa 02 lần/tháng.'
    ]
  },
  {
    id: 'promo-3',
    category: 'gifts',
    title: 'Combo Gửi 3 Ngày - Tặng Gói Spa Cắt Tỉa',
    description: 'Đặt phòng Cao Cấp hoặc VIP từ 3 ngày trở lên, tặng miễn phí 01 suất Spa làm sạch tai, cắt móng và chải lông.',
    discount: 'QUÀ TẶNG 150K',
    code: 'SPAGIFT',
    minBookingDays: 3,
    badge: 'Quà tặng HOT',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    validUntil: '20/11/2026',
    image: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=600&q=80',
    terms: [
      'Áp dụng cho Gói Cao Cấp và Gói VIP với số ngày lưu trú từ 3 ngày.',
      'Bé sẽ được vệ sinh mắt, tai, cắt tỉa móng và chải lông bằng lược hơi nước an toàn.',
      'Chương trình có số lượng quà tặng giới hạn 50 suất mỗi tháng.'
    ]
  },
  {
    id: 'promo-4',
    category: 'campaigns',
    title: 'Gia Đình Đa Mèo: Đi Chung Giảm Sâu',
    description: 'Gửi từ bé mèo thứ 2 ở cùng phòng VIP, giảm ngay 40% phụ phí bé thứ 2 và tặng kèm khay cỏ mèo tươi.',
    discount: 'GIẢM 40% BÉ THỨ 2',
    code: 'TWINCATS',
    minBookingDays: 1,
    badge: 'Gia đình mèo',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    validUntil: '31/12/2026',
    image: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80',
    terms: [
      'Chỉ áp dụng khi 2 bé ở cùng một phòng kích thước lớn (Gói Cao Cấp hoặc VIP).',
      'Cả hai bé đều đã được tiêm ngừa đầy đủ và hòa đồng với nhau.',
      'Không áp dụng cho mèo đang trong thời kỳ động dục chưa triệt sản.'
    ]
  },
  {
    id: 'promo-5',
    category: 'vouchers',
    title: 'Đặc Quyền Thành Viên: Giảm 15% Cuối Tuần',
    description: 'Ưu đãi dành riêng cho đặt phòng rơi vào thứ 6, thứ 7 và Chủ Nhật. Đặt sớm để giữ phòng vị trí đẹp.',
    discount: 'GIẢM 15%',
    code: 'WEEKENDCAT',
    minBookingDays: 2,
    badge: 'Cuối tuần',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    validUntil: '30/11/2026',
    image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80',
    terms: [
      'Áp dụng cho ngày nhận phòng rơi vào thứ 6 hoặc thứ 7.',
      'Cần đặt trước ít nhất 24 giờ trước thời điểm check-in.',
      'Được hủy phòng miễn phí trước 12 giờ.'
    ]
  },
  {
    id: 'promo-6',
    category: 'gifts',
    title: 'Tiệc Pate Hảo Hạng & Cỏ Mèo Miễn Phí',
    description: 'Check-in trong tuần này, mỗi bé được tặng ngay 02 lon Pate Monge / Ciao Churu cao cấp bồi bổ dinh dưỡng.',
    discount: 'PATE CAO CẤP 0Đ',
    code: 'FREECIAO',
    minBookingDays: 2,
    badge: 'Quà tặng',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    validUntil: '10/11/2026',
    image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
    terms: [
      'Áp dụng cho tất cả các gói dịch vụ lưu trú.',
      'Sen có thể chọn khẩu vị yêu thích của bé: Gà, Cá ngừ, Cá hồi hoặc Tôm.',
      'Pate được phục vụ theo lịch ăn hằng ngày của bé tại khách sạn.'
    ]
  }
];

// Cấu hình các giải thưởng trên Vòng quay may mắn (Minigame)
export const luckyWheelPrizes = [
  {
    id: 'prize-1',
    text: 'Giảm 20% Tiền Phòng',
    shortName: 'Giảm 20%',
    code: 'LUCKY20',
    type: 'discount',
    color: '#10B981', // emerald
    textColor: '#ffffff',
    description: 'Voucher giảm 20% tổng giá trị phòng lưu trú (tối đa 150.000đ).'
  },
  {
    id: 'prize-2',
    text: 'Tặng 1 Lon Pate Cao Cấp',
    shortName: 'Pate Cao Cấp',
    code: 'PATEVIP',
    type: 'gift',
    color: '#FF9B71', // accent orange
    textColor: '#ffffff',
    description: '01 lon Pate nhập khẩu hương vị tự chọn khi bé check-in.'
  },
  {
    id: 'prize-3',
    text: 'Voucher Giảm 50.000đ',
    shortName: 'Giảm 50K',
    code: 'LUCKY50K',
    type: 'voucher',
    color: '#0D9488', // teal
    textColor: '#ffffff',
    description: 'Giảm ngay 50.000đ cho đơn đặt phòng từ 300.000đ.'
  },
  {
    id: 'prize-4',
    text: 'Gói Cắt Móng & Vệ Sinh Tai',
    shortName: 'Spa Móng & Tai',
    code: 'FREESPA',
    type: 'service',
    color: '#F59E0B', // amber
    textColor: '#ffffff',
    description: 'Dịch vụ chăm sóc móng và vệ sinh tai sạch khuẩn trị giá 80.000đ.'
  },
  {
    id: 'prize-5',
    text: 'Voucher Giảm 10% Phòng',
    shortName: 'Giảm 10%',
    code: 'LUCKY10',
    type: 'discount',
    color: '#6366F1', // indigo
    textColor: '#ffffff',
    description: 'Giảm 10% không giới hạn giá trị đơn đặt phòng.'
  },
  {
    id: 'prize-6',
    text: 'Đồ Chơi Cỏ Mèo Catnip',
    shortName: 'Cỏ Mèo Catnip',
    code: 'CATNIPFUN',
    type: 'gift',
    color: '#EC4899', // pink
    textColor: '#ffffff',
    description: 'Tặng 01 món đồ chơi nhồi catnip organic giúp Boss xả stress.'
  }
];
