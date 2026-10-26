import React from 'react';
import { Users } from 'lucide-react';
import { SEGMENTS, BOOKING_STAGES, initialsOf } from './customerUtils';

export const Card = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

export const SectionTitle = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
    <div>
      <h2 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-orange-500" />}
        {title}
      </h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const SegmentBadge = ({ segment }) => {
  const { label, cls } = SEGMENTS[segment] || SEGMENTS.new;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-bold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
};

export const StageBadge = ({ stage }) => {
  const { label, cls } = BOOKING_STAGES[stage] || BOOKING_STAGES.upcoming;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-bold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
};

export const Avatar = ({ name, size = 'md' }) => {
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}>
      {initialsOf(name)}
    </div>
  );
};

export const EmptyState = ({ title, description, action }) => (
  <Card className="p-10 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
      <Users className="h-7 w-7" />
    </div>
    <p className="font-bold text-gray-800">{title}</p>
    {description && <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </Card>
);
