const CACHE_KEY = 'mvn-admin-customer-data-v1';

const emptySnapshot = () => ({
  server: { profiles: [], bookings: [], pets: [] },
  db: { profiles: [], bookings: [], pets: [] },
  lastSyncedAt: null,
});

export const readAdminCustomerSnapshot = (storage, userId) => {
  if (!storage || !userId) return emptySnapshot();

  try {
    const raw = storage.getItem(`${CACHE_KEY}:${userId}`);
    if (!raw) return emptySnapshot();

    const saved = JSON.parse(raw);
    const timestamp = saved?.lastSyncedAt ? new Date(saved.lastSyncedAt) : null;
    if (
      !timestamp ||
      Number.isNaN(timestamp.getTime()) ||
      !['server', 'db'].every((source) =>
        ['profiles', 'bookings', 'pets'].every((key) => Array.isArray(saved?.[source]?.[key]))
      )
    ) {
      return emptySnapshot();
    }

    return {
      server: saved.server,
      db: saved.db,
      lastSyncedAt: timestamp,
    };
  } catch (error) {
    console.warn('[AdminCustomerData] Unable to read the session cache:', error);
    return emptySnapshot();
  }
};

export const writeAdminCustomerSnapshot = (storage, userId, snapshot) => {
  if (!storage || !userId || !snapshot?.lastSyncedAt) return;

  try {
    storage.setItem(
      `${CACHE_KEY}:${userId}`,
      JSON.stringify({
        server: snapshot.server,
        db: snapshot.db,
        lastSyncedAt: snapshot.lastSyncedAt.toISOString(),
      })
    );
  } catch (error) {
    console.warn('[AdminCustomerData] Unable to save the session cache:', error);
  }
};
