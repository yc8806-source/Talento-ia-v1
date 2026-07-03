import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiUsers } from 'react-icons/fi';
import { permissionAPI } from '../api/api';

function PermissionsManagement() {
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState({});
  const [permissions, setPermissions] = useState({});
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // team, user, permission

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        permissionAPI.getAllRoles(),
        permissionAPI.getAllPermissions(),
      ]);

      setRoles(rolesRes.data.roles || {});
      setPermissions(permissionsRes.data.permissions || {});
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4">Cargando gestión de permisos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Gestión de Permisos Granular</h1>
          <p className="text-gray-600 mt-1">Controla el acceso por roles y equipos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          {[
            { id: 'roles', label: '👥 Roles', icon: '👥' },
            { id: 'permissions', label: '🔐 Permisos', icon: '🔐' },
            { id: 'teams', label: '🏢 Equipos', icon: '🏢' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 font-semibold transition ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Roles Disponibles</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(roles).map(([roleKey, roleData]) => (
                  <div
                    key={roleKey}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{roleData.name}</h3>
                        <p className="text-sm text-gray-600">{roleData.description}</p>
                      </div>
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                        {roleKey}
                      </span>
                    </div>

                    <div className="bg-white rounded p-3 mt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Permisos ({roleData.permissions.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {roleData.permissions.slice(0, 5).map(perm => (
                          <span
                            key={perm}
                            className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            {perm}
                          </span>
                        ))}
                        {roleData.permissions.length > 5 && (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            +{roleData.permissions.length - 5} más
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Permisos del Sistema</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Clave de Permiso
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Categoría
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(permissions).map(([permKey, permDesc]) => {
                      const category = permKey.split('.')[0];
                      const categoryColors = {
                        candidates: 'bg-blue-100 text-blue-800',
                        vacancies: 'bg-green-100 text-green-800',
                        evaluations: 'bg-purple-100 text-purple-800',
                        questions: 'bg-yellow-100 text-yellow-800',
                        exams: 'bg-indigo-100 text-indigo-800',
                        reports: 'bg-pink-100 text-pink-800',
                        users: 'bg-red-100 text-red-800',
                        teams: 'bg-teal-100 text-teal-800',
                        admin: 'bg-gray-100 text-gray-800',
                      };

                      return (
                        <tr key={permKey} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-sm text-gray-900">
                            {permKey}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{permDesc}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                categoryColors[category] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {category}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Equipos</h2>
                <button
                  onClick={() => {
                    setModalType('team');
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
                >
                  <FiPlus className="w-5 h-5" />
                  Crear Equipo
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-600">
                <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="mb-2">
                  Los equipos se gestionan desde la sección de Administración
                </p>
                <p className="text-sm">
                  Asigna miembros y permisos específicos por departamento
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total de Roles</p>
          <p className="text-3xl font-bold text-blue-600">{Object.keys(roles).length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total de Permisos</p>
          <p className="text-3xl font-bold text-green-600">{Object.keys(permissions).length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Categorías</p>
          <p className="text-3xl font-bold text-purple-600">
            {new Set(Object.keys(permissions).map(p => p.split('.')[0])).size}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>💡 Sistema de Permisos Granular:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Roles predefinidos con conjuntos de permisos específicos</li>
          <li>Permisos granulares por acción y módulo</li>
          <li>Asignación de roles a nivel de equipo y departamento</li>
          <li>Auditoría completa de cambios de permisos</li>
          <li>Control de acceso flexible y seguro</li>
        </ul>
      </div>
    </div>
  );
}

export default PermissionsManagement;
