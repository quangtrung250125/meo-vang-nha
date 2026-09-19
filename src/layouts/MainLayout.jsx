import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import FloatingContactButtons from '../../Chi/FloatingContactButtons';
import CustomerWelcomeModal from '../components/CustomerWelcomeModal';
import { useCustomerProfile } from '../contexts/CustomerContext';
import { usePetProfile } from '../contexts/PetContext';

const MainLayout = () => {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const { registerCustomer } = useCustomerProfile();
  const { petList, savePet } = usePetProfile();

  useEffect(() => {
    const timer = window.setTimeout(() => setIsWelcomeOpen(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleProfileSubmit = async (profileData) => {
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
        onClose={() => setIsWelcomeOpen(false)}
        onSubmit={handleProfileSubmit}
      />
      <Header />
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <Footer />
      <FloatingContactButtons />
    </div>
  );
};

export default MainLayout;
