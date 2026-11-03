import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Wallet, Users, Activity, Megaphone, Sparkles, FileSpreadsheet, FileDown, RefreshCw, Info,
  BedDouble, Package, CalendarRange, Share2, TrendingUp, Repeat, Crown, XCircle, Clock, Lightbulb, Flame,
} from 'lucide-react';
import useCustomerData from '../AdminCustomers/useCustomerData';
import { Card, SectionTitle, SegmentBadge } from '../AdminCustomers/shared';
import { formatMoney } from '../AdminCustomers/customerUtils';
import OverviewFilters from '../AdminDashboard/OverviewFilters';
import { useRoomState, ROOM_CONFIG } from '../../../Chi/RoomStateContext';
import { useServiceCatalog } from '../../contexts/ServiceCatalogContext';
import { fetchMarketingMessages, fetchMarketingSettings } from '../../services/marketingApi';
import { MKT_STORAGE_KEYS, loadFromStorage, initialScenarios } from '../AdminMarketing/marketingStore';
import { periodOf } from '../../utils/dashboardReport';
import { computeAdminReport, reportToCsv } from '../../utils/adminReport';
import { todayInVietnam } from '../../utils/bookingDeposit';

const TABS = [
  { id: 'revenue', label: 'Doanh thu', icon: Wallet },
  { id: 'customers', label: 'Khách hàng', icon: Users },
  { id: 'operations', label: 'Vận hành', icon: Activity },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'forecast', label: 'Dự báo & gợi ý', icon: Sparkles },
];

const pct = (n) => `${(Number(n) || 0).toFixed(1)}%`;
const vnDate = (day) => (day ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : '—');

const Stat = ({ icon: Icon, label, value, sub, color = 'text-orange-600 bg-orange-50' }) => (
  <Card className="p-5 break-inside-avoid">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-2xl font-black text-gray-900 break-words">{value}</p>
    <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </Card>
);

const Empty = ({ children }) => (
  <p className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3">{children}</p>
);

