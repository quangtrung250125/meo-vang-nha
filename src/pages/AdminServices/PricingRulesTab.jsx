import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Save, Calculator } from 'lucide-react';
import { useServiceCatalog } from '../../contexts/ServiceCatalogContext';
import { RULE_TYPES, SERVICE_CATEGORIES, describeRule, computeRuleAdjustments, formatVnd } from '../../utils/serviceCatalog';

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300';
const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const NEW_RULE = { type: 'season', name: '', percent: 10, startDate: '', endDate: '', weekdays: [5, 6], minNights: 7, minCats: 1, appliesTo: ['Lưu trú'], repeatYearly: false, active: true };

const RuleModal = ({ rule, onClose }) => {
  const { saveRule } = useServiceCatalog();
  const [form, setForm] = useState({ ...NEW_RULE, ...rule });
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleIn = (key, v) => setForm((f) => ({ ...f, [key]: f[key]?.includes(v) ? f[key].filter((x) => x !== v) : [...(f[key] || []), v] }));
  const isDate = form.type === 'season' || form.type === 'holiday';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nhập tên quy tắc');
    const percent = Number(form.percent);
    if (!Number.isFinite(percent) || percent === 0 || Math.abs(percent) > 200) return toast.error('% điều chỉnh không hợp lệ');
    if (form.type === 'discount' && percent < 0) return toast.error('Giảm giá nhập số dương, VD 5 = giảm 5%');
    if (isDate && (!form.startDate || !form.endDate)) return toast.error('Chọn ngày bắt đầu và kết thúc');
    if (isDate && !form.repeatYearly && form.endDate < form.startDate) return toast.error('Ngày kết thúc phải sau ngày bắt đầu');
    if (form.type === 'weekend' && form.weekdays.length === 0) return toast.error('Chọn ít nhất 1 ngày trong tuần');
    if (!form.appliesTo?.length) return toast.error('Chọn nhóm dịch vụ áp dụng');

    const clean = {
      id: rule.id,
      isCustom: rule.isCustom,
      type: form.type,
      name: form.name.trim(),
      percent,
      appliesTo: form.type === 'discount' ? form.appliesTo : ['Lưu trú'],
      active: Boolean(form.active),
    };
    if (isDate) Object.assign(clean, { startDate: form.startDate, endDate: form.endDate, repeatYearly: Boolean(form.repeatYearly) });
    if (form.type === 'weekend') clean.weekdays = form.weekdays.map(Number).sort();
    if (form.type === 'discount') Object.assign(clean, { minNights: Number(form.minNights) || 0, minCats: Number(form.minCats) || 0 });

    setSaving(true);
    try {
      await saveRule(clean);
      toast.success(`Đã lưu quy tắc "${clean.name}"`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Không lưu được');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form onSubmit={handleSave} onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl" role="dialog" aria-label="Quy tắc giá">
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="font-extrabold text-gray-800">{rule.id ? 'Sửa quy tắc giá' : 'Thêm quy tắc giá'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" aria-label="Đóng"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Loại</span>
            <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)} disabled={Boolean(rule.id)} aria-label="Loại quy tắc">
              {Object.entries(RULE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Tên hiển thị cho khách</span>
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="VD: Phụ thu dịp 30/4 - 1/5" aria-label="Tên quy tắc" />
          </label>
          <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">{form.type === 'discount' ? 'Giảm (%)' : 'Điều chỉnh giá lưu trú (%)'}</span>
            <input className={inputCls} type="number" value={form.percent} onChange={(e) => set('percent', e.target.value)} aria-label="Phần trăm" />
            {form.type !== 'discount' && <span className="block text-[11px] text-gray-400 mt-1">Số dương = phụ thu, số âm = giảm (VD -10 cho mùa thấp điểm)</span>}
          </label>

          {isDate && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Từ ngày</span><input type="date" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} aria-label="Từ ngày" /></label>
                <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Đến ngày</span><input type="date" className={inputCls} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} aria-label="Đến ngày" /></label>
              </div>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="accent-orange-500 w-4 h-4" checked={Boolean(form.repeatYearly)} onChange={(e) => set('repeatYearly', e.target.checked)} /> Lặp lại hằng năm</label>
            </>
          )}

          {form.type === 'weekend' && (
            <div>
              <span className="block text-xs font-bold text-gray-600 mb-1">Áp dụng cho đêm</span>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((d, i) => (
                  <button type="button" key={d} onClick={() => toggleIn('weekdays', i)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${form.weekdays?.includes(i) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>{d}</button>
                ))}
              </div>
            </div>
          )}

          {form.type === 'discount' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Gửi tối thiểu (đêm)</span><input type="number" min="0" className={inputCls} value={form.minNights} onChange={(e) => set('minNights', e.target.value)} /></label>
                <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Số mèo tối thiểu</span><input type="number" min="0" className={inputCls} value={form.minCats} onChange={(e) => set('minCats', e.target.value)} /></label>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-600 mb-1">Giảm trên</span>
                <div className="flex flex-wrap gap-3">
                  {SERVICE_CATEGORIES.map((c) => (
                    <label key={c} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="accent-orange-500 w-4 h-4" checked={form.appliesTo?.includes(c)} onChange={() => toggleIn('appliesTo', c)} /> {c}</label>
                  ))}
                </div>
              </div>
            </>
          )}

          <label className="inline-flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="accent-orange-500 w-4 h-4" checked={Boolean(form.active)} onChange={(e) => set('active', e.target.checked)} /> Bật ngay (khách thấy và tính vào giá)</label>
        </div>
        <div className="border-t border-gray-100 px-5 py-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Huỷ</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Đang lưu…' : 'Lưu quy tắc'}</button>
        </div>
      </form>
    </div>
  );
};

