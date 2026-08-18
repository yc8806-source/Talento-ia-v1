import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiHome, FiUsers, FiBriefcase, FiTrendingUp, FiSettings, FiBarChart2, FiShare2, FiLock, FiUser, FiMail } from 'react-icons/fi';

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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 group ${
        isActive(to)
          ? 'bg-white text-purple-700 shadow-md'
          : 'text-white hover:bg-white hover:bg-opacity-10'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive(to) ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span>{label}</span>
    </Link>
  );

  return (
    <>
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 shadow-lg border-b border-purple-500 border-opacity-20">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity duration-300 group"
            >
              <img
                src="/impulsa-talento-logo.png"
                alt="IMPULSA TALENTO"
                className="h-12 w-12 group-hover:scale-105 transition-transform duration-300"
              />
              <span className="font-bold text-white text-2xl font-heading hidden sm:inline">IMPULSA TALENTO</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" icon={FiHome} label="Dashboard" />
              <NavLink to="/mi-perfil" icon={FiUser} label="Perfil" />
              <NavLink to="/candidatos" icon={FiUsers} label="Candidatos" />
              <NavLink to="/vacantes" icon={FiBriefcase} label="Vacantes" />
              <NavLink to="/evaluaciones" icon={FiTrendingUp} label="Evaluaciones" />
              <NavLink to="/reportes" icon={FiBarChart2} label="Reportes" />
              {role === 'admin' && (
                <>
                  <NavLink to="/permisos" icon={FiLock} label="Permisos" />
                  <NavLink to="/admin" icon={FiSettings} label="Admin" />
                </>
              )}
            </div>

            {/* User Info & Logout */}
            <div className="hidden md:flex items-center gap-4 ml-4">
              <div className="text-right text-white">
                <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-purple-200 capitalize">{role || 'usuario'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-300 hover:scale-110"
                title="Cerrar sesión"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-300"
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
            <div className="md:hidden mt-4 pt-4 border-t border-white border-opacity-20 space-y-2">
              <NavLink to="/dashboard" icon={FiHome} label="Dashboard" />
              <NavLink to="/mi-perfil" icon={FiUser} label="Perfil" />
              <NavLink to="/candidatos" icon={FiUsers} label="Candidatos" />
              <NavLink to="/vacantes" icon={FiBriefcase} label="Vacantes" />
              <NavLink to="/evaluaciones" icon={FiTrendingUp} label="Evaluaciones" />
              <NavLink to="/reportes" icon={FiBarChart2} label="Reportes" />
              {role === 'admin' && (
                <>
                  <NavLink to="/permisos" icon={FiLock} label="Permisos" />
                  <NavLink to="/admin" icon={FiSettings} label="Admin" />
                </>
              )}
              <div className="pt-2 mt-2 border-t border-white border-opacity-20">
                <p className="font-semibold text-white text-sm px-4 py-2">
                  {user.firstName} {user.lastName}
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-red-500 hover:bg-opacity-30 rounded-lg transition-all duration-300 text-sm font-medium"
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
