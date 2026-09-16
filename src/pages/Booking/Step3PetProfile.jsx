import React, { useState } from 'react';
import { Info, Plus, Check, Gift } from 'lucide-react';
import { usePetProfile } from '../../contexts/PetContext';
import PetForm from '../../components/PetForm';
import { toast } from 'react-hot-toast';


const Step3PetProfile = ({ data, updateData, onNext, onPrev }) => {
  const { petList, savePet } = usePetProfile();
  
  const [selectedIds, setSelectedIds] = useState(() => {
    return data.petProfiles ? data.petProfiles.map(p => p.id) : [];
  });
  
  const [addingNew, setAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length >= data.catCount) {
        toast.error(`Bạn chỉ được chọn hồ sơ cho ${data.catCount} bé mèo như đã đăng ký.`);
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSaveNewPet = (petData) => {
    setIsSaving(true);
    setTimeout(() => {
      const newPet = { ...petData, id: petData.id || Date.now().toString() };
      savePet(newPet);
      
      if (selectedIds.length < data.catCount) {
        setSelectedIds(prev => [...prev, newPet.id]);
      }
      
      setIsSaving(false);
      setAddingNew(false);
      toast.success('Đã thêm hồ sơ mới!');
    }, 800);
  };

  const handleNextClick = () => {
    if (selectedIds.length !== data.catCount) {
      toast.error(`Vui lòng chọn đủ hồ sơ cho ${data.catCount} bé mèo.`);
      return;
    }
    
    const selectedPets = selectedIds.map(id => petList.find(p => p.id === id)).filter(Boolean);
    updateData({ petProfiles: selectedPets });
    onNext();
  };

  // Kiểm tra Thứ 5
  const isThursday = (() => {
    if (!data.checkIn) return false;
    return new Date(data.checkIn + 'T00:00:00').getDay() === 4;
  })();

  if (addingNew) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
        <h2 className="text-2xl font-bold text-text-dark font-title">Thêm hồ sơ bé mèo mới</h2>
        <PetForm 
          onSave={handleSaveNewPet}
          onCancel={() => setAddingNew(false)}
          isSaving={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      <div>
        <h2 className="text-2xl font-bold text-text-dark font-title mb-2">3. Hồ sơ bé mèo</h2>
        <p className="text-gray-600">
          Vui lòng chọn hồ sơ cho <strong>{data.catCount}</strong> bé mèo bạn đã đăng ký. 
          (Đã chọn {selectedIds.length}/{data.catCount})
        </p>
      </div>

      {/* Thursday pate reminder */}
      {isThursday && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-amber-800 text-sm">🎉 Check-in Thứ 5 — Đừng quên chọn pate cho bé!</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Mở hồ sơ từng bé, vào tab <strong>“Thói quen”</strong> và chọn sở thích pate. Nhân viên sẽ chuẩn bị đúng loại cho bé.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Nút thêm mới */}
        <div 
          onClick={() => setAddingNew(true)}
          className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-light/30 transition-all min-h-[140px] group shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-md transition-all">
            <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
          </div>
          <p className="text-text-dark font-bold group-hover:text-primary transition-colors text-sm">Thêm bé mèo mới</p>
        </div>

        {/* Danh sách thú cưng */}
        {petList.map(pet => {
          const isSelected = selectedIds.includes(pet.id);
          return (
            <div 
              key={pet.id} 
              onClick={() => toggleSelect(pet.id)}
              className={`relative bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 flex items-center gap-4 ${isSelected ? 'border-primary bg-primary-light/10' : 'border-gray-100 hover:border-primary/50'}`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center shadow-inner overflow-hidden shrink-0 border-2 border-white">
                {pet.imagePreview ? (
                  <img src={pet.imagePreview} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <Info className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-text-dark leading-tight truncate">{pet.name}</h3>
                <p className="text-gray-500 text-sm truncate">{pet.age} tuổi</p>
                <span className="inline-block mt-1 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                  {pet.gender}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-between">
        <button onClick={onPrev} className="bg-white border border-gray-200 text-gray-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors">Quay lại</button>
        <button 
          onClick={handleNextClick} 
          className={`font-bold px-8 py-3 rounded-xl transition-all shadow-md ${selectedIds.length === data.catCount ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
};

export default Step3PetProfile;
