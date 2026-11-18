import { describe, expect, it } from 'vitest';
import { readAdminCustomerSnapshot, writeAdminCustomerSnapshot } from '../../src/utils/adminCustomerCache';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
};

const snapshot = () => ({
  server: { profiles: [{ id: 'profile' }], bookings: [{ id: 'booking' }], pets: [{ id: 'pet' }] },
  db: { profiles: [], bookings: [], pets: [] },
  lastSyncedAt: new Date('2026-11-18T04:00:00.000Z'),
});

describe('admin customer session cache', () => {
  it('hydrates a complete snapshot only for the same admin user', () => {
    const storage = createStorage();
    writeAdminCustomerSnapshot(storage, 'admin-a', snapshot());

    expect(readAdminCustomerSnapshot(storage, 'admin-a')).toEqual(snapshot());
    expect(readAdminCustomerSnapshot(storage, 'admin-b')).toMatchObject({
      server: { profiles: [], bookings: [], pets: [] },
      db: { profiles: [], bookings: [], pets: [] },
      lastSyncedAt: null,
    });
  });

  it('rejects incomplete or invalid snapshots instead of treating them as real zeroes', () => {
    const storage = createStorage();
    storage.setItem('mvn-admin-customer-data-v1:admin-a', JSON.stringify({
      server: { profiles: [], bookings: [] },
      db: { profiles: [], bookings: [], pets: [] },
      lastSyncedAt: '2026-11-18T04:00:00.000Z',
    }));

    expect(readAdminCustomerSnapshot(storage, 'admin-a')).toMatchObject({
      server: { profiles: [], bookings: [], pets: [] },
      db: { profiles: [], bookings: [], pets: [] },
      lastSyncedAt: null,
    });
  });
});
