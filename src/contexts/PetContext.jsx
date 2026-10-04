import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  fetchServerSync,
  pushServerSync,
  broadcastEvent,
  subscribeSyncEvents,
} from '../services/crossDeviceSync';

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
  const petListRef = useRef(petList);
  petListRef.current = petList;

  const persistPets = (nextList) => {
    localStorage.setItem('petList', JSON.stringify(nextList));
    localStorage.setItem('petProfiles', JSON.stringify(nextList));
  };

  // ── 1. Tải dữ liệu ban đầu từ Server API và Supabase DB ──
  useEffect(() => {
    let isMounted = true;

    const syncInitialPets = async () => {
      // 1.1 Tải từ server sync store (hỗ trợ liên thiết bị Desktop <-> Mobile qua cùng server)
      try {
        const serverData = await fetchServerSync();
        if (serverData && Array.isArray(serverData.pets) && serverData.pets.length > 0 && isMounted) {
          const serverNormalized = normalizePetList(serverData.pets);
          setPetList((prev) => {
            // Merge dữ liệu server và local
            const merged = [...prev];
            serverNormalized.forEach((sp) => {
              const idx = merged.findIndex(
                (p) => p.id === sp.id || (p.name && sp.name && p.name.trim().toLowerCase() === sp.name.trim().toLowerCase())
              );
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...sp };
              } else {
                merged.push(sp);
              }
            });
            persistPets(merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn('Lỗi lấy pets từ server sync:', err);
      }

      // 1.2 Tải từ Supabase nếu có session
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
            setPetList((prev) => {
              const merged = [...prev];
              normalized.forEach(np => {
                const idx = merged.findIndex(p => p.id === np.id || (p.name && np.name && p.name.trim().toLowerCase() === np.name.trim().toLowerCase()));
                if (idx >= 0) merged[idx] = { ...merged[idx], ...np };
                else merged.push(np);
              });
              persistPets(merged);
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Lỗi tải pets từ Supabase:', err);
      }
    };

    syncInitialPets();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        syncInitialPets();
      } else if (event === 'SIGNED_OUT') {
        // Giữ lại local cache để người dùng không bị mất danh sách khi đổi mạng
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // ── 2. Lắng nghe Đồng Bộ Realtime Đa Thiết Bị (Supabase Broadcast Channel) ──
  useEffect(() => {
    const unsubscribe = subscribeSyncEvents(({ type, payload }) => {
      if (type === 'PETS_UPDATED' || type === 'FULL_SYNC_RESPONSE') {
        const incomingPets = payload?.pets;
        if (Array.isArray(incomingPets) && incomingPets.length > 0) {
          const normalized = normalizePetList(incomingPets);
          setPetList((prev) => {
            const merged = [...prev];
            normalized.forEach((np) => {
              const idx = merged.findIndex(
                (p) => p.id === np.id || (p.name && np.name && p.name.trim().toLowerCase() === np.name.trim().toLowerCase())
              );
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...np };
              } else {
                merged.push(np);
              }
            });
            persistPets(merged);
            return merged;
          });
        }
      } else if (type === 'REQUEST_SYNC') {
        // Thiết bị khác vừa mở và xin dữ liệu -> phản hồi ngay toàn bộ danh sách mèo hiện tại
        if (petListRef.current && petListRef.current.length > 0) {
          broadcastEvent('FULL_SYNC_RESPONSE', {
            pets: petListRef.current,
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ── 3. Lưu hồ sơ mèo (Cập nhật Local + Server API + Broadcast Realtime) ──
  const savePet = async (petData) => {
    let savedId = petData.id;

    // Lưu vào Supabase nếu có session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        if (petData.id && typeof petData.id === 'string' && petData.id.includes('-') && petData.id.length > 20) {
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
      console.warn('Không thể lưu pet vào Supabase DB:', err);
    }

    const safePet = {
      ...petData,
      id: savedId || petData.id || String(Date.now()),
      imageFile: undefined,
      imagePreview: petData.imagePreview || '',
      updatedAt: new Date().toISOString(),
    };

    let updatedList = [];
    setPetList(prev => {
      if (safePet.id && prev.some(p => p.id === safePet.id)) {
        updatedList = prev.map(p => (p.id === safePet.id ? safePet : p));
      } else {
        updatedList = [...prev, safePet];
      }
      persistPets(updatedList);
      return updatedList;
    });

    // ── ĐỒNG BỘ ĐA THIẾT BỊ NGAY LẬP TỨC ──
    // A. Đẩy lên Server API
    pushServerSync({ pets: updatedList });

    // B. Broadcast tức thì qua Supabase Cloud WebSockets đến điện thoại
    broadcastEvent('PETS_UPDATED', { pets: updatedList });
  };
  
  // ── 4. Xóa hồ sơ mèo ──
  const removePet = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && id) {
        await supabase.from('pets').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Không thể xóa pet trên Supabase DB:', err);
    }

    let updatedList = [];
    setPetList(prev => {
      updatedList = prev.filter(p => p.id !== id);
      persistPets(updatedList);
      return updatedList;
    });

    // Đồng bộ đa thiết bị
    pushServerSync({ pets: updatedList });
    broadcastEvent('PETS_UPDATED', { pets: updatedList });
  };

  return (
    <PetContext.Provider value={{ petList, savePet, removePet }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePetProfile = () => useContext(PetContext);
