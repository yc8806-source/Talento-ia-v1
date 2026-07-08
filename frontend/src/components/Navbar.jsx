import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiHome, FiUsers, FiBriefcase, FiTrendingUp, FiSettings, FiBarChart2, FiShare2, FiLock, FiUser } from 'react-icons/fi';

function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isActive(to)
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  );

  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talent IA
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/dashboard" icon={FiHome} label="Dashboard" />
              <NavLink to="/mi-perfil" icon={FiUser} label="Mi Perfil" />
              <NavLink to="/candidatos" icon={FiUsers} label="Candidatos" />
              <NavLink to="/vacantes" icon={FiBriefcase} label="Vacantes" />
              <NavLink to="/evaluaciones" icon={FiTrendingUp} label="Evaluaciones" />
              <NavLink to="/reportes" icon={FiBarChart2} label="Reportes" />
              {role === 'admin' && (
                <>
                  <NavLink to="/compartir" icon={FiShare2} label="Compartir" />
                  <NavLink to="/permisos" icon={FiLock} label="Permisos" />
                  <NavLink to="/admin" icon={FiSettings} label="Admin" />
                </>
              )}
            </div>

            {/* User Info & Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900 text-sm">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-600 capitalize">{role || 'usuario'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-2">
              <NavLink to="/dashboard" icon={FiHome} label="Dashboard" />
              <NavLink to="/mi-perfil" icon={FiUser} label="Mi Perfil" />
              <NavLink to="/candidatos" icon={FiUsers} label="Candidatos" />
              <NavLink to="/vacantes" icon={FiBriefcase} label="Vacantes" />
              <NavLink to="/evaluaciones" icon={FiTrendingUp} label="Evaluaciones" />
              <NavLink to="/reportes" icon={FiBarChart2} label="Reportes" />
              {role === 'admin' && (
                <>
                  <NavLink to="/compartir" icon={FiShare2} label="Compartir" />
                  <NavLink to="/permisos" icon={FiLock} label="Permisos" />
                  <NavLink to="/admin" icon={FiSettings} label="Admin" />
                </>
              )}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <p className="font-semibold text-gray-900 text-sm px-4 py-2">
                  {user.firstName} {user.lastName}
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm"
                >
                  <FiLogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
