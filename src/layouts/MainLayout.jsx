import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import FloatingContactButtons from '../../Chi/FloatingContactButtons';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-bg-light">
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
