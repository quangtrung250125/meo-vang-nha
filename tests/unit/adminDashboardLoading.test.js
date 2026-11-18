import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import KpiMetricsGrid from '../../src/pages/AdminDashboard/KpiMetricsGrid';
import UrgentTasksToday from '../../src/pages/AdminDashboard/UrgentTasksToday';
import AdminReports from '../../src/pages/AdminReports';

vi.mock('../../src/pages/AdminCustomers/useCustomerData', () => ({
  default: () => ({ customers: [], loading: true, hasData: false, error: '', refresh: () => {} }),
}));

vi.mock('../../src/contexts/ServiceCatalogContext', () => ({
  useServiceCatalog: () => ({ items: [], rules: [] }),
}));

vi.mock('../../Chi/RoomStateContext', () => ({
  useRoomState: () => ({ bookings: {}, maintenanceRooms: {} }),
  ROOM_CONFIG: [],
}));

describe('Admin dashboard loading indicators', () => {
  it('does not render zero-valued KPI cards before data is ready', () => {
    const markup = renderToStaticMarkup(
      React.createElement(KpiMetricsGrid, { metrics: {}, loading: true })
    );

    expect(markup).toContain('role="status"');
    expect(markup).not.toContain('0đ');
    expect(markup).not.toContain('0 đơn');
  });

  it('does not present empty task counts while source data is loading', () => {
    const element = React.createElement(
      MemoryRouter,
      null,
      React.createElement(UrgentTasksToday, { loading: true })
    );
    const markup = renderToStaticMarkup(element);

    expect(markup).toContain('role="status"');
    expect(markup).not.toContain('0 việc cần xử lý');
    expect(markup).not.toContain('0 đơn');
    expect(markup).not.toContain('0 phản hồi');
  });

  it('does not render zero-valued report totals before customer data is ready', () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(AdminReports))
    );

    expect(markup).toContain('role="status"');
    expect(markup).not.toContain('0đ');
  });
});
