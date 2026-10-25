import React, { useState, useMemo } from 'react';
import { Play, Search, Filter, Plus, Edit2, Zap, Users, Mail, MessageSquare, Phone, Bell, ToggleLeft, ToggleRight, TrendingUp, MousePointerClick, ShoppingCart, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CUSTOMER_SEGMENTS, CHANNELS, SEGMENT_COLORS, MKT_STORAGE_KEYS, saveToStorage, formatPercent } from './marketingStore';

const CHANNEL_ICONS = { zalo: MessageSquare, email: Mail, sms: Phone, webpush: Bell, call: Phone };
const CHANNEL_COLORS = { zalo: 'bg-sky-100 text-sky-700', email: 'bg-purple-100 text-purple-700', sms: 'bg-emerald-100 text-emerald-700', webpush: 'bg-orange-100 text-orange-700', call: 'bg-rose-100 text-rose-700' };

// Form modal kich ban
const ScenarioModal = ({ scenario, onClose, onSave }) => {
  const [form, setForm] = useState(scenario ? { ...scenario } : {
    name: '', trigger: '', delay: '', channels: ['zalo'], segment: 'potential', templateId: '', action: '', enabled: true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleChannel = (ch) => {
    const next = form.channels.includes(ch) ? form.channels.filter(c => c !== ch) : [...form.channels, ch];
    if (next.length === 0) { toast.error('Phai chon it nhat 1 kenh!'); return; }
    set('channels', next);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Vui long nhap ten kich ban!'); return; }
    onSave({ ...form, id: form.id || `sc-${Date.now()}`, weekSent: form.weekSent || 0 });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{scenario ? 'Sua kich ban' : 'Tao kich ban moi'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Ten kich ban *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Vi du: Nhac lich truoc ngay gui meo" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Kich hoat (trigger)</label>
            <input value={form.trigger} onChange={e => set('trigger', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Vi du: 2 ngay truoc check-in" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Do tre</label>
            <input value={form.delay} onChange={e => set('delay', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Vi du: 2 gio sau bo do" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Doi tuong (phan khuc)</label>
            <select value={form.segment} onChange={e => set('segment', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
              {CUSTOMER_SEGMENTS.filter(s => s.id !== 'all').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Kenh gui</label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map(ch => (
                <button key={ch.id} type="button" onClick={() => toggleChannel(ch.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.channels.includes(ch.id) ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-500 hover:border-emerald-300'}`}>
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Hanh dong mo ta</label>
            <input value={form.action} onChange={e => set('action', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Mo ta hanh dong kich ban" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-bold text-gray-600">Trang thai</span>
            <button type="button" onClick={() => set('enabled', !form.enabled)}
              className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${form.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-bold ${form.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>{form.enabled ? 'Bat' : 'Tat'}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">Huy</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer">Luu kich ban</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Tab1Scenarios = ({ scenarios, setScenarios }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterSegment, setFilterSegment] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);

  const stats = useMemo(() => ({
    running: scenarios.filter(s => s.enabled).length,
    openRate: 45.0,
    clickRate: 15.0,
    converted: 144,
  }), [scenarios]);

  const filtered = useMemo(() => scenarios.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.action?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'on' ? s.enabled : !s.enabled);
    const matchChannel = filterChannel === 'all' || s.channels.includes(filterChannel);
    const matchSegment = filterSegment === 'all' || s.segment === filterSegment;
    return matchSearch && matchStatus && matchChannel && matchSegment;
  }), [scenarios, search, filterStatus, filterChannel, filterSegment]);

  const handleToggle = (id) => {
    const next = scenarios.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    setScenarios(next);
    saveToStorage(MKT_STORAGE_KEYS.SCENARIOS, next);
    const sc = next.find(s => s.id === id);
    toast.success(`Kich ban "${sc.name.substring(0, 30)}..." da ${sc.enabled ? 'bat' : 'tat'}`);
  };

  const handleSave = (sc) => {
    const next = editingScenario ? scenarios.map(s => s.id === sc.id ? sc : s) : [...scenarios, sc];
    setScenarios(next);
    saveToStorage(MKT_STORAGE_KEYS.SCENARIOS, next);
    toast.success(editingScenario ? 'Da cap nhat kich ban!' : 'Da tao kich ban moi!');
    setModalOpen(false);
    setEditingScenario(null);
  };

  const segmentLabel = (id) => CUSTOMER_SEGMENTS.find(s => s.id === id)?.label || id;

  const statCards = [
    { label: 'Dang chay', value: stats.running, unit: 'kich ban', icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Ti le mo', value: formatPercent(stats.openRate), unit: 'trung binh', icon: TrendingUp, color: 'bg-sky-50 text-sky-600' },
    { label: 'Ti le bam', value: formatPercent(stats.clickRate), unit: 'trung binh', icon: MousePointerClick, color: 'bg-purple-50 text-purple-600' },
    { label: 'Don chuyen doi (30 ngay)', value: stats.converted, unit: 'don', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tim theo ten kich ban..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
            <option value="all">Trang thai: Tat ca</option>
            <option value="on">Dang bat</option>
            <option value="off">Dang tat</option>
          </select>
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
            <option value="all">Kenh: Tat ca</option>
            {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={filterSegment} onChange={e => setFilterSegment(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
            <option value="all">Doi tuong: Tat ca</option>
            {CUSTOMER_SEGMENTS.filter(s => s.id !== 'all').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={() => { setEditingScenario(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0">
            <Plus className="h-4 w-4" />
            Tao kich ban
          </button>
        </div>
      </div>

      {/* Bang kich ban */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Kich hoat / Hanh dong</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Kenh</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Doi tuong</th>
                <th className="text-right px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Gui/tuan</th>
                <th className="text-center px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Bat/Tat</th>
                <th className="text-center px-4 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">Khong tim thay kich ban nao.</td></tr>
              ) : filtered.map(sc => (
                <tr key={sc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-gray-800 leading-snug">{sc.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sc.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5 italic">{sc.trigger}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {sc.channels.map(ch => (
                        <span key={ch} className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${CHANNEL_COLORS[ch] || 'bg-gray-100 text-gray-600'}`}>{CHANNELS.find(c => c.id === ch)?.label || ch}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${SEGMENT_COLORS[sc.segment] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{segmentLabel(sc.segment)}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-bold text-gray-700">{sc.weekSent}</span>
                    <span className="text-xs text-gray-400 ml-1">tin</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => handleToggle(sc.id)} title={sc.enabled ? 'Tat kich ban' : 'Bat kich ban'}
                      className={`relative inline-flex w-11 h-6 rounded-full transition-colors cursor-pointer ${sc.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sc.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => { setEditingScenario(sc); setModalOpen(true); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-emerald-300 hover:text-emerald-700 transition-all cursor-pointer">
                      <Edit2 className="h-3.5 w-3.5" />
                      Sua
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <ScenarioModal scenario={editingScenario} onClose={() => { setModalOpen(false); setEditingScenario(null); }} onSave={handleSave} />}
    </div>
  );
};

export default Tab1Scenarios;
