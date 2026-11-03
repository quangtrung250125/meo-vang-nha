import React, { useMemo, useState } from 'react';
import { Send, AlertCircle, Bell, BellOff, Search, Eye, MousePointerClick } from 'lucide-react';
import { PUSH_DESTINATIONS, composeMessage, destinationLabel, VN_OFFSET_MS } from '../../utils/marketingEngine';

const STATUS = {
  sent: { label: 'Đã gửi', cls: 'text-emerald-100' },
  no_device: { label: 'Chưa gửi được: khách chưa bật thông báo', cls: 'text-amber-100' },
  failed: { label: 'Gửi lỗi', cls: 'text-rose-100' },
};

const fmt = (iso) => {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + VN_OFFSET_MS).toISOString();
  return `${d.slice(11, 16)} ${d.slice(8, 10)}/${d.slice(5, 7)}`;
};

// Hộp thư: lịch sử thông báo đã gửi theo từng khách, và gửi thêm tin cho khách đang xem
const Tab5Inbox = ({ messages = [], customers = [], deviceCountOf, send, status }) => {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState({ title: '', body: '', url: '/my-booking' });
  const [sending, setSending] = useState(false);

  const byId = useMemo(() => new Map(customers.map((c) => [String(c.id), c])), [customers]);

  // Khách đã nhận tin xếp trước (mới nhất lên đầu), sau đó tới các khách còn lại
  const conversations = useMemo(() => {
    const groups = new Map();
    messages.forEach((m) => {
      const key = String(m.customerId);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    });
    const withMessages = [...groups.entries()].map(([id, list]) => ({
      id,
      name: byId.get(id)?.name || list[0]?.customerName || 'Khách hàng',
      customer: byId.get(id) || { id, name: list[0]?.customerName },
      messages: [...list].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))),
      lastAt: list[0]?.createdAt,
    }));
    const others = customers
      .filter((c) => !groups.has(String(c.id)))
      .map((c) => ({ id: String(c.id), name: c.name, customer: c, messages: [], lastAt: null }));
    const q = search.trim().toLowerCase();
    return [...withMessages, ...others].filter((c) => !q || `${c.name} ${c.customer?.phone || ''}`.toLowerCase().includes(q));
  }, [messages, customers, byId, search]);

  const conv = conversations.find((c) => c.id === selected) || conversations[0];
  const devices = conv ? deviceCountOf(conv.customer) : 0;

  const handleSend = async () => {
    if (!conv || !draft.body.trim() || sending) return;
    setSending(true);
    const composed = composeMessage({ template: draft, customer: conv.customer });
    await send([{ customerId: conv.id, customerName: conv.name, phone: conv.customer?.phone, ...composed }], 'manual');
    setDraft((d) => ({ ...d, title: '', body: '' }));
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <div className="px-4 py-3 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-xs text-sky-700 font-medium">
          Lịch sử thông báo Web Push đã gửi tới từng khách (tự động và thủ công), kèm trạng thái đã xem / đã bấm. Có thể gửi thêm tin ngay tại đây. Zalo OA / Messenger chưa kết nối nên chưa hiện ở hộp thư này.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col md:flex-row md:h-[620px]">
        {/* Danh sách khách */}
        <div className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col max-h-72 md:max-h-none">
          <div className="px-4 py-3 border-b border-gray-100 space-y-2">
            <h3 className="text-sm font-bold text-gray-800">Khách hàng</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm khách..." className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {conversations.length === 0 && <p className="p-4 text-xs text-gray-400">Chưa có khách hàng.</p>}
            {conversations.map((c) => {
              const isActive = conv?.id === c.id;
              const last = c.messages[c.messages.length - 1];
              const hasDevice = deviceCountOf(c.customer) > 0;
              return (
                <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-black shrink-0">{(c.name || '?').charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-emerald-700' : 'text-gray-800'}`}>{c.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{last ? last.title : 'Chưa nhận tin nào'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {last && <span className="text-[10px] text-gray-400">{fmt(last.createdAt)}</span>}
                      {hasDevice ? <Bell className="h-3 w-3 text-emerald-500" /> : <BellOff className="h-3 w-3 text-gray-300" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lịch sử tin */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[420px]">
          {conv ? (
            <>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm">{(conv.name || '?').charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{conv.name}</p>
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
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                  <button onClick={handleSend} disabled={!draft.body.trim() || sending || status?.pushConfigured === false} title="Gửi Web Push ngay"
                    className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl transition-colors cursor-pointer shrink-0">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Chọn một khách để xem.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tab5Inbox;
