// Dữ liệu chi tiết cho 4 gói dịch vụ lưu trú mèo
export const ROOM_TYPES = {
  DELUXE: {
    id: 'deluxe',
    name: 'Phòng Deluxe',
    shortName: 'Deluxe',
    badge: 'Đẳng cấp 5 sao',
    capacity: 'Tối đa 6 mèo/phòng',
    description: 'Biệt thự gỗ rộng rãi nhiều tầng, có nhà trốn, trụ cào móng cao cấp, khay cát riêng biệt và góc chơi leo trèo thoải mái.',
    images: [
      {
        url: '/images/rooms/deluxe-1.png',
        title: 'Deluxe - Biến thể 1',
        desc: 'Thiết kế góc leo trèo & ban công trên cao với đèn sưởi ấm'
      },
      {
        url: '/images/rooms/deluxe-2.png',
        title: 'Deluxe - Biến thể 2',
        desc: 'Tích hợp nhà gỗ mini tầng dưới & khay cát rộng thoải mái'
      }
    ]
  },
  VIP: {
    id: 'vip',
    name: 'Phòng VIP',
    shortName: 'VIP',
    badge: 'Ấm cúng & Tiện nghi',
    capacity: 'Tối đa 2 mèo/phòng',
    description: 'Không gian ấm áp vân gỗ tự nhiên, trang bị võng nằm thư giãn êm ái, khay ăn đôi và khay cát âm sàn tiện nghi.',
    images: [
      {
        url: '/images/rooms/vip.png',
        title: 'Phòng VIP Tiêu Chuẩn',
        desc: 'Võng nằm êm ái, hệ thống chiếu sáng dịu nhẹ và khay vệ sinh riêng'
      }
    ]
  },
  VVIP: {
    id: 'vvip',
    name: 'Phòng VVIP',
    shortName: 'VVIP',
    badge: 'Toàn cảnh sang trọng',
    capacity: 'Tối đa 4 mèo/phòng',
    description: 'Thiết kế 2 tầng biệt lập với cửa kính toàn cảnh, cầu thang dốc, nhà mèo trốn trên cao, bóng cào móng và góc vệ sinh kín đáo bên dưới.',
    images: [
      {
        url: '/images/rooms/vvip.png',
        title: 'Phòng VVIP Toàn Cảnh',
        desc: 'Tủ kính cao cấp 2 tầng thông thoáng, góc chơi bóng cuộn và camera góc rộng'
      }
    ]
  }
};

