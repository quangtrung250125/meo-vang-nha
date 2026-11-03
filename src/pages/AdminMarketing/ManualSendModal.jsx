import React, { useMemo, useState } from 'react';
import { X, Search, Send, Bell, BellOff, CheckCircle2, AlertCircle, Users, FileText, PenLine } from 'lucide-react';
import { SEGMENTS } from '../AdminCustomers/customerUtils';
import { PUSH_DESTINATIONS, TEMPLATE_VARIABLES, composeMessage, stageOf, destinationLabel } from '../../utils/marketingEngine';

const RESULT_LABELS = {
  sent: { label: 'Đã gửi', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  no_device: { label: 'Chưa bật thông báo', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  failed: { label: 'Gửi lỗi', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  duplicate: { label: 'Đã gửi trước đó', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  limited: { label: 'Vướng giới hạn', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  invalid: { label: 'Thiếu nội dung', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

// Đơn sắp tới gần nhất (để điền {ngay_nhan}, {ma_don} và mở đúng đơn khi bấm thông báo)
const nextBookingOf = (customer) =>
  [...(customer.bookings || [])]
    .filter((b) => stageOf(b) === 'upcoming' || stageOf(b) === 'staying')
    .sort((a, b) => String(a.checkIn || '').localeCompare(String(b.checkIn || '')))[0] || null;

const ManualSendModal = ({ customers = [], templates = [], deviceCountOf, initialSelected = [], initialTemplateId = '', onSend, onClose }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const [mode, setMode] = useState(initialTemplateId || templates.length ? 'template' : 'custom');
  const [templateId, setTemplateId] = useState(initialTemplateId || templates[0]?.id || '');
  const [custom, setCustom] = useState({ title: '', body: '', url: '/booking' });
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (q && !`${c.name} ${c.phone} ${(c.petNames || []).join(' ')}`.toLowerCase().includes(q)) return false;
      if (filter === 'push') return deviceCountOf(c) > 0;
      if (filter !== 'all') return c.segment === filter;
      return true;
    });
  }, [customers, search, filter, deviceCountOf]);

  const allVisibleSelected = visible.length > 0 && visible.every((c) => selected.has(c.id));
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAllVisible = () => setSelected((prev) => {
    const next = new Set(prev);
    visible.forEach((c) => (allVisibleSelected ? next.delete(c.id) : next.add(c.id)));
    return next;
  });

  const template = mode === 'template'
    ? templates.find((t) => t.id === templateId)
    : { id: null, title: custom.title, body: custom.body, url: custom.url };

  const recipients = customers.filter((c) => selected.has(c.id));
  const withDevice = recipients.filter((c) => deviceCountOf(c) > 0).length;
  const previewCustomer = recipients[0] || customers[0] || { name: 'Nguyễn Lan Anh', petNames: ['Bơ'], bookings: [] };
  const preview = template?.body ? composeMessage({ template, customer: previewCustomer, booking: nextBookingOf(previewCustomer) }) : null;

  const canSend = recipients.length > 0 && template?.body?.trim() && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    const list = recipients.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      phone: c.phone,
      templateId: mode === 'template' ? templateId : null,
      ...composeMessage({ template, customer: c, booking: nextBookingOf(c) }),
    }));
    const res = await onSend(list);
    setResults(res);
    setSending(false);
  };

  const nameOf = (id) => customers.find((c) => c.id === id)?.name || id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4" data-testid="manual-send-modal">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Send className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800">Gửi thông báo thủ công</h3>
            <p className="text-xs text-gray-500">Gửi Web Push ngay tới điện thoại / máy tính của khách. Khách bấm vào sẽ mở đúng trang đã chọn.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>

        {results ? (
          <div className="p-6 overflow-y-auto">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Kết quả gửi</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(RESULT_LABELS).map(([key, cfg]) => {
                const n = results.filter((r) => r.status === key).length;
                return n ? <span key={key} className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.cls}`}>{cfg.label}: {n}</span> : null;
              })}
              {results.length === 0 && <span className="text-sm text-rose-600">Không gửi được, vui lòng thử lại.</span>}
            </div>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-[50vh] overflow-y-auto">
              {results.map((r, i) => {
                const cfg = RESULT_LABELS[r.status] || RESULT_LABELS.failed;
                return (
                  <div key={`${r.customerId}-${i}`} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold text-gray-800 truncate">{nameOf(r.customerId)}</span>
                      {r.reason && r.status !== 'sent' && <span className="block text-[11px] text-gray-500 mt-0.5" data-testid="send-result-reason">{r.reason}</span>}
                    </span>
                    {r.devices > 0 && <span className="text-xs text-gray-400">{r.devices} thiết bị</span>}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 pt-5">
              <button onClick={() => setResults(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">Gửi tin khác</button>
              <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer">Xong</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto lg:overflow-hidden grid lg:grid-cols-2">
            {/* Chọn khách */}
            <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100 min-h-0">
              <div className="p-4 space-y-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <Users className="h-4 w-4 text-emerald-600" /> 1. Chọn khách nhận
                  <span className="ml-auto text-xs font-bold text-emerald-700" data-testid="selected-count">Đã chọn {recipients.length}</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, SĐT, tên mèo..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[{ id: 'all', label: 'Tất cả' }, { id: 'push', label: 'Đã bật thông báo' }, ...Object.entries(SEGMENTS).map(([id, s]) => ({ id, label: s.label }))].map((f) => (
                    <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${filter === f.id ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-500 hover:border-emerald-300'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="h-4 w-4 accent-emerald-600" />
                  Chọn tất cả {visible.length} khách đang hiện
                </label>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[40vh] lg:max-h-none">
                {visible.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-400">Không có khách phù hợp.</p>
                ) : visible.map((c) => {
                  const n = deviceCountOf(c);
                  return (
                    <label key={c.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${selected.has(c.id) ? 'bg-emerald-50/60' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.phone || 'Chưa có SĐT'}{c.petNames?.length ? ` · Mèo: ${c.petNames.join(', ')}` : ''}</p>
                      </div>
                      {n > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"><Bell className="h-3 w-3" />{n} thiết bị</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200 shrink-0"><BellOff className="h-3 w-3" />Chưa bật</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Nội dung */}
            <div className="flex flex-col min-h-0">
              <div className="p-4 space-y-3 lg:overflow-y-auto flex-1">
                <div className="text-sm font-bold text-gray-800">2. Nội dung thông báo</div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setMode('template')} className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${mode === 'template' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}><FileText className="h-4 w-4" />Dùng mẫu có sẵn</button>
                  <button type="button" onClick={() => setMode('custom')} className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${mode === 'custom' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}><PenLine className="h-4 w-4" />Tự soạn tin</button>
                </div>

                {mode === 'template' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Mẫu tin</label>
                    <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" data-testid="template-select">
                      {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {template && <p className="text-[11px] text-gray-400 mt-1.5">Khi bấm sẽ mở: <b>{destinationLabel(template.url)}</b></p>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Tiêu đề</label>
                      <input value={custom.title} onChange={(e) => setCustom((c) => ({ ...c, title: e.target.value }))} maxLength={100} placeholder="Ví dụ: 🎉 Ưu đãi cuối tuần cho bé {ten_meo}" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" data-testid="custom-title" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Nội dung *</label>
                      <textarea value={custom.body} onChange={(e) => setCustom((c) => ({ ...c, body: e.target.value }))} maxLength={400} rows={4} placeholder="Chào {ten_chu}! ..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300" data-testid="custom-body" />
                      <p className="text-[11px] text-gray-400 mt-1">Biến cá nhân hóa: {TEMPLATE_VARIABLES.join(', ')}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">Khi khách bấm vào thông báo, mở trang</label>
                      <select value={custom.url} onChange={(e) => setCustom((c) => ({ ...c, url: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" data-testid="custom-url">
                        {PUSH_DESTINATIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {preview && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 mb-1.5">Xem trước{recipients[0] ? ` (gửi cho ${previewCustomer.name})` : ''}:</p>
                    <div className="rounded-2xl bg-slate-800 text-white p-3.5 flex gap-3 shadow-inner">
                      <img src="/images/LogoMeoVangNha/813939190_1681772440267304_6167511068586325652_n.png" alt="" className="w-10 h-10 rounded-lg bg-white object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-snug">{preview.title}</p>
                        <p className="text-xs text-slate-200 leading-relaxed mt-0.5">{preview.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">meovangnha.store · mở {destinationLabel(preview.url)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {recipients.length > 0 && withDevice < recipients.length && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{recipients.length - withDevice} khách chưa bật nhận thông báo trên web nên sẽ chưa nhận được tin này. Khách bật tại Hồ sơ của tôi &gt; Thông báo.</span>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-3">
                <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">Hủy</button>
                <button onClick={handleSend} disabled={!canSend} data-testid="manual-send-submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold cursor-pointer">
                  {sending ? 'Đang gửi...' : <><Send className="h-4 w-4" />Gửi ngay cho {recipients.length} khách</>}
                </button>
              </div>
            </div>
          </div>
        )}
        {results && results.some((r) => r.status === 'sent') && (
          <div className="px-6 pb-4 -mt-2 text-[11px] text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Lượt xem và lượt bấm sẽ cập nhật ở tab Kết quả và Hộp thư tập trung.</div>
        )}
      </div>
    </div>
  );
};

export default ManualSendModal;
