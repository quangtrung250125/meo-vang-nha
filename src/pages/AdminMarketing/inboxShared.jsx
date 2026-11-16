import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { VN_OFFSET_MS } from '../../utils/marketingEngine';
import { normalizeVnPhone } from '../../utils/phone';

export const CHANNELS = {
  messenger: { label: 'Messenger', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  web: { label: 'Web', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const ChannelTag = ({ channel }) => {
  const c = CHANNELS[channel] || CHANNELS.web;
  return <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold leading-none ${c.cls}`} data-testid={`tag-${channel}`}>{c.label}</span>;
};

export const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + VN_OFFSET_MS).toISOString();
  return `${d.slice(11, 16)} ${d.slice(8, 10)}/${d.slice(5, 7)}`;
};

export const Avatar = ({ name, src, size = 'w-9 h-9 text-sm' }) => (
  src
    ? <img src={src} alt="" referrerPolicy="no-referrer" className={`${size} rounded-full object-cover shrink-0 bg-gray-100`} />
    : <div className={`${size} rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black shrink-0`}>{(name || '?').charAt(0)}</div>
);

// Nút "Hồ sơ khách hàng": mở trang Khách hàng > Hồ sơ của khách
export const ProfileLink = ({ customerId }) => {
  const location = useLocation();
  if (!customerId) return null;
  const base = location.pathname.startsWith('/admin') ? '/admin/customers' : '/customers';
  return (
    <Link to={`${base}?tab=profile&id=${encodeURIComponent(customerId)}`} data-testid="inbox-profile-link"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-[11px] font-bold whitespace-nowrap transition-colors">
      <UserRound className="h-3 w-3" /> Hồ sơ khách hàng
    </Link>
  );
};

// Số điện thoại Việt Nam khách gõ trong tin nhắn (để gợi ý gắn tài khoản)
export function phonesInText(text = '') {
  const out = new Set();
  const re = /(?:\+?84|0)(?:[\s.-]?\d){9}(?!\d)/g;
  String(text || '').match(re)?.forEach((m) => {
    const p = normalizeVnPhone(m.replace(/[^\d+]/g, ''));
    if (/^0\d{9}$/.test(p)) out.add(p);
  });
  return [...out];
}
