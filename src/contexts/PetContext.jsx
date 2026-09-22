import React, { createContext, useState, useContext } from 'react';

const PetContext = createContext();

const normalizePetList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(Boolean)
    .map((pet) => ({
      ...pet,
      id: pet.id || String(Date.now() + Math.random()),
      name: pet.name || 'Bé mèo',
      age: pet.age || '',
      gender: pet.gender || 'Đực',
      breed: pet.breed || '',
      weight: pet.weight || '',
      imagePreview: pet.imagePreview || '',
      health: pet.health || {
        vaccinated: 'Rồi',
        medicalCondition: '',
        medicalHistory: '',
        medication: '',
        allergy: '',
      },
      personality: pet.personality || {
        friendly: false,
        shy: false,
        stress: false,
        hardToReach: false,
        other: false,
        otherDetail: '',
      },
      habits: pet.habits || '',
      patePreference: pet.patePreference || '',
      specialRequests: pet.specialRequests || '',
    }));
};

const readStoredPets = () => {
  if (typeof window === 'undefined') return [];

  const candidates = ['petList', 'petProfiles', 'petProfileList'];
  for (const key of candidates) {
    const saved = localStorage.getItem(key);
    if (!saved) continue;
    try {
      const parsed = JSON.parse(saved);
      const normalized = normalizePetList(parsed);
      if (normalized.length > 0) return normalized;
    } catch (e) {
      console.warn('Failed to parse pet list', e);
    }
  }

  return [];
};

export const PetProvider = ({ children }) => {
  const [petList, setPetList] = useState(() => readStoredPets());

  const persistPets = (nextList) => {
    localStorage.setItem('petList', JSON.stringify(nextList));
    localStorage.setItem('petProfiles', JSON.stringify(nextList));
  };

  const savePet = (petData) => {
    const safePet = {
      ...petData,
      id: petData.id || String(Date.now()),
      imageFile: undefined,
      imagePreview: petData.imagePreview || '',
    };

    setPetList(prev => {
      let newList;
      if (safePet.id && prev.some(p => p.id === safePet.id)) {
        newList = prev.map(p => (p.id === safePet.id ? safePet : p));
      } else {
        newList = [...prev, safePet];
      }
      persistPets(newList);
      return newList;
    });
  };
  
  const removePet = (id) => {
    setPetList(prev => {
      const newList = prev.filter(p => p.id !== id);
      persistPets(newList);
      return newList;
    });
  };

  return (
    <PetContext.Provider value={{ petList, savePet, removePet }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePetProfile = () => useContext(PetContext);
