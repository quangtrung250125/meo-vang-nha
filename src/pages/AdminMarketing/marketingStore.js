// ============================================================
// marketingStore.js — Store & dữ liệu mẫu cho "Marketing tự động"
// CẢNH BÁO: DỮ LIỆU MẪU — chưa kết nối API thật. Mọi hành động gửi đang ở chế độ MÔ PHỎNG.
// ============================================================

// ---------- TAB IDs ----------
export const MARKETING_TABS = [
  { id: 'scenarios',  label: 'Kịch bản' },
  { id: 'templates',  label: 'Mẫu tin nhắn' },
  { id: 'schedule',   label: 'Lịch gửi & đối tượng' },
  { id: 'results',    label: 'Kết quả' },
  { id: 'inbox',      label: 'Hộp thư tập trung' },
  { id: 'frequency',  label: 'Giới hạn tần suất' },
];

export const CUSTOMER_SEGMENTS = [
  { id: 'all',         label: 'Tất cả' },
  { id: 'potential',   label: 'Tiềm năng' },
  { id: 'new',         label: 'Khách mới' },
  { id: 'returning',   label: 'Khách quay lại' },
  { id: 'loyal',       label: 'Thân thiết' },
  { id: 'vip',         label: 'VIP' },
  { id: 'at_risk',     label: 'Nguy cơ rời bỏ' },
  { id: 'confirmed',   label: 'Đơn đã xác nhận' },
  { id: 'checked_out', label: 'Vừa check-out' },
  { id: 'upgrading',   label: 'Sắp lên hạng' },
];

export const SEGMENT_COLORS = {
  potential:   'bg-sky-50 text-sky-700 border-sky-200',
  new:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  returning:   'bg-teal-50 text-teal-700 border-teal-200',
  loyal:       'bg-purple-50 text-purple-700 border-purple-200',
  vip:         'bg-amber-50 text-amber-700 border-amber-200',
  at_risk:     'bg-rose-50 text-rose-700 border-rose-200',
  confirmed:   'bg-blue-50 text-blue-700 border-blue-200',
  checked_out: 'bg-orange-50 text-orange-700 border-orange-200',
  upgrading:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  all:         'bg-gray-100 text-gray-600 border-gray-200',
};

export const CHANNELS = [
  { id: 'zalo',    label: 'Zalo',      color: 'bg-sky-100 text-sky-700' },
  { id: 'email',   label: 'Email',     color: 'bg-purple-100 text-purple-700' },
  { id: 'sms',     label: 'SMS',       color: 'bg-emerald-100 text-emerald-700' },
  { id: 'webpush', label: 'Web Push',  color: 'bg-orange-100 text-orange-700' },
  { id: 'call',    label: 'Cuộc gọi',  color: 'bg-rose-100 text-rose-700' },
];

export const MKT_STORAGE_KEYS = {
  SCENARIOS:  'mvn_mkt_scenarios_v1',
  TEMPLATES:  'mvn_mkt_templates_v1',
  FREQUENCY:  'mvn_mkt_frequency_v1',
};

export const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const formatCurrency = (n) => {
  if (n === undefined || n === null || isNaN(Number(n))) return '0đ';
  return Number(n).toLocaleString('vi-VN') + 'đ';
};

export const formatPercent = (n) => {
  if (n === undefined || n === null) return '0%';
  return Number(n).toFixed(1) + '%';
};

// CẢNH BÁO: Dữ liệu mẫu — chưa nối API
export const initialScenarios = [
  { id: 'sc-1', name: 'Đăng ký nhưng chưa đặt phòng sau 3 ngày', trigger: 'Đăng ký ≥ 3 ngày, chưa đặt', delay: '3 ngày sau đăng ký', channels: ['zalo','email'], segment: 'potential', templateId: 'tpl-new-offer', weekSent: 24, enabled: true, action: 'Gửi ưu đãi khách mới' },
  { id: 'sc-2', name: 'Bỏ dở đặt phòng', trigger: 'Bỏ giỏ đặt phòng > 2 giờ', delay: '2 giờ sau bỏ dở', channels: ['webpush','zalo'], segment: 'potential', templateId: 'tpl-cart-abandon', weekSent: 11, enabled: true, action: 'Nhắc hoàn tất, kèm lịch phòng trống' },
  { id: 'sc-3', name: 'Nhắc lịch trước ngày gửi mèo', trigger: 'X ngày trước ngày check-in (mặc định 2)', delay: '2 ngày trước check-in', channels: ['zalo','sms'], segment: 'confirmed', templateId: 'tpl-checkin-remind', weekSent: 38, enabled: true, action: 'Nhắc lịch check-in' },
  { id: 'sc-4', name: 'Cảm ơn sau check-out', trigger: '1 ngày sau check-out', delay: '1 ngày sau check-out', channels: ['zalo'], segment: 'checked_out', templateId: 'tpl-thankyou', weekSent: 33, enabled: true, action: 'Cảm ơn & xin đánh giá' },
  { id: 'sc-5', name: 'Nhắc nhẹ dịp lễ / mùa cao điểm', trigger: 'Quá X ngày chưa quay lại hoặc dịp lễ', delay: 'Theo lịch lễ', channels: ['zalo','email'], segment: 'returning', templateId: 'tpl-holiday', weekSent: 19, enabled: true, action: 'Gợi ý lịch lễ / mùa cao điểm' },
  { id: 'sc-6', name: 'Chúc mừng lên hạng thành viên', trigger: 'Khách đủ điều kiện lên hạng', delay: 'Ngay khi đủ điều kiện', channels: ['zalo','email'], segment: 'upgrading', templateId: 'tpl-tier-up', weekSent: 7, enabled: true, action: 'Chúc mừng & giới thiệu quyền lợi' },
  { id: 'sc-7', name: 'Ưu đãi quay lại & gọi thăm hỏi (Nguy cơ rời bỏ)', trigger: 'Khách rơi vào nguy cơ rời bỏ', delay: 'Ngay khi phát hiện', channels: ['zalo','call'], segment: 'at_risk', templateId: 'tpl-winback', weekSent: 4, enabled: false, action: 'Ưu đãi quay lại + tạo việc gọi thăm hỏi' },
];

