import React, { useMemo } from 'react';
import {
  Users, UserPlus, Repeat, PawPrint, BedDouble, Wallet, CalendarCheck, PieChart, Clock, ChevronRight,
} from 'lucide-react';
import { computeStats, formatMoney, formatPercent, formatDate, SEGMENTS, VIP_SPENT, VIP_BOOKINGS } from './customerUtils';
import { Card, SectionTitle, SegmentBadge, Avatar, EmptyState } from './shared';

const SEGMENT_BAR = {
  new: 'bg-gray-300',
  first: 'bg-sky-400',
  returning: 'bg-emerald-500',
  vip: 'bg-orange-500',
};

const StatsTab = ({ customers, onOpenProfile, onOpenList }) => {
  const stats = useMemo(() => computeStats(customers), [customers]);

  if (customers.length === 0) {
    return (
      <EmptyState
        title="Chưa có khách hàng nào"
        description="Khi khách đăng ký tài khoản, tạo hồ sơ mèo hoặc hoàn thành đặt phòng ở giao diện khách hàng, số liệu sẽ tự hiện ở đây."
      />
    );
  }

  const kpis = [
    { label: 'Tổng khách hàng', value: stats.total, sub: `${stats.booked} khách đã đặt phòng`, icon: Users, color: 'from-emerald-400 to-teal-500' },
    { label: 'Khách mới 30 ngày', value: stats.newLast30, sub: 'Tài khoản hoặc đơn đầu tiên', icon: UserPlus, color: 'from-sky-400 to-blue-500' },
    { label: 'Tỷ lệ quay lại', value: formatPercent(stats.returningRate), sub: `${stats.returning}/${stats.booked} khách đặt từ 2 lần`, icon: Repeat, color: 'from-violet-400 to-purple-500' },
    { label: 'Hồ sơ mèo', value: stats.pets, sub: `TB ${(stats.total ? stats.pets / stats.total : 0).toFixed(1)} bé/khách`, icon: PawPrint, color: 'from-amber-400 to-orange-500' },
    { label: 'Khách đang lưu trú', value: stats.staying, sub: 'Có mèo đang ở khách sạn', icon: BedDouble, color: 'from-emerald-500 to-green-600' },
    { label: 'Đơn đặt phòng', value: stats.bookings, sub: 'Không tính đơn đã hủy', icon: CalendarCheck, color: 'from-rose-400 to-pink-500' },
    { label: 'Doanh thu từ khách', value: formatMoney(stats.revenue), sub: 'Tổng giá trị các đơn', icon: Wallet, color: 'from-orange-400 to-red-500' },
    { label: 'Chi tiêu TB / khách', value: formatMoney(stats.avgSpent), sub: 'Trên khách đã đặt phòng', icon: Wallet, color: 'from-teal-400 to-cyan-500' },
  ];

  const recent = customers.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-6 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center shadow-md mb-4`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 break-words">{k.value}</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">{k.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionTitle
            icon={PieChart}
            title="Phân loại khách hàng"
            subtitle={`VIP: từ ${VIP_BOOKINGS} đơn hoặc chi tiêu từ ${formatMoney(VIP_SPENT)}. Quay lại: từ 2 đơn.`}
          />
          <div className="space-y-4">
            {stats.segments.map(({ key, count }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-700">{SEGMENTS[key].label}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {count} <span className="text-xs font-medium text-gray-400">({formatPercent(stats.total ? count / stats.total : 0)})</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${SEGMENT_BAR[key]} transition-all`}
                    style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle
            icon={Clock}
            title="Khách hàng hoạt động gần đây"
            subtitle="Vừa đăng ký, tạo hồ sơ mèo hoặc đặt phòng"
            action={(
              <button onClick={onOpenList} className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1">
                Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          />
          <div className="divide-y divide-gray-50">
            {recent.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpenProfile(c.id)}
                className="w-full flex items-center gap-3 py-3 text-left hover:bg-orange-50/40 rounded-xl px-2 -mx-2 transition-colors"
              >
                <Avatar name={c.fullName} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{c.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {c.phone || c.email || '—'} · {c.pets.length} bé mèo · {c.bookingCount} đơn
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <SegmentBadge segment={c.segment} />
                  <p className="text-[11px] text-gray-400 mt-1">{formatDate(c.lastBookingAt || c.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StatsTab;
