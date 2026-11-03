import React, { useState, useMemo } from 'react';
import { Play, Search, Plus, Edit2, Mail, MessageSquare, Phone, Bell, TrendingUp, MousePointerClick, ShoppingCart, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CUSTOMER_SEGMENTS, CHANNELS, SEGMENT_COLORS, formatPercent } from './marketingStore';
import { RULE_TYPES, ruleTypeOf, describeRule } from '../../utils/marketingEngine';

const CHANNEL_ICONS = { zalo: MessageSquare, email: Mail, sms: Phone, webpush: Bell, call: Phone };
const CHANNEL_COLORS = { zalo: 'bg-sky-100 text-sky-700', email: 'bg-purple-100 text-purple-700', sms: 'bg-emerald-100 text-emerald-700', webpush: 'bg-orange-100 text-orange-700', call: 'bg-rose-100 text-rose-700' };

// Form modal kịch bản
const ScenarioModal = ({ scenario, templates = [], onClose, onSave }) => {
  const [form, setForm] = useState(scenario ? { ...scenario, rule: scenario.rule || { type: 'before_checkin', value: 2 } } : {
    name: '', trigger: '', delay: '', channels: ['webpush'], segment: 'potential', templateId: templates[0]?.id || '', action: '', enabled: true,
    rule: { type: 'before_checkin', value: 2 },
  });
  const ruleType = ruleTypeOf(form.rule?.type);
  const setRule = (patch) => setForm(f => ({ ...f, rule: { ...f.rule, ...patch } }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleChannel = (ch) => {
    const next = form.channels.includes(ch) ? form.channels.filter(c => c !== ch) : [...form.channels, ch];
    if (next.length === 0) { toast.error('Phải chọn ít nhất 1 kênh!'); return; }
    set('channels', next);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên kịch bản!'); return; }
    if (!form.templateId) { toast.error('Vui lòng chọn mẫu tin nhắn!'); return; }
    const rule = { type: form.rule.type, value: Number(form.rule.value) || 0 };
    onSave({ ...form, rule, trigger: describeRule(rule), delay: describeRule(rule), id: form.id || `sc-${Date.now()}`, weekSent: form.weekSent || 0 });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{scenario ? 'Sửa kịch bản' : 'Tạo kịch bản mới'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên kịch bản *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Ví dụ: Nhắc lịch trước ngày gửi mèo" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Kích hoạt khi</label>
            <div className="flex gap-2">
              <select value={form.rule?.type} onChange={e => setRule({ type: e.target.value, value: ruleTypeOf(e.target.value)?.defaultValue ?? 0 })} data-testid="rule-type"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
                {RULE_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              {ruleType?.unit && (
                <div className="flex items-center gap-1.5">
                  <input type="number" min={0} max={365} value={form.rule?.value ?? 0} onChange={e => setRule({ value: e.target.value })} data-testid="rule-value"
                    className="w-20 border border-gray-200 rounded-xl px-2 py-2.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  <span className="text-xs text-gray-500">{ruleType.unit === 'hours' ? 'giờ' : 'ngày'}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{ruleType?.hint}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Mẫu tin gửi đi</label>
            <select value={form.templateId} onChange={e => set('templateId', e.target.value)} data-testid="scenario-template"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">— Chọn mẫu tin —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Đối tượng (phân khúc)</label>
            <select value={form.segment} onChange={e => set('segment', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
              {CUSTOMER_SEGMENTS.filter(s => s.id !== 'all').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Kênh gửi</label>
            <p className="text-[11px] text-gray-400 mb-1.5">Web Push đang gửi thật tới khách. Zalo, Email, SMS, Cuộc gọi cần kết nối tài khoản riêng nên chưa gửi.</p>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map(ch => (
                <button key={ch.id} type="button" onClick={() => toggleChannel(ch.id)} data-testid={`channel-${ch.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${form.channels.includes(ch.id) ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-500 hover:border-emerald-300'}`}>
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Hành động mô tả</label>
            <input value={form.action} onChange={e => set('action', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Mô tả hành động kịch bản" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-bold text-gray-600">Trạng thái</span>
            <button type="button" onClick={() => set('enabled', !form.enabled)}
              className={`relative inline-flex w-11 h-6 rounded-full transition-colors cursor-pointer ${form.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-bold ${form.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>{form.enabled ? 'Bật' : 'Tắt'}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">Hủy</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer">Lưu kịch bản</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Tab1Scenarios = ({ scenarios, templates, saveConfig, evaluation, resultsFor, messages = [], send, status }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterSegment, setFilterSegment] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [runningId, setRunningId] = useState(null);

  const results30 = resultsFor(30);
  const stats = {
    running: scenarios.filter(s => s.enabled).length,
    openRate: results30.summary.openRate,
    clickRate: results30.summary.clickRate,
    converted: results30.summary.converted,
  };

  // Số tin đã gửi trong 7 ngày và số tin đang chờ, theo kịch bản
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const sentWeek = useMemo(() => messages.reduce((acc, m) => {
    if (m.status === 'sent' && m.scenarioId && new Date(m.createdAt).getTime() >= weekAgo) acc[m.scenarioId] = (acc[m.scenarioId] || 0) + 1;
    return acc;
  }, {}), [messages, weekAgo]);
  const pendingOf = (id) => [...evaluation.due, ...evaluation.blocked].filter(d => d.scenarioId === id);

  const filtered = useMemo(() => scenarios.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.action?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'on' ? s.enabled : !s.enabled);
    const matchChannel = filterChannel === 'all' || s.channels.includes(filterChannel);
    const matchSegment = filterSegment === 'all' || s.segment === filterSegment;
    return matchSearch && matchStatus && matchChannel && matchSegment;
  }), [scenarios, search, filterStatus, filterChannel, filterSegment]);

  const handleToggle = (id) => {
    const next = scenarios.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    saveConfig({ scenarios: next });
    const sc = next.find(s => s.id === id);
    toast.success(`Kịch bản "${sc.name.substring(0, 30)}..." đã ${sc.enabled ? 'bật' : 'tắt'}`);
  };

  const handleSave = (sc) => {
    const next = editingScenario ? scenarios.map(s => s.id === sc.id ? sc : s) : [...scenarios, sc];
    saveConfig({ scenarios: next });
    toast.success(editingScenario ? 'Đã cập nhật kịch bản!' : 'Đã tạo kịch bản mới!');
    setModalOpen(false);
    setEditingScenario(null);
  };

  // Gửi ngay các tin đã đến hạn của kịch bản (vẫn áp giới hạn tần suất, không gửi trùng)
  const handleRunNow = async (sc) => {
    const due = evaluation.due.filter(d => d.scenarioId === sc.id);
    if (!sc.channels.includes('webpush')) { toast.error('Kịch bản chưa chọn kênh Web Push.'); return; }
    if (due.length === 0) {
      const blocked = evaluation.blocked.filter(d => d.scenarioId === sc.id).length;
      toast(blocked ? `${blocked} tin đang chờ vì giới hạn tần suất / giờ yên lặng.` : 'Hiện chưa có khách nào đến hạn nhận tin của kịch bản này.', { icon: 'ℹ️' });
      return;
    }
    setRunningId(sc.id);
    await send(due, 'auto');
    setRunningId(null);
  };

  const segmentLabel = (id) => CUSTOMER_SEGMENTS.find(s => s.id === id)?.label || id;

  const statCards = [
    { label: 'Đang chạy', value: stats.running, unit: 'kịch bản', icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Tỉ lệ mở (30 ngày)', value: formatPercent(stats.openRate), unit: 'tin đã gửi', icon: TrendingUp, color: 'bg-sky-50 text-sky-600' },
    { label: 'Tỉ lệ bấm (30 ngày)', value: formatPercent(stats.clickRate), unit: 'tin đã gửi', icon: MousePointerClick, color: 'bg-purple-50 text-purple-600' },
    { label: 'Đơn chuyển đổi (30 ngày)', value: stats.converted, unit: 'đơn', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-black text-gray-800">{card.value} <span className="text-xs font-normal text-gray-400">{card.unit}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên kịch bản..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
            <option value="all">Trạng thái: Tất cả</option>
            <option value="on">Đang bật</option>
            <option value="off">Đang tắt</option>
          </select>
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
            <option value="all">Kênh: Tất cả</option>
            {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={filterSegment} onChange={e => setFilterSegment(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
            <option value="all">Đối tượng: Tất cả</option>
            {CUSTOMER_SEGMENTS.filter(s => s.id !== 'all').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={() => { setEditingScenario(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0">
            <Plus className="h-4 w-4" />
            Tạo kịch bản
          </button>
        </div>
      </div>

      {/* Bảng kịch bản */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Kích hoạt / Hành động</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Kênh</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Đối tượng</th>
                <th className="text-right px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Gửi 7 ngày / Chờ</th>
                <th className="text-center px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Bật/Tắt</th>
                <th className="text-center px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">Không tìm thấy kịch bản nào.</td></tr>
              ) : filtered.map(sc => (
                <tr key={sc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-gray-800 leading-snug">{sc.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sc.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5 italic">{sc.rule ? describeRule(sc.rule) : sc.trigger}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {sc.channels.map(ch => (
                        <span key={ch} title={ch === 'webpush' ? 'Gửi thật tới thiết bị của khách' : 'Chưa kết nối, chưa gửi'}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${ch === 'webpush' ? CHANNEL_COLORS[ch] : 'bg-gray-100 text-gray-400 line-through decoration-gray-300'}`}>{CHANNELS.find(c => c.id === ch)?.label || ch}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${SEGMENT_COLORS[sc.segment] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{segmentLabel(sc.segment)}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-bold text-gray-700">{sentWeek[sc.id] || 0}</span>
                    <span className="text-xs text-gray-400 ml-1">tin</span>
                    <span className="block text-[11px] text-amber-600 font-bold">{sc.enabled && sc.channels.includes('webpush') ? `${pendingOf(sc.id).length} chờ gửi` : ''}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => handleToggle(sc.id)} title={sc.enabled ? 'Tắt kịch bản' : 'Bật kịch bản'}
                      className={`relative inline-flex w-11 h-6 rounded-full transition-colors cursor-pointer ${sc.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sc.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <button onClick={() => handleRunNow(sc)} disabled={!sc.enabled || runningId === sc.id || status?.pushConfigured === false} title="Gửi ngay các tin đã đến hạn"
                      className="inline-flex items-center gap-1 px-3 py-1.5 mr-1.5 border border-orange-200 rounded-lg text-xs font-bold text-orange-600 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                      <Play className="h-3.5 w-3.5" />
                      {runningId === sc.id ? 'Đang gửi' : 'Chạy ngay'}
                    </button>
                    <button onClick={() => { setEditingScenario(sc); setModalOpen(true); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-emerald-300 hover:text-emerald-700 transition-all cursor-pointer">
                      <Edit2 className="h-3.5 w-3.5" />
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 px-1">Kịch bản đang bật và có kênh Web Push sẽ tự gửi: khi trang Admin đang mở (kiểm tra mỗi 2 phút) và hằng ngày lúc 8 giờ sáng trên máy chủ. Mỗi khách chỉ nhận một lần cho mỗi lần kích hoạt.</p>

      {modalOpen && <ScenarioModal scenario={editingScenario} templates={templates} onClose={() => { setModalOpen(false); setEditingScenario(null); }} onSave={handleSave} />}
    </div>
  );
};

export default Tab1Scenarios;
