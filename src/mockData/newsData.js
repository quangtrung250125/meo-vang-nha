// Mock data cho Tin tức & Cẩm nang chăm sóc mèo

export const newsCategories = [
  { id: 'all', name: 'Tất cả bài viết' },
  { id: 'nutrition', name: 'Dinh dưỡng & Biếng ăn' },
  { id: 'hygiene', name: 'Vệ sinh & Cát mèo' },
  { id: 'health', name: 'Sức khỏe & Tiêm phòng' },
  { id: 'boarding', name: 'Kinh nghiệm lưu trú' }
];

export const articlesList = [
  {
    id: 'art-1',
    category: 'nutrition',
    categoryName: 'Dinh dưỡng & Biếng ăn',
    title: 'Mèo biếng ăn thì phải làm sao? 7 nguyên nhân và giải pháp từ Bác sĩ Thú y',
    slug: 'meo-bieng-an-phai-lam-sao',
    excerpt: 'Boss bỗng nhiên ngửi rồi bỏ đi, không chịu ăn hạt hay pate? Đừng vội nản lòng, hãy cùng tìm hiểu nguyên nhân chính xác và mẹo kích thích sự thèm ăn cực kỳ an toàn.',
    author: 'BS. Nguyễn Minh Tuấn (Chuyên gia thú y Mèo Vắng Nhà)',
    date: '15/09/2026',
    readTime: '6 phút đọc',
    featured: true,
    coverImage: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1000&q=80',
    tags: ['Biếng ăn', 'Dinh dưỡng', 'Chăm sóc mèo', 'Pate cho mèo'],
    sections: [
      {
        heading: '1. Vì sao mèo cưng bỗng nhiên biếng ăn?',
        content: `Mèo là loài động vật rất nhạy cảm với mùi vị, kết cấu thức ăn và môi trường xung quanh. Việc mèo đột ngột bỏ ăn có thể xuất phát từ nhiều nguyên nhân:
- **Đổi loại hạt hoặc thức ăn đột ngột:** Hệ tiêu hóa và vị giác của mèo cần ít nhất 7-10 ngày để thích ứng với công thức mới.
- **Hội chứng mỏi râu (Whisker Fatigue):** Bát ăn quá sâu và hẹp khiến râu mèo liên tục cọ sát vào thành bát, gây khó chịu mỗi lần cúi đầu ăn.
- **Thời tiết nóng bức:** Vào mùa hè, nhu cầu năng lượng giảm khiến mèo ăn ít hơn bình thường.
- **Căng thẳng, thay đổi môi trường:** Có khách lạ, mùi mèo khác, tiếng sấm sét hoặc chuyển chỗ ở.
- **Vấn đề răng miệng hoặc bệnh lý:** Viêm nướu, rụng răng, sốt, nghẹt mũi (mèo không ngửi thấy mùi thơm thức ăn sẽ không chịu ăn).`
      },
      {
        heading: '2. Các giải pháp kích thích vị giác cho mèo hiệu quả',
        content: `Dưới đây là 6 mẹo nhỏ nhưng có võ được các chuyên gia thú y khuyến nghị:
- **Hâm ấm nhẹ pate hoặc thức ăn ướt:** Quay microwave 5-10 giây để giải phóng mùi thơm béo ngậy quyến rũ.
- **Đổi sang bát ăn dẹt, miệng rộng bằng sứ/inox:** Giúp râu mèo thoải mái, tránh kích ứng cằm và hạn chế mụn đầu đen.
- **Bổ sung men tiêu hóa hoặc bột súp thưởng:** Rắc nhẹ một ít men vi sinh hoặc bột thịt gà sấy khô (freeze-dried) lên trên lớp hạt.
- **Chia nhỏ bữa ăn:** Cho ăn 4-5 bữa nhỏ mỗi ngày thay vì để sẵn một bát đầy dễ bị ỉu và bay mất mùi vị thơm ngon.
- **Tách biệt bát ăn và khay cát:** Mèo có thói quen không bao giờ ăn gần nơi đi vệ sinh hoặc khu vực có mùi hóa chất tẩy rửa.`
      },
      {
        heading: '3. Khi nào cần đưa mèo đến phòng khám thú y ngay?',
        content: `Nếu mèo nhịn ăn hoàn toàn quá 24 - 36 giờ, bạn cần lập tức đưa bé đến bệnh viện thú y. Mèo nhịn đói lâu rất dễ bị hội chứng Gan nhiễm mỡ (Hepatic Lipidosis) - một tình trạng suy gan cấp tính cực kỳ nguy hiểm có thể đe dọa tính mạng.`
      }
    ],
    doctorNote: 'Lời khuyên từ bác sĩ: Không bao giờ ép mèo ăn bằng cách nhét mạnh vào miệng khi chưa có chỉ định, điều này dễ làm mèo sợ hãi và nôn ói. Hãy luôn theo dõi cân nặng và lượng nước uống hằng ngày của bé!'
  },
  {
    id: 'art-2',
    category: 'hygiene',
    categoryName: 'Vệ sinh & Cát mèo',
    title: 'Cẩm nang chọn cát vệ sinh cho mèo: So sánh cát đất sét, đậu nành (tofu), cát gỗ và cát thủy tinh',
    slug: 'chon-cat-ve-sinh-cho-meo',
    excerpt: 'Nên chọn loại cát nào vừa khử mùi tốt, vón cục nhanh, không bụi lại an toàn cho hô hấp của mèo? Bảng so sánh chi tiết ưu nhược điểm của 4 loại cát phổ biến nhất hiện nay.',
    author: 'Thùy Linh (Chuyên viên chăm sóc thú cưng)',
    date: '10/09/2026',
    readTime: '5 phút đọc',
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80',
    tags: ['Cát vệ sinh', 'Khay cát', 'Vệ sinh thú cưng', 'Cát đậu nành'],
    sections: [
      {
        heading: '1. So sánh 4 loại cát vệ sinh phổ biến nhất',
        content: `Mỗi dòng cát có những đặc tính riêng biệt phù hợp với từng nhu cầu và điều kiện gia đình:
- **Cát đất sét bentonite:** Khả năng vón cục cực nhanh và độ bám mùi tốt, giá thành tiết kiệm. Nhược điểm là khá nặng, có bụi và không thể xả trực tiếp vào bồn cầu.
- **Cát đậu nành (Tofu):** Làm từ bã đậu nành hữu cơ tự nhiên, hạt dài, gần như 100% không bụi. Rất an toàn cho mèo con (dù lỡ nuốt phải), có thể xả trực tiếp vào bồn cầu tiện lợi.
- **Cát gỗ thông sinh học:** Khả năng hút ẩm tốt, khử mùi gỗ tự nhiên dễ chịu, thân thiện với môi trường. Khi gặp chất lỏng sẽ rã thành bột mùn cưa, cần dùng chậu cát 2 tầng.
- **Cát thủy tinh (Silica Gel):** Hút ẩm siêu nhanh, giữ khay cát luôn khô ráo. Nhược điểm là hạt cứng có thể gây đau đệm chân mèo và một số bé không chịu đi.`
      },
      {
        heading: '2. Cách nhận biết bé mèo có thích loại cát hiện tại không?',
        content: `Nếu mèo thường xuyên đi vệ sinh ra ngoài rìa chậu, cào bới thành chậu thật lâu nhưng không chịu bước chân vào trong cát, hoặc nhịn tiểu kéo dài, đó là tín hiệu cho thấy bé không ưng loại cát hoặc kích thước hạt cát hiện tại. Hãy chuyển đổi từ từ bằng cách trộn 25% - 50% - 75% cát mới vào cát cũ.`
      },
      {
        heading: '3. Quy tắc "Số mèo + 1" cho khay cát',
        content: `Nếu nhà bạn nuôi 1 bé mèo, nên có ít nhất 2 khay cát đặt ở 2 góc nhà khác nhau. Khay cát nên được dọn phân và nước tiểu ít nhất 2 lần/ngày và thay rửa toàn bộ khay định kỳ 2-3 tuần/lần.`
      }
    ],
    doctorNote: 'Đối với mèo con dưới 3 tháng tuổi hoặc mèo vừa phẫu thuật/triệt sản, tuyệt đối không dùng cát đất sét nhiều bụi dễ dính vào vết mổ. Cát đậu nành hữu cơ là lựa chọn an toàn nhất!'
  },
  {
    id: 'art-3',
    category: 'health',
    categoryName: 'Sức khỏe & Tiêm phòng',
    title: 'Lịch tiêm phòng vắc-xin cho mèo chuẩn thú y: Phác đồ 3 mũi cơ bản, dại và tiêm nhắc lại',
    slug: 'lich-tiem-phong-cho-meo',
    excerpt: 'Nắm vững lịch tiêm phòng vắc-xin 4 bệnh nguy hiểm và phòng dại để tạo lá chắn miễn dịch trọn đời cho mèo yêu. Cùng những lưu ý quan trọng trước và sau khi tiêm.',
    author: 'BS. Lê Hải Đăng (Trưởng khoa Y tế Mèo Vắng Nhà)',
    date: '05/09/2026',
    readTime: '7 phút đọc',
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80',
    tags: ['Tiêm phòng', 'Vắc-xin mèo', 'Sức khỏe mèo', 'Phòng dại'],
    sections: [
      {
        heading: '1. Vắc-xin 4 bệnh cho mèo bảo vệ những bệnh gì?',
        content: `Vắc-xin phòng 4 bệnh (thường dùng Nobivac Feline hoặc Purevax) bảo vệ mèo khỏi các căn bệnh truyền nhiễm nguy hiểm có tỷ lệ tử vong cao:
- **Bệnh Giảm bạch cầu (Feline Panleukopenia - FPV):** Căn bệnh tử thần với tỷ lệ tử vong lên tới 90% ở mèo con.
- **Bệnh Viêm mũi - khí quản truyền nhiễm (Feline Viral Rhinotracheitis - FHV-1):** Gây sốt, chảy dịch mũi mắt, loét giác mạc.
- **Bệnh Calicivirus (FCV):** Gây loét miệng, đau lưỡi, chảy nước dãi và viêm phổi.
- **Bệnh Chlamydia:** Gây viêm kết mạc mắt mãn tính, sưng húp mi mắt và khó thở.`
      },
      {
        heading: '2. Phác đồ tiêm chủng chuẩn quốc tế theo từng mốc tháng tuổi',
        content: `Lịch tiêm phòng lý tưởng được khuyến cáo như sau:
- **Mũi 1 (6-8 tuần tuổi):** Tiêm mũi vắc-xin 4 bệnh đầu tiên khi lượng kháng thể từ sữa mẹ bắt đầu giảm.
- **Mũi 2 (10-12 tuần tuổi):** Tiêm mũi nhắc lại vắc-xin 4 bệnh (cách mũi 1 từ 3-4 tuần).
- **Mũi 3 (14-16 tuần tuổi):** Tiêm mũi 4 bệnh thứ 3 để hoàn thiện hệ miễn dịch vững chắc.
- **Vắc-xin phòng Dại (Rabies):** Tiêm khi mèo đủ từ 12-16 tuần tuổi.
- **Tiêm nhắc lại định kỳ:** Mỗi năm tiêm nhắc 01 mũi 4 bệnh và 01 mũi dại để duy trì lượng kháng thể bảo vệ.`
      },
      {
        heading: '3. Lưu ý quan trọng trước và sau khi tiêm',
        content: `- Chỉ tiêm khi bé hoàn toàn khỏe mạnh, không sốt, không tiêu chảy hay sổ mũi.
- Tẩy giun trước khi tiêm phòng khoảng 5-7 ngày để cơ thể hấp thu vắc-xin tốt nhất.
- Sau khi tiêm: Giữ ấm cho bé, không tắm trong vòng 7 ngày, theo dõi phản ứng dị ứng trong 30-60 phút đầu tại phòng khám.`
      }
    ],
    doctorNote: 'Lưu ý từ bác sĩ: Mèo nuôi hoàn toàn trong nhà vẫn cần tiêm vắc-xin đầy đủ vì virus gây bệnh có thể bám trên đế giày dép, quần áo của người nuôi mang từ bên ngoài vào nhà.'
  },
  {
    id: 'art-4',
    category: 'boarding',
    categoryName: 'Kinh nghiệm lưu trú',
    title: '5 mẹo giúp mèo không bị stress và hòa nhập tốt khi gửi tại khách sạn thú cưng',
    slug: 'giup-meo-khong-stress-khi-gui-khach-san',
    excerpt: 'Mèo vốn là loài động vật có tính sở hữu lãnh thổ cao. Làm thế nào để bé cảm thấy an toàn, thoải mái và bớt lo âu khi bạn vắng nhà?',
    author: 'Hoàng Yến (Quản lý vận hành Mèo Vắng Nhà)',
    date: '01/09/2026',
    readTime: '4 phút đọc',
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&w=800&q=80',
    tags: ['Lưu trú mèo', 'Stress ở mèo', 'Khách sạn thú cưng', 'Kinh nghiệm'],
    sections: [
      {
        heading: '1. Mang theo vật dụng có mùi hương quen thuộc',
        content: `Mùi hương là chiếc phao cứu sinh mang lại cảm giác an tâm nhất cho mèo. Khi gửi bé tại khách sạn Mèo Vắng Nhà, bạn nên gửi kèm:
- Một chiếc áo cũ chưa giặt của bạn (mang mùi hương của Sen).
- Chiếc chăn hoặc tấm đệm ngủ quen thuộc của bé.
- Món đồ chơi gặm cắn mà bé yêu thích nhất.`
      },
      {
        heading: '2. Giữ nguyên loại thức ăn hằng ngày',
        content: `Sự thay đổi không gian đã tạo ra một lượng căng thẳng nhất định, do đó tuyệt đối không nên đổi khẩu phần ăn trong những ngày đầu lưu trú. Hãy mang theo loại hạt hoặc pate bé đang ăn thường ngày để tránh rối loạn tiêu hóa.`
      },
      {
        heading: '3. Theo dõi bé qua Camera 24/7 và giao tiếp cùng bảo mẫu',
        content: `Tại Mèo Vắng Nhà, các phòng đều có camera trực tiếp 24/7 để bạn mở app ngắm nhìn bé mọi lúc. Đội ngũ nhân viên luôn dành thời gian vuốt ve, chơi đùa bằng cần câu lông vũ để bé nhanh chóng làm quen và xem phòng lưu trú như ngôi nhà thứ hai.`
      }
    ],
    doctorNote: 'Nên cho mèo làm quen với lồng vận chuyển (balo/carrier) từ 3-5 ngày trước chuyến đi bằng cách để mở cửa lồng trong phòng khách và đặt hạt thưởng vào bên trong.'
  },
  {
    id: 'art-5',
    category: 'health',
    categoryName: 'Sức khỏe & Tiêm phòng',
    title: 'Dấu hiệu nhận biết sớm mèo bị thiếu nước & nguy cơ sỏi thận: Cách kích thích Boss uống nước',
    slug: 'meo-thieu-nuoc-va-soi-than',
    excerpt: 'Tổ tiên của loài mèo là động vật sa mạc nên cơ chế nhận biết cơn khát khá kém. Làm sao để nhận biết bé đang thiếu nước và phòng tránh sỏi bàng quang, suy thận sớm?',
    author: 'BS. Lê Hải Đăng (Trưởng khoa Y tế Mèo Vắng Nhà)',
    date: '28/08/2026',
    readTime: '5 phút đọc',
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=800&q=80',
    tags: ['Thiếu nước', 'Sỏi thận', 'Sức khỏe', 'Đài phun nước'],
    sections: [
      {
        heading: '1. Bài kiểm tra độ đàn hồi da (Skin Turgor Test) nhanh tại nhà',
        content: `Nhẹ nhàng túm nhẹ phần da gáy của mèo kéo lên rồi thả tay ra:
- **Nếu da phẳng lại ngay lập tức (dưới 1 giây):** Cơ thể bé được cung cấp đủ nước.
- **Nếu da đàn hồi chậm, giữ nếp trong 2-3 giây:** Bé đang trong tình trạng mất nước mức độ nhẹ đến vừa.
- **Ngoài ra:** Nướu răng khô dính, phân khô cứng thành viên nhỏ và mắt trũng sâu cũng là dấu hiệu thiếu nước rõ rệt.`
      },
      {
        heading: '2. 4 mẹo giúp Boss chăm chỉ uống nước gấp 3 lần',
        content: `- **Dùng đài phun nước tự động có màng lọc:** Mèo có bản năng thích dòng nước chảy vì chúng xem đó là nguồn nước sạch, trong lành.
- **Thêm nước luộc ức gà/cá không gia vị:** Nước dùng thơm lừng giúp kích thích vị giác và bổ sung nước tự nhiên.
- **Tăng tỷ lệ thức ăn ướt (Pate):** Pate chứa đến 75-80% độ ẩm, giúp cơ thể lọc bàng quang tự nhiên mỗi ngày.
- **Đặt nhiều bát nước ở các phòng khác nhau:** Không đặt bát nước ngay cạnh bát hạt hay gần khay cát.`
      }
    ],
    doctorNote: 'Lời khuyên từ bác sĩ: Mèo ăn 100% hạt khô có nguy cơ mắc bệnh tiết niệu (FLUTD) và sỏi thận cao gấp 4 lần so với mèo có chế độ ăn kết hợp pate và nước uống đầy đủ.'
  },
  {
    id: 'art-6',
    category: 'hygiene',
    categoryName: 'Vệ sinh & Cát mèo',
    title: 'Bí quyết chăm sóc móng, tai và bộ lông bóng mượt cho mèo không làm Boss quạu',
    slug: 'cham-soc-mong-tai-long-meo',
    excerpt: 'Hướng dẫn các bước vệ sinh tai sạch khuẩn, cắt tỉa móng an toàn không phạm tủy đỏ và chải lông giảm rụng lông búi ruột đúng cách.',
    author: 'Thùy Linh (Chuyên viên chăm sóc thú cưng)',
    date: '20/08/2026',
    readTime: '4 phút đọc',
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    tags: ['Spa thú cưng', 'Cắt móng mèo', 'Vệ sinh tai', 'Chải lông'],
    sections: [
      {
        heading: '1. Kỹ thuật cắt móng an toàn tuyệt đối',
        content: `Dùng ngón tay cái và ngón trỏ ấn nhẹ vào đệm thịt ngón chân mèo để móng chìa ra. Chỉ bấm phần đầu móng cong trong suốt, cách đường tủy hồng (phần chứa mạch máu và dây thần kinh) ít nhất 2mm. Nếu chẳng may cắt phạm, dùng bột cầm máu hoặc bột bắp ấn vào đầu móng.`
      },
      {
        heading: '2. Vệ sinh tai sạch sẽ phòng ngừa rận tai',
        content: `Nhỏ 2-3 giọt dung dịch rửa tai chuyên dụng cho mèo vào vành tai, massage nhẹ nhàng gốc tai khoảng 20 giây để chất bẩn tan ra. Để mèo lắc đầu tự nhiên rồi dùng bông gòn mềm lau sạch phần dịch bên ngoài vành tai (không thụt tăm bông sâu vào trong ống tai).`
      }
    ],
    doctorNote: 'Nên tập các thao tác sờ nắn bàn chân, vành tai và chải lông cho mèo ngay từ khi còn nhỏ kèm bánh thưởng để tạo phản xạ vui vẻ.'
  }
];

