import React from 'react';
import { 
  DollarSign, ShoppingBag, BedDouble, 
  TrendingUp, TrendingDown, Users, UserCheck, 
  XCircle, Minus, Sparkles
} from 'lucide-react';

/**
 * Format tiền tệ VNĐ
 */
const formatMoney = (val) => {
  return `${Math.round(val || 0).toLocaleString('vi-VN')}đ`;
};

/**
 * Component hiển thị badge % tăng giảm so với kỳ trước
 */
const DiffBadge = ({ diff, isInverse = false }) => {
  if (diff === null || diff === undefined || isNaN(diff)) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
        <Minus className="w-3 h-3" /> —
      </span>
    );
  }

  const isZero = Math.abs(diff) < 0.1;
  if (isZero) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  }

  const isPositive = diff > 0;
  // Với tỷ lệ hủy (isInverse = true), giảm là tốt (xanh lá), tăng là xấu (đỏ)
  const isGood = isInverse ? !isPositive : isPositive;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
        isGood
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
          : 'bg-rose-50 text-rose-700 border border-rose-200/80'
      }`}
    >
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
    </span>
  );
};

const KpiMetricsGrid = ({ metrics, comparePrevious = true }) => {
  const cards = [
    {
      id: 'revenue',
      title: 'Doanh thu',
      value: formatMoney(metrics.revenue.current),
      diff: metrics.revenue.diff,
      prevValue: formatMoney(metrics.revenue.previous),
      icon: DollarSign,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      hint: 'Đơn đã check-out & thanh toán, theo ngày gửi',
    },
    {
      id: 'bookings',
      title: 'Số đơn',
      value: `${metrics.bookingCount.current} đơn`,
      diff: metrics.bookingCount.diff,
      prevValue: `${metrics.bookingCount.previous} đơn`,
      icon: ShoppingBag,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      hint: 'Đặt trong kỳ, không tính đơn hủy',
    },
    {
      id: 'occupancy',
      title: 'Tỷ lệ lấp phòng',
      value: `${metrics.occupancyRate.current.toFixed(1)}%`,
      diff: metrics.occupancyRate.diff,
      prevValue: `${metrics.occupancyRate.previous.toFixed(1)}%`,
      icon: BedDouble,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      hint: 'Đêm có mèo ở / tổng đêm phòng',
    },
    {
      id: 'adr',
      title: 'Doanh thu/phòng/đêm',
      value: formatMoney(metrics.adr.current),
      diff: metrics.adr.diff,
      prevValue: formatMoney(metrics.adr.previous),
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      hint: 'Tiền lưu trú / số đêm đã bán (ADR)',
    },
    {
      id: 'new_customers',
      title: 'Số khách mới',
      value: `${metrics.newCustomers.current} khách`,
      diff: metrics.newCustomers.diff,
      prevValue: `${metrics.newCustomers.previous} khách`,
      icon: Users,
      color: 'from-sky-500 to-blue-500',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-600',
      hint: 'Đơn đầu tiên đặt trong kỳ',
    },
    {
      id: 'returning_customers',
      title: 'Số khách quay lại',
      value: `${metrics.returningCustomers.current} khách`,
      diff: metrics.returningCustomers.diff,
      prevValue: `${metrics.returningCustomers.previous} khách`,
      icon: UserCheck,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      hint: 'Đặt trong kỳ, đã từng đặt trước đó',
    },
    {
      id: 'cancel_rate',
      title: 'Tỷ lệ hủy',
      value: `${metrics.cancelRate.current.toFixed(1)}%`,
      diff: metrics.cancelRate.diff,
      prevValue: `${metrics.cancelRate.previous.toFixed(1)}%`,
      icon: XCircle,
      color: 'from-rose-500 to-red-500',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
      isInverse: true,
      hint: 'Đơn hủy / đơn đặt trong kỳ',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            {/* Top row: Icon & Title & Diff */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${card.bgColor} ${card.textColor} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.title}</h3>
                  <p className="text-[11px] text-gray-400 font-medium">{card.hint}</p>
                </div>
              </div>
              {comparePrevious && <DiffBadge diff={card.diff} isInverse={card.isInverse} />}
            </div>

            {/* Middle row: Big Value */}
            <div className="pt-1 pb-1">
              <p className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight font-title">
                {card.value}
              </p>
            </div>

            {/* Bottom row: Compare hint */}
            {comparePrevious && (
              <div className="pt-2 border-t border-gray-100/80 flex items-center justify-between text-xs text-gray-400">
                <span>Kỳ trước:</span>
                <span className="font-semibold text-gray-600">{card.prevValue}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KpiMetricsGrid;
