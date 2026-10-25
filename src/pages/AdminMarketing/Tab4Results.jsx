import React, { useState } from 'react';
import { Send, Eye, MousePointerClick, ShoppingCart, TrendingUp, DollarSign, Filter } from 'lucide-react';
import { formatCurrency, formatPercent } from './marketingStore';

const TIME_FILTERS = [
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: '90d', label: '90 ngày' },
];

const FunnelBar = ({ label, value, total, color, icon: Icon }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color.includes('sky') ? '#0ea5e9' : color.includes('emerald') ? '#10b981' : color.includes('purple') ? '#a855f7' : '#f97316' }} />
      </div>
      <p className="text-xl font-black text-gray-800">{value.toLocaleString()}</p>
      <p className="text-xs font-bold text-gray-500 text-center leading-tight">{label}</p>
      <p className="text-xs text-gray-400">{formatPercent(pct)}</p>
    </div>
  );
};

const Tab4Results = ({ results }) => {
  const [timeFilter, setTimeFilter] = useState('30d');
  const s = results.summary;

  const funnelSteps = [
    { label: 'Đã gửi', value: s.sent, color: 'bg-sky-100 text-sky-600', icon: Send },
    { label: 'Đã mở', value: s.opened, color: 'bg-emerald-100 text-emerald-600', icon: Eye },
    { label: 'Đã bấm', value: s.clicked, color: 'bg-purple-100 text-purple-600', icon: MousePointerClick },
    { label: 'Thành đơn', value: s.converted, color: 'bg-orange-100 text-orange-600', icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      {/* CẢNH BÁO: Dữ liệu mẫu */}
      <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 font-medium">
        ⚠️ Dữ liệu mẫu — chưa nối với hệ thống tracking tin nhắn thật. Sau khi kết nối, biểu đồ sẽ cập nhật theo thời gian thực.
      </div>

      {/* Bộ lọc thời gian */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 mr-1">Lọc theo:</span>
        {TIME_FILTERS.map(f => (
          <button key={f.id} onClick={() => setTimeFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${timeFilter === f.id ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-500 hover:border-emerald-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Funnel: Phễu chuyển đổi */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-6">Phễu chuyển đổi</h3>
        <div className="flex items-start gap-4 overflow-x-auto pb-2">
          {funnelSteps.map((step, i) => (
            <React.Fragment key={i}>
              <FunnelBar {...step} total={s.sent} />
              {i < funnelSteps.length - 1 && (
                <div className="text-gray-300 text-2xl font-light mt-5 shrink-0">›</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-bold text-gray-800">Doanh thu từ chiến dịch:</span>
          <span className="text-lg font-black text-orange-600">{formatCurrency(s.revenue)}</span>
        </div>
      </div>

      {/* Bảng theo kịch bản */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Kết quả theo kịch bản</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Kịch bản</th>
                <th className="text-right px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Đã gửi</th>
                <th className="text-right px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Đã mở</th>
                <th className="text-right px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Đã bấm</th>
                <th className="text-right px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Đơn</th>
                <th className="text-right px-5 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.byScenario.map(row => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-bold text-gray-800">{row.name}</td>
                  <td className="px-4 py-3.5 text-right text-sm text-gray-700">{row.sent.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm text-gray-700">{row.opened.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">({row.sent > 0 ? formatPercent(row.opened / row.sent * 100) : '0%'})</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm text-gray-700">{row.clicked.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">({row.sent > 0 ? formatPercent(row.clicked / row.sent * 100) : '0%'})</span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-bold text-emerald-700">{row.converted}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-orange-600">{row.revenue > 0 ? formatCurrency(row.revenue) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-5 py-3.5 text-sm font-black text-gray-800">Tổng</td>
                <td className="px-4 py-3.5 text-right text-sm font-black text-gray-800">{s.sent.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right text-sm font-black text-gray-800">{s.opened.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right text-sm font-black text-gray-800">{s.clicked.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-right text-sm font-black text-emerald-700">{s.converted}</td>
                <td className="px-5 py-3.5 text-right text-sm font-black text-orange-600">{formatCurrency(s.revenue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tab4Results;
