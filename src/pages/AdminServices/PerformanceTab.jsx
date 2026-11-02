import React, { useMemo } from 'react';
import { TrendingUp, ShoppingBag, Link2, Lightbulb } from 'lucide-react';
import { useServiceCatalog } from '../../contexts/ServiceCatalogContext';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { computeServicePerformance, formatVnd } from '../../utils/serviceCatalog';
import { withoutDemoBookings } from '../../utils/demoBookings';

const pct = (x) => `${Math.round((x || 0) * 100)}%`;

const Kpi = ({ icon: Icon, label, value, hint }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1"><Icon className="w-4 h-4 text-orange-500" /> {label}</div>
    <p className="text-2xl font-black text-gray-800">{value}</p>
    {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

const PerformanceTab = () => {
  const { items } = useServiceCatalog();
  const { globalBookingList } = useBookingHistory();
  const bookings = useMemo(() => withoutDemoBookings(globalBookingList || []), [globalBookingList]);
  const perf = useMemo(() => computeServicePerformance(bookings, items), [bookings, items]);
  const maxSold = Math.max(1, ...perf.services.map((s) => s.sold));
  const best = perf.services.find((s) => s.sold > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi icon={ShoppingBag} label="Đơn được tính" value={perf.totalBookings} hint="Không tính đơn đã huỷ" />
        <Kpi icon={TrendingUp} label="Bán chạy nhất" value={best ? best.sold : 0} hint={best ? best.name : 'Chưa có đơn'} />
        <Kpi icon={Link2} label="Đơn có mua kèm" value={pct(perf.addonRate)} hint="Có thêm spa, đưa đón hoặc camera" />
        <Kpi icon={TrendingUp} label="Doanh thu ước tính" value={formatVnd(perf.services.reduce((s, x) => s + x.revenue, 0))} hint="Theo giá hiện tại" />
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <h2 className="font-extrabold text-gray-800 px-5 pt-5">Số lần bán & tỷ lệ mua kèm từng dịch vụ</h2>
        <p className="text-xs text-gray-400 px-5 mb-3">Tỷ lệ mua kèm = trong các đơn có dịch vụ này, bao nhiêu % có mua thêm dịch vụ khác</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-5 py-2">Dịch vụ</th>
                <th className="text-left px-3 py-2 w-48">Số lần bán</th>
                <th className="text-right px-3 py-2">Doanh thu ước tính</th>
                <th className="text-right px-3 py-2">Mua kèm</th>
                <th className="text-left px-5 py-2">Hay đi cùng</th>
              </tr>
            </thead>
            <tbody>
              {perf.services.map((s) => (
                <tr key={s.id} className="border-t border-gray-100" data-testid={`perf-row-${s.id}`}>
                  <td className="px-5 py-2.5">
                    <p className="font-semibold text-gray-800">{s.name}</p>
                    <p className="text-[11px] text-gray-400">{s.category}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-400 rounded-full" style={{ width: `${(s.sold / maxSold) * 100}%` }} /></div>
                      <span className="font-bold text-gray-700 w-6 text-right">{s.sold}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{formatVnd(s.revenue)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{s.sold ? pct(s.attachRate) : '–'}</td>
                  <td className="px-5 py-2.5 text-xs text-gray-600">
                    {s.topPartners.length === 0 ? <span className="text-gray-300">–</span> : s.topPartners.map((p) => `${p.name} (${pct(p.rate)})`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-extrabold text-gray-800 mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> Gợi ý upsell theo hạng phòng</h2>
        {perf.upsell.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có đơn đặt phòng nào để phân tích.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {perf.upsell.map((u) => (
              <div key={u.room} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4" data-testid={`upsell-${u.room}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800">Phòng {u.room}</h3>
                  <span className="text-xs text-gray-400">{u.bookings} đơn</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1 mb-3">
                  {u.addons.slice(0, 4).map((a) => (
                    <li key={a.id} className="flex justify-between"><span>{a.name}</span><span className="font-semibold">{pct(a.rate)}</span></li>
                  ))}
                  {u.addons.length === 0 && <li className="text-gray-400">Chưa mua kèm dịch vụ nào</li>}
                </ul>
                <p className="text-xs bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-2.5">{u.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PerformanceTab;
