import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout({ onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
      <Navbar onLogout={onLogout} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer simple */}
      <footer className="bg-gray-800 text-gray-300 text-center py-4 text-sm mt-8">
        <p>© 2026 Talent IA - Sistema de Evaluación de Talentos</p>
      </footer>
    </div>
  );
}

export default Layout;
