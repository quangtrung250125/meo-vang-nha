import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import FloatingContactButtons from '../../Chi/FloatingContactButtons';
import CustomerWelcomeModal from '../components/CustomerWelcomeModal';
import SearchModal from '../components/SearchModal';
import PolicyModal from '../components/PolicyModal';
import AuthModal from '../components/AuthModal';
import { useCustomerProfile } from '../contexts/CustomerContext';
import { usePetProfile } from '../contexts/PetContext';
import { useUI } from '../contexts/UIContext';

const MainLayout = () => {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const { registerCustomer, isAuthenticated } = useCustomerProfile();
  const { petList, savePet } = usePetProfile();
  const { isAuthOpen, closeAuth } = useUI();

  useEffect(() => {
    if (isAuthenticated) {
      setIsWelcomeOpen(false);
      return;
    }

    const timer = window.setTimeout(() => setIsWelcomeOpen(true), 3000);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  const handleProfileSubmit = async (profileData) => {
    localStorage.setItem('mvn_has_seen_welcome', 'true');
    const pet = {
      id: `crm-pet-${Date.now()}`,
      name: profileData.petName,
      age: profileData.age,
      gender: profileData.gender,
      breed: profileData.breed,
      spayed: profileData.spayed,
      vaccineType: profileData.vaccineType,
      health: {
        vaccinated: profileData.vaccinated,
        medicalCondition: profileData.allergies,
        medicalHistory: profileData.medicalHistory,
        allergy: profileData.allergies,
      },
      habits: profileData.feeding,
      personality: profileData.personality,
      toys: profileData.toys,
      specialRequests: profileData.specialCare,
      createdFromWelcome: true,
      source: profileData.source,
    };

    registerCustomer({
      ...profileData,
      labels: profileData.labels || ['Khách hàng mới'],
      pets: [pet],
    });

    if (!petList.some(item => item.name === pet.name)) savePet(pet);
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-light">
      <CustomerWelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => {
          localStorage.setItem('mvn_has_seen_welcome', 'true');
          setIsWelcomeOpen(false);
        }}
        onSubmit={handleProfileSubmit}
      />
      <Header />
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <Footer />
      <FloatingContactButtons />
      <SearchModal />
      <PolicyModal />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
    </div>
  );
};

export default MainLayout;
