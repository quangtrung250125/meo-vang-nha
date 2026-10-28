import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { SEO_ISSUES } from './seoData';

const LEVEL_CONFIG = {
  error: {
    label: 'Lỗi',
    icon: AlertCircle,
    iconColor: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-500',
  },
  warn: {
    label: 'Cảnh báo',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  info: {
    label: 'Đề xuất',
    icon: Lightbulb,
    iconColor: 'text-sky-500',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-500',
  },
};

const CATEGORY_LABELS = {
  content: 'Nội dung',
  performance: 'Hiệu suất',
  technical: 'Kỹ thuật',
  social: 'Mạng xã hội',
  links: 'Liên kết',
};

const IssueItem = ({ issue }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = LEVEL_CONFIG[issue.level];
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-200 ${cfg.border} bg-white`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50/60 transition-colors cursor-pointer"
      >
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-gray-800">{issue.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {CATEGORY_LABELS[issue.category] || issue.category}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{issue.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="hidden sm:inline text-xs font-semibold text-gray-400">
            Ảnh hưởng: <span className="text-gray-600">{issue.impact}</span>
          </span>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-gray-400" />
            : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className={`px-4 pb-4 pt-2 border-t ${cfg.border} ${cfg.bg}`}>
          <p className="text-sm text-gray-700 mb-3">{issue.description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-500">Trang bị ảnh hưởng:</span>
            {issue.pages.map(p => (
              <span
                key={p}
                className="inline-flex items-center gap-1 text-xs font-mono bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md"
              >
                <ExternalLink className="h-3 w-3 text-gray-400" />
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'error', label: 'Lỗi' },
  { id: 'warn', label: 'Cảnh báo' },
  { id: 'info', label: 'Đề xuất' },
];

const SeoIssuesList = ({ issues = [] }) => {
  const [activeTab, setActiveTab] = useState('all');

  const currentIssues = issues && issues.length > 0 ? issues : [];

  const counts = {
    all: currentIssues.length,
    error: currentIssues.filter(i => i.level === 'error').length,
    warn: currentIssues.filter(i => i.level === 'warn').length,
    info: currentIssues.filter(i => i.level === 'info').length,
  };

  const filtered = activeTab === 'all'
    ? currentIssues
    : currentIssues.filter(i => i.level === activeTab);


  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const cfg = LEVEL_CONFIG[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${active ? 'opacity-100' : ''}`} />}
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Issues */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-semibold">Không có vấn đề nào trong danh mục này!</p>
          </div>
        ) : (
          filtered.map(issue => <IssueItem key={issue.id} issue={issue} />)
        )}
      </div>
    </div>
  );
};

export default SeoIssuesList;
