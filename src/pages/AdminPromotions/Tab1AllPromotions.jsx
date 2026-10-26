import React, { useState, useMemo } from 'react';
import {
  Flame,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  Clock,
  Sparkles,
  Edit,
  Trash2,
  Check,
  X,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  Eye,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  formatCurrency,
  formatDateVN,
  CUSTOMER_GROUPS,
  PROMO_STATUSES,
  saveToStorage,
  STORAGE_KEYS
} from './promotionsStore';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80',
];

const Tab1AllPromotions = ({ promotions, setPromotions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Drawer thêm / sửa ưu đãi
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    description: '',
    type: 'percentage',
    discountValue: 20,
    discountDisplay: 'GIẢM 20%',
    code: '',
    minBookingDays: 2,
    minOrderValue: 300000,
    targetGroup: 'all',
    targetGroupLabel: 'Tất cả khách',
    targetBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    isHot: false,
    budgetTotal: 10000000,
    usageLimit: 100,
    image: SAMPLE_IMAGES[0],
    rightBadgeText: 'Ưu đãi',
    terms: 'Áp dụng cho mọi đơn đặt phòng đủ điều kiện lưu trú.',
  };
  const [formData, setFormData] = useState(initialForm);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const activeCount = promotions.filter((p) => p.status === 'active').length;
    const upcomingCount = promotions.filter((p) => p.status === 'upcoming').length;
    const totalBudget = promotions.reduce((sum, p) => sum + (p.budgetTotal || 0), 0);
    const totalSpent = promotions.reduce((sum, p) => sum + (p.budgetUsed || 0), 0);
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    const totalUsage = promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0);

    return {
      activeCount,
      upcomingCount,
      remainingBudget,
      totalUsage,
    };
  }, [promotions]);

  // Bộ lọc dữ liệu
  const filteredPromos = useMemo(() => {
    return promotions.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      const matchGroup = selectedGroup === 'all' || p.targetGroup === selectedGroup;

      return matchSearch && matchStatus && matchGroup;
    });
  }, [promotions, searchTerm, selectedStatus, selectedGroup]);

  // Bật / tắt ưu đãi
  const handleToggleStatus = (promoId) => {
    const next = promotions.map((p) => {
      if (p.id === promoId) {
        const nextStatus = p.status === 'active' ? 'paused' : 'active';
        toast.success(
          nextStatus === 'active'
            ? `Đã bật ưu đãi "${p.name}"`
            : `Đã tạm dừng ưu đãi "${p.name}"`
        );
        return { ...p, status: nextStatus };
      }
      return p;
    });
    setPromotions(next);
    saveToStorage(STORAGE_KEYS.PROMOTIONS, next);
  };

  // Mở Drawer thêm mới
  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      ...initialForm,
      code: 'PROMO' + Math.floor(1000 + Math.random() * 9000),
    });
    setIsDrawerOpen(true);
  };

  // Mở Drawer sửa
  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name || '',
      description: promo.description || '',
      type: promo.type || 'percentage',
      discountValue: promo.discountValue || 0,
      discountDisplay: promo.discountDisplay || '',
      code: promo.code || '',
      minBookingDays: promo.minBookingDays || 1,
      minOrderValue: promo.minOrderValue || 0,
      targetGroup: promo.targetGroup || 'all',
      targetGroupLabel: promo.targetGroupLabel || 'Tất cả khách',
      targetBadgeColor: promo.targetBadgeColor || 'bg-emerald-100 text-emerald-800 border-emerald-200',
      startDate: promo.startDate || '',
      endDate: promo.endDate || '',
      isHot: Boolean(promo.isHot),
      budgetTotal: promo.budgetTotal || 5000000,
      usageLimit: promo.usageLimit || 50,
      image: promo.image || SAMPLE_IMAGES[0],
      rightBadgeText: promo.targetGroupLabel || 'Ưu đãi',
      terms: promo.terms || '',
    });
    setIsDrawerOpen(true);
  };

  // Lưu ưu đãi (Lưu nháp hoặc Lưu & Bật)
  const handleSavePromo = (targetStatus = 'active') => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên chương trình ưu đãi!');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã ưu đãi!');
      return;
    }

    // Xác định nhãn hiển thị giảm giá
    let discountDisplay = formData.discountDisplay;
    if (formData.type === 'percentage') {
      discountDisplay = `GIẢM ${formData.discountValue}%`;
    } else if (formData.type === 'fixed') {
      discountDisplay = `-${formatCurrency(formData.discountValue)}`;
    } else if (formData.type === 'gift') {
      discountDisplay = 'TẶNG QUÀ';
    } else if (formData.type === 'combo') {
      discountDisplay = 'COMBO';
    }

    // Xác định màu badge đối tượng
    const groupObj = CUSTOMER_GROUPS.find((g) => g.id === formData.targetGroup);
    let targetBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (formData.targetGroup === 'new') targetBadgeColor = 'bg-rose-100 text-rose-700 border-rose-200';
    if (formData.targetGroup === 'loyal') targetBadgeColor = 'bg-sky-100 text-sky-700 border-sky-200';
    if (formData.targetGroup === 'vip') targetBadgeColor = 'bg-purple-100 text-purple-700 border-purple-200';
    if (formData.targetGroup === 'at_risk') targetBadgeColor = 'bg-amber-100 text-amber-700 border-amber-200';

    if (editingPromo) {
      // Cập nhật
      const updated = promotions.map((p) => {
        if (p.id === editingPromo.id) {
          return {
            ...p,
            ...formData,
            discountDisplay,
            targetGroupLabel: formData.rightBadgeText || groupObj?.label || 'Tất cả khách',
            targetBadgeColor,
            validUntil: formatDateVN(formData.endDate),
            status: targetStatus,
          };
        }
        return p;
      });
      setPromotions(updated);
      saveToStorage(STORAGE_KEYS.PROMOTIONS, updated);
      toast.success(`Đã cập nhật ưu đãi "${formData.name}"!`);
    } else {
      // Tạo mới
      const newPromo = {
        id: 'promo-' + Date.now(),
        ...formData,
        discountDisplay,
        targetGroupLabel: formData.rightBadgeText || groupObj?.label || 'Tất cả khách',
        targetBadgeColor,
        validUntil: formatDateVN(formData.endDate),
        status: targetStatus,
        budgetUsed: 0,
        usageCount: 0,
      };
      const updated = [newPromo, ...promotions];
      setPromotions(updated);
      saveToStorage(STORAGE_KEYS.PROMOTIONS, updated);
      toast.success(`Đã tạo thành công ưu đãi "${formData.name}"!`);
    }

    setIsDrawerOpen(false);
  };

  // Xóa ưu đãi
  const handleDeletePromo = (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa ưu đãi "${name}" không?`)) {
      const next = promotions.filter((p) => p.id !== id);
      setPromotions(next);
      saveToStorage(STORAGE_KEYS.PROMOTIONS, next);
      toast.success(`Đã xóa ưu đãi "${name}"`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hàng số liệu nhanh (KPI Stats) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Đang chạy</p>
            <p className="text-2xl font-black text-gray-800">{stats.activeCount} <span className="text-xs font-normal text-gray-400">ưu đãi</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Sắp diễn ra</p>
            <p className="text-2xl font-black text-gray-800">{stats.upcomingCount} <span className="text-xs font-normal text-gray-400">chiến dịch</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Ngân sách còn lại</p>
            <p className="text-xl font-black text-emerald-600">{formatCurrency(stats.remainingBudget)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Lượt dùng 30 ngày</p>
            <p className="text-2xl font-black text-gray-800">{stats.totalUsage} <span className="text-xs font-normal text-gray-400">lượt</span></p>
          </div>
        </div>
      </div>

      {/* 2. Thanh công cụ & Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Tìm kiếm & Lọc */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc mã ưu đãi..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc Trạng thái */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer font-medium text-gray-700"
          >
            {PROMO_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Lọc Đối tượng */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer font-medium text-gray-700"
          >
            {CUSTOMER_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nút Chuyển dạng Thẻ / Bảng & Nút Tạo ưu đãi */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Dạng thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo ưu đãi</span>
          </button>
        </div>
      </div>

      {/* 3. Danh sách hiển thị: Dạng Thẻ hoặc Dạng Bảng */}
      {filteredPromos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">Không tìm thấy chương trình ưu đãi nào</h3>
          <p className="text-sm text-gray-500 mt-1">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
              setSelectedGroup('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 3A. BỐ CỤC DẠNG THẺ (GRID) - Giữ nguyên phong cách thẻ bìa đẹp mắt của Mèo Vắng Nhà */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromos.map((promo) => {
            const budgetPercent = Math.min(
              100,
              Math.round(((promo.budgetUsed || 0) / (promo.budgetTotal || 1)) * 100)
            );
            const isRunning = promo.status === 'active';

            return (
              <div
                key={promo.id}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group relative"
              >
                {/* Ảnh bìa + Nhãn giá trị (góc trái) + Nhãn đối tượng (góc phải) + Nhãn Hot */}
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
                  <img
                    src={promo.image}
                    alt={promo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Nhãn giá trị góc trái */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-primary font-black text-xs px-3 py-1 rounded-full shadow-sm">
                    {promo.discountDisplay}
                  </div>

                  {/* Cụm góc phải: Nhãn đối tượng & Nhãn Hot */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {promo.isHot && (
                      <span className="flex items-center gap-1 bg-orange-500 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                        <Flame className="w-3 h-3 fill-current" />
                        Hot
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${promo.targetBadgeColor}`}
                    >
                      {promo.targetGroupLabel}
                    </span>
                  </div>

                  {/* Trạng thái mờ nếu tạm dừng hoặc kết thúc */}
                  {!isRunning && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="px-3.5 py-1.5 rounded-full bg-white text-gray-800 text-xs font-bold shadow-md">
                        {promo.status === 'paused' ? 'Đang tạm dừng' : promo.status === 'upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Thân thẻ */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-base font-title text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
                      {promo.name}
                    </h4>
                  </div>

                  <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2 flex-1">
                    {promo.description}
                  </p>

                  {/* Mã ưu đãi & Thời gian áp dụng */}
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 mb-4 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Mã voucher:</span>
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {promo.code}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        Thời gian:
                      </span>
                      <span className="font-medium text-gray-700">
                        {formatDateVN(promo.startDate)} - {formatDateVN(promo.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Thanh tiến độ ngân sách đã dùng */}
                  <div className="mb-4 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium">Ngân sách đã dùng:</span>
                      <span className="font-bold text-gray-800">
                        {formatCurrency(promo.budgetUsed)} / {formatCurrency(promo.budgetTotal)} ({budgetPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          budgetPercent > 85 ? 'bg-rose-500' : budgetPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${budgetPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                      <span>Đã dùng {promo.usageCount} lượt</span>
                      <span>Giới hạn {promo.usageLimit} lượt</span>
                    </div>
                  </div>

                  {/* Hàng điều khiển: Công tắc Bật/Tắt & Nút Sửa */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    {/* Công tắc Bật / Tắt */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(promo.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                          isRunning ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                        title={isRunning ? 'Nhấn để tạm dừng' : 'Nhấn để bật ưu đãi'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                            isRunning ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-semibold text-gray-600">
                        {isRunning ? 'Đang bật' : 'Tạm dừng'}
                      </span>
                    </div>

                    {/* Nút Sửa & Xóa */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(promo)}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="Chỉnh sửa ưu đãi"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePromo(promo.id, promo.name)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Xóa ưu đãi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 3B. BỐ CỤC DẠNG BẢNG (TABLE) */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Tên chương trình</th>
                  <th className="py-3.5 px-4">Mã voucher</th>
                  <th className="py-3.5 px-4">Mức giảm</th>
                  <th className="py-3.5 px-4">Đối tượng</th>
                  <th className="py-3.5 px-4">Tiến độ ngân sách</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4 text-center">Bật / Tắt</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPromos.map((promo) => {
                  const budgetPercent = Math.min(
                    100,
                    Math.round(((promo.budgetUsed || 0) / (promo.budgetTotal || 1)) * 100)
                  );
                  const isRunning = promo.status === 'active';

                  return (
                    <tr key={promo.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={promo.image}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-gray-800">
                              <span>{promo.name}</span>
                              {promo.isHot && (
                                <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                                  HOT
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 line-clamp-1">{promo.description}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                          {promo.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-800">
                        {promo.discountDisplay}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${promo.targetBadgeColor}`}>
                          {promo.targetGroupLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">{formatCurrency(promo.budgetUsed)}</span>
                            <span className="font-bold text-gray-700">{budgetPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                budgetPercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${budgetPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateVN(promo.startDate)} - {formatDateVN(promo.endDate)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(promo.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                            isRunning ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              isRunning ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(promo)}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(promo.id, promo.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DRAWER SLIDE-OVER: KHUNG NHẬP BÊN PHẢI (+ Tạo ưu đãi / Sửa ưu đãi) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
              {/* Header Drawer */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    {editingPromo ? 'Chỉnh sửa ưu đãi' : 'Tạo chương trình ưu đãi mới'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Thiết lập thông tin, điều kiện áp dụng và ngân sách cho chiến dịch
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Form Cuộn */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Tên ưu đãi */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tên ưu đãi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Mùa Hè Mát Lạnh - Đón Boss Nghỉ Dưỡng"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Mô tả ngắn */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Mô tả ngắn
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tóm tắt quyền lợi cho khách hàng..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Loại ưu đãi & Giá trị */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Loại ưu đãi
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="percentage">Giảm theo %</option>
                      <option value="fixed">Giảm số tiền cố định</option>
                      <option value="gift">Quà tặng kèm</option>
                      <option value="combo">Combo trọn gói</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Giá trị {formData.type === 'percentage' ? '(%)' : '(VNĐ)'}
                    </label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Mã Voucher & Đối tượng áp dụng */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Mã áp dụng (Code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="VD: SUMMERBOSS"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Đối tượng khách hàng
                    </label>
                    <select
                      value={formData.targetGroup}
                      onChange={(e) => {
                        const target = e.target.value;
                        const label = CUSTOMER_GROUPS.find((g) => g.id === target)?.label || 'Tất cả khách';
                        setFormData({
                          ...formData,
                          targetGroup: target,
                          rightBadgeText: label,
                        });
                      }}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {CUSTOMER_GROUPS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ngày bắt đầu & Ngày kết thúc */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Điều kiện áp dụng: Số ngày gửi & Đơn tối thiểu */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Số ngày lưu trú tối thiểu
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.minBookingDays}
                      onChange={(e) => setFormData({ ...formData, minBookingDays: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Đơn tối thiểu (VNĐ)
                    </label>
                    <input
                      type="number"
                      step={50000}
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Ngân sách & Giới hạn lượt dùng */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Tổng ngân sách (VNĐ)
                    </label>
                    <input
                      type="number"
                      step={1000000}
                      value={formData.budgetTotal}
                      onChange={(e) => setFormData({ ...formData, budgetTotal: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Giới hạn lượt dùng
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Nhãn góc phải & Đánh dấu Chiến dịch Hot */}
                <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Đánh dấu "Chiến dịch HOT"
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Hiển thị huy hiệu Lửa nổi bật ở góc thẻ và banner trang chủ
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isHot}
                      onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nhãn hiển thị góc phải
                    </label>
                    <input
                      type="text"
                      value={formData.rightBadgeText}
                      onChange={(e) => setFormData({ ...formData, rightBadgeText: e.target.value })}
                      placeholder="VD: Khách mới, Quà tặng HOT, Giới hạn..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Ảnh bìa */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Ảnh bìa ưu đãi
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Nhập đường dẫn hình ảnh..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="text-xs text-gray-400 shrink-0">Gợi ý:</span>
                      {SAMPLE_IMAGES.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, image: imgUrl })}
                          className={`w-12 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                            formData.image === imgUrl ? 'border-emerald-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Điều khoản chi tiết */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Điều khoản & Quy định áp dụng
                  </label>
                  <textarea
                    rows={2}
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Footer Drawer: Nút Hủy, Lưu nháp, Lưu và bật */}
              <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSavePromo('paused')}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Lưu nháp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePromo('active')}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    Lưu và bật
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tab1AllPromotions;
