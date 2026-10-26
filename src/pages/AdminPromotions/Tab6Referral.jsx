import React, { useState } from 'react';
import {
  Users,
  Gift,
  Share2,
  Settings,
  DollarSign,
  Award,
  CheckCircle2,
  Clock,
  UserPlus,
  Copy,
  Check,
  Save,
  Link as LinkIcon,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  formatCurrency,
  formatDateVN,
  saveToStorage,
  STORAGE_KEYS
} from './promotionsStore';

const Tab6Referral = ({
  referralSettings,
  setReferralSettings,
  referralLogs,
  setReferralLogs,
}) => {
  const [settingsForm, setSettingsForm] = useState({ ...referralSettings });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedLink, setCopiedLink] = useState(null);

  // Lưu cài đặt chương trình giới thiệu
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setReferralSettings(settingsForm);
    saveToStorage(STORAGE_KEYS.REFERRAL_SETTINGS, settingsForm);
    toast.success('Đã lưu quy tắc chương trình Giới thiệu bạn bè thành công!');
  };

  // Bật / tắt chương trình
  const handleToggleEnable = () => {
    const next = { ...settingsForm, enabled: !settingsForm.enabled };
    setSettingsForm(next);
    setReferralSettings(next);
    saveToStorage(STORAGE_KEYS.REFERRAL_SETTINGS, next);
    toast.success(
      next.enabled
        ? 'Đã bật chương trình Giới thiệu bạn bè!'
        : 'Đã tạm dừng chương trình Giới thiệu bạn bè!'
    );
  };

  // Sao chép link giới thiệu
  const handleCopyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    toast.success('Đã sao chép link giới thiệu đặt phòng!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Lọc bảng lượt giới thiệu
  const filteredLogs = referralLogs.filter((log) => {
    const matchSearch =
      log.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.refereeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.catName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.referralCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Hàng số liệu tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Lượt giới thiệu</p>
            <p className="text-2xl font-black text-gray-800">
              {settingsForm.totalReferrals} <span className="text-xs font-normal text-gray-400">lời mời</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Đã đặt phòng</p>
            <p className="text-2xl font-black text-emerald-700">
              {settingsForm.completedBookings} <span className="text-xs font-normal text-gray-400">đơn</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Điểm đã thưởng</p>
            <p className="text-2xl font-black text-purple-700">
              {settingsForm.pointsRewarded?.toLocaleString('vi-VN')} <span className="text-xs font-normal text-gray-400">điểm</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Doanh thu mang lại</p>
            <p className="text-xl font-black text-orange-600">
              {formatCurrency(settingsForm.revenueGenerated)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Cài đặt quy tắc thưởng giới thiệu */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-500" />
              Cài đặt quy tắc & Phần thưởng Giới thiệu bạn bè
            </h3>
            <p className="text-xs text-gray-500">
              Thiết lập điểm thưởng cho người giới thiệu và voucher chào mừng cho bạn bè
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleEnable}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                settingsForm.enabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                  settingsForm.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs font-bold text-gray-700">
              {settingsForm.enabled ? 'Đang hoạt động' : 'Tạm dừng'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Người giới thiệu nhận (Điểm thưởng)
              </label>
              <input
                type="number"
                min={10}
                step={10}
                value={settingsForm.referrerRewardPoints}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    referrerRewardPoints: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-purple-700 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Cộng trực tiếp {settingsForm.referrerRewardPoints} điểm vào tài khoản
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Người được giới thiệu nhận (Ưu đãi)
              </label>
              <input
                type="text"
                value={settingsForm.refereeRewardDiscount}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    refereeRewardDiscount: e.target.value,
                  })
                }
                placeholder="VD: Giảm 15% hoặc 100.000đ"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Mã áp dụng tự động cho đơn đầu: <strong className="text-emerald-700">{settingsForm.refereeVoucherCode}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Giới hạn thưởng / mỗi khách / tháng
              </label>
              <input
                type="number"
                min={1}
                value={settingsForm.monthlyLimitPerUser}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    monthlyLimitPerUser: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Tối đa {settingsForm.monthlyLimitPerUser} người bạn thành công mỗi tháng
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-500" />
              Điểm thưởng được trao tự động ngay sau khi đơn đặt phòng đầu tiên của bạn bè được check-out
            </span>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-200 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu quy tắc giới thiệu</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Bảng theo dõi từng lượt giới thiệu */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-orange-500" />
              Bảng theo dõi chi tiết từng lượt giới thiệu
            </h3>
            <p className="text-xs text-gray-500">
              Kiểm tra mã giới thiệu riêng, trạng thái hoàn tất đơn phòng và lịch sử cộng điểm
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm người mời, bạn bè, mã ref..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Đã hoàn tất đơn</option>
              <option value="pending_completion">Đang chờ hoàn tất</option>
              <option value="registered">Mới đăng ký</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Người giới thiệu</th>
                <th className="py-3.5 px-4">Bạn được giới thiệu</th>
                <th className="py-3.5 px-4">Mã Ref & Link</th>
                <th className="py-3.5 px-4">Ngày giới thiệu</th>
                <th className="py-3.5 px-4">Trạng thái đơn</th>
                <th className="py-3.5 px-4">Thưởng đã trả / dự kiến</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Chưa có lượt giới thiệu nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Người giới thiệu */}
                    <td className="py-3.5 px-4">
                      <div>
                        <strong className="text-gray-800">{log.referrerName}</strong>
                        <p className="text-xs text-gray-400 font-mono">{log.referrerPhone}</p>
                      </div>
                    </td>

                    {/* Bạn bè */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-gray-800">{log.refereeName}</p>
                        <p className="text-xs text-gray-400 font-mono">{log.refereePhone}</p>
                        {log.catName && (
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-100 inline-block mt-0.5">
                            Bé {log.catName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mã Ref & Link */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                          {log.referralCode}
                        </span>
                        <button
                          onClick={() => handleCopyLink(log.bookingLink, log.id)}
                          className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="Sao chép link đặt phòng"
                        >
                          {copiedLink === log.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Ngày */}
                    <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateVN(log.createdAt)}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${log.statusCls}`}>
                        {log.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'pending_completion' && <Clock className="w-3 h-3" />}
                        {log.statusLabel}
                      </span>
                      {log.orderTotal > 0 && (
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Đơn {log.orderCode}: {formatCurrency(log.orderTotal)}
                        </div>
                      )}
                    </td>

                    {/* Thưởng */}
                    <td className="py-3.5 px-4 text-xs font-bold text-gray-700">
                      {log.rewardGiven}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tab6Referral;
