import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User, Search, UserPlus, X, Phone, CheckCircle2, KeyRound, RefreshCw, BellRing } from 'lucide-react';
import { fetchCustomerAccounts, createCustomerAccount } from '../services/adminCustomersApi';
import { normalizeVnPhone } from '../utils/phone';

const normalizeText = (s = '') =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const randomPassword = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * Dòng "Khách hàng" khi nhân viên đặt phòng hộ khách đến cửa hàng:
 * chọn khách đã có tài khoản, hoặc tạo nhanh tài khoản cho khách mới.
 * value: { id, fullName, phone, email, isNewAccount, tempPassword? } | null
 */
const AdminCustomerPicker = ({ value, onChange, error = '' }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', password: randomPassword() });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const boxRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setCustomers(await fetchCustomerAccounts());
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const matches = useMemo(() => {
    const q = normalizeText(query.trim());
    const digits = query.replace(/\D/g, '');
    const list = !q ? customers : customers.filter((c) =>
      normalizeText(c.fullName).includes(q) ||
      (digits && normalizeVnPhone(c.phone).includes(digits)) ||
      normalizeText(c.email).includes(q));
    return list.slice(0, 8);
  }, [customers, query]);

  const pick = (c) => {
    onChange({ ...c, isNewAccount: false });
    setOpen(false);
    setQuery('');
  };

  const startCreate = () => {
    const digits = query.replace(/\D/g, '');
    setForm({
      fullName: digits.length >= 6 ? '' : query.trim(),
      phone: digits.length >= 6 ? digits : '',
      password: randomPassword(),
    });
    setFormError('');
    setCreating(true);
    setOpen(false);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    const phone = normalizeVnPhone(form.phone);
    if (!form.fullName.trim()) return setFormError('Vui lòng nhập họ tên khách.');
    if (!/^0\d{9}$/.test(phone)) return setFormError('Số điện thoại cần 10 số, bắt đầu bằng 0.');
    if (String(form.password).length < 6) return setFormError('Mật khẩu cần ít nhất 6 ký tự.');
    setSaving(true);
    setFormError('');
    const result = await createCustomerAccount({ ...form, phone });
    setSaving(false);
    if (!result.ok) {
      if (result.existing) {
        setFormError(`${result.message} (${result.existing.fullName || result.existing.phone})`);
        setCustomers((prev) => (prev.some((c) => c.id === result.existing.id) ? prev : [...prev, result.existing]));
      } else {
        setFormError(result.message);
      }
      return;
    }
    setCustomers((prev) => [...prev, result.customer]);
    onChange({ ...result.customer, isNewAccount: true, tempPassword: result.password, needsConfirmation: result.needsConfirmation });
    setCreating(false);
  };

  const existingForPhone = form.phone && customers.find((c) => c.phone === normalizeVnPhone(form.phone));

  return (
    <div ref={boxRef} className="rounded-2xl border-2 border-sky-200 bg-sky-50/60 p-4 sm:p-5" data-testid="admin-customer-picker">
      <div className="flex items-center justify-between gap-2 mb-3">
        <label className="flex items-center gap-2 text-sm font-bold text-text-dark">
          <User className="w-4 h-4 text-sky-600" />
          Khách hàng
          <span className="text-[11px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">Đặt hộ khách tại cửa hàng</span>
        </label>
        <button type="button" onClick={load} className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1" title="Tải lại danh sách khách">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Tải lại</span>
        </button>
      </div>

      {value ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-sky-200 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center font-black shrink-0">
                {(value.fullName || '?').trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-text-dark truncate" data-testid="assisted-customer-name">{value.fullName || 'Khách hàng'}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{value.phone || value.email}</p>
              </div>
            </div>
            <button type="button" onClick={() => onChange(null)} className="text-xs font-bold text-sky-700 hover:text-sky-900 shrink-0 px-2 py-1 rounded-lg hover:bg-sky-100">
              Đổi khách
            </button>
          </div>
          {value.isNewAccount ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Đã tạo tài khoản cho khách. Đơn sẽ được ghi nhận ngay khi đặt.</p>
              <p className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Đưa khách thông tin đăng nhập: SĐT <strong>{value.phone}</strong>, mật khẩu tạm <strong data-testid="assisted-temp-password">{value.tempPassword}</strong> (khách nên đổi sau khi đăng nhập).
              </p>
              {value.needsConfirmation && (
                <p className="text-amber-700">Supabase đang bật xác nhận email nên tài khoản cần được xác nhận trong Supabase (Authentication &gt; Users) trước khi khách đăng nhập.</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-xs text-purple-800 flex items-start gap-1.5">
              <BellRing className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Khách đã có tài khoản: sau khi tạo đơn, hệ thống gửi thông báo để khách <strong>xác nhận</strong>. Khách xác nhận thì đơn mới được ghi nhận (phòng vẫn được giữ trong lúc chờ).</span>
            </div>
          )}
        </div>
      ) : creating ? (
        <form onSubmit={submitCreate} className="space-y-3 rounded-xl bg-white border border-sky-200 p-4" data-testid="assisted-create-form">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-dark flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-sky-600" />Tạo tài khoản khách mới</p>
            <button type="button" onClick={() => setCreating(false)} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Đóng"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Họ tên khách"
              aria-label="Họ tên khách"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Số điện thoại"
              aria-label="Số điện thoại khách"
              inputMode="tel"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Mật khẩu tạm (đưa cho khách để đăng nhập)</label>
            <div className="flex gap-2">
              <input
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                aria-label="Mật khẩu tạm"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-sky-400"
              />
              <button type="button" onClick={() => setForm((f) => ({ ...f, password: randomPassword() }))} className="px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                Tạo mã khác
              </button>
            </div>
          </div>
          {existingForPhone && (
            <button type="button" onClick={() => { pick(existingForPhone); setCreating(false); }} className="w-full text-left text-xs rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
              SĐT này đã có tài khoản <strong>{existingForPhone.fullName || existingForPhone.phone}</strong>. Bấm để chọn khách này.
            </button>
          )}
          {formError && <p className="text-xs font-semibold text-red-600">{formError}</p>}
          <button type="submit" disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl">
            {saving ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & chọn khách này'}
          </button>
        </form>
      ) : (
        <div className="relative">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Tìm khách theo tên hoặc số điện thoại"
                aria-label="Tìm khách hàng"
                className="w-full border border-gray-200 bg-white rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-sky-400"
              />
            </div>
            <button type="button" onClick={startCreate} className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white border-2 border-sky-300 text-sky-700 font-bold text-sm hover:bg-sky-100 shrink-0">
              <UserPlus className="w-4 h-4" />
              Tạo tài khoản mới
            </button>
          </div>
          {open && (
            <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-72 overflow-y-auto">
              {loading && customers.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">Đang tải danh sách khách...</p>
              ) : loadError && customers.length === 0 ? (
                <p className="px-4 py-3 text-xs text-red-600">{loadError}</p>
              ) : matches.length === 0 ? (
                <button type="button" onClick={startCreate} className="w-full text-left px-4 py-3 text-xs text-gray-600 hover:bg-sky-50">
                  Không tìm thấy khách. <span className="font-bold text-sky-700">Tạo tài khoản mới →</span>
                </button>
              ) : matches.map((c) => (
                <button key={c.id} type="button" onClick={() => pick(c)} className="w-full text-left px-4 py-2.5 hover:bg-sky-50 flex items-center justify-between gap-3" data-testid="assisted-customer-option">
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-gray-800 truncate">{c.fullName || 'Chưa có tên'}</span>
                    <span className="block text-xs text-gray-500">{c.phone || c.email}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-sky-700 shrink-0">Chọn</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
};

export default AdminCustomerPicker;
