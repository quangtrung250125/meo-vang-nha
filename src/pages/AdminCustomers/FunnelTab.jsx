import React, { useMemo } from 'react';
import { Filter, TrendingDown, Lightbulb, ChevronRight } from 'lucide-react';
import { computeFunnel, formatPercent } from './customerUtils';
import { Card, SectionTitle, EmptyState } from './shared';

const STEP_COLORS = ['bg-emerald-500', 'bg-emerald-400', 'bg-orange-400', 'bg-orange-500', 'bg-amber-500'];

const FunnelTab = ({ customers, onOpenList }) => {
  const steps = useMemo(() => computeFunnel(customers), [customers]);

  if (customers.length === 0) {
    return <EmptyState title="Chưa có dữ liệu cho phễu chuyển đổi" description="Phễu sẽ hiện khi có khách hàng đầu tiên." />;
  }

  // Bước rơi rụng nhiều nhất (so với bước trước)
  const biggestDrop = steps.slice(1).reduce(
    (worst, step, i) => {
      const lost = steps[i].count - step.count;
      return lost > worst.lost ? { lost, from: steps[i], to: step } : worst;
    },
    { lost: 0, from: null, to: null }
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="p-6 xl:col-span-2">
        <SectionTitle
          icon={Filter}
          title="Phễu chuyển đổi khách hàng"
          subtitle="Từ lúc khách xuất hiện đến khi quay lại đặt tiếp"
        />
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={step.key}>
              {i > 0 && (
                <div className="flex items-center gap-2 pl-3 py-1 text-xs text-gray-400">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>
                    Chuyển tiếp <b className="text-gray-600">{formatPercent(step.fromPrev)}</b>
                    {steps[i - 1].count - step.count > 0 && ` · rời đi ${steps[i - 1].count - step.count} khách`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-orange-50 text-orange-600 font-black text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{step.label}</p>
                      <p className="text-xs text-gray-400 truncate">{step.hint}</p>
                    </div>
                    <p className="text-sm font-black text-gray-900 shrink-0">
                      {step.count} <span className="text-xs font-semibold text-gray-400">({formatPercent(step.ofTotal)})</span>
                    </p>
                  </div>
                  <div className="h-8 rounded-xl bg-gray-50 overflow-hidden">
                    <div
                      className={`h-full rounded-xl ${STEP_COLORS[i]} transition-all`}
                      style={{ width: `${Math.max(step.ofTotal * 100, step.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <SectionTitle icon={Lightbulb} title="Nhận xét nhanh" />
          {biggestDrop.lost > 0 ? (
            <p className="text-sm text-gray-600 leading-relaxed">
              Khách rơi nhiều nhất ở bước <b className="text-gray-800">{biggestDrop.from.label}</b> →{' '}
              <b className="text-gray-800">{biggestDrop.to.label}</b>: mất {biggestDrop.lost} khách
              ({formatPercent(1 - biggestDrop.to.fromPrev)}).
            </p>
          ) : (
            <p className="text-sm text-gray-600">Chưa có bước nào bị rơi khách.</p>
          )}
          <div className="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
            <p className="text-xs font-bold text-orange-700 mb-1">Tổng chuyển đổi</p>
            <p className="text-2xl font-black text-orange-600">{formatPercent(steps[2].ofTotal)}</p>
            <p className="text-xs text-orange-700/80 mt-0.5">khách ghi nhận đã đặt phòng</p>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-bold text-gray-800">Xem chi tiết từng khách</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">Lọc theo nhóm khách trong danh sách để chăm sóc đúng người.</p>
          <button
            onClick={onOpenList}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-sm transition-colors"
          >
            Danh sách khách hàng <ChevronRight className="h-4 w-4" />
          </button>
        </Card>
      </div>
    </div>
  );
};

export default FunnelTab;
