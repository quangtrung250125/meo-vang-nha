import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchServerSync,
  invalidateServerSyncCache,
  scopeIncomingPayload,
  scopeOutgoingPayload,
} from '../../src/services/crossDeviceSync';

vi.mock('../../src/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

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

  it('khách nhận sự kiện thay đổi nhật ký chăm sóc', () => {
    const payload = { bookingCodes: ['A'] };
    expect(scopeIncomingPayload('CARE_LOGS_CHANGED', payload, me)).toEqual(payload);
  });

  it('gắn ownerId khi gửi mèo đi', () => {
    const scoped = scopeOutgoingPayload({ pets: [{ id: 1 }, { id: 2, ownerId: 'user-b' }] }, me);
    expect(scoped.pets).toEqual([{ id: 1, ownerId: 'user-a' }]);
  });
});

describe('fetchServerSync', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    invalidateServerSyncCache();
  });

  it('shares an in-flight request between concurrent consumers', async () => {
    const fetch = vi.fn(() => new Promise((resolve) => {
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: { bookings: [] } }),
      }), 20);
    }));
    vi.stubGlobal('fetch', fetch);

    const [first, second] = await Promise.all([fetchServerSync(), fetchServerSync()]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ bookings: [] });
    expect(second).toEqual(first);
  });

  it('reuses a successful response until invalidated', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { bookings: [{ code: 'A' }] } }),
    });
    vi.stubGlobal('fetch', fetch);

    await fetchServerSync();
    const second = await fetchServerSync();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ bookings: [{ code: 'A' }] });
    invalidateServerSyncCache();
    await fetchServerSync();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
