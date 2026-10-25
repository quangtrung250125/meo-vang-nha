import React, { useState } from 'react';
import { 
  X, Check, Utensils, Smile, Droplets, HeartPulse, 
  Sparkles, CheckSquare, Square, Info, Zap, Send
} from 'lucide-react';

const BulkCareLogModal = ({ isOpen, onClose, cats = [], onSaveBulk }) => {
  // Danh sách ID mèo được chọn, mặc định chọn tất cả
  const [selectedCatIds, setSelectedCatIds] = useState(() => cats.map(c => c.id));

  // Tùy chọn tác vụ
  const [enableFood, setEnableFood] = useState(true);
  const [mealType, setMealType] = useState('Bữa sáng');
  const [foodAmount, setFoodAmount] = useState('50');
  const [foodType, setFoodType] = useState('Hạt dinh dưỡng + Pate');
  const [foodNote, setFoodNote] = useState('Bé ăn hết phần, ngon miệng');

  const [enablePlay, setEnablePlay] = useState(true);
  const [playActivity, setPlayActivity] = useState('Chơi đùa tự do tại khu vui chơi chung');
  const [playMood, setPlayMood] = useState('Rất vui vẻ & năng động');
  const [playNote, setPlayNote] = useState('');

  const [enableHygiene, setEnableHygiene] = useState(false);
  const [hygieneStool, setHygieneStool] = useState('Bình thường');
  const [hygieneNote, setHygieneNote] = useState('');

  const [enableHealth, setEnableHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState('Khỏe mạnh, lanh lợi');
  const [healthNote, setHealthNote] = useState('');

  // Cập nhật selectedCatIds khi danh sách cats thay đổi
  React.useEffect(() => {
    if (cats.length > 0) {
      setSelectedCatIds(cats.map(c => c.id));
    }
  }, [cats]);

  if (!isOpen) return null;

  const toggleSelectCat = (id) => {
    setSelectedCatIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCatIds.length === cats.length) {
      setSelectedCatIds([]);
    } else {
      setSelectedCatIds(cats.map(c => c.id));
    }
  };

  // Nạp nhanh các mẫu thiết lập thông dụng
  const applyPreset = (type) => {
    if (type === 'morning') {
      setEnableFood(true);
      setMealType('Bữa sáng');
      setFoodAmount('50');
      setFoodType('Hạt Royal Canin');
      setFoodNote('Ăn hết sạch phần ăn');
      setEnablePlay(true);
      setPlayActivity('Vận động nhẹ buổi sáng & chải lông');
      setPlayMood('Vui vẻ, quấn người');
      setEnableHygiene(true);
      setHygieneStool('Bình thường');
    } else if (type === 'evening') {
      setEnableFood(true);
      setMealType('Bữa tối');
      setFoodAmount('50');
      setFoodType('Pate tươi cá hồi');
      setFoodNote('Ăn ngon miệng');
      setEnablePlay(false);
      setEnableHygiene(true);
      setHygieneStool('Bình thường');
    } else if (type === 'play') {
      setEnableFood(false);
      setEnablePlay(true);
      setPlayActivity('Chơi cần câu lông vũ & đuổi bóng');
      setPlayMood('Rất hào hứng, chạy nhảy linh hoạt');
      setEnableHygiene(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (selectedCatIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 bé mèo để cập nhật!');
      return;
    }

    if (!enableFood && !enablePlay && !enableHygiene && !enableHealth) {
      alert('Vui lòng chọn ít nhất 1 tác vụ (Cho ăn, Vui chơi, Vệ sinh hoặc Sức khỏe)!');
      return;
    }

    const selectedCats = cats.filter(c => selectedCatIds.includes(c.id));

    const payload = {
      food: enableFood ? {
        mealType,
        amount: foodAmount,
        foodType,
        note: foodNote
      } : null,
      play: enablePlay ? {
        enabled: true,
        activity: playActivity,
        mood: playMood,
        note: playNote
      } : null,
      hygiene: enableHygiene ? {
        enabled: true,
        stool: hygieneStool,
        note: hygieneNote
      } : null,
      health: enableHealth ? {
        status: healthStatus,
        note: healthNote
      } : null,
    };

    onSaveBulk(selectedCats, payload);
    onClose();
  };

  const isAllSelected = selectedCatIds.length === cats.length && cats.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-title">Cập nhật Nhật ký Hàng loạt</h2>
              <p className="text-xs text-white/80">Cập nhật nhanh tình trạng ăn uống, vận động cho nhiều bé cùng lúc</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="bg-amber-50/70 border-b border-amber-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Mẫu nhanh:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('morning')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-amber-200 text-amber-900 hover:bg-amber-100/70 transition-colors shadow-sm"
            >
              ☀️ Bữa sáng đầy đủ
            </button>
            <button
              type="button"
              onClick={() => applyPreset('evening')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-amber-200 text-amber-900 hover:bg-amber-100/70 transition-colors shadow-sm"
            >
              🌙 Bữa tối ấm cúng
            </button>
            <button
              type="button"
              onClick={() => applyPreset('play')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-amber-200 text-amber-900 hover:bg-amber-100/70 transition-colors shadow-sm"
            >
              🎾 Giờ vui chơi
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Chọn bé mèo */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800 text-sm">1. Chọn các bé áp dụng</span>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  Đã chọn {selectedCatIds.length}/{cats.length} bé
                </span>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {cats.map(cat => {
                const isSelected = selectedCatIds.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleSelectCat(cat.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-white border-orange-400 shadow-sm ring-2 ring-orange-400/20' 
                        : 'bg-white/60 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <img 
                      src={cat.image} 
                      alt={cat.catName} 
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-gray-800 truncate">{cat.catName}</p>
                      <p className="text-[11px] text-gray-500 truncate">Phòng {cat.room} • {cat.ownerName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Tác vụ nhật ký */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">2. Nội dung nhật ký cập nhật</h3>

            {/* A. Cho ăn */}
            <div className={`rounded-2xl border p-4 transition-all ${enableFood ? 'bg-white border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2.5 font-bold text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableFood}
                    onChange={(e) => setEnableFood(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                  />
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <span>Ghi nhận bữa ăn</span>
                </label>
                {enableFood && <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-full">Sẽ cập nhật</span>}
              </div>

              {enableFood && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Buổi ăn</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-300 outline-none"
                    >
                      <option value="Bữa sáng">Bữa sáng (08:00)</option>
                      <option value="Bữa trưa">Bữa trưa (12:00)</option>
                      <option value="Bữa tối">Bữa tối (18:00)</option>
                      <option value="Bữa phụ / Snack">Bữa phụ / Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Lượng thức ăn (gram)</label>
                    <div className="flex items-center gap-1.5">
                      {['40', '50', '60'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFoodAmount(g)}
                          className={`flex-1 text-xs py-2 rounded-lg border font-semibold ${
                            foodAmount === g 
                              ? 'bg-orange-500 border-orange-500 text-white' 
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {g}g
                        </button>
                      ))}
                      <input
                        type="number"
                        value={foodAmount}
                        onChange={(e) => setFoodAmount(e.target.value)}
                        placeholder="g"
                        className="w-16 text-xs border border-gray-200 rounded-lg p-2 text-center bg-gray-50 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Loại thức ăn</label>
                    <input
                      type="text"
                      value={foodType}
                      onChange={(e) => setFoodType(e.target.value)}
                      placeholder="VD: Hạt Royal Canin"
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-300 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* B. Vui chơi & Vận động */}
            <div className={`rounded-2xl border p-4 transition-all ${enablePlay ? 'bg-white border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2.5 font-bold text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePlay}
                    onChange={(e) => setEnablePlay(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Smile className="w-4 h-4" />
                  </div>
                  <span>Vui chơi & Vận động</span>
                </label>
                {enablePlay && <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">Sẽ cập nhật</span>}
              </div>

              {enablePlay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Hình thức hoạt động</label>
                    <input
                      type="text"
                      value={playActivity}
                      onChange={(e) => setPlayActivity(e.target.value)}
                      placeholder="VD: Vận động tại phòng chơi chung"
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tâm trạng các bé</label>
                    <select
                      value={playMood}
                      onChange={(e) => setPlayMood(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-300 outline-none"
                    >
                      <option value="Rất vui vẻ & năng động">Rất vui vẻ & năng động</option>
                      <option value="Thư giãn & thích được vuốt ve">Thư giãn & thích được vuốt ve</option>
                      <option value="Bình thường, ngoan ngoãn">Bình thường, ngoan ngoãn</option>
                      <option value="Hơi nhút nhát, cần làm quen">Hơi nhút nhát, cần làm quen</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* C. Vệ sinh khay cát */}
            <div className={`rounded-2xl border p-4 transition-all ${enableHygiene ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2.5 font-bold text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableHygiene}
                    onChange={(e) => setEnableHygiene(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <span>Dọn khay cát & Kiểm tra vệ sinh</span>
                </label>
                {enableHygiene && <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">Sẽ cập nhật</span>}
              </div>

              {enableHygiene && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tình trạng vệ sinh</label>
                    <select
                      value={hygieneStool}
                      onChange={(e) => setHygieneStool(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-300 outline-none"
                    >
                      <option value="Bình thường">Bình thường (Phân khuôn, tiểu tốt)</option>
                      <option value="Hơi lỏng">Hơi lỏng (Cần theo dõi)</option>
                      <option value="Táo bón">Táo bón</option>
                      <option value="Tiêu chảy">Tiêu chảy (Báo bác sĩ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú thêm (tùy chọn)</label>
                    <input
                      type="text"
                      value={hygieneNote}
                      onChange={(e) => setHygieneNote(e.target.value)}
                      placeholder="VD: Đã khử trùng và thêm cát mới"
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-300 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* D. Kiểm tra sức khỏe */}
            <div className={`rounded-2xl border p-4 transition-all ${enableHealth ? 'bg-white border-emerald-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2.5 font-bold text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableHealth}
                    onChange={(e) => setEnableHealth(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <span>Kiểm tra sức khỏe tổng quát</span>
                </label>
                {enableHealth && <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Sẽ cập nhật</span>}
              </div>

              {enableHealth && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tình trạng chung</label>
                    <select
                      value={healthStatus}
                      onChange={(e) => setHealthStatus(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-300 outline-none"
                    >
                      <option value="Khỏe mạnh, lanh lợi">Khỏe mạnh, lanh lợi</option>
                      <option value="Mắt mũi sạch sẽ, thân nhiệt bình thường">Mắt mũi sạch sẽ, thân nhiệt bình thường</option>
                      <option value="Ngoan ngoãn, thích nghỉ ngơi">Ngoan ngoãn, thích nghỉ ngơi</option>
                      <option value="Cần theo dõi thêm">Cần theo dõi thêm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Thông điệp gửi khách hàng</label>
                    <input
                      type="text"
                      value={healthNote}
                      onChange={(e) => setHealthNote(e.target.value)}
                      placeholder="VD: Bé sinh hoạt rất ngoan, ba mẹ yên tâm nhé!"
                      className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-300 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-gray-500">
            * Sau khi lưu, nhật ký sẽ tự động đồng bộ ngay lập tức sang ứng dụng của khách hàng.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Lưu & Cập nhật ({selectedCatIds.length} bé)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCareLogModal;