// Bảng đơn giản: columns [{ key, label, align, render }]
const Table = ({ columns, rows, empty }) => {
  if (!rows || rows.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50/60">
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-2.5 ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <tr key={row.key ?? i}>
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 ${c.align === 'right' ? 'text-right' : ''} ${c.strong ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Thanh ngang so sánh tỷ lệ
const Bars = ({ rows, valueOf, labelOf, textOf, color = 'bg-orange-500', max = 100 }) => (
  <div className="space-y-3">
    {rows.map((r) => {
      const v = valueOf(r);
      return (
        <div key={r.key}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-semibold text-gray-700">{labelOf(r)}</span>
            <span className="font-bold text-gray-900">{textOf(r)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, max > 0 ? (v / max) * 100 : 0)}%` }} />
          </div>
        </div>
      );
    })}
  </div>
);

const Note = ({ children }) => (
  <div className="flex items-start gap-2 text-xs text-sky-900 bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2.5">
    <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
    <span>{children}</span>
  </div>
);

const RevenueSection = ({ r }) => {
  const maxMonth = Math.max(1, ...r.byMonth.map((m) => m.revenue));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Stat icon={Wallet} label="Tổng doanh thu" value={formatMoney(r.revenue)} sub={`${r.bookings} đơn đã check-out & thanh toán`} />
        <Stat icon={BedDouble} label="Tiền lưu trú" value={formatMoney(r.stay)} sub={`${r.nights} đêm đã bán`} color="text-emerald-600 bg-emerald-50" />
        <Stat icon={Package} label="Dịch vụ thêm" value={formatMoney(r.addon)} sub="Spa, đưa đón, camera, dịch vụ mua thêm" color="text-sky-600 bg-sky-50" />
        <Stat icon={TrendingUp} label="Doanh thu / phòng khả dụng" value={formatMoney(r.revPar)} sub={`RevPAR: tiền lưu trú / ${r.availableNights} đêm phòng`} color="text-purple-600 bg-purple-50" />
      </div>
      <Note>Lợi nhuận cần số chi phí (nhân sự, thức ăn, quảng cáo...). Web chưa có chỗ nhập chi phí nên phần này mới tính doanh thu.</Note>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 break-inside-avoid">
          <SectionTitle icon={BedDouble} title="Theo hạng phòng" subtitle="Giá TB/đêm = tiền lưu trú / số đêm" />
          <Table
            rows={r.byRoom}
            empty="Chưa có đơn đã chốt trong khoảng này."
            columns={[
              { key: 'label', label: 'Hạng phòng', strong: true },
              { key: 'bookings', label: 'Đơn', align: 'right' },
              { key: 'perNight', label: 'Giá TB/đêm', align: 'right', render: (x) => formatMoney(x.perNight) },
              { key: 'revenue', label: 'Doanh thu', align: 'right', strong: true, render: (x) => `${formatMoney(x.revenue)} (${Math.round(x.share)}%)` },
            ]}
          />
        </Card>
        <Card className="p-6 break-inside-avoid">
          <SectionTitle icon={Package} title="Theo dịch vụ" subtitle="Số lần bán và doanh thu ước tính theo giá dịch vụ" />
          <Table
            rows={r.byService}
            empty="Chưa có dịch vụ nào được bán trong khoảng này."
            columns={[
              { key: 'label', label: 'Dịch vụ', strong: true },
              { key: 'category', label: 'Nhóm' },
              { key: 'sold', label: 'Đã bán', align: 'right' },
              { key: 'revenue', label: 'Doanh thu', align: 'right', strong: true, render: (x) => formatMoney(x.revenue) },
            ]}
          />
        </Card>
        <Card className="p-6 break-inside-avoid">
          <SectionTitle icon={CalendarRange} title="Theo mùa / dịp" subtitle="Theo giá mùa, lễ Tết admin đặt ở trang Dịch vụ" />
          <Table
            rows={r.bySeason}
            empty="Chưa có đơn đã chốt trong khoảng này."
            columns={[
              { key: 'label', label: 'Mùa / dịp', strong: true },
              { key: 'bookings', label: 'Đơn', align: 'right' },
              { key: 'revenue', label: 'Doanh thu', align: 'right', strong: true, render: (x) => `${formatMoney(x.revenue)} (${Math.round(x.share)}%)` },
            ]}
          />
        </Card>
        <Card className="p-6 break-inside-avoid">
          <SectionTitle icon={Share2} title="Theo kênh" subtitle="Tin marketing: khách đặt trong 7 ngày sau khi nhận tin" />
          <Table
            rows={r.byChannel}
            empty="Chưa có đơn đã chốt trong khoảng này."
            columns={[
              { key: 'label', label: 'Kênh', strong: true },
              { key: 'bookings', label: 'Đơn', align: 'right' },
              { key: 'revenue', label: 'Doanh thu', align: 'right', strong: true, render: (x) => `${formatMoney(x.revenue)} (${Math.round(x.share)}%)` },
            ]}
          />
        </Card>
      </div>

      <Card className="p-6 break-inside-avoid">
        <SectionTitle icon={BarChart3} title="Doanh thu theo tháng" subtitle="Theo tháng của ngày gửi mèo" />
        {r.byMonth.length === 0 ? <Empty>Chưa có đơn đã chốt trong khoảng này.</Empty> : (
          <Bars
            rows={r.byMonth}
            max={maxMonth}
            valueOf={(m) => m.revenue}
            labelOf={(m) => m.label}
            textOf={(m) => `${formatMoney(m.revenue)} · ${m.bookings} đơn`}
          />
        )}
      </Card>
    </div>
  );
};

const CustomersSection = ({ c }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <Stat icon={Crown} label="Giá trị vòng đời TB (CLV)" value={formatMoney(c.clv)} sub={`Chi tiêu đã chốt TB của ${c.payingCustomers} khách`} />
      <Stat icon={Repeat} label="Tỷ lệ giữ chân" value={pct(c.retentionRate)} sub={`${c.retained}/${c.previousCustomers} khách kỳ trước đặt tiếp kỳ này`} color="text-emerald-600 bg-emerald-50" />
      <Stat icon={Users} label="Tỷ lệ khách quay lại" value={pct(c.returningRate)} sub={`Trên ${c.bookedCustomers} khách đã đặt phòng`} color="text-sky-600 bg-sky-50" />
      <Stat icon={Wallet} label="Doanh thu từ khách trong kỳ" value={formatMoney(c.periodRevenue)} sub={`${c.totalCustomers} khách trong hệ thống`} color="text-purple-600 bg-purple-50" />
    </div>
    <Note>CAC (chi phí để có 1 khách) cần số tiền chi cho quảng cáo theo kênh. Web chưa có chỗ nhập chi phí nên chưa tính được.</Note>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 break-inside-avoid">
        <SectionTitle icon={Users} title="% doanh thu theo nhóm khách" subtitle="Khách mới / Quay lại / VIP (giống trang Khách hàng)" />
        <Bars
          rows={c.bySegment}
          valueOf={(x) => x.share}
          labelOf={(x) => `${x.label} · ${x.customers} khách đặt trong kỳ`}
          textOf={(x) => `${formatMoney(x.revenue)} (${Math.round(x.share)}%)`}
          color="bg-emerald-500"
        />
      </Card>
      <Card className="p-6 break-inside-avoid">
        <SectionTitle icon={Crown} title="Khách chi tiêu nhiều nhất" subtitle="Tổng chi tiêu đã thanh toán từ trước tới nay" />
        <Table
          rows={c.top.map((x) => ({ ...x, key: x.id }))}
          empty="Chưa có khách nào thanh toán."
          columns={[
            { key: 'name', label: 'Khách', strong: true, render: (x) => <span>{x.name}<span className="block text-xs font-normal text-gray-400">{x.phone}</span></span> },
            { key: 'segment', label: 'Nhóm', render: (x) => <SegmentBadge segment={x.segment} /> },
            { key: 'bookings', label: 'Đơn', align: 'right' },
            { key: 'spent', label: 'Chi tiêu', align: 'right', strong: true, render: (x) => formatMoney(x.spent) },
          ]}
        />
      </Card>
    </div>
  </div>
);

const OperationsSection = ({ o }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <Stat icon={BedDouble} label="Tỷ lệ lấp phòng" value={pct(o.occupancyRate)} sub={`${o.roomNights} đêm phòng có mèo ở`} color="text-emerald-600 bg-emerald-50" />
      <Stat icon={Clock} label="Thời gian lưu trú TB" value={`${o.avgStay.toFixed(1)} đêm`} sub={`Trên ${o.stays} đơn gửi trong kỳ`} color="text-sky-600 bg-sky-50" />
      <Stat icon={XCircle} label="Tỷ lệ hủy" value={pct(o.cancelRate)} sub={`${o.cancelled}/${o.placed} đơn đặt trong kỳ`} color="text-rose-600 bg-rose-50" />
      <Stat icon={Activity} label="Lý do hủy phổ biến nhất" value={o.reasons[0]?.label || '—'} sub={o.reasons[0] ? `${o.reasons[0].count} đơn` : 'Chưa có đơn hủy'} color="text-amber-600 bg-amber-50" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 break-inside-avoid">
        <SectionTitle icon={CalendarRange} title="Lấp phòng theo ngày trong tuần" subtitle="Đêm có mèo ở / tổng đêm phòng của thứ đó" />
        <Bars rows={o.byWeekday} valueOf={(x) => x.rate} labelOf={(x) => x.label} textOf={(x) => pct(x.rate)} color="bg-emerald-500" />
      </Card>
      <Card className="p-6 break-inside-avoid">
        <SectionTitle icon={CalendarRange} title="Lấp phòng theo tháng" subtitle="Trong khoảng đang xem" />
        <Bars rows={o.byMonth} valueOf={(x) => x.rate} labelOf={(x) => x.label} textOf={(x) => pct(x.rate)} color="bg-sky-500" />
        <div className="mt-6">
          <SectionTitle icon={XCircle} title="Lý do hủy" />
          <Table
            rows={o.reasons}
            empty="Không có đơn hủy trong khoảng này."
            columns={[
              { key: 'label', label: 'Lý do', strong: true },
              { key: 'count', label: 'Đơn', align: 'right' },
              { key: 'share', label: 'Tỷ trọng', align: 'right', render: (x) => pct(x.share) },
            ]}
          />
        </div>
      </Card>
    </div>
  </div>
);

const MarketingSection = ({ m }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <Stat icon={Crown} label="Kênh mang khách chất lượng nhất" value={m.quality?.label || '—'} sub={m.quality ? `${formatMoney(m.quality.revenuePerCustomer)} / khách · ${Math.round(m.quality.returningRate)}% quay lại` : 'Chưa có đơn trong kỳ'} />
      <Stat icon={Megaphone} label="Chiến dịch hiệu quả nhất" value={m.best?.label || '—'} sub={m.best ? `${m.best.converted} đơn từ ${m.best.sent} tin (${pct(m.best.convertRate)})` : 'Chưa có tin nào thành đơn'} color="text-purple-600 bg-purple-50" />
      <Stat icon={Share2} label="Tin marketing đã gửi" value={m.sent} sub="Web Push đã gửi trong kỳ" color="text-sky-600 bg-sky-50" />
    </div>
    <Card className="p-6 break-inside-avoid">
      <SectionTitle icon={Share2} title="Chất lượng khách theo kênh" subtitle="Không chỉ đếm số khách: so doanh thu trên mỗi khách và tỷ lệ khách quay lại" />
      <Table
        rows={m.byChannel}
        empty="Chưa có đơn trong khoảng này."
        columns={[
          { key: 'label', label: 'Kênh', strong: true },
          { key: 'customers', label: 'Khách', align: 'right' },
          { key: 'bookings', label: 'Đơn', align: 'right' },
          { key: 'revenue', label: 'Doanh thu đã chốt', align: 'right', render: (x) => formatMoney(x.revenue) },
          { key: 'revenuePerCustomer', label: 'Doanh thu / khách', align: 'right', strong: true, render: (x) => formatMoney(x.revenuePerCustomer) },
          { key: 'returningRate', label: 'Khách quay lại', align: 'right', render: (x) => pct(x.returningRate) },
        ]}
      />
    </Card>
    <Card className="p-6 break-inside-avoid">
      <SectionTitle icon={Megaphone} title="Hiệu quả từng chiến dịch" subtitle="Lấy từ nhật ký tin của trang Marketing tự động. Thành đơn = khách đặt trong 7 ngày sau khi nhận tin" />
      <Table
        rows={m.campaigns}
        empty="Chưa gửi tin marketing nào trong khoảng này."
        columns={[
          { key: 'label', label: 'Chiến dịch', strong: true },
          { key: 'sent', label: 'Đã gửi', align: 'right' },
          { key: 'clicked', label: 'Đã bấm', align: 'right' },
          { key: 'converted', label: 'Thành đơn', align: 'right', strong: true, render: (x) => `${x.converted} (${pct(x.convertRate)})` },
          { key: 'revenue', label: 'Doanh thu', align: 'right', render: (x) => formatMoney(x.revenue) },
        ]}
      />
    </Card>
  </div>
);

const ForecastSection = ({ f }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <Stat icon={Flame} label="Công suất đã đặt 30 ngày tới" value={pct(f.next30Occupancy)} sub="Theo đơn đang có ở Tình trạng phòng" />
      <Stat icon={BedDouble} label="Ngày kín 100% (30 ngày tới)" value={`${f.fullDays30} ngày`} color="text-purple-600 bg-purple-50" />
      <Stat icon={CalendarRange} label="Ngày đông nhất sắp tới" value={f.busiest && f.busiest.occupied > 0 ? vnDate(f.busiest.dateStr) : '—'} sub={f.busiest && f.busiest.occupied > 0 ? `${f.busiest.occupied}/${f.busiest.total} phòng` : 'Chưa có đơn sắp tới'} color="text-emerald-600 bg-emerald-50" />
    </div>
    <Card className="p-6 break-inside-avoid">
      <SectionTitle icon={Lightbulb} title="Cao điểm sắp tới & gợi ý" subtitle="Đã đặt = công suất phòng đã có đơn trong dịp đó, so với doanh thu cùng kỳ năm trước" />
      <div className="space-y-3">
        {f.peaks.map((p) => (
          <div key={p.key} className="border border-gray-100 rounded-xl p-4 break-inside-avoid">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold text-gray-800">{p.label}</p>
              <span className="text-xs font-bold text-gray-500">
                {vnDate(p.start)} – {vnDate(p.end)} · {p.daysUntil === 0 ? 'đang diễn ra' : `còn ${p.daysUntil} ngày`}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Đã đặt <b className="text-gray-800">{pct(p.occupancy)}</b> · Cùng kỳ năm trước <b className="text-gray-800">{formatMoney(p.lastYearRevenue)}</b>
            </p>
            <ul className="mt-2 space-y-1">
              {p.tips.map((t) => (
                <li key={t} className="text-sm text-gray-700 flex gap-2"><Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
    <Card className="p-6 break-inside-avoid">
      <SectionTitle icon={BedDouble} title="Hạng phòng & số phòng" subtitle="60 ngày tới, theo đơn đang có" />
      <Table
        rows={f.roomTips.map((x) => ({ ...x, key: x.type }))}
        empty="Chưa cấu hình phòng."
        columns={[
          { key: 'label', label: 'Hạng phòng', strong: true },
          { key: 'rooms', label: 'Số phòng', align: 'right' },
          { key: 'occupancy', label: 'Công suất TB', align: 'right', render: (x) => pct(x.occupancy) },
          { key: 'fullDays', label: 'Ngày kín hết', align: 'right' },
          { key: 'tip', label: 'Gợi ý' },
        ]}
      />
      {f.weekdayTip && (
        <p className="mt-4 text-sm text-gray-700 flex gap-2"><Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{f.weekdayTip}</p>
      )}
    </Card>
  </div>
);

const SECTION = {
  revenue: (rep) => <RevenueSection r={rep.revenue} />,
  customers: (rep) => <CustomersSection c={rep.customers} />,
  operations: (rep) => <OperationsSection o={rep.operations} />,
  marketing: (rep) => <MarketingSection m={rep.marketing} />,
  forecast: (rep) => <ForecastSection f={rep.forecast} />,
};

const AdminReports = () => {
  const { customers = [], loading, lastSyncedAt, refresh } = useCustomerData();
  const { bookings: roomBookings = {}, maintenanceRooms = {} } = useRoomState() || {};
  const { items = [], rules = [] } = useServiceCatalog();

  const [activeTab, setActiveTab] = useState('revenue');
  const [printing, setPrinting] = useState(false);
  const [timePreset, setTimePreset] = useState('quarter');
  const [customRange, setCustomRange] = useState({
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    endDate: todayInVietnam(),
  });
  const [comparePrevious, setComparePrevious] = useState(true);
  const [messages, setMessages] = useState([]);
  const [scenarios, setScenarios] = useState(() => loadFromStorage(MKT_STORAGE_KEYS.SCENARIOS, initialScenarios));

  // Nhật ký tin marketing đã gửi (chỉ đọc, không chạy gửi tin)
  useEffect(() => {
    let cancelled = false;
    fetchMarketingMessages(400).then((res) => { if (!cancelled) setMessages(res.messages || []); }).catch(() => {});
    fetchMarketingSettings().then((res) => {
      if (!cancelled && res.config?.scenarios?.length) setScenarios(res.config.scenarios);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const period = useMemo(() => periodOf(timePreset, customRange), [timePreset, customRange]);
  const report = useMemo(
    () => computeAdminReport({
      customers, range: period.current, rules, items, messages, scenarios, roomBookings, maintenanceRooms, rooms: ROOM_CONFIG,
    }),
    [customers, period, rules, items, messages, scenarios, roomBookings, maintenanceRooms]
  );

  const exportExcel = () => {
    const blob = new Blob([reportToCsv(report)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-meo-vang-nha_${period.current.start}_${period.current.end}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Xuất PDF: in toàn bộ 5 phần, trình duyệt cho chọn "Lưu thành PDF"
  const exportPdf = () => setPrinting(true);
  useEffect(() => {
    if (!printing) return undefined;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    const t = setTimeout(() => window.print(), 300);
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done); };
  }, [printing]);

  return (
    <div className="min-h-screen bg-gray-50/50 admin-report">
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              Báo cáo
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Số liệu từ đơn đặt phòng, hóa đơn, tình trạng phòng, giá mùa / lễ Tết và Marketing tự động · {vnDate(period.current.start)} – {vnDate(period.current.end)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 no-print">
            <span className="text-xs text-gray-400 font-medium">
              {lastSyncedAt ? `Cập nhật lúc ${lastSyncedAt.toLocaleTimeString('vi-VN')}` : 'Đang đồng bộ...'}
            </span>
            <button onClick={refresh} className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </button>
            <button onClick={exportExcel} className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl">
              <FileSpreadsheet className="h-4 w-4" /> Xuất Excel
            </button>
            <button onClick={exportPdf} className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl">
              <FileDown className="h-4 w-4" /> Xuất PDF
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="no-print">
          <OverviewFilters
            timePreset={timePreset}
            setTimePreset={setTimePreset}
            customRange={customRange}
            setCustomRange={setCustomRange}
            comparePrevious={comparePrevious}
            setComparePrevious={setComparePrevious}
            showCompare={false}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-print">
          <div className="flex min-w-max">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === id ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {printing
          ? TABS.map(({ id, label }, i) => (
            <section key={id} className={`space-y-4 ${i > 0 ? 'break-before-page' : ''}`}>
              <h2 className="text-lg font-black text-gray-800">{label}</h2>
              {SECTION[id](report)}
            </section>
          ))
          : SECTION[activeTab](report)}
      </div>
    </div>
  );
};

export default AdminReports;
