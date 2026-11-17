import { getRequestUser, getBearerToken } from './auth.js';
import { findViewableInHouseBooking } from './bookingsService.js';
import { listCareLogs, insertCareLogs, getCareLog, deleteCareLog } from './careLogsDb.js';
import { CARE_LOG_TYPES, UNDO_WINDOW_MS, taskForType, vnDateKey, vnTime } from '../../src/utils/careTasks.js';

// Nhật ký chăm sóc, đi chung serverless function /api/bookings (?resource=care-logs) để không vượt
// giới hạn 12 function của Vercel Hobby.
//   GET    Admin: nhật ký 45 ngày gần đây (hoặc của 1 đơn) · Khách: nhật ký các đơn của mình
//   POST   Chỉ Admin. { entries: [{ bookingCode, petId, type, label, detail, status, tag, icon, imageUrl, reportData, petName, task }] }
//          Chỉ ghi cho bé ĐANG Ở; task = true là tác vụ hằng ngày (Cho ăn / Vận động / Dọn vệ sinh), mỗi ngày 1 lần.
//   DELETE Chỉ Admin, hoàn tác trong 5 phút. { id }

const ADMIN_HISTORY_DAYS = 45;
const MAX_ENTRIES = 100;
const MAX_TEXT = 2000;

export const isCareLogsRequest = (req) => getQuery(req).resource === 'care-logs';

function getQuery(req) {
  if (req?.query && Object.keys(req.query).length > 0) return req.query;
  if (!req?.url) return {};
  return Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
}

const text = (value) => (typeof value === 'string' ? value.slice(0, MAX_TEXT) : undefined);

