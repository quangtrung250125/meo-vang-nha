import React, { useState } from 'react';
import { Plus, Eye, Mail, MessageSquare, Phone, Bell, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CHANNELS, MKT_STORAGE_KEYS, saveToStorage } from './marketingStore';

const SAMPLE_DATA = { ten_chu: 'Nguyen Lan Anh', ten_meo: 'Bo', ngay_nhan: '30/10/2026', ma_uu_dai: 'BOSS20', hang: 'Vang' };

const fillVariables = (body) => {
  return body
    .replace(/\{ten_chu\}/g, SAMPLE_DATA.ten_chu)
    .replace(/\{ten_meo\}/g, SAMPLE_DATA.ten_meo)
    .replace(/\{ngay_nhan\}/g, SAMPLE_DATA.ngay_nhan)
    .replace(/\{ma_uu_dai\}/g, SAMPLE_DATA.ma_uu_dai)
    .replace(/\{hang\}/g, SAMPLE_DATA.hang);
};

const CHANNEL_ICONS = { zalo: MessageSquare, email: Mail, sms: Phone, webpush: Bell, call: Phone };
const CHANNEL_COLORS = { zalo: 'bg-sky-100 text-sky-700 border-sky-200', email: 'bg-purple-100 text-purple-700 border-purple-200', sms: 'bg-emerald-100 text-emerald-700 border-emerald-200', webpush: 'bg-orange-100 text-orange-700 border-orange-200', call: 'bg-rose-100 text-rose-700 border-rose-200' };

const TemplateCard = ({ tpl, onEdit }) => {
  const [showPreview, setShowPreview] = useState(false);
  const Icon = CHANNEL_ICONS[tpl.channel] || MessageSquare;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-800 truncate">{tpl.name}</h4>
          <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${CHANNEL_COLORS[tpl.channel] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            <Icon className="h-3 w-3" />
            {CHANNELS.find(c => c.id === tpl.channel)?.label || tpl.channel}
          </span>
        </div>
        <button onClick={() => onEdit(tpl)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer shrink-0">
          <Edit2 className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 bg-gray-50 rounded-xl p-3">{tpl.body}</p>
      {tpl.variables?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tpl.variables.map(v => (
            <span key={v} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-mono font-bold">{v}</span>
          ))}
        </div>
      )}
      <button onClick={() => setShowPreview(!showPreview)}
        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer">
        <Eye className="h-3.5 w-3.5" />
        {showPreview ? 'An xem truoc' : 'Xem truoc voi du lieu mau'}
      </button>
      {showPreview && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <p className="text-[11px] font-bold text-emerald-700 mb-1.5">Xem truoc (du lieu mau):</p>
          <p className="text-sm text-gray-700 leading-relaxed">{fillVariables(tpl.body)}</p>
        </div>
      )}
    </div>
  );
};

const TemplateModal = ({ template, onClose, onSave }) => {
  const [form, setForm] = useState(template ? { ...template } : { name: '', channel: 'zalo', body: '', variables: [], status: 'active' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) { toast.error('Vui long dien day du thong tin!'); return; }
    const vars = [...form.body.matchAll(/\{[^}]+\}/g)].map(m => m[0]);
    onSave({ ...form, id: form.id || `tpl-${Date.now()}`, variables: [...new Set(vars)] });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{template ? 'Sua mau tin nhan' : 'Tao mau tin nhan moi'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Ten mau *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Vi du: Nhac lich truoc ngay gui meo" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Kenh gui</label>
            <select value={form.channel} onChange={e => set('channel', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
              {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Noi dung tin *</label>
            <p className="text-[11px] text-gray-400 mb-1.5">Bien ca nhan hoa: {'{ten_chu}'}, {'{ten_meo}'}, {'{ngay_nhan}'}, {'{ma_uu_dai}'}, {'{hang}'}</p>
            <textarea value={form.body} onChange={e => set('body', e.target.value)} rows={5} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" placeholder="Noi dung tin nhan... Dung {ten_chu} de ca nhan hoa" />
          </div>
          {form.body && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-[11px] font-bold text-emerald-700 mb-1">Xem truoc:</p>
              <p className="text-sm text-gray-700">{fillVariables(form.body)}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">Huy</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer">Luu mau</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Tab2Templates = ({ templates, setTemplates }) => {
  const [channelFilter, setChannelFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const filtered = channelFilter === 'all' ? templates : templates.filter(t => t.channel === channelFilter);

  const handleSave = (tpl) => {
    const next = editingTemplate ? templates.map(t => t.id === tpl.id ? tpl : t) : [...templates, tpl];
    setTemplates(next);
    saveToStorage(MKT_STORAGE_KEYS.TEMPLATES, next);
    toast.success(editingTemplate ? 'Da cap nhat mau tin nhan!' : 'Da tao mau tin nhan moi!');
    setModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Mau tin nhan theo kenh</h3>
            <p className="text-xs text-gray-500 mt-0.5">Bien ca nhan hoa: ten chu, ten meo, ngay nhan, ma uu dai, hang</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Channel filter pills */}
            <button onClick={() => setChannelFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${channelFilter === 'all' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-500 hover:border-emerald-300'}`}>Tat ca</button>
            {CHANNELS.map(c => (
              <button key={c.id} onClick={() => setChannelFilter(c.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${channelFilter === c.id ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-500 hover:border-emerald-300'}`}>{c.label}</button>
            ))}
            <button onClick={() => { setEditingTemplate(null); setModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-all hover:scale-[1.02] cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              Mau moi
            </button>
          </div>
        </div>
      </div>

      {/* Grid mau tin nhan */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-12 text-center text-gray-400 text-sm">Chua co mau tin nhan nao.</div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tpl => (
            <TemplateCard key={tpl.id} tpl={tpl} onEdit={(t) => { setEditingTemplate(t); setModalOpen(true); }} />
          ))}
        </div>
      )}

      {modalOpen && <TemplateModal template={editingTemplate} onClose={() => { setModalOpen(false); setEditingTemplate(null); }} onSave={handleSave} />}
    </div>
  );
};

export default Tab2Templates;
