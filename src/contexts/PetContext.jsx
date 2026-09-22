import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
      breed: pet.breed || 'Mèo',
      weight: pet.weight || '',
      imagePreview: pet.imagePreview || pet.avatar || '',
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

  // Tải danh sách thú cưng từ Supabase khi đăng nhập
  useEffect(() => {
    let isMounted = true;

    const loadSupabasePets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('user_id', session.user.id);

          if (!error && data && data.length > 0 && isMounted) {
            const mappedPets = data.map(p => ({
              id: p.id,
              name: p.name,
              age: p.age || '',
              weight: p.weight || '',
              breed: p.type || 'Mèo',
              gender: p.gender || 'Đực',
              notes: p.notes || '',
              imagePreview: p.avatar || null,
              createdAt: p.created_at,
            }));
            const normalized = normalizePetList(mappedPets);
            setPetList(normalized);
            persistPets(normalized);
          }
        }
      } catch (err) {
        console.warn('Lỗi tải pets từ Supabase:', err);
      }
    };

    loadSupabasePets();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadSupabasePets();
      } else if (event === 'SIGNED_OUT') {
        setPetList([]);
        localStorage.removeItem('petList');
        localStorage.removeItem('petProfiles');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const savePet = async (petData) => {
    let savedId = petData.id;

    // Lưu vào Supabase nếu đã đăng nhập
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        if (petData.id && typeof petData.id === 'string' && petData.id.includes('-') && petData.id.length > 20) {
          // UUID có sẵn trên Supabase
          await supabase.from('pets').update({
            name: petData.name,
            type: petData.breed || 'Mèo',
            age: petData.age ? String(petData.age) : null,
            weight: petData.weight ? String(petData.weight) : null,
            gender: petData.gender || null,
            notes: petData.notes || petData.habits || null,
            avatar: petData.imagePreview || null,
          }).eq('id', petData.id);
        } else {
          // Thêm mới vào Supabase
          const { data: inserted, error } = await supabase.from('pets').insert({
            user_id: session.user.id,
            name: petData.name || 'Bé cưng',
            type: petData.breed || 'Mèo',
            age: petData.age ? String(petData.age) : null,
            weight: petData.weight ? String(petData.weight) : null,
            gender: petData.gender || null,
            notes: petData.notes || petData.habits || null,
            avatar: petData.imagePreview || null,
          }).select();

          if (!error && inserted?.[0]?.id) {
            savedId = inserted[0].id;
          }
        }
      }
    } catch (err) {
      console.warn('Không thể lưu pet vào Supabase:', err);
    }

    const safePet = {
      ...petData,
      id: savedId || petData.id || String(Date.now()),
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
  
  const removePet = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && id) {
        await supabase.from('pets').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Không thể xóa pet trên Supabase:', err);
    }

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
