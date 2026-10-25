// ============================================================
// marketingStore.js — Store & du lieu mau cho "Marketing tu dong"
// CANH BAO: DU LIEU MAU — chua ket noi API that. Moi hanh dong gui dang o che do MO PHONG.
// ============================================================

// ---------- TAB IDs ----------
export const MARKETING_TABS = [
  { id: 'scenarios',  label: 'Kich ban' },
  { id: 'templates',  label: 'Mau tin nhan' },
  { id: 'schedule',   label: 'Lich gui & doi tuong' },
  { id: 'results',    label: 'Ket qua' },
  { id: 'inbox',      label: 'Hop thu tap trung' },
  { id: 'frequency',  label: 'Gioi han tan suat' },
];

export const CUSTOMER_SEGMENTS = [
  { id: 'all',       label: 'Tat ca' },
  { id: 'potential', label: 'Tiem nang' },
  { id: 'new',       label: 'Khach moi' },
  { id: 'returning', label: 'Khach quay lai' },
  { id: 'loyal',     label: 'Than thiet' },
  { id: 'vip',       label: 'VIP' },
  { id: 'at_risk',   label: 'Nguy co roi bo' },
  { id: 'confirmed', label: 'Don da xac nhan' },
  { id: 'checked_out', label: 'Vua check-out' },
  { id: 'upgrading', label: 'Sap len hang' },
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
  { id: 'call',    label: 'Cuoc goi',  color: 'bg-rose-100 text-rose-700' },
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
  if (n === undefined || n === null || isNaN(Number(n))) return '0d';
  return Number(n).toLocaleString('vi-VN') + 'd';
};

export const formatPercent = (n) => {
  if (n === undefined || n === null) return '0%';
  return Number(n).toFixed(1) + '%';
};

// CANH BAO: Du lieu mau — chua noi API
export const initialScenarios = [
  { id: 'sc-1', name: 'Dang ky nhung chua dat phong sau 3 ngay', trigger: 'Dang ky >= 3 ngay, chua dat', delay: '3 ngay sau dang ky', channels: ['zalo','email'], segment: 'potential', templateId: 'tpl-new-offer', weekSent: 24, enabled: true, action: 'Gui uu dai khach moi' },
  { id: 'sc-2', name: 'Bo do dat phong', trigger: 'Bo gio dat phong > 2 gio', delay: '2 gio sau bo do', channels: ['webpush','zalo'], segment: 'potential', templateId: 'tpl-cart-abandon', weekSent: 11, enabled: true, action: 'Nhac hoan tat, kem lich phong trong' },
  { id: 'sc-3', name: 'Nhac lich truoc ngay gui meo', trigger: 'X ngay truoc ngay check-in (mac dinh 2)', delay: '2 ngay truoc check-in', channels: ['zalo','sms'], segment: 'confirmed', templateId: 'tpl-checkin-remind', weekSent: 38, enabled: true, action: 'Nhac lich check-in' },
  { id: 'sc-4', name: 'Cam on sau check-out', trigger: '1 ngay sau check-out', delay: '1 ngay sau check-out', channels: ['zalo'], segment: 'checked_out', templateId: 'tpl-thankyou', weekSent: 33, enabled: true, action: 'Cam on & xin danh gia' },
  { id: 'sc-5', name: 'Nhac nhe dip le / mua cao diem', trigger: 'Qua X ngay chua quay lai hoac dip le', delay: 'Theo lich le', channels: ['zalo','email'], segment: 'returning', templateId: 'tpl-holiday', weekSent: 19, enabled: true, action: 'Goi y lich le / mua cao diem' },
  { id: 'sc-6', name: 'Chuc mung len hang thanh vien', trigger: 'Khach du dieu kien len hang', delay: 'Ngay khi du dieu kien', channels: ['zalo','email'], segment: 'upgrading', templateId: 'tpl-tier-up', weekSent: 7, enabled: true, action: 'Chuc mung & gioi thieu quyen loi' },
  { id: 'sc-7', name: 'Uu dai quay lai & goi tham hoi (Nguy co roi bo)', trigger: 'Khach roi vao nguy co roi bo', delay: 'Ngay khi phat hien', channels: ['zalo','call'], segment: 'at_risk', templateId: 'tpl-winback', weekSent: 4, enabled: false, action: 'Uu dai quay lai + tao viec goi tham hoi' },
];