// Chỉ giữ các trường hiển thị của một dòng nhật ký
function sanitizeData(raw) {
  const data = {
    label: text(raw.label),
    detail: text(raw.detail),
    status: raw.status === 'watch' ? 'watch' : 'normal',
    tag: text(raw.tag),
    icon: text(raw.icon),
    petName: text(raw.petName),
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
    reportData: raw.reportData && typeof raw.reportData === 'object' ? raw.reportData : undefined,
  };
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export const toClientLog = (row) => ({
  ...row.data,
  id: row.id,
  bookingCode: row.bookingCode,
  petId: row.petId,
  customerId: row.customerId,
  type: row.type,
  createdBy: row.createdBy,
  createdAt: row.createdAt,
});

// Các bé thuộc đơn (khớp id không phân biệt số / chuỗi). Đơn không có hồ sơ mèo dùng bé đại diện pet_<mã đơn>.
function bookingPetIds(booking) {
  const ids = new Set();
  (booking.petProfiles || []).forEach((p) => { if (p?.id != null) ids.add(String(p.id)); });
  (booking.petIds || []).forEach((id) => { if (id != null) ids.add(String(id)); });
  ids.add(`pet_${booking.code || booking.id}`);
  return ids;
}

const SKIP_MESSAGES = {
  invalid: 'Thiếu thông tin nhật ký (mã đơn, bé mèo hoặc loại tác vụ).',
  not_in_house: 'Bé không còn đang lưu trú (đơn chưa check-in hoặc đã check-out).',
  unknown_pet: 'Bé mèo không thuộc đơn này.',
};
const skipMessage = (skip) =>
  skip.reason === 'already_done' ? `Đã hoàn thành lúc ${vnTime(skip.doneAt)} hôm nay.` : SKIP_MESSAGES[skip.reason];

async function handleGet(req, res, user) {
  const { bookingCode } = getQuery(req);
  const filter = user.isAdmin
    ? { bookingCode: bookingCode || null, sinceIso: bookingCode ? null : new Date(Date.now() - ADMIN_HISTORY_DAYS * 86400000).toISOString() }
    : { customerId: user.id, bookingCode: bookingCode || null };
  const rows = await listCareLogs(filter);
  return res.status(200).json({ success: true, logs: rows.map(toClientLog) });
}

async function handlePost(req, res, user) {
  const body = req.body || {};
  const entries = Array.isArray(body.entries) ? body.entries : [body];
  if (entries.length === 0 || entries.length > MAX_ENTRIES) {
    return res.status(400).json({ success: false, message: `Mỗi lần ghi từ 1 đến ${MAX_ENTRIES} dòng nhật ký.` });
  }

  const accessToken = getBearerToken(req);
  const todayKey = vnDateKey();
  const bookings = new Map();
  const todayLogs = new Map();
  const doneInBatch = new Set();
  const toInsert = [];
  const skipped = [];

  for (const raw of entries) {
    const bookingCode = String(raw?.bookingCode || '').trim();
    const petId = raw?.petId != null ? String(raw.petId) : '';
    const type = raw?.type;
    const ref = { bookingCode, petId, type };
    if (!bookingCode || !petId || !CARE_LOG_TYPES.includes(type)) {
      skipped.push({ ...ref, reason: 'invalid' });
      continue;
    }

    if (!bookings.has(bookingCode)) {
      bookings.set(bookingCode, await findViewableInHouseBooking(bookingCode, user, accessToken));
    }
    const booking = bookings.get(bookingCode);
    if (!booking) {
      skipped.push({ ...ref, reason: 'not_in_house' });
      continue;
    }
    if (!bookingPetIds(booking).has(petId)) {
      skipped.push({ ...ref, reason: 'unknown_pet' });
      continue;
    }

    // Tác vụ hằng ngày: đã làm hôm nay thì không ghi trùng
    const task = raw.task ? taskForType(type) : null;
    if (task) {
      if (!todayLogs.has(bookingCode)) {
        const rows = await listCareLogs({ bookingCode });
        todayLogs.set(bookingCode, rows.filter((r) => vnDateKey(r.createdAt) === todayKey));
      }
      const done = todayLogs.get(bookingCode).find((r) => r.petId === petId && task.matchTypes.includes(r.type));
      const batchKey = `${bookingCode}|${petId}|${task.key}`;
      if (done || doneInBatch.has(batchKey)) {
        skipped.push({ ...ref, reason: 'already_done', doneAt: done?.createdAt || new Date().toISOString() });
        continue;
      }
      doneInBatch.add(batchKey);
    }

    toInsert.push({
      bookingCode,
      petId,
      customerId: booking.customerId || null,
      type,
      data: sanitizeData(raw),
      createdBy: user.id,
    });
  }

  const saved = await insertCareLogs(toInsert);
  if (saved.length === 0) {
    const first = skipped[0] || { reason: 'invalid' };
    const status = first.reason === 'invalid' || first.reason === 'unknown_pet' ? 400 : 409;
    return res.status(status).json({ success: false, message: skipMessage(first), skipped });
  }
  return res.status(200).json({ success: true, logs: saved.map(toClientLog), skipped });
}

async function handleDelete(req, res) {
  const id = req.body?.id || getQuery(req).id;
  if (!id) return res.status(400).json({ success: false, message: 'Thiếu mã dòng nhật ký.' });
  const log = await getCareLog(id);
  if (!log) return res.status(404).json({ success: false, message: 'Không tìm thấy dòng nhật ký.' });
  if (Date.now() - new Date(log.createdAt).getTime() > UNDO_WINDOW_MS) {
    return res.status(409).json({ success: false, message: 'Chỉ hoàn tác được trong 5 phút sau khi bấm.' });
  }
  await deleteCareLog(id);
  return res.status(200).json({ success: true, id, bookingCode: log.bookingCode });
}

export async function handleCareLogs(req, res) {
  res.setHeader?.('Cache-Control', 'no-cache, no-store, must-revalidate');
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });

  if (req.method === 'GET') return handleGet(req, res, user);
  if (!user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Chỉ nhân viên Mèo Vắng Nhà mới cập nhật được nhật ký.' });
  }
  if (req.method === 'POST') return handlePost(req, res, user);
  if (req.method === 'DELETE') return handleDelete(req, res);
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
