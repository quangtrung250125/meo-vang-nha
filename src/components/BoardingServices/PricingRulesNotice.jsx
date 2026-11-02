// Bảng giá theo mùa / cuối tuần / lễ Tết & giảm giá: khách thấy đúng các quy tắc admin đang bật
import React from 'react';
import { CalendarClock, Percent } from 'lucide-react';
import { useServiceCatalog } from '../../contexts/ServiceCatalogContext';
import { describeRule, RULE_TYPES } from '../../utils/serviceCatalog';

const PricingRulesNotice = () => {
  const { activeRules } = useServiceCatalog();
  if (!activeRules || activeRules.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto mb-10 px-1" data-testid="pricing-rules-notice">
      <div className="bg-white border border-amber-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-text-dark text-base sm:text-lg">Giá theo mùa, cuối tuần, lễ Tết & ưu đãi đang áp dụng</h3>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {activeRules.map((rule) => (
            <li key={rule.id} className="flex items-start gap-2 text-sm bg-amber-50/60 border border-amber-100 rounded-2xl px-3 py-2">
              <Percent className={`w-4 h-4 mt-0.5 shrink-0 ${rule.type === 'discount' ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>
                <span className="font-semibold text-text-dark">{rule.name}</span>
                <span className="text-gray-500"> · {RULE_TYPES[rule.type]?.label || ''}</span>
                <span className="block text-gray-600 text-xs mt-0.5">{describeRule(rule)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 mt-3">Phụ thu / giảm giá được tính tự động ở bước xác nhận khi đặt phòng.</p>
      </div>
    </div>
  );
};

export default PricingRulesNotice;
