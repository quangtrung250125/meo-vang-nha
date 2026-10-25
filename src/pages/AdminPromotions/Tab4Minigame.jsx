import React, { useState } from 'react';
import {
  Trophy,
  Settings,
  Users,
  Award,
  Sparkles,
  PieChart,
  Edit,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCw,
  Gift,
  Coins,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  formatCurrency,
  saveToStorage,
  STORAGE_KEYS
} from './promotionsStore';
import LuckyWheel from '../Promotions/LuckyWheel';

const Tab4Minigame = ({
  minigameSettings,
  setMinigameSettings,
  minigamePrizes,
  setMinigamePrizes
}) => {
  const [settingsForm, setSettingsForm] = useState({ ...minigameSettings });
  const [editingPrize, setEditingPrize] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showWheelPreview, setShowWheelPreview] = useState(false);

  // Form sửa giải thưởng
  const [prizeFormData, setPrizeFormData] = useState({
    name: '',
    shortName: '',
    type: 'voucher',
    code: '',
    winRate: 15,
    totalLimit: 50,
    color: '#10B981',
    enabled: true,
  });

  // Lưu cấu hình cài đặt
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setMinigameSettings(settingsForm);
    saveToStorage(STORAGE_KEYS.MINIGAME_SETTINGS, settingsForm);
    toast.success('Đã lưu cài đặt Minigame Boss Vui thành công!');
  };

  // Bật / tắt minigame
  const handleToggleGameEnable = () => {
    const next = { ...settingsForm, enabled: !settingsForm.enabled };
    setSettingsForm(next);
    setMinigameSettings(next);
    saveToStorage(STORAGE_KEYS.MINIGAME_SETTINGS, next);
    toast.success(
      next.enabled
        ? 'Đã bật Minigame Vòng Quay Boss Vui cho khách hàng!'
        : 'Đã tạm đóng Minigame trên giao diện khách hàng!'
    );
  };

  // Bật / tắt từng giải thưởng
  const handleTogglePrize = (id) => {
    const updated = minigamePrizes.map((p) => {
      if (p.id === id) {
        return { ...p, enabled: !p.enabled };
      }
      return p;
    });
    setMinigamePrizes(updated);
    saveToStorage(STORAGE_KEYS.MINIGAME_PRIZES, updated);
    toast.success('Đã cập nhật trạng thái giải thưởng!');
  };

  // Mở modal sửa giải
  const handleOpenEditPrize = (prize) => {
    setEditingPrize(prize);
    setPrizeFormData({
      name: prize.name,
      shortName: prize.shortName,
      type: prize.type,
      code: prize.code || '',
      winRate: prize.winRate,
      totalLimit: prize.totalLimit,
      color: prize.color || '#10B981',
      enabled: prize.enabled !== false,
    });
    setIsEditModalOpen(true);
  };

  // Lưu giải thưởng
  const handleSavePrize = (e) => {
    e.preventDefault();
    const updated = minigamePrizes.map((p) => {
      if (p.id === editingPrize.id) {
        return {
          ...p,
          ...prizeFormData,
          winRate: Number(prizeFormData.winRate),
          totalLimit: Number(prizeFormData.totalLimit),
        };
      }
      return p;
    });
    setMinigamePrizes(updated);
    saveToStorage(STORAGE_KEYS.MINIGAME_PRIZES, updated);
    toast.success(`Đã cập nhật giải thưởng "${prizeFormData.name}"!`);
    setIsEditModalOpen(false);
  };

  // Tổng tỷ lệ phần trăm các giải đang bật
  const totalRate = minigamePrizes
    .filter((p) => p.enabled)
    .reduce((sum, p) => sum + (p.winRate || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Thẻ số liệu tháng này */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Lượt chơi tháng này</p>
            <p className="text-2xl font-black text-gray-800">
              {settingsForm.totalPlaysThisMonth?.toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Khách tham gia</p>
            <p className="text-2xl font-black text-gray-800">
              {settingsForm.participatingCustomers?.toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Điểm đã phát</p>
            <p className="text-2xl font-black text-purple-700">
              {settingsForm.pointsAwardedThisMonth?.toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Quà & Voucher đã trao</p>
            <p className="text-2xl font-black text-emerald-700">
              {settingsForm.prizesWonThisMonth?.toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Cài đặt hệ thống Minigame */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-500" />
              Cài đặt thông số Minigame
            </h3>
            <p className="text-xs text-gray-500">
              Điều chỉnh số lượt chơi miễn phí mỗi ngày, điểm thưởng và giới hạn ngân sách quà tặng
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleGameEnable}
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
              {settingsForm.enabled ? 'Đang mở game' : 'Đang đóng'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Lượt quay miễn phí / ngày / khách
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={settingsForm.freePlaysPerDay}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, freePlaysPerDay: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Mỗi tài khoản được nhận số lượt này lúc 00:00 hằng ngày
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Điểm thưởng tối đa mỗi lượt quay
              </label>
              <input
                type="number"
                min={10}
                step={10}
                value={settingsForm.maxPointsPerSpin}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, maxPointsPerSpin: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Khống chế điểm thưởng tránh vượt quá quỹ điểm tích lũy
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Ngân sách quà tặng mỗi tháng (VNĐ)
              </label>
              <input
                type="number"
                step={500000}
                value={settingsForm.monthlyGiftBudget}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, monthlyGiftBudget: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Hiện tại: {formatCurrency(settingsForm.monthlyGiftBudget)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowWheelPreview(!showWheelPreview)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{showWheelPreview ? 'Ẩn xem trước vòng quay' : 'Xem trước vòng quay may mắn'}</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-200 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cài đặt minigame</span>
            </button>
          </div>
        </form>
      </div>

      {/* Xem trước vòng quay (nếu bật) */}
      {showWheelPreview && (
        <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-md">
          <div className="text-center max-w-md mx-auto mb-4">
            <h4 className="font-bold text-gray-800 text-base">Xem trước Vòng quay trên điện thoại & máy tính</h4>
            <p className="text-xs text-gray-500">Giao diện mà khách hàng nhìn thấy khi tham gia minigame</p>
          </div>
          <LuckyWheel onClaimPrize={(p) => toast.success(`Khách trúng: ${p.text}`)} />
        </div>
      )}

      {/* 3. Bảng cơ cấu giải thưởng & Tỉ lệ trúng */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-500" />
              Cơ cấu giải thưởng & Tỉ lệ trúng thưởng
            </h3>
            <p className="text-xs text-gray-500">
              Tổng tỉ lệ các ô đang bật: <strong className={totalRate === 100 ? 'text-emerald-600' : 'text-amber-600'}>{totalRate}%</strong> (khuyến nghị đạt 100%)
            </p>
          </div>

          {totalRate !== 100 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tổng tỷ lệ đang là {totalRate}% (nên chỉnh về 100%)</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Giải thưởng</th>
                <th className="py-3.5 px-4">Mã Voucher / Quà</th>
                <th className="py-3.5 px-4">Tỉ lệ trúng (%)</th>
                <th className="py-3.5 px-4 min-w-[150px]">Đã trao / Giới hạn</th>
                <th className="py-3.5 px-4 text-center">Bật / Tắt</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {minigamePrizes.map((prize) => {
                const percentGiven = Math.min(
                  100,
                  Math.round(((prize.awardedCount || 0) / (prize.totalLimit || 1)) * 100)
                );

                return (
                  <tr key={prize.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Tên giải + Màu */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: prize.color }}
                        />
                        <div>
                          <p className="font-bold text-gray-800">{prize.name}</p>
                          <span className="text-xs text-gray-400">Hiển thị: "{prize.shortName}"</span>
                        </div>
                      </div>
                    </td>

                    {/* Mã Voucher / Quà */}
                    <td className="py-3.5 px-4">
                      {prize.code ? (
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          {prize.code}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Không có mã</span>
                      )}
                    </td>

                    {/* Tỉ lệ trúng */}
                    <td className="py-3.5 px-4">
                      <span className="font-black text-gray-800 text-sm">{prize.winRate}%</span>
                    </td>

                    {/* Đã trao / Giới hạn */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700">
                            {prize.awardedCount} / {prize.totalLimit >= 9999 ? 'Không giới hạn' : prize.totalLimit}
                          </span>
                          {prize.totalLimit < 9999 && (
                            <span className="text-gray-400">{percentGiven}%</span>
                          )}
                        </div>
                        {prize.totalLimit < 9999 && (
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${percentGiven}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Bật / Tắt */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePrize(prize.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                          prize.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            prize.enabled ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Nút sửa */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditPrize(prize)}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa giải thưởng"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal sửa giải thưởng */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Chỉnh sửa thông số giải thưởng
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Cập nhật tên hiển thị, tỉ lệ xác suất và số lượng giới hạn
            </p>

            <form onSubmit={handleSavePrize} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tên giải thưởng
                </label>
                <input
                  type="text"
                  required
                  value={prizeFormData.name}
                  onChange={(e) => setPrizeFormData({ ...prizeFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tên ngắn trên mặt vòng quay
                </label>
                <input
                  type="text"
                  required
                  value={prizeFormData.shortName}
                  onChange={(e) => setPrizeFormData({ ...prizeFormData, shortName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tỉ lệ trúng (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={prizeFormData.winRate}
                    onChange={(e) =>
                      setPrizeFormData({ ...prizeFormData, winRate: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Giới hạn số giải
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prizeFormData.totalLimit}
                    onChange={(e) =>
                      setPrizeFormData({ ...prizeFormData, totalLimit: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Mã Voucher cấp phát
                </label>
                <input
                  type="text"
                  value={prizeFormData.code}
                  onChange={(e) => setPrizeFormData({ ...prizeFormData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: LUCKY20"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-200 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Cập nhật giải
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tab4Minigame;
