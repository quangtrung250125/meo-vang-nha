import React, { useEffect, useMemo, useState } from 'react';
import { Send, AlertCircle, AlertTriangle, Bell, BellOff, Search, Eye, MousePointerClick } from 'lucide-react';
import { PUSH_DESTINATIONS, composeMessage, destinationLabel } from '../../utils/marketingEngine';
import useMessengerInbox from './useMessengerInbox';
import MessengerThread from './MessengerThread';
import { Avatar, ChannelTag, ProfileLink, fmtTime as fmt } from './inboxShared';

const STATUS = {
  sent: { label: 'Đã gửi', cls: 'text-emerald-100' },
  no_device: { label: 'Chưa gửi được: khách chưa bật thông báo', cls: 'text-amber-100' },
  failed: { label: 'Gửi lỗi', cls: 'text-rose-100' },
};

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'messenger', label: 'Messenger' },
  { id: 'web', label: 'Web' },
];

// Facebook chưa kết nối: các bước cài đặt
const MessengerSetup = ({ status }) => {
  if (!status || status.configured) return null;
  const missing = [
    !status.pageToken && 'MESSENGER_PAGE_ACCESS_TOKEN',
    !status.appSecret && 'MESSENGER_APP_SECRET',
    !status.verifyToken && 'MESSENGER_VERIFY_TOKEN',
  ].filter(Boolean);
  const webhook = `${String(status.siteUrl || '').replace(/\/+$/, '')}/api/marketing/messenger`;
  return (
    <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-800" data-testid="messenger-setup">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="space-y-1 min-w-0">
        <p><b>Chưa kết nối Fanpage Messenger.</b> Thiếu biến trên Vercel: {missing.join(', ')}.</p>
        <p>Trong ứng dụng Facebook (developers.facebook.com) &gt; Messenger &gt; Webhooks: nhập Callback URL <code className="px-1 bg-white/70 rounded break-all select-all">{webhook}</code>, Verify token giống MESSENGER_VERIFY_TOKEN, chọn sự kiện <b>messages</b>, <b>message_echoes</b>, <b>messaging_postbacks</b> rồi đăng ký cho Fanpage.</p>
      </div>
    </div>
  );
};

/**
 * Hộp thư tập trung: tin khách nhắn Fanpage qua Messenger và thông báo Web Push đã gửi cho khách trên web,
 * gắn nhãn kênh để phân biệt. Khách có tài khoản web hiện họ tên đầy đủ, SĐT, mèo và nút "Hồ sơ khách hàng".
 */