export const initialTemplates = [
  { id: 'tpl-new-offer',       name: 'Uu dai khach moi',              channel: 'zalo',    body: 'Chao {ten_chu}! Be {ten_meo} cua ban dang cho mot mai nha am ap. Dat ngay hom nay de nhan uu dai {ma_uu_dai} – giam 20% cho lan dau gui be. Phong trong con nhieu!', variables: ['{ten_chu}','{ten_meo}','{ma_uu_dai}'], status: 'active' },
  { id: 'tpl-cart-abandon',    name: 'Nhac hoan tat dat phong',       channel: 'webpush', body: 'O, ban bo quen be {ten_meo} roi! Con phong trong ngay {ngay_nhan}. Hoan tat dat phong ngay truoc khi het cho nhe!', variables: ['{ten_meo}','{ngay_nhan}'], status: 'active' },
  { id: 'tpl-checkin-remind',  name: 'Nhac lich truoc ngay gui meo',  channel: 'zalo',    body: 'Nhac nhe: Chi con 2 ngay nua la {ngay_nhan} – ngay gui be {ten_meo} den Meo Vang Nha. Nho mang theo do an quen, do choi va so suc khoe cua be nhe!', variables: ['{ten_chu}','{ten_meo}','{ngay_nhan}'], status: 'active' },
  { id: 'tpl-thankyou',        name: 'Cam on & xin danh gia',         channel: 'zalo',    body: 'Cam on {ten_chu} da tin tuong Meo Vang Nha cham soc be {ten_meo}! Be da ve nha binh an. Ban co the danh gia dich vu tai day de giup chung minh cai thien hon nhe. Hen gap lai!', variables: ['{ten_chu}','{ten_meo}'], status: 'active' },
  { id: 'tpl-holiday',         name: 'Goi y lich le / mua cao diem',  channel: 'email',   body: 'Chao {ten_chu}! Dip Tet dang den gan – dat phong som cho be {ten_meo} de co phong dep nhat. Dung ma {ma_uu_dai} de nhan uu dai dac biet. So luong phong co han!', variables: ['{ten_chu}','{ten_meo}','{ma_uu_dai}'], status: 'active' },
  { id: 'tpl-tier-up',         name: 'Chuc mung len hang',            channel: 'zalo',    body: 'Chuc mung {ten_chu}! Ban vua dat hang {hang} tai Meo Vang Nha. Tu hom nay ban duoc huong cac quyen loi dac biet danh rieng cho hang {hang}. Cam on vi da dong hanh cung chung minh!', variables: ['{ten_chu}','{hang}'], status: 'active' },
  { id: 'tpl-winback',         name: 'Uu dai quay lai (Nguy co roi bo)', channel: 'zalo', body: 'Chao {ten_chu}! Chung minh nho be {ten_meo} lam. Dung ma {ma_uu_dai} de dat phong voi uu dai 15% hoi quy. Chung minh hua se cham be that chu dao!', variables: ['{ten_chu}','{ten_meo}','{ma_uu_dai}'], status: 'active' },
];

export const initialScheduleItems = [
  { id: 'sch-1', scenarioName: 'Nhac lich truoc ngay gui meo',       sendAt: '2026-10-27 08:00', recipients: 12 },
  { id: 'sch-2', scenarioName: 'Cam on sau check-out',               sendAt: '2026-10-27 10:00', recipients: 5  },
  { id: 'sch-3', scenarioName: 'Dang ky nhung chua dat (3 ngay)',    sendAt: '2026-10-27 14:00', recipients: 8  },
  { id: 'sch-4', scenarioName: 'Nhac le Tet Duong lich',             sendAt: '2026-10-28 09:00', recipients: 47 },
];

