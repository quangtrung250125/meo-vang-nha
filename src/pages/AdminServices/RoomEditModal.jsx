import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Save } from 'lucide-react';
import { useServiceCatalog } from '../../contexts/ServiceCatalogContext';

const inputCls = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300';

const RoomEditModal = ({ room, onClose }) => {
  const { saveRoom } = useServiceCatalog();
  const [form, setForm] = useState({
    name: room.name || '',
    badge: room.badge || '',
    capacity: room.capacity || '',
    description: room.description || '',
    surcharge: room.surcharge ?? 0,
    status: room.status || 'active',
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const surcharge = Number(form.surcharge);
    if (!form.name.trim()) return toast.error('Nhập tên hạng phòng');
    if (!Number.isFinite(surcharge) || surcharge < 0) return toast.error('Phụ phí không hợp lệ');
    setSaving(true);
    try {
      await saveRoom(room.key, {
        name: form.name.trim(),
        badge: form.badge.trim(),
        capacity: form.capacity.trim(),
        description: form.description.trim(),
        surcharge,
        status: form.status,
      });
      toast.success(`Đã lưu ${form.name}. Trang khách đã cập nhật.`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Không lưu được');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form onSubmit={handleSave} onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl" role="dialog" aria-label={`Sửa ${room.name}`}>
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="font-extrabold text-gray-800">Sửa hạng phòng {room.key}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" aria-label="Đóng"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Tên hiển thị</span><input className={inputCls} value={form.name} onChange={set('name')} /></label>
          <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Nhãn ngắn</span><input className={inputCls} value={form.badge} onChange={set('badge')} /></label>
          <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Sức chứa</span><input className={inputCls} value={form.capacity} onChange={set('capacity')} placeholder="VD: Tối đa 2 mèo/phòng" /></label>
          <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Mô tả</span><textarea className={inputCls} rows={3} value={form.description} onChange={set('description')} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Phụ phí nâng hạng (đ/ngày)</span><input className={inputCls} type="number" min="0" step="1000" value={form.surcharge} onChange={set('surcharge')} aria-label="Phụ phí nâng hạng" /></label>
            <label className="block"><span className="block text-xs font-bold text-gray-600 mb-1">Trạng thái</span>
              <select className={inputCls} value={form.status} onChange={set('status')}>
                <option value="active">Đang nhận khách</option>
                <option value="paused">Tạm ngưng nâng hạng</option>
              </select>
            </label>
          </div>
          <p className="text-[11px] text-gray-400">Tạm ngưng: khách không chọn được nâng lên hạng phòng này ở trang Dịch vụ. Sơ đồ phòng và đơn đã đặt không bị ảnh hưởng.</p>
        </div>
        <div className="border-t border-gray-100 px-5 py-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Huỷ</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Đang lưu…' : 'Lưu'}</button>
        </div>
      </form>
    </div>
  );
};

export default RoomEditModal;
