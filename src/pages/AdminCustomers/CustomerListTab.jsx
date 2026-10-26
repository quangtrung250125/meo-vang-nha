import React, { useMemo, useState } from 'react';
import { Search, ChevronRight, PawPrint, CalendarCheck } from 'lucide-react';
import { SEGMENTS, formatMoney, formatDate, normalizePhone } from './customerUtils';
import { Card, SegmentBadge, Avatar, EmptyState } from './shared';

const SORTS = {
  recent: { label: 'Hoạt động gần nhất', fn: (a, b) => b.lastActivity - a.lastActivity },
  spent: { label: 'Chi tiêu cao nhất', fn: (a, b) => b.totalSpent - a.totalSpent },
  bookings: { label: 'Nhiều đơn nhất', fn: (a, b) => b.bookingCount - a.bookingCount },
  name: { label: 'Tên A → Z', fn: (a, b) => a.fullName.localeCompare(b.fullName, 'vi') },
};

const CustomerListTab = ({ customers, onOpenProfile }) => {
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('all');
  const [sort, setSort] = useState('recent');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qPhone = normalizePhone(q);
    return customers
      .filter((c) => segment === 'all' || c.segment === segment)
      .filter((c) => {
        if (!q) return true;
        return (
          c.fullName.toLowerCase().includes(q)
          || (c.email || '').toLowerCase().includes(q)
          || (qPhone && normalizePhone(c.phone).includes(qPhone))
          || c.pets.some((p) => (p.name || '').toLowerCase().includes(q))
        );
      })
      .sort(SORTS[sort].fn);
  }, [customers, query, segment, sort]);

  if (customers.length === 0) {
    return <EmptyState title="Chưa có khách hàng nào" description="Khách đăng ký hoặc đặt phòng sẽ tự xuất hiện trong danh sách này." />;
  }

  return (
    <Card>
      {/* Bộ lọc */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại, email hoặc tên mèo"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[['all', 'Tất cả'], ...Object.entries(SEGMENTS).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSegment(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                segment === key ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-white"
            aria-label="Sắp xếp"
          >
            {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-10 text-center text-sm text-gray-500">Không có khách hàng phù hợp với bộ lọc.</p>
      ) : (
        <>
          {/* Bảng trên máy tính */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50/60">
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Liên hệ</th>
                  <th className="px-5 py-3 text-center">Mèo</th>
                  <th className="px-5 py-3 text-center">Đơn</th>
                  <th className="px-5 py-3 text-right">Tổng chi tiêu</th>
                  <th className="px-5 py-3">Đặt gần nhất</th>
                  <th className="px-5 py-3">Nhóm</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onOpenProfile(c.id)}
                    className="cursor-pointer hover:bg-orange-50/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.fullName} />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">{c.fullName}</p>
                          <p className="text-xs text-gray-400">Từ {formatDate(c.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-700">{c.phone || '—'}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.email}</p>
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-gray-700">{c.pets.length}</td>
                    <td className="px-5 py-3 text-center font-semibold text-gray-700">{c.bookingCount}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900">{formatMoney(c.totalSpent)}</td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(c.lastBookingAt)}</td>
                    <td className="px-5 py-3"><SegmentBadge segment={c.segment} /></td>
                    <td className="px-5 py-3 text-gray-300"><ChevronRight className="h-4 w-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Thẻ trên điện thoại */}
          <div className="md:hidden divide-y divide-gray-50">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpenProfile(c.id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-orange-50/40"
              >
                <Avatar name={c.fullName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800 truncate">{c.fullName}</p>
                    <SegmentBadge segment={c.segment} />
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.phone || c.email || '—'}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="inline-flex items-center gap-1"><PawPrint className="h-3 w-3" />{c.pets.length}</span>
                    <span className="inline-flex items-center gap-1"><CalendarCheck className="h-3 w-3" />{c.bookingCount}</span>
                    <span className="font-bold text-gray-800">{formatMoney(c.totalSpent)}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
        Hiển thị {filtered.length}/{customers.length} khách hàng. Bấm vào một khách để xem hồ sơ.
      </div>
    </Card>
  );
};

export default CustomerListTab;
