import React, { useState } from 'react';
import { Info, Plus } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { usePetProfile } from '../../contexts/PetContext';
import PetForm from '../../components/PetForm';

const PetProfile = () => {
  const { petList, savePet } = usePetProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingPet, setEditingPet] = useState(null); // null means adding new
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNew = () => {
    setEditingPet(null);
    setIsEditing(true);
  };

  const handleEdit = (pet) => {
    setEditingPet(pet);
    setIsEditing(true);
  };

  const handleSavePet = (petData) => {
    setIsSaving(true);
    setTimeout(() => {
      savePet(petData);
      setIsSaving(false);
      setIsEditing(false);
      toast.success('Đã lưu hồ sơ thành công!');
    }, 800);
  };

  return (
    <div className="w-full min-h-screen bg-bg-cream pb-12">
      <Toaster position="top-center" /> 
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-text-dark font-title mb-2">Hồ sơ của các bé</h1>
          <p className="text-gray-500">Quản lý thông tin thú cưng để chúng mình chăm sóc tốt hơn.</p>
        </div>
        
        {isEditing ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             <PetForm 
                initialData={editingPet}
                onSave={handleSavePet}
                onCancel={() => setIsEditing(false)}
                isSaving={isSaving}
             />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Add New Card */}
            <div 
              onClick={handleAddNew}
              className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary-light/30 transition-all min-h-[220px] group shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-text-dark font-bold text-lg group-hover:text-primary transition-colors">Thêm bé mèo mới</p>
            </div>

            {/* List Existing Pets */}
            {petList.map(pet => (
              <div key={pet.id} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shadow-inner overflow-hidden shrink-0 border-2 border-white">
                    {pet.imagePreview ? (
                      <img src={pet.imagePreview} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <Info className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-dark">{pet.name}</h3>
                    <p className="text-gray-500 text-sm">{pet.age} tuổi • {pet.breed || 'Không rõ'}</p>
                    <span className="inline-block mt-1 bg-primary-light text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {pet.gender}
                    </span>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <button 
                    onClick={() => handleEdit(pet)}
                    className="w-full bg-bg-cream text-primary font-bold py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors"
                  >
                    Cập nhật thông tin
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PetProfile;