// Dữ liệu phục vụ công cụ tra cứu lịch tiêm phòng tương tác
export const vaccinationScheduleData = {
  'under-2-months': {
    stage: 'Dưới 2 tháng tuổi (Mèo con bú mẹ)',
    vaccines: [
      {
        name: 'Chưa chỉ định tiêm vắc-xin',
        status: 'Chờ đủ tuổi',
        note: 'Giai đoạn này mèo con vẫn còn nhận kháng thể mẹ truyền qua sữa mẹ. Tiêm quá sớm vắc-xin sẽ bị kháng thể mẹ vô hiệu hóa.'
      },
      {
        name: 'Tẩy giun lần đầu (3-4 tuần tuổi)',
        status: 'Khuyến nghị',
        note: 'Tẩy giun định kỳ bằng thuốc dành riêng cho mèo con (như Fenbendazole hoặc Pyrantel).'
      }
    ],
    vetAdvice: 'Giữ ấm cơ thể, vệ sinh mắt mũi hàng ngày và cho bú mẹ hoàn toàn hoặc bổ sung sữa bột chuyên dụng cho mèo con (KMR).'
  },
  '2-months': {
    stage: '2 tháng tuổi (~8 tuần tuổi)',
    vaccines: [
      {
        name: 'Mũi 1: Vắc-xin 4 bệnh (Nobivac / Purevax)',
        status: 'Bắt buộc',
        note: 'Phòng ngừa 4 bệnh nguy hiểm: Giảm bạch cầu (FPV), Viêm mũi khí quản (FHV), Calicivirus (FCV) và Chlamydia.'
      },
      {
        name: 'Tẩy giun lần 2',
        status: 'Bắt buộc',
        note: 'Thực hiện trước mũi tiêm 5-7 ngày.'
      }
    ],
    vetAdvice: 'Trước khi tiêm bé cần khỏe mạnh, ăn ngủ tốt. Sau khi tiêm giữ ấm và kiêng tắm nước trong ít nhất 7 ngày.'
  },
  '3-months': {
    stage: '3 tháng tuổi (~12 tuần tuổi)',
    vaccines: [
      {
        name: 'Mũi 2: Nhắc lại vắc-xin 4 bệnh',
        status: 'Bắt buộc',
        note: 'Cách mũi 1 từ 3 đến 4 tuần. Mũi này giúp cơ thể sinh kháng thể đạt mức bảo hộ an toàn.'
      },
      {
        name: 'Vắc-xin phòng Bệnh Dại (Rabies)',
        status: 'Bắt buộc',
        note: 'Có thể tiêm cùng lúc hoặc cách mũi 4 bệnh 1 tuần tùy chỉ định của bác sĩ thú y.'
      }
    ],
    vetAdvice: 'Theo dõi bé 30 phút tại phòng khám sau tiêm để xử lý kịp thời nếu có phản ứng dị ứng thuốc (sưng mắt, khó thở).'
  },
  '4-months': {
    stage: '4 tháng tuổi (~16 tuần tuổi)',
    vaccines: [
      {
        name: 'Mũi 3: Hoàn thành phác đồ vắc-xin 4 bệnh',
        status: 'Rất khuyến nghị',
        note: 'Theo khuyến cáo mới nhất của Hiệp hội Thú y Thế giới (WSAVA), mũi thứ 3 ở tuần 16 giúp đảm bảo 100% không bị cản trở bởi kháng thể mẹ.'
      },
      {
        name: 'Nhỏ gáy phòng ve rận & giun tim',
        status: 'Định kỳ',
        note: 'Sử dụng Revolution Plus hoặc Broadline để phòng ngừa ve, rận, ghẻ tai và ấu trùng giun tim.'
      }
    ],
    vetAdvice: 'Bé đã hoàn thành đầy đủ hệ miễn dịch nền tảng và có thể thoải mái hòa nhập, vui chơi hoặc lưu trú tại khách sạn thú cưng an toàn.'
  },
  'adult': {
    stage: 'Trên 1 năm tuổi (Mèo trưởng thành)',
    vaccines: [
      {
        name: 'Mũi nhắc lại hàng năm: Vắc-xin 4 bệnh (1 mũi)',
        status: 'Bắt buộc hàng năm',
        note: 'Lượng kháng thể sẽ giảm dần sau 12 tháng, cần tiêm nhắc lại 1 mũi mỗi năm để bảo vệ liên tục.'
      },
      {
        name: 'Mũi nhắc lại hàng năm: Vắc-xin Dại (1 mũi)',
        status: 'Bắt buộc hàng năm',
        note: 'Quy định thú y bắt buộc để bảo vệ thú cưng và sức khỏe gia đình.'
      },
      {
        name: 'Tẩy giun định kỳ 3 tháng/lần & Nhỏ gáy hàng tháng',
        status: 'Định kỳ',
        note: 'Duy trì lịch uống thuốc giun và nhỏ gáy phòng ve rận thường xuyên.'
      }
    ],
    vetAdvice: 'Nên kết hợp kiểm tra sức khỏe tổng quát, siêu âm ổ bụng và xét nghiệm máu định kỳ 6-12 tháng/lần cho mèo trưởng thành.'
  }
};
