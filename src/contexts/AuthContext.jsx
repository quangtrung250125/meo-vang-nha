import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import AuthModal from '../components/AuthModal';

const AuthContext = createContext();

const DEFAULT_PROFILE = {
  fullName: 'Nguyễn Đức An',
  phone: '0912 345 678',
  email: 'ducan070@gmail.com',
  address: 'Số 45, Phố Đặng Văn Ngữ, Đống Đa, Hà Nội',
  birthday: '1995-08-15',
  notes: 'Bé mèo Miu nhà mình hơi nhút nhát với mèo đực khác, cần chuồng yên tĩnh và phòng ấm áp.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  points: 850,
  tier: 'Vàng',
  tierColor: 'from-amber-400 to-yellow-600',
  tierIcon: '👑',
  joinDate: '15/01/2025',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(() => {
    const saved = localStorage.getItem('customer_profile');
    if (saved) {
      try {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  const syncProfileWithUser = useCallback((currentUser) => {
    if (currentUser) {
      const storageKey = `customer_profile_${currentUser.id}`;
      const saved = localStorage.getItem(storageKey);
      const metadata = currentUser.user_metadata || {};
      
      let base = { ...DEFAULT_PROFILE };
      if (saved) {
        try {
          base = { ...base, ...JSON.parse(saved) };
        } catch (e) {
          // ignore
        }
      }
      
      const merged = {
        ...base,
        fullName: metadata.full_name || base.fullName || currentUser.email?.split('@')[0],
        phone: metadata.phone || base.phone,
        email: currentUser.email || base.email,
        avatar: metadata.avatar_url || base.avatar,
      };

      setCustomerProfile(merged);
      localStorage.setItem('customer_profile', JSON.stringify(merged));
      localStorage.setItem(storageKey, JSON.stringify(merged));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      syncProfileWithUser(u);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      syncProfileWithUser(u);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [syncProfileWithUser]);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const switchAccount = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Switch account sign out error:', error);
    } finally {
      setIsAuthModalOpen(true);
    }
  };

  const updateProfile = async (updatedData) => {
    const newProfile = { ...customerProfile, ...updatedData };
    setCustomerProfile(newProfile);
    
    // Save locally
    localStorage.setItem('customer_profile', JSON.stringify(newProfile));
    if (user?.id) {
      localStorage.setItem(`customer_profile_${user.id}`, JSON.stringify(newProfile));
      
      // Attempt supabase update
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: newProfile.fullName,
            phone: newProfile.phone,
            address: newProfile.address,
            birthday: newProfile.birthday,
            avatar_url: newProfile.avatar,
          }
        });
      } catch (err) {
        console.warn('Could not sync user profile to supabase:', err);
      }
    }
    return newProfile;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      customerProfile,
      updateProfile,
      openAuthModal, 
      closeAuthModal, 
      logout,
      switchAccount 
    }}>
      {children}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