export const initialTemplates = [
  { id: 'tpl-new-offer',       name: 'Ưu đãi khách mới',              channel: 'zalo',    body: 'Chào {ten_chu}! Bé {ten_meo} của bạn đang chờ một mái nhà ấm áp. Đặt ngay hôm nay để nhận ưu đãi {ma_uu_dai} – giảm 20% cho lần đầu gửi bé. Phòng trống còn nhiều!', variables: ['{ten_chu}','{ten_meo}','{ma_uu_dai}'], status: 'active' },
  { id: 'tpl-cart-abandon',    name: 'Nhắc hoàn tất đặt phòng',       channel: 'webpush', body: 'Ơ, bạn bỏ quên bé {ten_meo} rồi! Còn phòng trống ngày {ngay_nhan}. Hoàn tất đặt phòng ngay trước khi hết chỗ nhé!', variables: ['{ten_meo}','{ngay_nhan}'], status: 'active' },
  { id: 'tpl-checkin-remind',  name: 'Nhắc lịch trước ngày gửi mèo',  channel: 'zalo',    body: 'Nhắc nhẹ: Chỉ còn 2 ngày nữa là {ngay_nhan} – ngày gửi bé {ten_meo} đến Mèo Vắng Nhà. Nhớ mang theo đồ ăn quen, đồ chơi và sổ sức khỏe của bé nhé!', variables: ['{ten_chu}','{ten_meo}','{ngay_nhan}'], status: 'active' },
  { id: 'tpl-thankyou',        name: 'Cảm ơn & xin đánh giá',         channel: 'zalo',    body: 'Cảm ơn {ten_chu} đã tin tưởng Mèo Vắng Nhà chăm sóc bé {ten_meo}! Bé đã về nhà bình an. Bạn có thể đánh giá dịch vụ tại đây để giúp chúng mình cải thiện hơn nhé. Hẹn gặp lại!', variables: ['{ten_chu}','{ten_meo}'], status: 'active' },
  { id: 'tpl-holiday',         name: 'Gợi ý lịch lễ / mùa cao điểm',  channel: 'email',   body: 'Chào {ten_chu}! Dịp Tết đang đến gần – đặt phòng sớm cho bé {ten_meo} để có phòng đẹp nhất. Dùng mã {ma_uu_dai} để nhận ưu đãi đặc biệt. Số lượng phòng có hạn!', variables: ['{ten_chu}','{ten_meo}','{ma_uu_dai}'], status: 'active' },
  { id: 'tpl-tier-up',         name: 'Chúc mừng lên hạng',            channel: 'zalo',    body: 'Chúc mừng {ten_chu}! Bạn vừa đạt hạng {hang} tại Mèo Vắng Nhà. Từ hôm nay bạn được hưởng các quyền lợi đặc biệt dành riêng cho hạng {hang}. Cảm ơn vì đã đồng hành cùng chúng mình!', variables: ['{ten_chu}','{hang}'], status: 'active' },
  { id: 'tpl-winback',         name: 'Ưu đãi quay lại (Nguy cơ rời bỏ)', channel: 'zalo', body: 'Chào {ten_chu}! Chúng mình nhớ bé {ten_meo} lắm. Dùng mã {ma_uu_dai} để đặt phòng với ưu đãi 15% hồi quy. Chúng mình hứa sẽ chăm bé thật chu đáo!', variables: ['{ten_chu}','{ten_meo}','{ma_uu_dai}'], status: 'active' },
];

export const initialScheduleItems = [
  { id: 'sch-1', scenarioName: 'Nhắc lịch trước ngày gửi mèo',       sendAt: '2026-10-27 08:00', recipients: 12 },
  { id: 'sch-2', scenarioName: 'Cảm ơn sau check-out',               sendAt: '2026-10-27 10:00', recipients: 5  },
  { id: 'sch-3', scenarioName: 'Đăng ký nhưng chưa đặt (3 ngày)',    sendAt: '2026-10-27 14:00', recipients: 8  },
  { id: 'sch-4', scenarioName: 'Nhắc lễ Tết Dương lịch',             sendAt: '2026-10-28 09:00', recipients: 47 },
];

