import { describe, expect, it } from 'vitest';
import { fromPetRow, isUuid, newUuid, toPetRow } from '../../src/utils/petRows';

const OWNER = 'c0712ec3-c76a-4296-adcd-f0f69fc9a3a0';

describe('Chuyển hồ sơ bé <-> bảng pets (id, customer_id, name, data)', () => {
  it('chỉ ghi đúng các cột có trong bảng, thông tin chi tiết nằm trong data', () => {
    const row = toPetRow(
      { id: 'local-1', name: 'Mochi', breed: 'Anh lông ngắn', age: 2, weight: '4kg', imagePreview: 'data:image/png;base64,x', imageFile: {}, ownerId: 'x' },
      OWNER,
    );
    expect(Object.keys(row).sort()).toEqual(['customer_id', 'data', 'name', 'updated_at']);
    expect(row.customer_id).toBe(OWNER);
    expect(row.name).toBe('Mochi');
    expect(row.data).toEqual({ breed: 'Anh lông ngắn', age: 2, weight: '4kg', imagePreview: 'data:image/png;base64,x' });
    expect(row).not.toHaveProperty('user_id');
  });

  it('đọc lại đúng hồ sơ bé và chủ nuôi', () => {
    const pet = fromPetRow({
      id: '11111111-1111-4111-8111-111111111111',
      customer_id: OWNER,
      name: 'Mochi',
      data: { breed: 'Anh lông ngắn', age: 2 },
      created_at: '2026-10-28T00:00:00Z',
    });
    expect(pet).toMatchObject({ id: '11111111-1111-4111-8111-111111111111', name: 'Mochi', breed: 'Anh lông ngắn', age: 2, ownerId: OWNER });
  });

  it('chịu được dòng thiếu data', () => {
    expect(fromPetRow({ id: 'a', customer_id: OWNER, name: null, data: null })).toMatchObject({ id: 'a', name: 'Bé cưng', ownerId: OWNER });
  });

  it('tạo id dạng uuid hợp lệ cho cột id', () => {
    expect(isUuid(newUuid())).toBe(true);
    expect(isUuid('1730000000000')).toBe(false);
  });
});
