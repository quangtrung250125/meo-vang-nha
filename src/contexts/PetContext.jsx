import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useCustomerProfile } from './CustomerContext';
import { fromPetRow, toPetRow, isUuid, newUuid } from '../utils/petRows';
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

// Mỗi tài khoản có một ngăn lưu riêng trong localStorage, khách chưa đăng nhập dùng ngăn 'guest'
const LEGACY_KEYS = ['petList', 'petProfiles', 'petProfileList'];
const GUEST_KEY = 'guest';
const storageKeyFor = (ownerKey) => `petList:${ownerKey || GUEST_KEY}`;

const readJson = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.warn('Failed to parse pet list', e);
    return null;
  }
};

const readStoredPets = (ownerKey) => {
  if (typeof window === 'undefined') return [];
  const own = normalizePetList(readJson(storageKeyFor(ownerKey)));

  // Dữ liệu kiểu cũ (dùng chung mọi tài khoản): chỉ nhận lại những bé có ownerId đúng tài khoản này
  if (ownerKey) {
    LEGACY_KEYS.forEach((key) => {
      normalizePetList(readJson(key)).forEach((pet) => {
        if (pet.ownerId === ownerKey && !own.some((p) => p.id === pet.id)) own.push(pet);
      });
    });
  }
  return own;
};

// Gộp theo id (không gộp theo tên: 2 nhà có thể cùng đặt tên bé là "Mochi")
const mergePets = (prev, incoming) => {
  const merged = [...prev];
  incoming.forEach((np) => {
    const idx = merged.findIndex((p) => p.id === np.id);
    if (idx >= 0) merged[idx] = { ...merged[idx], ...np };
    else merged.push(np);
  });
  return merged;
};

export const PetProvider = ({ children }) => {
  const { authenticatedCustomer, isAdmin } = useCustomerProfile() || {};
  const ownerKey = authenticatedCustomer?.id || null;

  const [petList, setPetList] = useState(() => readStoredPets(ownerKey));
  const petListRef = useRef(petList);
  petListRef.current = petList;

  // Tài khoản đang xem, dùng trong các callback bất đồng bộ
  const ownerRef = useRef({ ownerKey, isAdmin });
  ownerRef.current = { ownerKey, isAdmin };

  const persistPets = (nextList) => {
    // Bỏ các khoá dùng chung kiểu cũ để tài khoản sau không đọc được mèo của tài khoản trước
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(storageKeyFor(ownerRef.current.ownerKey), JSON.stringify(nextList));
  };

  // Khách chỉ giữ mèo của chính mình; admin xem được tất cả
  const keepOwnPets = (list) => {
    const { ownerKey: current, isAdmin: admin } = ownerRef.current;
    if (admin) return list;
    return list.filter((pet) => (current ? pet.ownerId === current : !pet.ownerId));
  };

  // Đổi tài khoản: nạp ngăn lưu của tài khoản mới; mèo tạo lúc chưa đăng nhập được chuyển sang tài khoản vừa đăng nhập
  const prevOwnerRef = useRef(ownerKey);
  useEffect(() => {
    const prevOwner = prevOwnerRef.current;
    if (prevOwner === ownerKey) return;
    prevOwnerRef.current = ownerKey;

    let next = readStoredPets(ownerKey);
    if (!prevOwner && ownerKey) {
      const guestPets = normalizePetList(readJson(storageKeyFor(null)))
        .filter((pet) => !pet.ownerId)
        .map((pet) => ({ ...pet, ownerId: ownerKey }));
      if (guestPets.length > 0) {
        next = mergePets(next, guestPets);
        localStorage.removeItem(storageKeyFor(null));
        pushServerSync({ pets: next });
      }
    }
    setPetList(next);
    persistPets(next);
  }, [ownerKey]);

  // ── 1. Tải dữ liệu ban đầu từ Server API và Supabase DB ──
  useEffect(() => {
    let isMounted = true;

    const syncInitialPets = async () => {
      // 1.1 Tải từ server sync store (hỗ trợ liên thiết bị Desktop <-> Mobile qua cùng server)
      try {
        const serverData = await fetchServerSync();
        if (serverData && Array.isArray(serverData.pets) && serverData.pets.length > 0 && isMounted) {
          const serverNormalized = keepOwnPets(normalizePetList(serverData.pets));
          setPetList((prev) => {
            // Merge dữ liệu server và local
            const merged = mergePets(prev, serverNormalized);
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
            .eq('customer_id', session.user.id);

          if (error) console.warn('Lỗi đọc bảng pets từ Supabase:', error.message);
          if (!error && data && data.length > 0 && isMounted) {
            const mappedPets = data.map(fromPetRow);
            const normalized = keepOwnPets(normalizePetList(mappedPets));
            setPetList((prev) => {
              const merged = mergePets(prev, normalized);
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
          const normalized = keepOwnPets(normalizePetList(incomingPets));
          setPetList((prev) => {
            const merged = mergePets(prev, normalized);
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
    let ownerId = petData.ownerId || (ownerRef.current.isAdmin ? null : ownerRef.current.ownerKey);

    // Lưu vào Supabase nếu có session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        ownerId = ownerId || session.user.id;
        // Admin lưu hồ sơ hộ khách thì giữ chủ là khách, còn lại là tài khoản đang đăng nhập
        const customerId = isUuid(ownerId) ? ownerId : session.user.id;
        if (isUuid(petData.id)) {
          // Không đổi chủ của bé khi cập nhật, chỉ cập nhật tên và thông tin chi tiết
          const { customer_id: _owner, ...changes } = toPetRow(petData, customerId);
          const { error } = await supabase.from('pets').update(changes).eq('id', petData.id);
          if (error) console.warn('Lỗi cập nhật pet trên Supabase:', error.message);
        } else {
          const newId = newUuid();
          const { error } = await supabase.from('pets').insert({ id: newId, ...toPetRow(petData, customerId) });
          if (error) {
            console.warn('Lỗi thêm pet vào Supabase:', error.message);
          } else {
            savedId = newId;
          }
        }
      }
    } catch (err) {
      console.warn('Không thể lưu pet vào Supabase DB:', err);
    }

    const safePet = {
      ...petData,
      id: savedId || petData.id || String(Date.now()),
      ownerId,
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
