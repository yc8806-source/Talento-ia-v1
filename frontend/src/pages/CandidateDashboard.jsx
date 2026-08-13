import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone } from 'react-icons/fi';

function CandidateDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const role = localStorage.getItem('role');
      setUser({
        ...storedUser,
        role: role
      });
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Error cargando perfil</p>
      </div>
    );
  }

  const fullName = `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim();
  const roleLabel = user.role === 'admin' ? 'Administrador' : 'Candidato';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">
          Mi Perfil
        </h1>
        <p className="text-purple-100">Información de tu cuenta</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <FiUser className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{fullName || 'Usuario'}</h2>
            <p className="text-gray-600">{roleLabel}</p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <FiMail className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-semibold text-gray-900">{user.email || 'No disponible'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <FiPhone className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="text-lg font-semibold text-gray-900">{user.phone || 'No proporcionado'}</p>
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-900 font-semibold">
                ✓ Cuenta de administrador
              </p>
              <p className="text-sm text-purple-700 mt-1">
                Tienes acceso a todas las funciones administrativas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Opciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {user.role === 'admin' ? (
            <>
              <a href="/candidatos" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-semibold transition">
                📋 Gestionar Candidatos
              </a>
              <a href="/vacantes" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-semibold transition">
                💼 Gestionar Vacantes
              </a>
              <a href="/evaluaciones" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-semibold transition">
                📊 Evaluaciones
              </a>
              <a href="/reportes" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-semibold transition">
                📈 Reportes
              </a>
            </>
          ) : (
            <>
              <a href="/dashboard" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-semibold transition">
                📊 Dashboard
              </a>
              <a href="/evaluaciones" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-semibold transition">
                📋 Mis Evaluaciones
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateDashboard;