const Tab5Inbox = ({ messages = [], customers = [], deviceCountOf, send, status }) => {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState({ title: '', body: '', url: '/my-booking' });
  const [sending, setSending] = useState(false);

  const byId = useMemo(() => new Map(customers.map((c) => [String(c.id), c])), [customers]);
  const openPsid = selected?.startsWith('m:') ? selected.slice(2) : null;
  const messenger = useMessengerInbox(openPsid);

  const conversations = useMemo(() => {
    // Messenger: khách đã gắn tài khoản web thì hiện họ tên đầy đủ, chưa có thì hiện tên Facebook
    const mess = messenger.conversations.map((c) => {
      const customer = c.customerId ? byId.get(String(c.customerId)) || null : null;
      return {
        key: `m:${c.psid}`,
        channel: 'messenger',
        name: customer?.name || c.nickname || 'Khách Messenger',
        avatar: c.profilePic,
        preview: c.lastText || '',
        lastAt: c.lastMessageAt,
        unread: c.unread || 0,
        customer,
        conv: c,
        searchText: `${customer?.name || ''} ${c.nickname || ''} ${customer?.phone || ''}`,
      };
    });

    // Web: thông báo Web Push đã gửi theo từng khách, sau đó tới các khách chưa nhận tin
    const groups = new Map();
    messages.forEach((m) => {
      const key = String(m.customerId);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    });
    const web = [...groups.entries()].map(([id, list]) => {
      const sorted = [...list].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
      const customer = byId.get(id) || { id, name: list[0]?.customerName };
      return {
        key: `w:${id}`,
        channel: 'web',
        name: byId.get(id)?.name || list[0]?.customerName || 'Khách hàng',
        preview: sorted[sorted.length - 1]?.title || '',
        lastAt: sorted[sorted.length - 1]?.createdAt || null,
        unread: 0,
        customer,
        messages: sorted,
        searchText: `${customer?.name || ''} ${customer?.phone || ''}`,
      };
    });
    const others = customers
      .filter((c) => !groups.has(String(c.id)))
      .map((c) => ({ key: `w:${c.id}`, channel: 'web', name: c.name, preview: '', lastAt: null, unread: 0, customer: c, messages: [], searchText: `${c.name} ${c.phone || ''}` }));

    const q = search.trim().toLowerCase();
    return [...mess, ...web]
      .sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')))
      .concat(others)
      .filter((c) => filter === 'all' || c.channel === filter)
      .filter((c) => !q || c.searchText.toLowerCase().includes(q));
  }, [messenger.conversations, messages, customers, byId, search, filter]);

  const conv = conversations.find((c) => c.key === selected) || conversations[0];
  // Chưa chọn (hoặc hội thoại đang chọn bị lọc mất): mở hội thoại đầu danh sách (Messenger cần tải tin)
  const firstKey = conv?.key || null;
  useEffect(() => {
    if (firstKey && firstKey !== selected) setSelected(firstKey);
  }, [firstKey, selected]);

  const unreadTotal = messenger.conversations.reduce((s, c) => s + (c.unread || 0), 0);
  const configured = Boolean(messenger.status?.configured);

  const handleSendWeb = async () => {
    if (!conv || conv.channel !== 'web' || !draft.body.trim() || sending) return;
    setSending(true);
    const composed = composeMessage({ template: draft, customer: conv.customer });
    await send([{ customerId: conv.customer.id, customerName: conv.name, phone: conv.customer?.phone, ...composed }], 'manual');
    setDraft((d) => ({ ...d, title: '', body: '' }));
    setSending(false);
  };

  const devices = conv?.channel === 'web' ? deviceCountOf(conv.customer) : 0;

  return (
    <div className="space-y-4">
      <div className="px-4 py-3 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-xs text-sky-700 font-medium">
          Gom tin khách nhắn Fanpage qua <b>Messenger</b> và thông báo đã gửi cho khách trên <b>Web</b> (Web Push). Khách đã có tài khoản web hiện họ tên đầy đủ, SĐT và mèo; bấm “Hồ sơ khách hàng” để xem chi tiết.
        </p>
      </div>
      <MessengerSetup status={messenger.status} />
      {messenger.status && messenger.status.database === false && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Chưa tạo bảng tin nhắn Messenger trên Supabase nên tin chỉ lưu tạm. Chạy file supabase/migrations/20261116_create_messenger_inbox.sql trong Supabase SQL Editor.</span>
        </div>
      )}
      {messenger.error && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">Không tải được tin Messenger: {messenger.error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col md:flex-row md:h-[640px]">
        {/* Danh sách hội thoại */}
        <div className="md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col max-h-80 md:max-h-none">
          <div className="px-4 py-3 border-b border-gray-100 space-y-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              Hội thoại
              {unreadTotal > 0 && <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">{unreadTotal}</span>}
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, SĐT..." className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button key={f.id} onClick={() => setFilter(f.id)} data-testid={`inbox-filter-${f.id}`}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${filter === f.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {conversations.length === 0 && <p className="p-4 text-xs text-gray-400">Chưa có hội thoại.</p>}
            {conversations.map((c) => {
              const isActive = conv?.key === c.key;
              const hasDevice = c.channel === 'web' && deviceCountOf(c.customer) > 0;
              return (
                <button key={c.key} onClick={() => setSelected(c.key)} data-testid="inbox-conversation"
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <Avatar name={c.name} src={c.avatar} size="w-8 h-8 text-xs" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-xs truncate ${c.unread ? 'font-black' : 'font-bold'} ${isActive ? 'text-emerald-700' : 'text-gray-800'}`}>{c.name}</p>
                        <ChannelTag channel={c.channel} />
                      </div>
                      <p className={`text-[11px] truncate ${c.unread ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                        {c.preview || (c.channel === 'web' ? 'Chưa nhận tin nào' : '')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {c.lastAt && <span className="text-[10px] text-gray-400">{fmt(c.lastAt)}</span>}
                      {c.unread > 0 && <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">{c.unread}</span>}
                      {c.channel === 'web' && (hasDevice ? <Bell className="h-3 w-3 text-emerald-500" /> : <BellOff className="h-3 w-3 text-gray-300" />)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nội dung hội thoại */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[440px]">
          {!conv && <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Chọn một hội thoại để xem.</div>}

          {conv?.channel === 'messenger' && (
            <MessengerThread
              conv={conv.conv}
              customer={conv.customer}
              customers={customers}
              thread={messenger.thread}
              onReply={messenger.reply}
              onLink={messenger.link}
              configured={configured}
              siteUrl={messenger.status?.siteUrl}
            />
          )}

          {conv?.channel === 'web' && (
            <>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
                <Avatar name={conv.name} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-800 truncate" data-testid="inbox-conv-name">{conv.name}</p>
                    <ChannelTag channel="web" />
                    {byId.has(String(conv.customer?.id)) && <ProfileLink customerId={conv.customer.id} />}
                  </div>
                  <p className="text-xs text-gray-400">
                    {conv.customer?.phone || 'Chưa có SĐT'}
                    {conv.customer?.petNames?.length ? ` · Mèo: ${conv.customer.petNames.join(', ')}` : ''}
                    {' · '}{devices > 0 ? <span className="text-emerald-600 font-bold">{devices} thiết bị nhận thông báo</span> : <span className="text-amber-600 font-bold">chưa bật thông báo</span>}
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/30">
                {conv.messages.length === 0 && <p className="text-center text-sm text-gray-400 py-10">Chưa gửi thông báo nào cho khách này.</p>}
                {conv.messages.map((m) => {
                  const st = STATUS[m.status] || STATUS.failed;
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed text-white ${m.status === 'sent' ? 'bg-emerald-500' : m.status === 'no_device' ? 'bg-amber-500' : 'bg-rose-500'}`}>
                        <p className="font-bold">{m.title}</p>
                        <p>{m.body}</p>
                        <p className="text-[10px] mt-1.5 opacity-90">Mở: {destinationLabel(m.url)} · {m.source === 'auto' ? 'Tự động' : 'Thủ công'}</p>
                        <span className={`flex flex-wrap items-center gap-2 text-[10px] mt-1 ${st.cls}`}>
                          <span>{fmt(m.createdAt)} · {st.label}</span>
                          {m.shownAt && <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" />Đã hiện {fmt(m.shownAt)}</span>}
                          {m.clickedAt && <span className="inline-flex items-center gap-0.5 font-bold"><MousePointerClick className="h-3 w-3" />Đã bấm {fmt(m.clickedAt)}</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t border-gray-100 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} maxLength={100} placeholder="Tiêu đề (không bắt buộc)" className="flex-1 min-w-[160px] text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  <select value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" title="Trang mở khi khách bấm thông báo">
                    {PUSH_DESTINATIONS.map((d) => <option key={d.id} value={d.id}>Mở: {d.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 items-end">
                  <textarea value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} rows={2} maxLength={400} placeholder={`Nhập nội dung gửi ${conv.name}... (Enter để gửi)`} data-testid="inbox-body"
                    className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendWeb(); } }} />
                  <button onClick={handleSendWeb} disabled={!draft.body.trim() || sending || status?.pushConfigured === false} title="Gửi Web Push ngay"
                    className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl transition-colors cursor-pointer shrink-0">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tab5Inbox;