export const BOARDING_PACKAGES = [
  {
    id: 'p1',
    code: 'QUY_TOC',
    name: 'Gói Mèo Quý Tộc',
    tagline: 'Trải nghiệm hoàng gia 5 sao toàn diện nhất cho thú cưng',
    basePrice: 200000,
    priceString: '200.000đ',
    period: '/ngày',
    highlightBadge: 'Gói Cao Cấp Nhất 👑',
    defaultRoomId: 'DELUXE',
    hasVariants: true,
    availableUpgrades: [
      {
        roomId: 'DELUXE',
        label: 'Phòng Deluxe (Mặc định gói)',
        surcharge: 0,
        surchargeString: 'Bao gồm sẵn',
        image: '/images/rooms/deluxe-1.png'
      }
    ],
    features: {
      food: {
        title: 'Thực đơn Sen chọn',
        detail: '3 bữa chính + 1 bữa phụ. Sen tự do chọn theo sở thích của bé: thịt gà tươi, pate tươi tiệm làm, pate lon nhập khẩu, hạt Royal Canin, đồ sấy thăng hoa freeze-dried, súp thưởng.',
        hasCustomMenu: true,
        extraInfoType: 'food-full'
      },
      litter: {
        title: 'Cát đậu nành hữu cơ',
        type: 'Cát đậu nành (Tofu)',
        detail: 'Cát đậu nành tự nhiên siêu vón hút, khử mùi tuyệt đối, an toàn dịu nhẹ cho đệm chân bé.',
        image: '/images/rooms/cat-dau-nanh.png',
        extraInfoType: 'litter-tofu'
      },
      cleaning: {
        title: 'Vệ sinh 2 lần/ngày',
        detail: 'Vệ sinh khử khuẩn bát ăn sau mỗi bữa, dọn khay cát sạch sẽ 2 lần/ngày đảm bảo không gian thơm tho.'
      },
      camera: {
        title: 'Camera riêng 24/24 xoay hướng',
        detail: 'Trang bị camera riêng trong phòng 24/24, điều khiển xoay đa hướng và đàm thoại 2 chiều với bé bất cứ lúc nào.',
        included: true
      },
      bonus: {
        title: 'Tặng tắm spa miễn phí từ 5 ngày',
        detail: 'Gửi từ 5 ngày trở lên tặng ngay 01 suất tắm sấy, dưỡng lông & cắt móng miễn phí hoàn toàn.'
      },
      transport: {
        title: 'Miễn phí đón trả trong 8km',
        detail: 'Xe chuyên dụng máy lạnh đón trả bé tận nhà miễn phí trong bán kính 8km.'
      }
    }
  },
  {
    id: 'p2',
    code: 'SANG_CHANH',
    name: 'Gói Mèo Sang Chảnh',
    tagline: 'Lựa chọn phổ biến được ưa chuộng nhất của các Sen',
    basePrice: 150000,
    priceString: '150.000đ',
    period: '/ngày',
    highlightBadge: 'Được Yêu Thích Nhất ⭐',
    defaultRoomId: 'VIP',
    availableUpgrades: [
      {
        roomId: 'VIP',
        label: 'Phòng VIP (Mặc định)',
        surcharge: 0,
        surchargeString: 'Bao gồm sẵn',
        image: '/images/rooms/vip.png'
      },
      {
        roomId: 'VVIP',
        label: 'Nâng cấp phòng VVIP',
        surcharge: 10000,
        surchargeString: '+10.000đ/ngày',
        image: '/images/rooms/vvip.png'
      },
      {
        roomId: 'DELUXE',
        label: 'Nâng cấp phòng Deluxe',
        surcharge: 20000,
        surchargeString: '+20.000đ/ngày',
        image: '/images/rooms/deluxe-1.png'
      }
    ],
    features: {
      food: {
        title: 'Ăn 3 bữa/ngày (Full pate hoặc mix hạt)',
        detail: 'Phục vụ 3 bữa/ngày, sen có thể chọn full pate thơm ngon bổ dưỡng hoặc mix 1 bữa hạt chất lượng cao.',
        extraInfoType: 'food-standard'
      },
      litter: {
        title: 'Cát khoáng Bentonite tự nhiên',
        type: 'Cát Bentonite',
        detail: 'Cát khoáng bentonite vón cục nhanh, kiểm soát mùi tốt, giữ khay vệ sinh luôn khô ráo.',
        image: '/images/rooms/cat-bentonite.png',
        extraInfoType: 'litter-bentonite'
      },
      cleaning: {
        title: 'Vệ sinh sau ăn + dọn cát 1 lần/ngày',
        detail: 'Lau dọn vệ sinh khay ăn ngay sau khi bé ăn xong + dọn cát và bổ sung cát sạch 1 lần mỗi ngày.'
      },
      camera: {
        title: 'Camera trong phòng riêng 24/24',
        detail: 'Theo dõi bé 24/24 qua ứng dụng với camera độ nét cao gắn riêng trong phòng.',
        included: true
      },
      bonus: {
        title: 'Tặng tắm spa miễn phí từ 7 ngày',
        detail: 'Gửi từ 7 ngày trở lên tặng 01 gói tắm làm sạch, vệ sinh tai và cắt móng miễn phí.'
      },
      transport: {
        title: 'Miễn phí đón trả trong 6km',
        detail: 'Hỗ trợ đưa đón bé tận nơi bằng xe chuyên dụng miễn phí trong bán kính 6km.'
      }
    }
  },
  {
    id: 'p3',
    code: 'THUONG_DE',
    name: 'Gói Mèo Thượng Đế',
    tagline: 'Chế độ chăm sóc chu đáo, tiết kiệm và linh hoạt tiện ích',
    basePrice: 120000,
    priceString: '120.000đ',
    period: '/ngày',
    highlightBadge: 'Giá Tốt Tiết Kiệm ✨',
    defaultRoomId: 'VIP',
    availableUpgrades: [
      {
        roomId: 'VIP',
        label: 'Phòng VIP (Mặc định)',
        surcharge: 0,
        surchargeString: 'Bao gồm sẵn',
        image: '/images/rooms/vip.png'
      },
      {
        roomId: 'VVIP',
        label: 'Nâng cấp phòng VVIP',
        surcharge: 10000,
        surchargeString: '+10.000đ/ngày',
        image: '/images/rooms/vvip.png'
      },
      {
        roomId: 'DELUXE',
        label: 'Nâng cấp phòng Deluxe',
        surcharge: 20000,
        surchargeString: '+20.000đ/ngày',
        image: '/images/rooms/deluxe-1.png'
      }
    ],
    features: {
      food: {
        title: 'Ăn 3 bữa/ngày (1 pate + 2 hạt)',
        detail: 'Thực đơn cân bằng dinh dưỡng: 1 bữa pate mềm kích thích vị giác + 2 bữa hạt dinh dưỡng trong ngày.',
        extraInfoType: 'food-standard'
      },
      litter: {
        title: 'Cát khoáng Bentonite tự nhiên',
        type: 'Cát Bentonite',
        detail: 'Cát khoáng bentonite vón tốt, sạch sẽ khô thoáng.',
        image: '/images/rooms/cat-bentonite.png',
        extraInfoType: 'litter-bentonite'
      },
      cleaning: {
        title: 'Vệ sinh sau ăn + dọn cát 1 lần/ngày',
        detail: 'Dọn dẹp bát ăn sau bữa và sàng lọc cát vệ sinh 1 lần/ngày.'
      },
      camera: {
        title: 'Cập nhật ảnh & tin nhắn hàng ngày',
        detail: 'Không có camera mặc định (nhân viên gửi video/ảnh bé hàng ngày). Có thể nâng cấp thêm camera riêng 24/24 chỉ +10k/ngày.',
        included: false,
        canAddCamera: true,
        cameraSurcharge: 10000
      },
      bonus: {
        title: 'Tặng tắm spa miễn phí từ 8 ngày',
        detail: 'Gửi từ 8 ngày trở lên được tặng miễn phí gói tắm sấy vệ sinh toàn diện.'
      },
      transport: {
        title: 'Miễn phí đón trả trong 5km',
        detail: 'Đón trả tận nhà miễn phí trong bán kính 5km cho bé mèo.'
      }
    }
  },
  {
    id: 'p4',
    code: 'TU_TUC',
    name: 'Gói Mèo Tự Túc',
    tagline: 'Phù hợp với các bé có chế độ ăn riêng hoặc cần ăn kiêng',
    basePrice: 90000,
    priceString: '90.000đ',
    period: '/ngày',
    highlightBadge: 'Tiết Kiệm Tối Đa 💰',
    defaultRoomId: 'VIP',
    availableUpgrades: [
      {
        roomId: 'VIP',
        label: 'Phòng VIP (Mặc định)',
        surcharge: 0,
        surchargeString: 'Bao gồm sẵn',
        image: '/images/rooms/vip.png'
      },
      {
        roomId: 'VVIP',
        label: 'Nâng cấp phòng VVIP',
        surcharge: 10000,
        surchargeString: '+10.000đ/ngày',
        image: '/images/rooms/vvip.png'
      },
      {
        roomId: 'DELUXE',
        label: 'Nâng cấp phòng Deluxe',
        surcharge: 20000,
        surchargeString: '+20.000đ/ngày',
        image: '/images/rooms/deluxe-1.png'
      }
    ],
    features: {
      food: {
        title: 'Sen tự chuẩn bị đồ ăn (tối đa 3 bữa/ngày)',
        detail: 'Sen gửi sẵn thức ăn của bé (hạt, pate hoặc đồ tươi nấu sẵn theo khẩu phần), tiệm hỗ trợ bảo quản tủ mát/cấp đông và cho ăn đúng giờ tối đa 3 bữa/ngày.',
        isSelfPrepared: true
      },
      litter: {
        title: 'Cát khoáng Bentonite tự nhiên',
        type: 'Cát Bentonite',
        detail: 'Đã bao gồm cát khoáng Bentonite của tiệm, giữ chỗ vệ sinh sạch sẽ cho bé.',
        image: '/images/rooms/cat-bentonite.png',
        extraInfoType: 'litter-bentonite'
      },
      cleaning: {
        title: 'Vệ sinh sau ăn + dọn cát 1 lần/ngày',
        detail: 'Dọn sạch bát ăn sau mỗi lần ăn và dọn khay cát 1 lần mỗi ngày.'
      },
      camera: {
        title: 'Cập nhật tình hình hàng ngày',
        detail: 'Không có camera mặc định (nhân viên gửi ảnh/tin nhắn hàng ngày). Tùy chọn thêm camera 24/24 chỉ +10k/ngày.',
        included: false,
        canAddCamera: true,
        cameraSurcharge: 10000
      },
      bonus: {
        title: 'Chăm sóc chu đáo theo giờ',
        detail: 'Đội ngũ trực chăm sóc tận tình, vuốt ve làm quen để bé nhanh chóng thích nghi môi trường mới.'
      },
      transport: {
        title: 'Miễn phí đón trả trong 4km',
        detail: 'Hỗ trợ đưa đón tận nhà miễn phí trong bán kính 4km.'
      }
    }
  }
];