// Máy tính thử: admin xem 1 đơn mẫu sẽ bị phụ thu / giảm bao nhiêu
const RuleSimulator = ({ rules, items }) => {
  const lodgings = items.filter((i) => i.category === 'Lưu trú' && i.published !== false);
  const today = new Date().toISOString().slice(0, 10);
  const [pkgId, setPkgId] = useState(lodgings[0]?.id || '');
  const [checkIn, setCheckIn] = useState(today);
  const [nights, setNights] = useState(3);
  const [cats, setCats] = useState(1);
  const pkg = lodgings.find((l) => l.id === pkgId) || lodgings[0];
  const days = Math.max(1, Number(nights) || 1);
  const base = (pkg?.price || 0) * days * Math.max(1, Number(cats) || 1);
  const { lines, total } = computeRuleAdjustments({ rules: rules.filter((r) => r.active), checkIn, days, cats, lodgingNightly: pkg?.price || 0 });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Calculator className="w-4 h-4 text-orange-500" /> Thử tính giá với các quy tắc đang bật</h3>
      <div className="grid gap-3 sm:grid-cols-4 mb-3">
        <select className={inputCls} value={pkg?.id || ''} onChange={(e) => setPkgId(e.target.value)} aria-label="Gói thử">
          {lodgings.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input type="date" className={inputCls} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} aria-label="Ngày gửi thử" />
        <input type="number" min="1" className={inputCls} value={nights} onChange={(e) => setNights(e.target.value)} aria-label="Số đêm thử" />
        <input type="number" min="1" className={inputCls} value={cats} onChange={(e) => setCats(e.target.value)} aria-label="Số mèo thử" />
      </div>
      <div className="text-sm space-y-1">
        <div className="flex justify-between"><span className="text-gray-500">Tiền lưu trú ({days} đêm × {cats} bé × {formatVnd(pkg?.price)})</span><span>{formatVnd(base)}</span></div>
        {lines.map((l) => (
          <div key={l.id} className={`flex justify-between ${l.amount < 0 ? 'text-emerald-700' : 'text-amber-700'}`}><span>{l.name}{l.nights ? ` (${l.nights} đêm)` : ''}</span><span>{l.amount < 0 ? '-' : '+'}{formatVnd(Math.abs(l.amount))}</span></div>
        ))}
        {lines.length === 0 && <p className="text-xs text-gray-400">Không có quy tắc nào áp vào khoảng ngày này.</p>}
        <div className="flex justify-between font-bold border-t border-gray-100 pt-1"><span>Tổng tiền lưu trú</span><span className="text-orange-600">{formatVnd(base + total)}</span></div>
      </div>
    </div>
  );
};

const PricingRulesTab = () => {
  const { rules, items, saveRule, removeRule } = useServiceCatalog();
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState('');

  const toggle = async (rule) => {
    setBusyId(rule.id);
    try {
      await saveRule({ ...rule, active: !rule.active });
      toast.success(rule.active ? `Đã tắt "${rule.name}"` : `Đã bật "${rule.name}". Khách thấy ngay.`);
    } catch (err) {
      toast.error(err.message || 'Không lưu được');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (rule) => {
    setBusyId(rule.id);
    try {
      await removeRule(rule);
      toast.success(`Đã xoá "${rule.name}"`);
    } catch (err) {
      toast.error(err.message || 'Không xoá được');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-sm text-sky-800">
        Quy tắc đang bật sẽ hiện ở đầu trang Dịch vụ của khách và tự cộng/trừ vào tổng tiền ở bước Xác nhận khi đặt phòng.
        Mỗi đêm chỉ tính 1 mức theo ngày (Lễ Tết ưu tiên, rồi Theo mùa, rồi Cuối tuần). Các quy tắc Giảm giá không cộng dồn, lấy mức có lợi nhất cho khách.
      </div>

      <div className="flex justify-end">
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Thêm quy tắc giá
        </button>
      </div>

      {Object.entries(RULE_TYPES).sort((a, b) => b[1].priority - a[1].priority).map(([type, meta]) => {
        const list = rules.filter((r) => r.type === type);
        if (list.length === 0) return null;
        return (
          <section key={type}>
            <h2 className="font-extrabold text-gray-800 mb-3">{meta.label}</h2>
            <div className="space-y-3">
              {list.map((rule) => (
                <div key={rule.id} data-testid={`rule-row-${rule.id}`} className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${rule.active ? 'border-amber-200 shadow-sm' : 'border-gray-100'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800">{rule.name}</p>
                    <p className="text-xs text-gray-500">{describeRule(rule)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggle(rule)}
                      disabled={busyId === rule.id}
                      role="switch"
                      aria-checked={Boolean(rule.active)}
                      aria-label={`Bật tắt ${rule.name}`}
                      className={`relative w-12 h-7 rounded-full transition-colors ${rule.active ? 'bg-emerald-500' : 'bg-gray-300'} disabled:opacity-50`}
                    >
                      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${rule.active ? 'left-6' : 'left-1'}`} />
                    </button>
                    <span className={`text-xs font-bold w-12 ${rule.active ? 'text-emerald-600' : 'text-gray-400'}`}>{rule.active ? 'Đang bật' : 'Đang tắt'}</span>
                    <button onClick={() => setEditing(rule)} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-white text-orange-600 border border-orange-200 hover:bg-orange-50"><Pencil className="w-3.5 h-3.5" /> Sửa</button>
                    {rule.isCustom && (
                      <button onClick={() => remove(rule)} disabled={busyId === rule.id} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-white text-rose-600 border border-rose-200 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /> Xoá</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <RuleSimulator rules={rules} items={items} />

      {editing && <RuleModal rule={editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

export default PricingRulesTab;
