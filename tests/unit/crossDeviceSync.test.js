import { describe, expect, it } from 'vitest';
import { scopeIncomingPayload, scopeOutgoingPayload } from '../../src/services/crossDeviceSync';

const me = { userId: 'user-a', isAdmin: false };

describe('Đồng bộ đa thiết bị chỉ nhận dữ liệu của chính mình', () => {
  it('bỏ mèo và đơn của khách khác', () => {
    const payload = {
      pets: [{ id: 1, ownerId: 'user-a' }, { id: 2, ownerId: 'user-b' }, { id: 3 }],
      bookings: [{ code: 'A', customerId: 'user-a' }, { code: 'B', customerId: 'user-b' }],
    };
    const scoped = scopeIncomingPayload('FULL_SYNC_RESPONSE', payload, me);
    expect(scoped.pets.map((p) => p.id)).toEqual([1]);
    expect(scoped.bookings.map((b) => b.code)).toEqual(['A']);
  });

  it('không nhận hồ sơ của người khác', () => {
    expect(scopeIncomingPayload('PROFILE_UPDATED', { profile: { id: 'user-b' } }, me)).toBeNull();
    expect(scopeIncomingPayload('PROFILE_UPDATED', { profile: { id: 'user-a' } }, me)).not.toBeNull();
  });

  it('khách chưa đăng nhập không nhận dữ liệu nào', () => {
    expect(scopeIncomingPayload('PETS_UPDATED', { pets: [{ id: 1, ownerId: 'x' }] }, { userId: null })).toBeNull();
  });

  it('admin nhận tất cả', () => {
    const payload = { pets: [{ id: 2, ownerId: 'user-b' }] };
    expect(scopeIncomingPayload('PETS_UPDATED', payload, { userId: 'admin', isAdmin: true })).toBe(payload);
  });

  it('gắn ownerId khi gửi mèo đi', () => {
    const scoped = scopeOutgoingPayload({ pets: [{ id: 1 }, { id: 2, ownerId: 'user-b' }] }, me);
    expect(scoped.pets).toEqual([{ id: 1, ownerId: 'user-a' }]);
  });
});
