// Tác vụ chăm sóc trong ngày và cách đọc nhật ký theo giờ Việt Nam.
// Dùng chung cho giao diện (Tổng quan, Tình trạng phòng, nhật ký của khách) và server (api/_lib/careLogsService.js).

export const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

// Cho phép Admin hoàn tác một lần bấm nhầm trong khoảng thời gian này
export const UNDO_WINDOW_MS = 5 * 60 * 1000;

// Các loại dòng nhật ký được ghi
export const CARE_LOG_TYPES = ['eating', 'mood', 'hygiene', 'health', 'media', 'report'];

// 3 tác vụ hằng ngày của mỗi bé. Mỗi tác vụ hoàn thành 1 lần / ngày (giờ Việt Nam).
// 'play' cũ được tính như 'mood' (Vui chơi & Vận động).
export const DAILY_TASKS = [
  {
    key: 'fed',
    type: 'eating',
    matchTypes: ['eating'],
    label: 'Cho ăn',
    icon: 'Utensils',
    detail: 'Bé đã được cho ăn theo khẩu phần của gói lưu trú.',
  },
  {
    key: 'played',
    type: 'mood',
    matchTypes: ['mood', 'play'],
    label: 'Vui chơi & Vận động',
    icon: 'Smile',
    detail: 'Bé đã được chơi đùa và vận động cùng nhân viên.',
  },
  {
    key: 'hygiene',
    type: 'hygiene',
    matchTypes: ['hygiene'],
    label: 'Vệ sinh khay cát',
    icon: 'Droplets',
    detail: 'Khay cát của bé đã được dọn sạch sẽ.',
  },
];

export const getDailyTask = (key) => DAILY_TASKS.find((t) => t.key === key) || null;

// Tác vụ hằng ngày tương ứng với một loại nhật ký (hoặc null)
export const taskForType = (type) => DAILY_TASKS.find((t) => t.matchTypes.includes(type)) || null;

const toDate = (value) => (value instanceof Date ? value : new Date(value));

/** Ngày (YYYY-MM-DD) theo giờ Việt Nam của một thời điểm. */
export function vnDateKey(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(toDate(value));
}

/** Giờ:phút theo giờ Việt Nam, ví dụ "08:05". */
export function vnTime(value) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: VN_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(toDate(value));
}

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/** Nhãn ngày cho nhật ký: "Hôm nay, 17/11" hoặc "Thứ Hai, 16/11" (tự ghép để giống nhau trên mọi trình duyệt). */
export function vnDateLabel(value, todayKey = vnDateKey()) {
  const key = vnDateKey(value);
  const [year, month, day] = key.split('-').map(Number);
  const dayMonth = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  if (key === todayKey) return `Hôm nay, ${dayMonth}`;
  return `${WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]}, ${dayMonth}`;
}

/**
 * Trạng thái 3 tác vụ hôm nay của một bé, tính từ nhật ký của bé (mọi thứ tự).
 * @returns {{ fed, played, hygiene, hasWarning, logsToday, done: { fed|played|hygiene: { at, logId } | null } }}
 */
export function getTodayTaskStatus(logs = [], todayKey = vnDateKey()) {
  const logsToday = (logs || [])
    .filter((l) => l?.createdAt && vnDateKey(l.createdAt) === todayKey)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const done = {};
  DAILY_TASKS.forEach((task) => {
    const first = logsToday.find((l) => task.matchTypes.includes(l.type));
    done[task.key] = first ? { at: first.createdAt, logId: first.id } : null;
  });

  return {
    fed: Boolean(done.fed),
    played: Boolean(done.played),
    hygiene: Boolean(done.hygiene),
    hasWarning: logsToday.some((l) => l.status === 'watch'),
    logsToday,
    done,
  };
}

/** Admin còn hoàn tác được dòng nhật ký này không. */
export const canUndoLog = (log, now = Date.now()) =>
  Boolean(log?.createdAt) && now - new Date(log.createdAt).getTime() <= UNDO_WINDOW_MS;
