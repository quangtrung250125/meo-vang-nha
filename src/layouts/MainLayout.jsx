import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import FloatingContactButtons from '../../Chi/FloatingContactButtons';
import SearchModal from '../components/SearchModal';
import PolicyModal from '../components/PolicyModal';
import AuthModal from '../components/AuthModal';
import { useUI } from '../contexts/UIContext';

const MainLayout = () => {
  const { isAuthOpen, closeAuth } = useUI();

  return (
    <div className="flex flex-col min-h-screen bg-bg-light selection:bg-emerald-100 selection:text-emerald-900">
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
