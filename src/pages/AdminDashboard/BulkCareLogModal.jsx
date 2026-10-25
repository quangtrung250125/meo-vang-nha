import React, { useEffect, useMemo, useState } from 'react';
import { Utensils, Smile, Droplets, HeartPulse, X, CheckSquare, Square } from 'lucide-react';

const STOOL_OPTIONS = ['Bình thường', 'Hơi lỏng', 'Tiêu chảy', 'Táo bón', 'Chưa đi vệ sinh'];

const emptyForm = {
  feed: true,
  foodAmount: '50',
  play: false,
  hygiene: false,
  stool: 'Bình thường',
  note: '',
};

/**
 * Cập nhật nhật ký cho nhiều bé cùng lúc.
 * onSave(selectedCats, formData) — formData theo cùng định dạng với cập nhật từng bé.
 */
const BulkCareLogModal = ({ isOpen, onClose, cats, onSave, initialAction }) => {
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const keyOf = (cat) => `${cat.bookingId}_${cat.id}`;

  // Mở modal: chọn sẵn các bé phù hợp với tác vụ được bấm
  useEffect(() => {
    if (!isOpen) return;
    const preset = { ...emptyForm };
    let preselected = cats;
    if (initialAction === 'feed') {
      preselected = cats.filter((c) => !c.fed);
    } else if (initialAction === 'play') {
      preset.feed = false;
      preset.play = true;
      preselected = cats.filter((c) => !c.played);
    }
    setForm(preset);
    setSelectedKeys(new Set(preselected.map(keyOf)));
    setIsSaving(false);
    // Chỉ chạy khi vừa mở modal; danh sách bé thay đổi (realtime) không được xóa lựa chọn đang làm dở
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialAction]);

  const selectedCats = useMemo(() => cats.filter((c) => selectedKeys.has(keyOf(c))), [cats, selectedKeys]);

  if (!isOpen) return null;

  const toggleCat = (cat) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const k = keyOf(cat);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const selectWhere = (predicate) => setSelectedKeys(new Set(cats.filter(predicate).map(keyOf)));

  const hasAction = (form.feed && Number(form.foodAmount) > 0) || form.play || form.hygiene || form.note.trim();
  const canSave = selectedCats.length > 0 && hasAction && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    await onSave(selectedCats, {
      foodAmount: form.feed ? form.foodAmount : '',
      played: form.play,
      stool: form.hygiene ? form.stool : '',
      health: form.note,
    });
    setIsSaving(false);
  };

  const filterButtons = [
    { label: 'Tất cả', predicate: () => true },
    { label: 'Chưa cho ăn', predicate: (c) => !c.fed },
    { label: 'Chưa chơi', predicate: (c) => !c.played },
    { label: 'Bỏ chọn', predicate: () => false },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-care-log-title"
    >
      <div className="bg-white w-full sm:max-w-4xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 id="bulk-care-log-title" className="text-xl font-bold text-gray-800">
              Cập nhật nhật ký hàng loạt
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Chọn các bé và việc đã làm. Mỗi bé được ghi nhật ký riêng, khách sẽ thấy ngay trong trang Theo dõi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-5">
          {/* Chọn bé */}
          <section className="md:col-span-2 border-b md:border-b-0 md:border-r p-5 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Bé được cập nhật</h3>
              <span className="text-sm font-semibold text-orange-600">
                {selectedCats.length}/{cats.length} bé
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {filterButtons.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => selectWhere(f.predicate)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
                >
                  {f.label}
                </button>
              ))}
            </div>
            <ul className="space-y-2">
              {cats.map((cat) => {
                const checked = selectedKeys.has(keyOf(cat));
                return (
                  <li key={keyOf(cat)}>
                    <button
                      type="button"
                      onClick={() => toggleCat(cat)}
                      aria-pressed={checked}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                        checked ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-5 h-5 text-orange-500 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 shrink-0" />
                      )}
                      <img src={cat.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-gray-800 truncate">{cat.catName}</span>
                        <span className="block text-xs text-gray-500 truncate">
                          Phòng {cat.room} · {cat.fed ? 'Đã ăn' : 'Chưa ăn'} · {cat.played ? 'Đã chơi' : 'Chưa chơi'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Việc đã làm */}
          <section className="md:col-span-3 p-5 space-y-4">
            <h3 className="font-bold text-gray-800">Việc đã làm</h3>

            <div className={`rounded-xl border p-4 transition-colors ${form.feed ? 'border-orange-300 bg-orange-50/60' : 'border-gray-200'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.feed}
                  onChange={(e) => setForm((p) => ({ ...p, feed: e.target.checked }))}
                  className="w-5 h-5 accent-orange-500"
                />
                <Utensils className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-gray-800">Đã cho ăn</span>
              </label>
              {form.feed && (
                <div className="mt-3 pl-8 flex items-center gap-2">
                  <label htmlFor="bulk-food" className="text-sm text-gray-600">
                    Lượng mỗi bé
                  </label>
                  <input
                    id="bulk-food"
                    type="number"
                    min="1"
                    value={form.foodAmount}
                    onChange={(e) => setForm((p) => ({ ...p, foodAmount: e.target.value }))}
                    className="w-24 border border-gray-200 bg-white rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                  <span className="text-sm text-gray-600">gram</span>
                </div>
              )}
            </div>

            <label
              className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${form.play ? 'border-purple-300 bg-purple-50/60' : 'border-gray-200'}`}
            >
              <input
                type="checkbox"
                checked={form.play}
                onChange={(e) => setForm((p) => ({ ...p, play: e.target.checked }))}
                className="w-5 h-5 accent-purple-500"
              />
              <Smile className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-gray-800">Đã cho chơi đùa, vận động</span>
            </label>

            <div className={`rounded-xl border p-4 transition-colors ${form.hygiene ? 'border-blue-300 bg-blue-50/60' : 'border-gray-200'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hygiene}
                  onChange={(e) => setForm((p) => ({ ...p, hygiene: e.target.checked }))}
                  className="w-5 h-5 accent-blue-500"
                />
                <Droplets className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-800">Đã dọn vệ sinh</span>
              </label>
              {form.hygiene && (
                <div className="mt-3 pl-8">
                  <label htmlFor="bulk-stool" className="text-sm text-gray-600 block mb-1">
                    Tình trạng (áp dụng cho tất cả bé được chọn)
                  </label>
                  <select
                    id="bulk-stool"
                    value={form.stool}
                    onChange={(e) => setForm((p) => ({ ...p, stool: e.target.value }))}
                    className="w-full sm:w-64 border border-gray-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    {STOOL_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <label htmlFor="bulk-note" className="flex items-center gap-3 font-semibold text-gray-800 mb-2">
                <HeartPulse className="w-5 h-5 text-red-400" />
                Ghi chú sức khỏe / tâm trạng
                <span className="text-xs font-normal text-gray-400">(không bắt buộc)</span>
              </label>
              <textarea
                id="bulk-note"
                rows="2"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="VD: Các bé ăn ngon, ngủ trưa ngoan."
                className="w-full border border-gray-200 bg-white rounded-lg p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <p className="text-sm text-gray-500">
            {selectedCats.length === 0
              ? 'Chọn ít nhất 1 bé để lưu.'
              : !hasAction
                ? 'Chọn ít nhất 1 việc đã làm.'
                : `Sẽ ghi nhật ký cho ${selectedCats.length} bé.`}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-colors shadow-md shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Đang lưu...' : `Lưu nhật ký cho ${selectedCats.length} bé`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCareLogModal;