export const initialRecipients = [
  { id: 'r-1', name: 'Nguyễn Lan Anh',  catName: 'Bơ',      segment: 'potential',   trigger: 'Đăng ký 3 ngày, chưa đặt', status: 'pending' },
  { id: 'r-2', name: 'Trần Minh Khôi',  catName: 'Mochi',   segment: 'confirmed',   trigger: '2 ngày trước check-in',    status: 'pending' },
  { id: 'r-3', name: 'Lê Thùy Linh',    catName: 'Cà Phê',  segment: 'checked_out', trigger: '1 ngày sau check-out',     status: 'sent'    },
  { id: 'r-4', name: 'Phạm Tuấn Kiệt',  catName: 'Kem',     segment: 'at_risk',     trigger: 'Nguy cơ rời bỏ',           status: 'pending' },
  { id: 'r-5', name: 'Hoàng Thu Hằng',  catName: 'Nấm',     segment: 'upgrading',   trigger: 'Đủ điều kiện lên hạng',    status: 'sent'    },
  { id: 'r-6', name: 'Bùi Thanh Tú',    catName: 'Pudding', segment: 'potential',   trigger: 'Bỏ dở đặt phòng',          status: 'pending' },
];

export const initialResults = {
  summary: { sent: 3840, opened: 1728, clicked: 576, converted: 144, revenue: 43200000, openRate: 45.0, clickRate: 15.0, convertRate: 3.75 },
  byScenario: [
    { id: 'sc-1', name: 'Ưu đãi khách mới',       sent: 480, opened: 240, clicked: 96, converted: 28, revenue: 8400000  },
    { id: 'sc-2', name: 'Bỏ dở đặt phòng',         sent: 210, opened: 140, clicked: 84, converted: 42, revenue: 12600000 },
    { id: 'sc-3', name: 'Nhắc lịch check-in',      sent: 760, opened: 532, clicked: 76, converted:  0, revenue: 0        },
    { id: 'sc-4', name: 'Cảm ơn sau check-out',    sent: 660, opened: 396, clicked: 66, converted:  0, revenue: 0        },
    { id: 'sc-5', name: 'Gợi ý lịch lễ',           sent: 940, opened: 282, clicked: 94, converted: 47, revenue: 14100000 },
    { id: 'sc-6', name: 'Chúc mừng lên hạng',      sent: 140, opened:  84, clicked: 28, converted: 14, revenue: 4200000  },
    { id: 'sc-7', name: 'Ưu đãi quay lại',         sent:  90, opened:  54, clicked: 18, converted:  9, revenue: 2700000  },
  ],
};

export const initialConversations = [
  { id: 'conv-1', platform: 'zalo', customer: 'Nguyễn Lan Anh', catName: 'Bơ', avatar: null, lastMessage: 'Cho mình hỏi phòng còn trống ngày 30 không?', lastAt: '10:32', unread: 2, messages: [{ id: 'm1', from: 'customer', text: 'Chào shop! Mình muốn đặt phòng cho bé Bơ.', at: '10:25' }, { id: 'm2', from: 'bot', text: 'Chào bạn Lan Anh! Bé Bơ nghe cute quá. Bạn muốn đặt ngày nào ạ?', at: '10:26' }, { id: 'm3', from: 'customer', text: 'Cho mình hỏi phòng còn trống ngày 30 không?', at: '10:32' }] },
  { id: 'conv-2', platform: 'zalo', customer: 'Trần Minh Khôi', catName: 'Mochi', avatar: null, lastMessage: 'Bé Mochi có cần mang thức ăn riêng không?', lastAt: '09:15', unread: 0, messages: [{ id: 'm1', from: 'customer', text: 'Bé Mochi có cần mang thức ăn riêng không?', at: '09:15' }, { id: 'm2', from: 'bot', text: 'Dạ bạn có thể mang thêm thức ăn quen của bé nhé, shop sẽ cho bé ăn đúng giờ.', at: '09:17' }] },
  { id: 'conv-3', platform: 'messenger', customer: 'Lê Thùy Linh', catName: 'Cà Phê', avatar: null, lastMessage: 'Cảm ơn shop, bé về khỏe lắm!', lastAt: 'Hôm qua', unread: 0, messages: [{ id: 'm1', from: 'customer', text: 'Cảm ơn shop, bé về khỏe lắm!', at: 'Hôm qua 18:00' }, { id: 'm2', from: 'bot', text: 'Cảm ơn bạn Thùy Linh! Chúc bé Cà Phê luôn khỏe, hẹn gặp lại lần sau nhé.', at: 'Hôm qua 18:05' }] },
];

export const initialFrequency = {
  maxPerWeek:       3,
  minGapHours:     24,
  quietStart:    '21:00',
  quietEnd:      '08:00',
  pauseOnComplaint: true,
};
