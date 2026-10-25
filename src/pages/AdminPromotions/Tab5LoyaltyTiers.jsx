import React, { useState } from 'react';
import {
  Award,
  Crown,
  Sparkles,
  Settings,
  Users,
  Search,
  PlusCircle,
  MinusCircle,
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Shield,
  Save,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  formatCurrency,
  saveToStorage,
  STORAGE_KEYS
} from './promotionsStore';

const Tab5LoyaltyTiers = ({
  loyaltyTiers,
  setLoyaltyTiers,
  loyaltyRules,
  setLoyaltyRules,
  customerPoints,
  setCustomerPoints,
  pointsAuditLogs,
  setPointsAuditLogs,
}) => {
  const [rulesForm, setRulesForm] = useState({ ...loyaltyRules });
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Modal Cộng / Trừ điểm thủ công
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [pointAction, setPointAction] = useState('add'); // 'add' | 'subtract'
  const [pointAmount, setPointAmount] = useState(50);
  const [pointReason, setPointReason] = useState('');

  // Lưu cài đặt quy tắc quy đổi
  const handleSaveRules = (e) => {
    e.preventDefault();
    setLoyaltyRules(rulesForm);
    saveToStorage(STORAGE_KEYS.LOYALTY_RULES, rulesForm);
    toast.success('Đã lưu quy tắc tích điểm & quy đổi thành công!');
  };

  // Mở modal cộng / trừ điểm
  const handleOpenPointModal = (cust, action = 'add') => {
    setSelectedCustomer(cust);
    setPointAction(action);
    setPointAmount(50);
    setPointReason(
      action === 'add'
        ? 'Thưởng tri ân khách hàng thân thiết'
        : 'Điều chỉnh điểm do thay đổi đơn hàng'
    );
    setIsPointModalOpen(true);
  };

  // Xác nhận cộng / trừ điểm
  const handleConfirmPoints = (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (pointAmount <= 0) {
      toast.error('Số điểm phải lớn hơn 0!');
      return;
    }

    const currentPts = selectedCustomer.currentPoints || 0;
    if (pointAction === 'subtract' && pointAmount > currentPts) {
      toast.error(`Khách hàng chỉ có ${currentPts} điểm, không thể trừ ${pointAmount} điểm!`);
      return;
    }

    const diff = pointAction === 'add' ? pointAmount : -pointAmount;
    const nextPoints = currentPts + diff;

    // Cập nhật customerPoints
    const updatedCusts = customerPoints.map((c) => {
      if (c.id === selectedCustomer.id) {
        // Tự động kiểm tra nâng hạng nếu điểm vượt ngưỡng
        let tier = c.tier;
        let tierName = c.tierName;
        if (nextPoints >= 500) {
          tier = 'diamond';
          tierName = 'Kim cương';
        } else if (nextPoints >= 250) {
          tier = 'gold';
          tierName = 'Vàng';
        } else if (nextPoints >= 100) {
          tier = 'silver';
          tierName = 'Bạc';
        }

        return {
          ...c,
          currentPoints: nextPoints,
          tier,
          tierName,
        };
      }
      return c;
    });
    setCustomerPoints(updatedCusts);
    saveToStorage(STORAGE_KEYS.CUSTOMER_POINTS, updatedCusts);

    // Ghi vào Audit Log
    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.fullName,
      action: pointAction,
      amount: pointAmount,
      reason: pointReason || (pointAction === 'add' ? 'Cộng điểm thủ công' : 'Trừ điểm thủ công'),
      actor: 'Admin (0962606249)',
    };
    const updatedLogs = [newLog, ...pointsAuditLogs];
    setPointsAuditLogs(updatedLogs);
    saveToStorage(STORAGE_KEYS.POINTS_AUDIT_LOGS, updatedLogs);

    toast.success(
      pointAction === 'add'
        ? `Đã cộng +${pointAmount} điểm cho khách hàng ${selectedCustomer.fullName}!`
        : `Đã trừ -${pointAmount} điểm của khách hàng ${selectedCustomer.fullName}!`
    );
    setIsPointModalOpen(false);
  };

  // Lọc bảng điểm khách
  const filteredCustomers = customerPoints.filter((c) => {
    const matchSearch =
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.catNames && c.catNames.some((n) => n.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchTier = tierFilter === 'all' || c.tier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="space-y-8">
      {/* 1. KHUNG 4 HẠNG THÀNH VIÊN (ĐỒNG, BẠC, VÀNG, KIM CƯƠNG) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              4 Hạng Thẻ Thành Viên & Hệ Số Tích Điểm
            </h3>
            <p className="text-xs text-gray-500">
              Khách hàng tự động thăng hạng khi hoàn tất đơn hàng đạt hạn mức tích lũy
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loyaltyTiers.map((tier) => (
            <div
              key={tier.id}
              className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {/* Vạch màu gradient đầu thẻ */}
              <div
                className={`h-2 absolute top-0 inset-x-0 bg-gradient-to-r ${tier.color}`}
              />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-title font-extrabold text-lg text-gray-800">
                      Hạng {tier.name}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tier.badgeCls}`}>
                      {tier.nameEn}
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    x{tier.multiplier} Điểm
                  </span>
                </div>

                {/* Điều kiện lên hạng */}
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs space-y-1 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Chi tiêu tích lũy:</span>
                    <strong className="text-gray-800">
                      {tier.minSpend === 0 ? 'Mặc định' : formatCurrency(tier.minSpend)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Số đơn tối thiểu:</span>
                    <strong className="text-gray-800">
                      {tier.minBookings === 0 ? 'Không yêu cầu' : `${tier.minBookings} đơn`}
                    </strong>
                  </div>
                </div>

                {/* Quyền lợi */}
                <div className="space-y-1.5 mb-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Đặc quyền thành viên:
                  </p>
                  {tier.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Số khách hàng đang ở hạng này */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Số khách hiện tại:</span>
                <span className="font-extrabold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {tier.customerCount} thành viên
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CÀI ĐẶT QUY TẮC QUY ĐỔI & LÊN/HẠ HẠNG */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-500" />
            Quy tắc quy đổi điểm & Điều kiện lên/hạ hạng
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Tỉ lệ tích điểm từ đơn đặt phòng hoàn tất, giá trị khi trừ tiền và chu kỳ hạ hạng khi không phát sinh đơn
          </p>
        </div>

        <form onSubmit={handleSaveRules} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Chi tiêu để được 1 điểm */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Chi tiêu để tích 1 điểm (VNĐ)
              </label>
              <input
                type="number"
                step={1000}
                value={rulesForm.spendForOnePoint}
                onChange={(e) =>
                  setRulesForm({ ...rulesForm, spendForOnePoint: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Mỗi {formatCurrency(rulesForm.spendForOnePoint)} chi tiêu = 1 Điểm
              </span>
            </div>

            {/* Giá trị 1 điểm khi đổi */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Giá trị 1 điểm khi đổi (VNĐ)
              </label>
              <input
                type="number"
                step={500}
                value={rulesForm.valuePerPoint}
                onChange={(e) =>
                  setRulesForm({ ...rulesForm, valuePerPoint: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                1 Điểm = {formatCurrency(rulesForm.valuePerPoint)} giảm trừ hóa đơn
              </span>
            </div>

            {/* Hạn điểm */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Thời hạn điểm thưởng (tháng)
              </label>
              <input
                type="number"
                min={1}
                value={rulesForm.pointExpiryMonths}
                onChange={(e) =>
                  setRulesForm({ ...rulesForm, pointExpiryMonths: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Điểm tự động hết hạn sau {rulesForm.pointExpiryMonths} tháng nếu không dùng
              </span>
            </div>

            {/* Đổi tối thiểu */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Số điểm đổi tối thiểu
              </label>
              <input
                type="number"
                min={10}
                value={rulesForm.minPointsToRedeem}
                onChange={(e) =>
                  setRulesForm({ ...rulesForm, minPointsToRedeem: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Khách cần tối thiểu {rulesForm.minPointsToRedeem} điểm để đổi quà/giảm giá
              </span>
            </div>

            {/* Tối đa đổi mỗi đơn */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Tối đa % đổi trên mỗi hóa đơn
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={rulesForm.maxRedeemPercentPerOrder}
                onChange={(e) =>
                  setRulesForm({ ...rulesForm, maxRedeemPercentPerOrder: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Tối đa trừ {rulesForm.maxRedeemPercentPerOrder}% tổng hóa đơn đặt phòng
              </span>
            </div>

            {/* Điều kiện hạ hạng */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Hạ hạng nếu không đặt phòng sau (tháng)
              </label>
              <select
                value={rulesForm.downgradeMonths}
                onChange={(e) =>
                  setRulesForm({ ...rulesForm, downgradeMonths: Number(e.target.value) })
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={6}>Sau 6 tháng không đặt phòng</option>
                <option value={12}>Sau 12 tháng không đặt phòng</option>
              </select>
              <span className="text-[11px] text-gray-400 mt-1 block">
                Tự động lùi 1 hạng nếu không phát sinh đặt phòng
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đơn hoàn tất sẽ tự động tích điểm và nâng hạng tức thì
            </span>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-200 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu quy tắc điểm & hạng</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. BẢNG ĐIỂM CỦA KHÁCH HÀNG & NÚT CỘNG/TRỪ THỦ CÔNG */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              Bảng theo dõi điểm & hạng thành viên của khách hàng
            </h3>
            <p className="text-xs text-gray-500">
              Tra cứu nhanh điểm hiện có, điểm sắp hết hạn và hỗ trợ cộng/trừ điểm thủ công
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên khách, SĐT, tên mèo..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">Tất cả hạng</option>
              <option value="bronze">Hạng Đồng</option>
              <option value="silver">Hạng Bạc</option>
              <option value="gold">Hạng Vàng</option>
              <option value="diamond">Hạng Kim cương</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Khách hàng & Bé mèo</th>
                <th className="py-3.5 px-4">Hạng hiện tại</th>
                <th className="py-3.5 px-4">Điểm hiện có</th>
                <th className="py-3.5 px-4">Điểm sắp hết hạn</th>
                <th className="py-3.5 px-4">Lên hạng tiếp theo</th>
                <th className="py-3.5 px-4 text-right">Điều chỉnh thủ công</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Không tìm thấy khách hàng nào
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  let tierBadgeCls = 'bg-amber-100 text-amber-800 border-amber-300';
                  if (cust.tier === 'silver') tierBadgeCls = 'bg-slate-100 text-slate-800 border-slate-300';
                  if (cust.tier === 'gold') tierBadgeCls = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                  if (cust.tier === 'diamond') tierBadgeCls = 'bg-cyan-100 text-cyan-800 border-cyan-300';

                  return (
                    <tr key={cust.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Tên khách + Bé mèo */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-gray-800">{cust.fullName}</p>
                          <p className="text-xs text-gray-400 font-mono">{cust.phone}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[11px] text-gray-500">Bé:</span>
                            {cust.catNames?.map((cat, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-100"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Hạng */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full border shadow-2xs ${tierBadgeCls}`}>
                          <Crown className="w-3.5 h-3.5" />
                          {cust.tierName}
                        </span>
                      </td>

                      {/* Điểm hiện có */}
                      <td className="py-3.5 px-4">
                        <span className="text-base font-black text-emerald-600 block">
                          {cust.currentPoints} <span className="text-xs font-normal text-gray-400">điểm</span>
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Đã tích lũy từ {cust.totalBookings || 1} đơn
                        </span>
                      </td>

                      {/* Điểm sắp hết hạn */}
                      <td className="py-3.5 px-4">
                        {cust.expiringPoints > 0 ? (
                          <div className="text-xs">
                            <span className="font-bold text-amber-600 block">
                              {cust.expiringPoints} điểm
                            </span>
                            <span className="text-[11px] text-gray-400">Hạn: {cust.expiryDate}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Không có điểm sắp hết</span>
                        )}
                      </td>

                      {/* Điểm cần lên hạng tiếp theo */}
                      <td className="py-3.5 px-4">
                        {cust.pointsToNextTier > 0 ? (
                          <div className="text-xs">
                            <span className="text-gray-600">
                              Cần <strong className="text-orange-600 font-bold">+{cust.pointsToNextTier} điểm</strong>
                            </span>
                            <span className="text-[11px] text-gray-400 block">
                              Để lên hạng {cust.nextTierName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Hạng Kim Cương cao nhất
                          </span>
                        )}
                      </td>

                      {/* Nút Cộng / Trừ điểm */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPointModal(cust, 'add')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
                            title="Cộng điểm"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Cộng</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPointModal(cust, 'subtract')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                            title="Trừ điểm"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>Trừ</span>
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

      {/* 4. NHẬT KÝ HOẠT ĐỘNG ĐIỂM THƯỞNG (AUDIT LOG) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-orange-500" />
          Nhật ký hoạt động cộng/trừ điểm gần đây (Audit Log)
        </h3>
        <div className="space-y-2.5">
          {pointsAuditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-xs ${
                    log.action === 'add'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {log.action === 'add' ? '+' : '-'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-gray-800">{log.customerName}</strong>
                    <span
                      className={`font-black ${
                        log.action === 'add' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {log.action === 'add' ? `+${log.amount}` : `-${log.amount}`} điểm
                    </span>
                  </div>
                  <p className="text-gray-500 mt-0.5">{log.reason}</p>
                </div>
              </div>

              <div className="text-right shrink-0 text-gray-400">
                <span className="block">{log.timestamp}</span>
                <span className="text-[10px] text-gray-500">{log.actor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. MODAL CỘNG / TRỪ ĐIỂM THỦ CÔNG */}
      {isPointModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {pointAction === 'add' ? 'Cộng điểm thưởng thủ công' : 'Trừ điểm thưởng'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Khách hàng: <strong className="text-gray-800">{selectedCustomer.fullName}</strong> ({selectedCustomer.phone}) • Điểm hiện tại: <strong className="text-emerald-600">{selectedCustomer.currentPoints}</strong>
            </p>

            <form onSubmit={handleConfirmPoints} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Số điểm cần {pointAction === 'add' ? 'cộng' : 'trừ'}
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={pointAmount}
                  onChange={(e) => setPointAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base font-black focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Lý do điều chỉnh (ghi vào nhật ký hoạt động) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  placeholder="VD: Thưởng sinh nhật bé mèo, bù sự cố phục vụ..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPointModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer ${
                    pointAction === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  Xác nhận {pointAction === 'add' ? 'cộng điểm' : 'trừ điểm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tab5LoyaltyTiers;
