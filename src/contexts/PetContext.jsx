import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const PetContext = createContext();

export const PetProvider = ({ children }) => {
  const { user } = useAuth();
  const [petList, setPetList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tải danh sách thú cưng
  const fetchPets = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPetList(data || []);
      } catch (err) {
        console.error('Error fetching pets from Supabase:', err);
        // Fallback localStorage nếu lỗi
        const saved = localStorage.getItem('petList_' + user.id) || localStorage.getItem('petList');
        if (saved) setPetList(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    } else {
      // Khách vãng lai chưa đăng nhập
      const saved = localStorage.getItem('petList_guest') || localStorage.getItem('petList');
      if (saved) {
        try {
          setPetList(JSON.parse(saved));
        } catch (e) {
          setPetList([]);
        }
      } else {
        setPetList([]);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Lưu thú cưng (Thêm mới hoặc Cập nhật)
  const savePet = async (petData) => {
    if (user) {
      try {
        if (petData.id && String(petData.id).includes('-')) {
          // Cập nhật thú cưng đã có trên Supabase
          const { error } = await supabase
            .from('pets')
            .update({
              name: petData.name,
              type: petData.type || 'Mèo',
              age: petData.age || '',
              weight: petData.weight || '',
              gender: petData.gender || '',
              notes: petData.notes || '',
              avatar: petData.avatar || '',
            })
            .eq('id', petData.id);

          if (error) throw error;
        } else {
          // Thêm thú cưng mới lên Supabase
          const { error } = await supabase
            .from('pets')
            .insert([{
              user_id: user.id,
              name: petData.name,
              type: petData.type || 'Mèo',
              age: petData.age || '',
              weight: petData.weight || '',
              gender: petData.gender || '',
              notes: petData.notes || '',
              avatar: petData.avatar || '',
            }]);

          if (error) throw error;
        }

        // Tải lại danh sách mới nhất từ Supabase
        await fetchPets();
      } catch (err) {
        console.error('Error saving pet to Supabase:', err);
        // Fallback local
        setPetList(prev => {
          let newList;
          if (petData.id) {
            newList = prev.map(p => p.id === petData.id ? petData : p);
          } else {
            newList = [{ ...petData, id: Date.now().toString() }, ...prev];
          }
          localStorage.setItem('petList_' + user.id, JSON.stringify(newList));
          return newList;
        });
      }
    } else {
      // Khi chưa đăng nhập -> Lưu tạm localStorage guest
      setPetList(prev => {
        let newList;
        if (petData.id) {
          newList = prev.map(p => p.id === petData.id ? petData : p);
        } else {
          newList = [{ ...petData, id: Date.now().toString() }, ...prev];
        }
        localStorage.setItem('petList_guest', JSON.stringify(newList));
        return newList;
      });
    }
  };

  // Xóa thú cưng
  const removePet = async (id) => {
    if (user && String(id).includes('-')) {
      try {
        const { error } = await supabase.from('pets').delete().eq('id', id);
        if (error) throw error;
        await fetchPets();
      } catch (err) {
        console.error('Error deleting pet from Supabase:', err);
      }
    } else {
      setPetList(prev => {
        const newList = prev.filter(p => p.id !== id);
        localStorage.setItem(user ? 'petList_' + user.id : 'petList_guest', JSON.stringify(newList));
        return newList;
      });
    }
  };

  return (
    <PetContext.Provider value={{ petList, savePet, removePet, loading, refreshPets: fetchPets }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePetProfile = () => useContext(PetContext);
