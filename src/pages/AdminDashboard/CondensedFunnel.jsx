import React, { useMemo } from 'react';
import { Filter, TrendingDown, Users, ChevronRight, Lightbulb } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { formatPercent } from '../AdminCustomers/customerUtils';

const STEP_COLORS = ['bg-emerald-500', 'bg-emerald-400', 'bg-orange-400', 'bg-orange-500', 'bg-amber-500'];

const CondensedFunnel = ({ customers = [] }) => {
  const location = useLocation();
  const isDirectAdminRoute = location.pathname.startsWith('/admin');
  const customersPath = isDirectAdminRoute ? '/admin/customers' : '/customers';

  // Tính 5 tầng phễu
  const steps = useMemo(() => {
    const total = customers.length;
    const hasPet = customers.filter((c) => (c.pets || []).length > 0).length;
    const booked = customers.filter((c) => (c.bookingCount || 0) > 0).length;
    const completed = customers.filter((c) => (c.completedCount || 0) > 0).length;
    const returning = customers.filter((c) => (c.bookingCount || 0) >= 2).length;

    const rawSteps = [
      { key: 'account', label: '1. Khách ghi nhận', count: total, hint: 'Tài khoản / SĐT đã lưu' },
      { key: 'pet', label: '2. Có hồ sơ mèo', count: hasPet, hint: 'Đã tạo ít nhất 1 hồ sơ bé' },
      { key: 'booked', label: '3. Đã đặt phòng', count: booked, hint: 'Hoàn thành đặt phòng' },
      { key: 'completed', label: '4. Hoàn tất lưu trú', count: completed, hint: 'Đã hoàn tất kỳ nghỉ' },
      { key: 'returning', label: '5. Quay lại đặt tiếp', count: returning, hint: 'Từ 2 đơn trở lên' },
    ];

    return rawSteps.map((s, idx) => {
      const prev = idx === 0 ? s.count : rawSteps[idx - 1].count;
      return {
        ...s,
        ofTotal: total > 0 ? s.count / total : 0,
        fromPrev: prev > 0 ? Math.min(1, s.count / prev) : 0,
      };
    });
  }, [customers]);

  // Bước rơi khách nhiều nhất
  const biggestDrop = useMemo(() => {
    return steps.slice(1).reduce(
      (worst, step, i) => {
        const lost = steps[i].count - step.count;
        return lost > worst.lost ? { lost, from: steps[i], to: step } : worst;
      },
      { lost: 0, from: null, to: null }
    );
  }, [steps]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Filter className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 font-title">
              Phễu chuyển đổi thu gọn
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            Số lượng khách ở mỗi tầng & tỷ lệ chuyển đổi xuyên suốt hành trình
          </p>
        </div>

        <Link
          to={customersPath}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 shrink-0"
        >
          Quản lý khách <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Funnel Progress Bars */}
      <div className="space-y-3.5 my-2">
        {steps.map((step, idx) => (
          <div key={step.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-gray-800 truncate">{step.label}</span>
                {idx > 0 && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    (từ tầng trước: <b className="text-gray-600">{formatPercent(step.fromPrev)}</b>)
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="font-black text-gray-900 text-sm">{step.count}</span>
                <span className="text-[11px] font-bold text-gray-400 ml-1">
                  ({formatPercent(step.ofTotal)})
                </span>
              </div>
            </div>

            {/* Thanh bar */}
            <div className="h-6 rounded-xl bg-gray-100 overflow-hidden relative">
              <div
                className={`h-full rounded-xl ${STEP_COLORS[idx]} transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${Math.max(step.ofTotal * 100, step.count > 0 ? 5 : 0)}%` }}
              >
                {step.count > 0 && (
                  <span className="text-[10px] font-extrabold text-white drop-shadow-xs">
                    {formatPercent(step.ofTotal)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nhận xét & Footer CTA */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-orange-50/50 p-3.5 rounded-2xl border border-orange-100">
        <div className="flex items-center gap-2 text-xs text-orange-950">
          <Lightbulb className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            {biggestDrop.lost > 0 ? (
              <>
                Rơi rụng nhiều nhất ở <b>{biggestDrop.from.label}</b> → <b>{biggestDrop.to.label}</b> (mất {biggestDrop.lost} khách).
              </>
            ) : (
              'Tỷ lệ chuyển đổi qua các tầng đang duy trì rất tốt!'
            )}
          </span>
        </div>

        <Link
          to={customersPath}
          className="text-xs font-bold text-orange-600 hover:text-orange-800 hover:underline shrink-0 font-title"
        >
          Xem chi tiết khách hàng →
        </Link>
      </div>
    </div>
  );
};

export default CondensedFunnel;
