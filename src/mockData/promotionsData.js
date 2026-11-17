// Mock data cho Hoạt động khuyến mãi & Minigame

export const promotionCategories = [
  { id: 'all', name: 'Tất cả ưu đãi' },
  { id: 'campaigns', name: 'Chiến dịch hot' },
  { id: 'vouchers', name: 'Mã giảm giá' },
  { id: 'gifts', name: 'Quà tặng & Combo' },
  { id: 'minigame', name: 'Minigame Boss Vui' }
];

// Customer promotions are loaded from the shared admin configuration.

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
    id: 'no-prize-1',
    text: 'Chúc bạn may mắn lần sau',
    shortName: 'Lần sau nhé!',
    code: '',
    type: 'noPrize',
    color: '#94A3B8', // slate gray
    textColor: '#ffffff',
    description: 'Rất tiếc, bạn chưa trúng giải lần này. Hãy thử lại nhé!'
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
    id: 'no-prize-2',
    text: 'Chúc bạn may mắn lần sau',
    shortName: 'Lần sau nhé!',
    code: '',
    type: 'noPrize',
    color: '#64748B', // darker slate
    textColor: '#ffffff',
    description: 'Rất tiếc, bạn chưa trúng giải lần này. Hãy thử lại nhé!'
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
    id: 'no-prize-3',
    text: 'Chúc bạn may mắn lần sau',
    shortName: 'Lần sau nhé!',
    code: '',
    type: 'noPrize',
    color: '#78716C', // stone
    textColor: '#ffffff',
    description: 'Rất tiếc, bạn chưa trúng giải lần này. Hãy thử lại nhé!'
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
  },
  {
    id: 'prize-7',
    text: 'Chúc bạn may mắn',
    shortName: 'Chúc bạn\nmay mắn',
    code: 'TRYAGAIN',
    type: 'luck',
    color: '#94A3B8',
    textColor: '#ffffff',
    description: 'Bạn chưa trúng quà lần này. Hãy thử lại vào hôm sau để tiếp tục săn ưu đãi nhé!'
  }
];
