import fs from 'fs';
import path from 'path';
import { getRequestUser } from './auth.js';

const DATA_DIR = process.env.MVN_DATA_DIR || path.resolve(process.cwd(), 'api/lib');
const SYNC_STORE_PATH = path.join(DATA_DIR, 'sync_store.json');

const INITIAL_STORE = {
  bookings: [],
  pets: [],
  profiles: [],
  updatedAt: new Date().toISOString(),
};

let inMemoryStore = { ...INITIAL_STORE };

// Đọc dữ liệu đã lưu từ file nếu có
try {
  if (fs.existsSync(SYNC_STORE_PATH)) {
    const raw = fs.readFileSync(SYNC_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      inMemoryStore = {
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
        pets: Array.isArray(parsed.pets) ? parsed.pets : [],
        profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  }
} catch (e) {
  console.warn('[SyncService] Không thể đọc sync_store.json, khởi tạo mặc định:', e.message);
}

function persistStore() {
  try {
    fs.writeFileSync(SYNC_STORE_PATH, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[SyncService] Không thể ghi sync_store.json:', e.message);
  }
}

export function getSyncData() {
  return inMemoryStore;
}

export function updateSyncData({ bookings, pets, profiles }) {
  let changed = false;

  if (Array.isArray(bookings)) {
    // Merge bookings theo id / code
    const existing = [...inMemoryStore.bookings];
    bookings.forEach((newItem) => {
      const idx = existing.findIndex(
        (b) => (b.id && b.id === newItem.id) || (b.code && b.code === newItem.code)
      );
      if (idx >= 0) {
        if (newItem.customerId && existing[idx].customerId !== newItem.customerId) return;
        existing[idx] = { ...existing[idx], ...newItem };
      } else {
        existing.unshift(newItem);
      }
    });
    inMemoryStore.bookings = existing;
    changed = true;
  }

  if (Array.isArray(pets)) {
    // Merge pets theo id hoặc tên
    const existing = [...inMemoryStore.pets];
    pets.forEach((newPet) => {
      const idx = existing.findIndex((p) => p.id && p.id === newPet.id);
      if (idx >= 0) {
        if (newPet.ownerId && existing[idx].ownerId !== newPet.ownerId) return;
        existing[idx] = { ...existing[idx], ...newPet };
      } else {
        existing.push(newPet);
      }
    });
    inMemoryStore.pets = existing;
    changed = true;
  }

  if (Array.isArray(profiles)) {
    const existing = [...inMemoryStore.profiles];
    profiles.forEach((newProf) => {
      const idx = existing.findIndex((p) => p.id && p.id === newProf.id);
      if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...newProf };
      } else {
        existing.push(newProf);
      }
    });
    inMemoryStore.profiles = existing;
    changed = true;
  }

  if (changed) {
    inMemoryStore.updatedAt = new Date().toISOString();
    persistStore();
  }

  return inMemoryStore;
}

/**
 * Chỉ giữ lại dữ liệu thuộc về người dùng (admin xem được tất cả, khách vãng lai không thấy gì).
 */
export function scopeSyncData(data, user) {
  if (user?.isAdmin) return data;
  if (!user) return { bookings: [], pets: [], profiles: [], updatedAt: data.updatedAt };
  return {
    bookings: data.bookings.filter((b) => b.customerId === user.id),
    pets: data.pets.filter((p) => p.ownerId === user.id),
    profiles: data.profiles.filter((p) => p.id === user.id),
    updatedAt: data.updatedAt,
  };
}

// Khách chỉ được ghi dữ liệu của chính mình: gắn ownerId/customerId theo tài khoản đăng nhập
function stampOwnership(body, user) {
  const asArray = (v) => (Array.isArray(v) ? v : undefined);
  if (user.isAdmin) {
    return { bookings: asArray(body.bookings), pets: asArray(body.pets), profiles: asArray(body.profiles) };
  }
  return {
    bookings: asArray(body.bookings)
      ?.filter((b) => b && (!b.customerId || b.customerId === user.id))
      .map((b) => ({ ...b, customerId: user.id })),
    pets: asArray(body.pets)
      ?.filter((p) => p && (!p.ownerId || p.ownerId === user.id))
      .map((p) => ({ ...p, ownerId: user.id })),
    profiles: asArray(body.profiles)
      ?.filter((p) => p && p.id === user.id),
  };
}

export async function handleSync(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const user = await getRequestUser(req);

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: scopeSyncData(getSyncData(), user),
    });
  }

  if (req.method === 'POST') {
    if (!user) {
      return res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để đồng bộ dữ liệu.' });
    }
    try {
      const updated = updateSyncData(stampOwnership(req.body || {}, user));
      return res.status(200).json({
        success: true,
        message: 'Đồng bộ dữ liệu thành công',
        data: scopeSyncData(updated, user),
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
