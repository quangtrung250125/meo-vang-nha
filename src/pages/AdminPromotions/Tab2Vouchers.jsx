import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  formatCurrency,
  formatDateVN,
  CUSTOMER_GROUPS,
  saveToStorage,
  STORAGE_KEYS,
  validateVoucherForBooking
} from './promotionsStore';

const Tab2Vouchers = ({ vouchers, setVouchers, promotions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal tạo / sửa Voucher
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  const initialForm = {
    code: '',
    discountType: 'percentage', // percentage, fixed
    discountValue: 20,
    maxDiscount: 200000,
    promoId: promotions[0]?.id || '',
    promoName: promotions[0]?.name || 'Chiến dịch chung',
    maxUsage: 100,
    limitPerCustomer: 1,
    minBookingDays: 2,
    minOrderValue: 400000,
    targetGroup: 'all',
    validUntil: '31/12/2026',
    status: 'active',
  };
  const [formData, setFormData] = useState(initialForm);

  // State cho Bộ mô phỏng / kiểm tra mã khi khách đặt phòng
  const [simCode, setSimCode] = useState('NEWFRIEND20');
  const [simCustomerGroup, setSimCustomerGroup] = useState('new');
  const [simBookingDays, setSimBookingDays] = useState(3);
  const [simOrderTotal, setSimOrderTotal] = useState(750000);
  const [simUsedCount, setSimUsedCount] = useState(0);
  const [simResult, setSimResult] = useState(null);

  // Sao chép mã
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã "${code}"`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setFormData({
      ...initialForm,
      code: 'MVN' + Math.floor(100 + Math.random() * 900),
      promoId: promotions[0]?.id || '',
      promoName: promotions[0]?.name || 'Chiến dịch chung',
    });
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (vouch) => {
    setEditingVoucher(vouch);
    setFormData({
      code: vouch.code,
      discountType: vouch.discountType || 'percentage',
      discountValue: vouch.discountValue || 0,
      maxDiscount: vouch.maxDiscount || 0,
      promoId: vouch.promoId || '',
      promoName: vouch.promoName || '',
      maxUsage: vouch.maxUsage || 100,
      limitPerCustomer: vouch.limitPerCustomer || 1,
      minBookingDays: vouch.minBookingDays || 1,
      minOrderValue: vouch.minOrderValue || 0,
      targetGroup: vouch.targetGroup || 'all',
      validUntil: vouch.validUntil || '31/12/2026',
      status: vouch.status || 'active',
    });
    setIsModalOpen(true);
  };

  // Lưu voucher
  const handleSaveVoucher = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã giảm giá!');
      return;
    }

    const linkedPromo = promotions.find((p) => p.id === formData.promoId);
    const promoName = linkedPromo ? linkedPromo.name : formData.promoName || 'Ưu đãi liên kết';

    let displayValue = '';
    if (formData.discountType === 'percentage') {
      displayValue = `Giảm ${formData.discountValue}%${formData.maxDiscount ? ` (tối đa ${formatCurrency(formData.maxDiscount)})` : ''}`;
    } else {
      displayValue = `Giảm ${formatCurrency(formData.discountValue)}`;
    }

    if (editingVoucher) {
      const updated = vouchers.map((v) => {
        if (v.id === editingVoucher.id) {
          return {
            ...v,
            ...formData,
            code: formData.code.toUpperCase().trim(),
            promoName,
            displayValue,
          };
        }
        return v;
      });
      setVouchers(updated);
      saveToStorage(STORAGE_KEYS.VOUCHERS, updated);
      toast.success(`Đã cập nhật mã "${formData.code}"!`);
    } else {
      const newVoucher = {
        id: 'vouch-' + Date.now(),
        ...formData,
        code: formData.code.toUpperCase().trim(),
        promoName,
        displayValue,
        usageCount: 0,
        status: 'active',
      };
      const updated = [newVoucher, ...vouchers];
      setVouchers(updated);
      saveToStorage(STORAGE_KEYS.VOUCHERS, updated);
      toast.success(`Đã tạo thành công mã mới "${formData.code}"!`);
    }

    setIsModalOpen(false);
  };

  // Xóa voucher
  const handleDeleteVoucher = (id, code) => {
    if (window.confirm(`Bạn có chắc muốn xóa mã giảm giá "${code}"?`)) {
      const next = vouchers.filter((v) => v.id !== id);
      setVouchers(next);
      saveToStorage(STORAGE_KEYS.VOUCHERS, next);
      toast.success(`Đã xóa mã "${code}"`);
    }
  };

  // Chạy kiểm tra mô phỏng
  const handleRunSimulation = () => {
    const res = validateVoucherForBooking({
      voucherCode: simCode,
      customer: { segment: simCustomerGroup, bookingCount: simCustomerGroup === 'new' ? 0 : 3 },
      orderTotal: Number(simOrderTotal),
      bookingDays: Number(simBookingDays),
      usedCountByCustomer: Number(simUsedCount),
      vouchersList: vouchers,
    });
    setSimResult(res);
  };

  // Lọc voucher
  const filteredVouchers = vouchers.filter((v) => {
    const matchSearch =
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.promoName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Thanh lọc */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm mã hoặc ưu đãi liên kết..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Lọc trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-gray-700 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Còn hiệu lực</option>
            <option value="exhausted">Hết lượt dùng</option>
            <option value="expired">Đã hết hạn</option>
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo mã mới</span>
        </button>
      </div>

      {/* 2. Bảng danh sách Mã giảm giá */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mã Voucher</th>
                <th className="py-3.5 px-4">Giá trị giảm</th>
                <th className="py-3.5 px-4">Ưu đãi liên kết</th>
                <th className="py-3.5 px-4 min-w-[150px]">Lượt dùng / Giới hạn</th>
                <th className="py-3.5 px-4">Mỗi khách</th>
                <th className="py-3.5 px-4">Hạn dùng</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    Không tìm thấy mã giảm giá nào
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((vouch) => {
                  const percentUsed = Math.min(
                    100,
                    Math.round(((vouch.usageCount || 0) / (vouch.maxUsage || 1)) * 100)
                  );

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Còn hiệu lực
                    </span>
                  );
                  if (vouch.status === 'exhausted' || vouch.usageCount >= vouch.maxUsage) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" /> Hết lượt
                      </span>
                    );
                  } else if (vouch.status === 'expired') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        <Clock className="w-3 h-3" /> Hết hạn
                      </span>
                    );
                  }

                  return (
                    <tr key={vouch.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Mã + Nút Copy */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/80 tracking-wider">
                            {vouch.code}
                          </span>
                          <button
                            onClick={() => handleCopy(vouch.code)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Sao chép mã"
                          >
                            {copiedCode === vouch.code ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Giá trị giảm */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-800">{vouch.displayValue}</span>
                        {vouch.minOrderValue > 0 && (
                          <div className="text-[11px] text-gray-400">
                            Đơn tối thiểu: {formatCurrency(vouch.minOrderValue)}
                          </div>
                        )}
                      </td>

                      {/* Ưu đãi liên kết */}
                      <td className="py-3.5 px-4">
                        <span className="text-gray-700 font-medium line-clamp-1">
                          {vouch.promoName}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {vouch.minBookingDays ? `Từ ${vouch.minBookingDays} ngày gửi` : 'Mọi đơn'}
                        </span>
                      </td>

                      {/* Lượt dùng / Giới hạn với thanh tiến độ */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-700">
                              {vouch.usageCount} / {vouch.maxUsage}
                            </span>
                            <span className="text-gray-400">{percentUsed}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                percentUsed >= 90
                                  ? 'bg-rose-500'
                                  : percentUsed >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Giới hạn mỗi khách */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">
                        {vouch.limitPerCustomer} lần/khách
                      </td>

                      {/* Hạn dùng */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{vouch.validUntil}</span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">{statusBadge}</td>

                      {/* Nút Sửa / Xóa */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(vouch)}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa mã"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVoucher(vouch.id, vouch.code)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa mã"
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

      {/* 3. KHUNG MÔ PHỎNG KIỂM TRA MÃ GIẢM GIÁ KHI KHÁCH ĐẶT PHÒNG (Validation Tester) */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              Quy tắc kiểm tra tự động khi khách đặt phòng
            </div>
            <h3 className="text-xl font-bold font-title">
              Công cụ mô phỏng & Thử nghiệm Voucher đặt phòng
            </h3>
            <p className="text-emerald-200 text-xs sm:text-sm mt-0.5">
              Hệ thống tự động kiểm tra đồng thời: Còn hạn • Còn lượt • Đúng nhóm đối tượng • Đạt đơn tối thiểu • Chưa vượt giới hạn mỗi khách
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunSimulation}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm rounded-xl shadow-lg shadow-black/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Zap className="w-4 h-4" />
            <span>Chạy kiểm tra thử</span>
          </button>
        </div>

        {/* Input tham số thử nghiệm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs">
          <div>
            <label className="block text-gray-300 font-bold mb-1">Mã voucher test</label>
            <input
              type="text"
              value={simCode}
              onChange={(e) => setSimCode(e.target.value.toUpperCase())}
              placeholder="VD: NEWFRIEND20"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl font-mono font-bold text-amber-300 focus:outline-none focus:bg-white/20"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1">Nhóm khách hàng</label>
            <select
              value={simCustomerGroup}
              onChange={(e) => setSimCustomerGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none"
            >
              <option value="new">Khách mới (0 đơn)</option>
              <option value="returning">Khách quay lại (1-4 đơn)</option>
              <option value="loyal">Khách thân thiết</option>
              <option value="vip">Khách VIP / Hạng Vàng & Kim cương</option>
              <option value="at_risk">Nguy cơ rời bỏ</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1">Số ngày gửi mèo</label>
            <input
              type="number"
              min={1}
              value={simBookingDays}
              onChange={(e) => setSimBookingDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl font-bold text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1">Tổng tiền phòng (VNĐ)</label>
            <input
              type="number"
              step={50000}
              value={simOrderTotal}
              onChange={(e) => setSimOrderTotal(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl font-bold text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1">Khách đã dùng mã này</label>
            <input
              type="number"
              min={0}
              value={simUsedCount}
              onChange={(e) => setSimUsedCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl font-bold text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Kết quả kiểm tra */}
        {simResult && (
          <div
            className={`mt-4 p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
              simResult.valid
                ? 'bg-emerald-950/70 border-emerald-400/50 text-emerald-100'
                : 'bg-rose-950/70 border-rose-400/50 text-rose-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {simResult.valid ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {simResult.valid ? 'HỢP LỆ VÀ ĐƯỢC PHÉP ÁP DỤNG' : 'TỪ CHỐI ÁP DỤNG'}
                </p>
                <p className="text-xs opacity-90">{simResult.message}</p>
              </div>
            </div>

            {simResult.valid && (
              <div className="text-right shrink-0">
                <span className="text-xs text-emerald-300">Tiền giảm thực tế:</span>
                <p className="text-lg font-black text-amber-300">
                  {formatCurrency(simResult.discountAmount)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. MODAL THÊM / SỬA VOUCHER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {editingVoucher ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Cài đặt hạn mức, điều kiện áp dụng và số lần sử dụng cho mỗi khách
            </p>

            <form onSubmit={handleSaveVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Mã Voucher (Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: MEOMEO50"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Loại giảm giá
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="percentage">Giảm theo %</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Mức giảm {formData.discountType === 'percentage' ? '(%)' : '(VNĐ)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={10000}
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Ưu đãi liên kết
                </label>
                <select
                  value={formData.promoId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const p = promotions.find((item) => item.id === id);
                    setFormData({
                      ...formData,
                      promoId: id,
                      promoName: p ? p.name : 'Chiến dịch chung',
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                >
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tổng lượt dùng
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Giới hạn / mỗi khách
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.limitPerCustomer}
                    onChange={(e) => setFormData({ ...formData, limitPerCustomer: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Số ngày lưu trú tối thiểu
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.minBookingDays}
                    onChange={(e) => setFormData({ ...formData, minBookingDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Hạn sử dụng (dd/mm/yyyy)
                  </label>
                  <input
                    type="text"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    placeholder="31/12/2026"
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
                  Lưu voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tab2Vouchers;
