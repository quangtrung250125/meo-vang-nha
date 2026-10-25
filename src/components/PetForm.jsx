import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

const TABS = ['Thông tin cơ bản', 'Sức khỏe', 'Thói quen', 'Tính cách', 'Yêu cầu riêng'];

const PetForm = ({ initialData, onSave, onCancel, isSaving, compact = false }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const [petData, setPetData] = useState(() => {
    return initialData || {
      name: '',
      age: '',
      gender: 'Đực',
      breed: '',
      weight: '',
      imagePreview: null,
      imageFile: null,
      health: {
        vaccinated: 'Rồi',
        medicalCondition: '',
        medicalHistory: '',
        medication: '',
        allergy: ''
      },
      habits: '',
      patePreference: '',
      personality: {
        friendly: false,
        shy: false,
        stress: false,
        hardToReach: false,
        other: false,
        otherDetail: ''
      },
      specialRequests: ''
    };
  });
  
  useEffect(() => {
    if (initialData) {
      setPetData(initialData);
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setPetData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleHealthChange = (field, value) => {
    setPetData(prev => ({
      ...prev,
      health: { ...prev.health, [field]: value }
    }));
  };

  const handlePersonalityChange = (field, checked) => {
    setPetData(prev => ({
      ...prev,
      personality: { ...prev.personality, [field]: checked }
    }));
  };

  const handleImageClick = () => fileInputRef.current?.click();
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPetData(prev => ({ ...prev, imageFile: file, imagePreview: objectUrl }));
    }
  };
  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setPetData(prev => ({ ...prev, imageFile: null, imagePreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!petData.name.trim()) newErrors.name = 'Vui lòng nhập tên bé';
    if (!petData.age.trim()) newErrors.age = 'Vui lòng nhập tuổi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (activeTab !== 0) setActiveTab(0);
      return;
    }

    const finalData = {
      ...petData,
      id: petData.id || Date.now().toString(),
      imageFile: undefined,
      isSpecialCare: (petData.health?.medicalCondition || '').trim() !== '' || (petData.health?.medication || '').trim() !== '',
    };

    onSave(finalData);
  };

  const renderBasicInfoTab = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">Tên bé <span className="text-red-500">*</span></label>
          <input type="text" value={petData.name} onChange={(e) => handleChange('name', e.target.value)} className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream`} />
          {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">Tuổi <span className="text-red-500">*</span></label>
          <input type="text" value={petData.age} onChange={(e) => handleChange('age', e.target.value)} className={`w-full border ${errors.age ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream`} />
          {errors.age && <p className="text-red-500 text-xs mt-1 font-medium">{errors.age}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-dark mb-3">Giới tính</label>
        <div className="flex gap-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={petData.gender === 'Đực'} onChange={() => handleChange('gender', 'Đực')} className="accent-primary w-4 h-4" />
            <span className="text-gray-600 text-sm font-medium">Đực</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={petData.gender === 'Cái'} onChange={() => handleChange('gender', 'Cái')} className="accent-primary w-4 h-4" />
            <span className="text-gray-600 text-sm font-medium">Cái</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">Giống mèo</label>
          <input type="text" value={petData.breed} onChange={(e) => handleChange('breed', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">Cân nặng (kg)</label>
          <input type="text" value={petData.weight} onChange={(e) => handleChange('weight', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream" />
        </div>
      </div>
    </>
  );

  const renderHealthTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-dark mb-3">Bé đã tiêm phòng chưa?</label>
        <div className="flex gap-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={petData.health.vaccinated === 'Rồi'} onChange={() => handleHealthChange('vaccinated', 'Rồi')} className="accent-primary w-4 h-4" />
            <span className="text-gray-600 text-sm font-medium">Rồi</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={petData.health.vaccinated === 'Chưa'} onChange={() => handleHealthChange('vaccinated', 'Chưa')} className="accent-primary w-4 h-4" />
            <span className="text-gray-600 text-sm font-medium">Chưa</span>
          </label>
        </div>
      </div>
      <div><label className="block text-sm font-semibold text-text-dark mb-2">Bệnh nền (Nếu có)</label><input type="text" value={petData.health.medicalCondition} onChange={(e) => handleHealthChange('medicalCondition', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream" /></div>
      <div><label className="block text-sm font-semibold text-text-dark mb-2">Tiền sử bệnh</label><input type="text" value={petData.health.medicalHistory} onChange={(e) => handleHealthChange('medicalHistory', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream" /></div>
      <div><label className="block text-sm font-semibold text-text-dark mb-2">Đang dùng thuốc</label><input type="text" value={petData.health.medication} onChange={(e) => handleHealthChange('medication', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream" /></div>
      <div><label className="block text-sm font-semibold text-text-dark mb-2">Dị ứng</label><input type="text" value={petData.health.allergy} onChange={(e) => handleHealthChange('allergy', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream" /></div>
    </div>
  );

  const PATE_OPTIONS = [
    '🐟 Cá ngừ',
    '🐔 Gà',
    '🥩 Bò',
    '🦐 Tôm',
    '🐠 Cá hồi',
    '🐟 Cá thu',
    '🥚 Trứng',
    '🌿 Thuần chay',
  ];

  const renderHabitsTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-dark mb-2">Thói quen sinh hoạt / Ăn uống</label>
        <textarea rows="4" value={petData.habits} onChange={(e) => handleChange('habits', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream resize-none"></textarea>
      </div>

      {/* Pate preference — dùng cho khuyến mãi Thứ 5 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🎁</span>
          <label className="block text-sm font-bold text-amber-800">Sở thích pate của bé <span className="font-normal text-amber-600">(dùng cho khuyến mãi Thứ 5 tặng pate)</span></label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PATE_OPTIONS.map((opt) => {
            const isSelected = petData.patePreference === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleChange('patePreference', isSelected ? '' : opt)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-100 text-amber-800 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {petData.patePreference && (
          <p className="text-xs text-amber-700 font-semibold mt-2">✓ Đã chọn: {petData.patePreference}</p>
        )}
        {!petData.patePreference && (
          <p className="text-xs text-gray-400 mt-2">Chưa chọn — nhân viên sẽ hỏi trực tiếp khi check-in thứ 5</p>
        )}
      </div>
    </div>
  );

  const renderPersonalityTab = () => (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-text-dark mb-2">Tính cách của bé</label>
      <div className="grid grid-cols-2 gap-4">
        {['friendly', 'shy', 'stress', 'hardToReach', 'other'].map((key) => {
          const labels = { friendly: 'Thân thiện', shy: 'Nhút nhát', stress: 'Dễ stress', hardToReach: 'Khó tiếp xúc', other: 'Khác' };
          return (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={petData.personality[key]} onChange={(e) => handlePersonalityChange(key, e.target.checked)} className="accent-primary w-4 h-4" />
              <span className="text-gray-600 text-sm">{labels[key]}</span>
            </label>
          )
        })}
      </div>
      {petData.personality.other && (
        <div className="mt-4"><input type="text" value={petData.personality.otherDetail} onChange={(e) => handlePersonalityChange('otherDetail', e.target.value)} placeholder="Vui lòng mô tả thêm..." className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream" /></div>
      )}
    </div>
  );

  const renderSpecialRequestsTab = () => (
    <div>
      <label className="block text-sm font-semibold text-text-dark mb-2">Yêu cầu đặc biệt khác</label>
      <textarea rows="5" value={petData.specialRequests} onChange={(e) => handleChange('specialRequests', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-gray-700 bg-bg-cream resize-none"></textarea>
    </div>
  );

  const showAdvancedTabs = !compact;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 relative">
      {showAdvancedTabs && (
        <div className="flex space-x-6 border-b border-gray-100 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {TABS.map((tab, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === idx ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {showAdvancedTabs ? (
            <>
              {activeTab === 0 && renderBasicInfoTab()}
              {activeTab === 1 && renderHealthTab()}
              {activeTab === 2 && renderHabitsTab()}
              {activeTab === 3 && renderPersonalityTab()}
              {activeTab === 4 && renderSpecialRequestsTab()}
            </>
          ) : (
            renderBasicInfoTab()
          )}
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-text-dark mb-2">Ảnh của bé</label>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          <div 
            onClick={handleImageClick}
            className={`relative border-2 border-dashed ${petData.imagePreview ? 'border-primary/50' : 'border-gray-200'} rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all min-h-[200px] overflow-hidden group`}
          >
            {petData.imagePreview ? (
              <>
                <img src={petData.imagePreview} alt="Pet preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={handleRemoveImage} className="bg-white text-red-500 rounded-full p-2 hover:scale-110 transition-transform shadow-lg"><X className="w-5 h-5" /></button>
                </div>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 text-gray-300 mb-2 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-gray-400 group-hover:text-primary transition-colors">Tải ảnh lên</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {Object.keys(errors).length > 0 && (
        <p className="text-red-500 text-sm font-medium mt-6">Vui lòng không để trống thông tin bắt buộc của bé (*).</p>
      )}

      <div className="mt-8 flex justify-end gap-4 border-t border-gray-100 pt-6">
        {onCancel && (
          <button 
            onClick={onCancel}
            disabled={isSaving}
            className="bg-white text-gray-600 border border-gray-200 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
        )}
        <button 
          onClick={handleSubmit}
          disabled={isSaving}
          className={`bg-accent text-white font-bold px-8 py-3 rounded-xl hover:bg-accent-hover transition-colors shadow-lg shadow-accent/30 flex items-center gap-2 ${isSaving ? 'opacity-80 cursor-wait' : ''}`}
        >
          {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
        </button>
      </div>
    </div>
  );
};

export default PetForm;
