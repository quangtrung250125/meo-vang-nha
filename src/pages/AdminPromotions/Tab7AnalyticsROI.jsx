import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Eye,
  CheckCircle2,
  Download,
  Filter,
  PieChart,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  formatCurrency,
  exportDataToExcelCSV
} from './promotionsStore';

const PERIODS = [
  { id: '7days', label: '7 ngày qua' },
  { id: '30days', label: '30 ngày qua' },
  { id: 'quarter', label: 'Quý này (Q4/2026)' },
  { id: 'year', label: 'Năm nay (2026)' },
];

const Tab7AnalyticsROI = ({ analyticsData, promotions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedProgram, setSelectedProgram] = useState('all');

  const {
    summary,
    weeklyUsage,
    customerDistribution,
    campaignPerformance
  } = analyticsData;

  // Lọc bảng hiệu quả chiến dịch
  const filteredPerformance = campaignPerformance.filter((perf) => {
    if (selectedProgram === 'all') return true;
    return perf.campaignName.toLowerCase().includes(selectedProgram.toLowerCase());
  });

  // Xuất file Excel / CSV UTF-8
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Tên chương trình ưu đãi',
      'Phân loại chiến dịch',
      'Lượt áp dụng (Lần)',
      'Doanh thu tăng thêm (VNĐ)',
      'Chi phí ưu đãi (VNĐ)',
      'Lợi nhuận ròng (VNĐ)',
      'Tỉ suất ROI (%)',
      'Đánh giá hiệu quả',
    ];

    const rows = filteredPerformance.map((p, idx) => [
      idx + 1,
      p.campaignName,
      p.type,
      p.redemptions,
      p.incrementalRevenue,
      p.promotionCost,
      p.netProfit,
      `${p.roi}%`,
      p.rating,
    ]);

    exportDataToExcelCSV(headers, rows, `hieu-qua-khuyen-mai-${selectedPeriod}.csv`);
    toast.success('Đã xuất file báo cáo hiệu quả thành công! Bạn có thể mở trực tiếp trong Excel.');
  };

  // Tìm tuần có số lượt dùng cao nhất để tính chiều cao cột biểu đồ
  const maxWeeklyUsage = Math.max(...weeklyUsage.map((w) => w.count), 100);

  return (
    <div className="space-y-6">
      {/* 1. Header & Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Lọc kỳ */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                toast.success(`Đã cập nhật kỳ báo cáo: ${PERIODS.find((p) => p.id === e.target.value)?.label}`);
              }}
              className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-gray-700 cursor-pointer"
            >
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc chương trình */}
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">Tất cả chương trình</option>
              {promotions.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nút xuất Excel */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Xuất báo cáo Excel</span>
        </button>
      </div>

      {/* 2. Thẻ số liệu KPI chính (Lượt xem, Lượt dùng, Doanh thu, Chi phí, ROI) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Lượt xem ưu đãi</span>
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-gray-800">
            {summary.views.toLocaleString('vi-VN')}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
            +18% so với kỳ trước
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Lượt dùng mã</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-800">
            {summary.redemptions} <span className="text-xs font-normal text-gray-400">lượt</span>
          </p>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            Tỉ lệ đổi: ~{((summary.redemptions / summary.views) * 100).toFixed(1)}%
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Doanh thu tăng thêm</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-xl font-black text-gray-800">
            {formatCurrency(summary.incrementalRevenue)}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
            +32.4 triệu so với tháng trước
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Chi phí ưu đãi</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-600">
            {formatCurrency(summary.promotionsCost)}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            Chiếm {((summary.promotionsCost / summary.incrementalRevenue) * 100).toFixed(1)}% doanh thu
          </span>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl text-white shadow-md col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-emerald-100 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tỉ suất ROI</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-3xl font-black text-amber-300">
            +{summary.roiPercent}%
          </p>
          <span className="text-[11px] text-emerald-100 mt-1 inline-block leading-tight">
            Mỗi 1đ ưu đãi mang lại 4.54đ doanh thu ròng
          </span>
        </div>
      </div>

      {/* 3. Biểu đồ lượt dùng theo tuần & Tỉ lệ khách mới / khách cũ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3A. Biểu đồ lượt dùng theo tuần (2 cột) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-500" />
                Lượt dùng ưu đãi theo tuần
              </h4>
              <span className="text-xs text-gray-400">Đơn vị: lượt áp dụng</span>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Xu hướng sử dụng voucher và ưu đãi tăng mạnh vào giai đoạn cuối tuần
            </p>
          </div>

          {/* Biểu đồ cột trực quan */}
          <div className="flex items-end justify-between gap-3 pt-6 pb-2 h-56 border-b border-gray-100">
            {weeklyUsage.map((w, idx) => {
              const heightPercent = Math.round((w.count / maxWeeklyUsage) * 100);
              const isLatest = idx === weeklyUsage.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip khi hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-gray-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-md z-10">
                    <p>{w.count} lượt dùng</p>
                    <p className="text-amber-300 text-[10px]">{formatCurrency(w.revenue)}</p>
                  </div>

                  {/* Cột biểu đồ */}
                  <div className="w-full max-w-[48px] bg-gray-100 rounded-2xl overflow-hidden h-40 flex items-end">
                    <div
                      className={`w-full transition-all duration-700 rounded-t-xl ${
                        isLatest
                          ? 'bg-gradient-to-t from-orange-500 to-amber-400'
                          : 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Nhãn tuần */}
                  <span className="text-[11px] font-medium text-gray-500 text-center line-clamp-1">
                    {w.week.split(' ')[1]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
              Các tuần trước
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-orange-500 inline-block" />
              Tuần hiện tại
            </span>
          </div>
        </div>

        {/* 3B. Tỉ lệ khách mới vs Khách cũ */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-1">
              <PieChart className="w-4 h-4 text-orange-500" />
              Tỉ lệ Khách mới / Khách cũ
            </h4>
            <p className="text-xs text-gray-500 mb-6">
              Phân bổ khách hàng sử dụng mã ưu đãi trong kỳ
            </p>

            <div className="space-y-4">
              {/* Khách cũ */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-gray-700">Khách cũ quay lại & Thân thiết</span>
                  <span className="font-black text-emerald-600">
                    {customerDistribution.returningCustomersPercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${customerDistribution.returningCustomersPercent}%` }}
                  />
                </div>
              </div>

              {/* Khách mới */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-gray-700">Khách hàng mới lần đầu</span>
                  <span className="font-black text-orange-500">
                    {customerDistribution.newCustomersPercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${customerDistribution.newCustomersPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 mt-6 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Đánh giá chuyên sâu:
            </span>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Chiến dịch "Đón Boss Lần Đầu" mang lại 44% khách mới với chi phí chuyển đổi tối ưu. Tỉ lệ khách cũ quay lại (56%) phản ánh mức độ hài lòng cao từ chính sách tích điểm.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Bảng ROI chi tiết từng chương trình */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Bảng phân tích ROI & Hiệu quả từng chương trình
            </h3>
            <p className="text-xs text-gray-500">
              ROI = (Doanh thu tăng thêm - Chi phí ưu đãi) / Chi phí ưu đãi
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Chương trình ưu đãi</th>
                <th className="py-3.5 px-4">Phân loại</th>
                <th className="py-3.5 px-4 text-center">Lượt dùng</th>
                <th className="py-3.5 px-4">Doanh thu mang lại</th>
                <th className="py-3.5 px-4">Chi phí ưu đãi</th>
                <th className="py-3.5 px-4">Lợi nhuận ròng</th>
                <th className="py-3.5 px-4 text-center">ROI (%)</th>
                <th className="py-3.5 px-4 text-right">Đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPerformance.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-800">
                    {p.campaignName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                      {p.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                    {p.redemptions}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-800">
                    {formatCurrency(p.incrementalRevenue)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-rose-600">
                    {formatCurrency(p.promotionCost)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">
                    {formatCurrency(p.netProfit)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-0.5 font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +{p.roi}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${p.ratingCls}`}>
                      {p.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tab7AnalyticsROI;
