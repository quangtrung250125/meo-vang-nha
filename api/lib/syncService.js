import fs from 'fs';
import path from 'path';

const SYNC_STORE_PATH = path.resolve(process.cwd(), 'api/lib/sync_store.json');

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
      const idx = existing.findIndex(
        (p) => (p.id && p.id === newPet.id) || (p.name && newPet.name && p.name.trim().toLowerCase() === newPet.name.trim().toLowerCase())
      );
      if (idx >= 0) {
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
      const idx = existing.findIndex(
        (p) => (p.id && p.id === newProf.id) || (p.phone && p.phone === newProf.phone)
      );
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

export async function handleSync(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: getSyncData(),
    });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const updated = updateSyncData({
        bookings: body.bookings,
        pets: body.pets,
        profiles: body.profiles,
      });
      return res.status(200).json({
        success: true,
        message: 'Đồng bộ dữ liệu thành công',
        data: updated,
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