// Dữ liệu chi tiết cho Component "Thông tin thêm" (Cát & Thực đơn)
export const EXTRA_SERVICE_INFO = {
  litters: [
    {
      id: 'tofu',
      name: 'Cát Đậu Nành Tự Nhiên (Tofu Cat Litter)',
      image: '/images/rooms/cat-dau-nanh.png',
      badge: 'Đặc quyền Gói Quý Tộc',
      isPlaceholder: false,
      desc: 'Sản xuất 100% từ bã đậu nành hữu cơ tự nhiên, hoàn toàn không bụi, xả được bồn cầu.',
      highlights: [
        'Không bụi 99.9%, chống dị ứng đường hô hấp cho mèo',
        'Vón cục nhanh tức thì, khử mùi tự nhiên dịu nhẹ',
        'Hạt êm ái, bảo vệ tuyệt đối đệm chân nhạy cảm của bé mèo',
        'An toàn tuyệt đối nếu bé vô tình nuốt phải vài hạt'
      ]
    },
    {
      id: 'bentonite',
      name: 'Cát Khoáng Bentonite Tự Nhiên',
      image: '/images/rooms/cat-bentonite.png',
      badge: 'Gói Sang Chảnh, Thượng Đế, Tự Túc',
      isPlaceholder: false,
      desc: 'Khoáng sét Bentonite tự nhiên cao cấp, thấm hút cực nhanh và kết khối siêu chắc chắn.',
      highlights: [
        'Hạt khoáng tự nhiên tạo cảm giác gần gũi như đất mẹ',
        'Khả năng hút ẩm và khóa mùi chất thải nhanh chóng',
        'Được sàng lọc bụi kỹ càng trước khi cho vào khay của bé',
        'Được dọn và khử trùng khay định kỳ mỗi ngày'
      ]
    }
  ],
  foods: [
    {
      id: 'chicken',
      name: 'Thịt Gà Tươi Hấp Xé',
      type: 'Đồ tươi nấu chín',
      desc: 'Ức gà tươi loại 1 hấp chín mềm, xé nhỏ vừa miệng, giàu đạm dễ tiêu hóa.',
      badge: 'Menu Quý Tộc'
    },
    {
      id: 'fresh-pate',
      name: 'Pate Tươi Tiệm Nấu Thủ Công',
      type: 'Pate cao cấp',
      desc: 'Nấu mới mỗi ngày từ gan gà tươi, ức gà và bí đỏ, không chất bảo quản, thơm lừng kích thích thèm ăn.',
      badge: 'Sen Chọn'
    },
    {
      id: 'canned-pate',
      name: 'Pate Hộp Nhập Khẩu Chính Hãng',
      type: 'Thương hiệu uy tín',
      desc: 'Các dòng pate lon nổi tiếng (Nutrience, Monge, Royal Canin, King\'s Pet...) giàu taurine và vitamin.',
      badge: 'Nhập Khẩu'
    },
    {
      id: 'royal-canin',
      name: 'Hạt Dinh Dưỡng Royal Canin',
      type: 'Hạt chuyên dụng',
      desc: 'Dòng hạt phù hợp theo từng độ tuổi (Kitten, Adult, Fit32, Hairball, Indoor) hỗ trợ đường tiêu hóa và mượt lông.',
      badge: 'Chuẩn Thú Y'
    },
    {
      id: 'freeze-dried',
      name: 'Đồ Ăn Sấy Lạnh (Freeze-Dried)',
      type: 'Thức ăn cao cấp',
      desc: 'Thịt ức gà, lòng đỏ trứng, chim cút sấy thăng hoa giữ nguyên 98% hàm lượng dinh dưỡng và vị ngon nguyên bản.',
      badge: 'Bổ Sung Dinh Dưỡng'
    },
    {
      id: 'soup',
      name: 'Súp Thưởng Dinh Dưỡng',
      type: 'Bữa phụ thơm ngon',
      desc: 'Các gói súp thưởng Ciao Churu thơm ngậy giúp bù nước, giải tỏa căng thẳng cho bé khi ở môi trường mới.',
      badge: 'Khoái Khẩu Của Mèo'
    }
  ]
};