export const initialRecipients = [
  { id: 'r-1', name: 'Nguyen Lan Anh',  catName: 'Bo',      segment: 'potential',   trigger: 'Dang ky 3 ngay, chua dat', status: 'pending' },
  { id: 'r-2', name: 'Tran Minh Khoi',  catName: 'Mochi',   segment: 'confirmed',   trigger: '2 ngay truoc check-in',    status: 'pending' },
  { id: 'r-3', name: 'Le Thuy Linh',    catName: 'Ca Phe',  segment: 'checked_out', trigger: '1 ngay sau check-out',     status: 'sent'    },
  { id: 'r-4', name: 'Pham Tuan Kiet',  catName: 'Kem',     segment: 'at_risk',     trigger: 'Nguy co roi bo',           status: 'pending' },
  { id: 'r-5', name: 'Hoang Thu Hang',  catName: 'Nam',     segment: 'upgrading',   trigger: 'Du dieu kien len hang',    status: 'sent'    },
  { id: 'r-6', name: 'Bui Thanh Tu',    catName: 'Pudding', segment: 'potential',   trigger: 'Bo do dat phong',          status: 'pending' },
];

export const initialResults = {
  summary: { sent: 3840, opened: 1728, clicked: 576, converted: 144, revenue: 43200000, openRate: 45.0, clickRate: 15.0, convertRate: 3.75 },
  byScenario: [
    { id: 'sc-1', name: 'Uu dai khach moi',       sent: 480, opened: 240, clicked: 96, converted: 28, revenue: 8400000  },
    { id: 'sc-2', name: 'Bo do dat phong',         sent: 210, opened: 140, clicked: 84, converted: 42, revenue: 12600000 },
    { id: 'sc-3', name: 'Nhac lich check-in',      sent: 760, opened: 532, clicked: 76, converted:  0, revenue: 0        },
    { id: 'sc-4', name: 'Cam on sau check-out',    sent: 660, opened: 396, clicked: 66, converted:  0, revenue: 0        },
    { id: 'sc-5', name: 'Goi y lich le',           sent: 940, opened: 282, clicked: 94, converted: 47, revenue: 14100000 },
    { id: 'sc-6', name: 'Chuc mung len hang',      sent: 140, opened:  84, clicked: 28, converted: 14, revenue: 4200000  },
    { id: 'sc-7', name: 'Uu dai quay lai',         sent:  90, opened:  54, clicked: 18, converted:  9, revenue: 2700000  },
  ],
};

export const initialConversations = [
  { id: 'conv-1', platform: 'zalo', customer: 'Nguyen Lan Anh', catName: 'Bo', avatar: null, lastMessage: 'Cho minh hoi phong con trong ngay 30 khong?', lastAt: '10:32', unread: 2, messages: [{ id: 'm1', from: 'customer', text: 'Chao shop! Minh muon dat phong cho be Bo.', at: '10:25' }, { id: 'm2', from: 'bot', text: 'Chao ban Lan Anh! Be Bo nghe cute qua. Ban muon dat ngay nao a?', at: '10:26' }, { id: 'm3', from: 'customer', text: 'Cho minh hoi phong con trong ngay 30 khong?', at: '10:32' }] },
  { id: 'conv-2', platform: 'zalo', customer: 'Tran Minh Khoi', catName: 'Mochi', avatar: null, lastMessage: 'Be Mochi co can mang thuc an rieng khong?', lastAt: '09:15', unread: 0, messages: [{ id: 'm1', from: 'customer', text: 'Be Mochi co can mang thuc an rieng khong?', at: '09:15' }, { id: 'm2', from: 'bot', text: 'Da ban co the mang them thuc an quen cua be nhe, shop se cho be an dung gio.', at: '09:17' }] },
  { id: 'conv-3', platform: 'messenger', customer: 'Le Thuy Linh', catName: 'Ca Phe', avatar: null, lastMessage: 'Cam on shop, be ve khoe lam!', lastAt: 'Hom qua', unread: 0, messages: [{ id: 'm1', from: 'customer', text: 'Cam on shop, be ve khoe lam!', at: 'Hom qua 18:00' }, { id: 'm2', from: 'bot', text: 'Cam on ban Thuy Linh! Chuc be Ca Phe luon khoe, hen gap lai lan sau nhe.', at: 'Hom qua 18:05' }] },
];

export const initialFrequency = {
  maxPerWeek:       3,
  minGapHours:     24,
  quietStart:    '21:00',
  quietEnd:      '08:00',
  pauseOnComplaint: true,
};
