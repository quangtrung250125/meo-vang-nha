import React, { createContext, useState, useContext, useEffect } from 'react';

const PetContext = createContext();

export const PetProvider = ({ children }) => {
  const [petList, setPetList] = useState(() => {
    const saved = localStorage.getItem('petList');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return []; // Mặc định là mảng rỗng nếu chưa có dữ liệu
  });

  const savePet = (petData) => {
    setPetList(prev => {
      let newList;
      if (petData.id) {
        // Cập nhật nếu đã có id
        newList = prev.map(p => p.id === petData.id ? petData : p);
      } else {
        // Thêm mới
        newList = [...prev, { ...petData, id: Date.now().toString() }];
      }
      localStorage.setItem('petList', JSON.stringify(newList));
      return newList;
    });
  };
  
  const removePet = (id) => {
    setPetList(prev => {
      const newList = prev.filter(p => p.id !== id);
      localStorage.setItem('petList', JSON.stringify(newList));
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
