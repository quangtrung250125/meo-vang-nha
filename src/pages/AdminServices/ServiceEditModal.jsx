import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Save } from 'lucide-react';
import { useServiceCatalog } from '../../contexts/ServiceCatalogContext';
import { SERVICE_CATEGORIES, ROOM_KEYS, deriveItem } from '../../utils/serviceCatalog';

const IMAGE_CHOICES = [
  { url: '/images/rooms/deluxe-1.png', label: 'Phòng Deluxe' },
  { url: '/images/rooms/vip.png', label: 'Phòng VIP' },
  { url: '/images/rooms/vvip.png', label: 'Phòng VVIP' },
  { url: '/images/service_spa.png', label: 'Spa' },
  { url: '/images/service_care.png', label: 'Chăm sóc / đưa đón' },
];

const PERIODS = ['/ngày', '/đêm', '/lần', '/chuyến', '/tháng'];

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-xs font-bold text-gray-600 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
  </label>
);

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300';

const ServiceEditModal = ({ item, onClose }) => {
  const { saveItem, addItem } = useServiceCatalog();
  const isNew = Boolean(item.isNew);
  const [form, setForm] = useState(() => ({
    name: item.name || '',
    category: item.category || SERVICE_CATEGORIES[0],
    originalPrice: item.originalPrice ?? '',
    discountPercent: item.discountPercent ?? (isNew ? 10 : 0),
    pricePrefix: item.pricePrefix || '',
    period: item.period || (item.category === 'Lưu trú' ? '/ngày' : '/lần'),
    desc: item.desc || '',
    tagline: item.tagline || '',
    featuresText: (item.features || []).join('\n'),
    capacity: item.capacity || '',
    forRoomTypes: item.forRoomTypes || (item.category === 'Lưu trú' ? ['VIP', 'VVIP', 'DELUXE'] : []),
    includesCamera: Boolean(item.includesCamera),
    image: item.image || (item.category === 'Lưu trú' ? '/images/rooms/vip.png' : '/images/service_spa.png'),
    status: item.status || 'active',
    isPopular: Boolean(item.isPopular),
  }));
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const isLodging = form.category === 'Lưu trú';

  const preview = deriveItem({ originalPrice: Number(form.originalPrice) || 0, discountPercent: Number(form.discountPercent) || 0, pricePrefix: form.pricePrefix });

  const toggleRoom = (key) =>
    setForm((f) => ({ ...f, forRoomTypes: f.forRoomTypes.includes(key) ? f.forRoomTypes.filter((k) => k !== key) : [...f.forRoomTypes, key] }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nhập tên dịch vụ');
    const originalPrice = Number(form.originalPrice);
    if (!Number.isFinite(originalPrice) || originalPrice <= 0) return toast.error('Giá niêm yết phải lớn hơn 0');
    const discountPercent = Number(form.discountPercent) || 0;
    if (discountPercent < 0 || discountPercent > 90) return toast.error('% ưu đãi từ 0 đến 90');
    if (isLodging && form.forRoomTypes.length === 0) return toast.error('Chọn ít nhất 1 hạng phòng áp dụng');

    const changes = {
      name: form.name.trim(),
      category: form.category,
      originalPrice,
      discountPercent,
      pricePrefix: form.pricePrefix.trim(),
      period: form.period,
      desc: form.desc.trim(),
      features: form.featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
      capacity: form.capacity.trim(),
      image: form.image,
      status: form.status,
      isPopular: form.isPopular,
    };
    if (isLodging) {
      changes.forRoomTypes = form.forRoomTypes;
      changes.includesCamera = form.includesCamera;
      if (form.tagline.trim() || item.tagline) changes.tagline = form.tagline.trim();
    }

    setSaving(true);
    try {
      if (isNew) {
        await addItem({ ...changes, bg: 'bg-primary-light', border: 'border-green-100' });
        toast.success(`Đã thêm "${changes.name}". Khách thấy ngay trên trang Dịch vụ.`);
      } else {
        await saveItem(item.id, changes);
        toast.success(`Đã lưu "${changes.name}". Trang khách đã cập nhật.`);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Không lưu được');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        role="dialog"
        aria-label={isNew ? 'Thêm dịch vụ mới' : `Sửa ${item.name}`}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-extrabold text-gray-800">{isNew ? 'Thêm dịch vụ mới' : `Sửa: ${item.name}`}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên dịch vụ">
              <input className={inputCls} value={form.name} onChange={set('name')} placeholder="VD: Combo tắm + tỉa lông" />
            </Field>
            <Field label="Nhóm dịch vụ">
              <select className={inputCls} value={form.category} onChange={set('category')} disabled={!isNew && !item.isCustom}>
                {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Giá niêm yết (đ)">
              <input className={inputCls} type="number" min="0" step="1000" value={form.originalPrice} onChange={set('originalPrice')} aria-label="Giá niêm yết" />
            </Field>
            <Field label="% ưu đãi" hint="0 = không giảm">
              <input className={inputCls} type="number" min="0" max="90" value={form.discountPercent} onChange={set('discountPercent')} aria-label="Phần trăm ưu đãi" />
            </Field>
            <Field label="Chữ trước giá" hint='VD: "từ"'>
              <input className={inputCls} value={form.pricePrefix} onChange={set('pricePrefix')} />
            </Field>
            <Field label="Tính theo">
              <select className={inputCls} value={form.period} onChange={set('period')}>
                {[...new Set([form.period, ...PERIODS])].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <div className="rounded-2xl bg-orange-50 border border-orange-100 px-4 py-2 text-sm">
            Khách sẽ thấy: <strong className="text-orange-600">{preview.priceString}</strong>{form.period}
            {preview.discountPercent > 0 && <span className="text-gray-400 line-through ml-2">{preview.originalPriceString}</span>}
          </div>

          <Field label="Mô tả ngắn">
            <textarea className={inputCls} rows={2} value={form.desc} onChange={set('desc')} />
          </Field>
          {isLodging && (
            <Field label="Câu giới thiệu (hiện dưới tên gói lưu trú)">
              <input className={inputCls} value={form.tagline} onChange={set('tagline')} />
            </Field>
          )}
          <Field label="Tiện ích đi kèm" hint="Mỗi dòng 1 tiện ích">
            <textarea className={inputCls} rows={4} value={form.featuresText} onChange={set('featuresText')} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sức chứa / giới hạn" hint="VD: Tối đa 2 mèo/phòng, Bé dưới 10kg">
              <input className={inputCls} value={form.capacity} onChange={set('capacity')} />
            </Field>
            <Field label="Trạng thái">
              <select className={inputCls} value={form.status} onChange={set('status')} aria-label="Trạng thái">
                <option value="active">Đang nhận khách</option>
                <option value="paused">Tạm ngưng nhận (ẩn với khách)</option>
              </select>
            </Field>
          </div>

          {isLodging && (
            <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
              <p className="text-xs font-bold text-gray-600">Áp dụng cho hạng phòng</p>
              <div className="flex flex-wrap gap-3">
                {ROOM_KEYS.map((key) => (
                  <label key={key} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={form.forRoomTypes.includes(key)} onChange={() => toggleRoom(key)} />
                    {key}
                  </label>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={form.includesCamera} onChange={set('includesCamera')} />
                Đã gồm camera riêng 24/24 (không thu thêm phí camera)
              </label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ảnh">
              <select className={inputCls} value={IMAGE_CHOICES.some((c) => c.url === form.image) ? form.image : '__custom'} onChange={(e) => e.target.value !== '__custom' && setForm((f) => ({ ...f, image: e.target.value }))}>
                {IMAGE_CHOICES.map((c) => <option key={c.url} value={c.url}>{c.label}</option>)}
                <option value="__custom">Link ảnh khác…</option>
              </select>
              <input className={`${inputCls} mt-2`} value={form.image} onChange={set('image')} placeholder="https://..." />
            </Field>
            <div className="flex items-end gap-3">
              {form.image && <img src={form.image} alt="" className="w-20 h-20 object-cover rounded-xl bg-gray-100" />}
              <label className="inline-flex items-center gap-2 text-sm pb-2">
                <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={form.isPopular} onChange={set('isPopular')} />
                Gắn nhãn "Phổ biến"
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Huỷ</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Đang lưu…' : isNew ? 'Thêm & đăng ngay' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceEditModal;
