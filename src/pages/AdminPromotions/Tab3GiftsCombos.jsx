import React, { useState } from 'react';
import {
  Gift,
  Plus,
  Search,
  Sparkles,
  Edit,
  Trash2,
  Package,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  formatCurrency,
  saveToStorage,
  STORAGE_KEYS
} from './promotionsStore';

const GIFT_TYPES = [
  { id: 'all', label: 'Tất cả các loại' },
  { id: 'combo', label: 'Combo ưu đãi' },
  { id: 'gift', label: 'Quà tặng kèm' },
  { id: 'points_redeem', label: 'Đổi điểm thưởng' },
];

const Tab3GiftsCombos = ({ gifts, setGifts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const initialForm = {
    name: '',
    type: 'gift', // combo, gift, points_redeem
    content: '',
    value: 100000,
    pointsRequired: 100,
    condition: 'Dành cho đơn đặt phòng từ 2 ngày',
    stockTotal: 50,
    stockUsed: 0,
    enabled: true,
  };
  const [formData, setFormData] = useState(initialForm);

  // Bật / tắt quà
  const handleToggleEnable = (id) => {
    const updated = gifts.map((g) => {
      if (g.id === id) {
        const nextState = !g.enabled;
        toast.success(
          nextState
            ? `Đã kích hoạt "${g.name}"`
            : `Đã tạm ngưng áp dụng "${g.name}"`
        );
        return { ...g, enabled: nextState };
      }
      return g;
    });
    setGifts(updated);
    saveToStorage(STORAGE_KEYS.GIFTS_COMBOS, updated);
  };

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      type: item.type || 'gift',
      content: item.content || '',
      value: item.value || 0,
      pointsRequired: item.pointsRequired || 100,
      condition: item.condition || '',
      stockTotal: item.stockTotal || 50,
      stockUsed: item.stockUsed || 0,
      enabled: item.enabled !== false,
    });
    setIsModalOpen(true);
  };

  // Lưu quà / combo
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên quà tặng / combo!');
      return;
    }

    let typeLabel = 'Quà tặng kèm';
    let badgeCls = 'bg-orange-50 text-orange-700 border-orange-200';
    if (formData.type === 'combo') {
      typeLabel = 'Combo ưu đãi';
      badgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (formData.type === 'points_redeem') {
      typeLabel = 'Đổi điểm thưởng';
      badgeCls = 'bg-purple-50 text-purple-700 border-purple-200';
    }

    if (editingItem) {
      const updated = gifts.map((g) => {
        if (g.id === editingItem.id) {
          return {
            ...g,
            ...formData,
            typeLabel,
            badgeCls,
          };
        }
        return g;
      });
      setGifts(updated);
      saveToStorage(STORAGE_KEYS.GIFTS_COMBOS, updated);
      toast.success(`Đã cập nhật "${formData.name}"!`);
    } else {
      const newItem = {
        id: 'gift-' + Date.now(),
        ...formData,
        typeLabel,
        badgeCls,
      };
      const updated = [newItem, ...gifts];
      setGifts(updated);
      saveToStorage(STORAGE_KEYS.GIFTS_COMBOS, updated);
      toast.success(`Đã thêm thành công "${formData.name}"!`);
    }

    setIsModalOpen(false);
  };

  // Xóa quà tặng
  const handleDeleteItem = (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
      const next = gifts.filter((g) => g.id !== id);
      setGifts(next);
      saveToStorage(STORAGE_KEYS.GIFTS_COMBOS, next);
      toast.success(`Đã xóa "${name}"`);
    }
  };

  // Lọc danh sách
  const filteredGifts = gifts.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || g.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc nội dung quà tặng..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-gray-700 cursor-pointer"
          >
            {GIFT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm quà tặng / Combo</span>
        </button>
      </div>

      {/* 2. Bảng Danh sách Quà tặng & Combo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tên Quà tặng / Combo</th>
                <th className="py-3.5 px-4">Phân loại</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nội dung chi tiết</th>
                <th className="py-3.5 px-4">Giá trị / Điểm đổi</th>
                <th className="py-3.5 px-4">Điều kiện nhận</th>
                <th className="py-3.5 px-4 min-w-[140px]">Tồn / Giới hạn</th>
                <th className="py-3.5 px-4 text-center">Bật / Tắt</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGifts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    Không tìm thấy quà tặng hoặc combo nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredGifts.map((item) => {
                  const stockPercent = Math.min(
                    100,
                    Math.round(((item.stockUsed || 0) / (item.stockTotal || 1)) * 100)
                  );
                  const remaining = Math.max(0, (item.stockTotal || 0) - (item.stockUsed || 0));

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Tên */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            {item.type === 'combo' ? (
                              <Layers className="w-4 h-4" />
                            ) : item.type === 'points_redeem' ? (
                              <Award className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Gift className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-bold text-gray-800 line-clamp-1">{item.name}</span>
                        </div>
                      </td>

                      {/* Loại */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${item.badgeCls}`}>
                          {item.typeLabel}
                        </span>
                      </td>

                      {/* Nội dung */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 leading-relaxed">
                        {item.content}
                      </td>

                      {/* Giá trị / Điểm */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-emerald-700 block">
                          {formatCurrency(item.value)}
                        </span>
                        {item.type === 'points_redeem' && (
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 inline-block mt-0.5">
                            Cần {item.pointsRequired} Điểm
                          </span>
                        )}
                      </td>

                      {/* Điều kiện */}
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {item.condition}
                      </td>

                      {/* Tồn / Giới hạn */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-700">
                              Còn {remaining} / {item.stockTotal}
                            </span>
                            <span className="text-gray-400">{stockPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                remaining <= 5 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Bật / Tắt */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleEnable(item.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                            item.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              item.enabled ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Nút sửa / xóa */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Modal Thêm / Sửa Quà tặng & Combo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {editingItem ? 'Chỉnh sửa Quà tặng / Combo' : 'Thêm Quà tặng / Combo mới'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Cài đặt phần thưởng, quà tặng kèm hoặc quà đổi bằng điểm thành viên
            </p>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tên Quà tặng / Combo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Set Pate Monge (02 lon)"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Phân loại
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="gift">Quà tặng kèm</option>
                    <option value="combo">Combo ưu đãi</option>
                    <option value="points_redeem">Đổi bằng điểm thưởng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Giá trị niêm yết (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={10000}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {formData.type === 'points_redeem' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Số điểm thưởng cần đổi
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={formData.pointsRequired}
                    onChange={(e) => setFormData({ ...formData, pointsRequired: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-purple-50 border border-purple-200 rounded-xl text-sm font-bold text-purple-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nội dung chi tiết món quà
                </label>
                <textarea
                  rows={2}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Mô tả cụ thể quà tặng bên trong..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Điều kiện nhận
                </label>
                <input
                  type="text"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder="VD: Đặt phòng VIP từ 3 ngày trở lên"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tổng số lượng tồn kho
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.stockTotal}
                    onChange={(e) => setFormData({ ...formData, stockTotal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Đã trao / Đã sử dụng
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stockUsed}
                    onChange={(e) => setFormData({ ...formData, stockUsed: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-200 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tab3GiftsCombos;
