import React from 'react';
import { RefreshCw } from 'lucide-react';

const AdminStatsLoading = ({ count = 4, error = '', onRetry }) => {
  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
        <span>{error}</span>
        {onRetry && (
          <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-bold text-rose-700 shadow-sm">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        )}
      </div>
    );
  }

  return (
    <div role="status" aria-label="Đang tải số liệu" aria-live="polite" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 h-10 w-10 rounded-xl bg-gray-100" />
          <div className="mb-3 h-8 w-2/3 rounded-lg bg-gray-100" />
          <div className="h-4 w-1/2 rounded bg-gray-100" />
          <div className="mt-2 h-3 w-3/4 rounded bg-gray-50" />
        </div>
      ))}
    </div>
  );
};

export default AdminStatsLoading;
