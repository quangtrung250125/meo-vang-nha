// Bảng Supabase `pets`: id (uuid), customer_id (uuid), name, data (json), created_at, updated_at.
// Thông tin chi tiết của bé (giống, tuổi, cân nặng, ảnh, ghi chú...) lưu trong cột `data`, giống bảng `bookings`.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value) => typeof value === 'string' && UUID_RE.test(value);

export const newUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Các trường chỉ dùng trên giao diện hoặc đã có cột riêng, không lưu vào `data`
const NON_DATA_FIELDS = ['id', 'name', 'ownerId', 'customer_id', 'imageFile', 'createdAt', 'updatedAt'];

/**
 * Hồ sơ bé trong app -> các cột của bảng `pets` (không gồm id).
 */
export function toPetRow(pet, customerId) {
  const data = {};
  Object.entries(pet || {}).forEach(([key, value]) => {
    if (!NON_DATA_FIELDS.includes(key) && value !== undefined) data[key] = value;
  });
  return {
    customer_id: customerId,
    name: pet?.name || 'Bé cưng',
    data,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Một dòng của bảng `pets` -> hồ sơ bé dùng trong app.
 */
export function fromPetRow(row) {
  const data = row?.data && typeof row.data === 'object' ? row.data : {};
  return {
    ...data,
    id: row.id,
    name: row.name || data.name || 'Bé cưng',
    ownerId: row.customer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
