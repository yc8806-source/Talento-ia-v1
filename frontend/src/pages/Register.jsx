import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/api';
import { FiUser, FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'rrhh',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.register(formData);
      alert('Usuario registrado exitosamente. Por favor inicia sesión.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center px-4">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card de Registro */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 animate-slide-in-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3 mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crear Cuenta
            </h1>
            <p className="text-gray-600 text-sm mt-2">Únete a Talent IA</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 animate-slide-in-down text-sm">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Nombre</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Juan"
                  required
                />
              </div>
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Apellido</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Rol</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="rrhh">👥 RR.HH</option>
                <option value="admin">🔐 Administrador</option>
              </select>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </>
              ) : (
                'Registrarse'
              )}
            </button>
          </form>

          {/* Enlace de login */}
          <p className="text-center text-gray-600 text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center justify-center gap-1 mt-2">
              <FiArrowLeft className="w-4 h-4" />
              Volver al login
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

export default Register;
