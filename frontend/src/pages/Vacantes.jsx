import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vacancyAPI } from '../api/api';
import { FiBriefcase, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Vacantes() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vacancyToDelete, setVacancyToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    status: 'open',
    available_positions: 1
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      const response = await vacancyAPI.getAll();
      setVacancies(response.data.vacancies || []);
    } catch (error) {
      console.error('Error cargando vacantes:', error);
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await vacancyAPI.create(formData);
      setFormData({ title: '', description: '', department: '', status: 'open', available_positions: 1 });
      setShowForm(false);
      fetchVacancies();
    } catch (error) {
      alert('Error al crear vacante: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleStatus = async (vacancyId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      await vacancyAPI.update(vacancyId, { status: newStatus });
      fetchVacancies();
      alert(`Vacante ${newStatus === 'open' ? 'reabierta' : 'cerrada'} exitosamente`);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteVacancy = async () => {
    if (!vacancyToDelete) return;

    try {
      await vacancyAPI.delete(vacancyToDelete.id);
      setShowDeleteConfirm(false);
      setVacancyToDelete(null);
      fetchVacancies();
      alert('Vacante eliminada exitosamente');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando vacantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <FiBriefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vacantes</h1>
              <p className="text-sm text-gray-600">Gestiona las posiciones disponibles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Botón Nueva Vacante */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            {showForm ? 'Cancelar' : 'Nueva Vacante'}
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Crear Nueva Vacante</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Título de la vacante"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <textarea
                name="description"
                placeholder="Descripción"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none min-h-24"
              />
              <input
                type="text"
                name="department"
                placeholder="Departamento"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="open">Abierta</option>
                <option value="closed">Cerrada</option>
              </select>
              <input
                type="number"
                name="available_positions"
                placeholder="Cantidad de vacantes"
                value={formData.available_positions}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Crear Vacante
              </button>
            </form>
          </div>
        )}

        {/* Grid de Vacantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacancies.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiBriefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No hay vacantes registradas</p>
            </div>
          ) : (
            vacancies.map(vacancy => (
              <div
                key={vacancy.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100"
              >
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{vacancy.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        vacancy.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {vacancy.status === 'open' ? 'Abierta' : 'Cerrada'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm border-t border-b border-gray-100 py-3">
                    <p><span className="font-semibold text-gray-900">Departamento:</span> <span className="text-gray-600">{vacancy.department}</span></p>
                    <p><span className="font-semibold text-gray-900">Vacantes:</span> <span className="text-gray-600">{vacancy.filledPositions || 0}/{vacancy.availablePositions || 1} ocupadas</span></p>
                  </div>

                  {/* Descripción */}
                  {vacancy.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{vacancy.description}</p>
                  )}

                  {/* Botones */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => navigate(`/vacantes/${vacancy.id}/candidatos`)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        👥 Candidatos
                      </button>
                      <button
                        onClick={() => navigate(`/vacantes/${vacancy.id}/assign-evaluations`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Examen
                      </button>
                      <button
                        onClick={() => handleToggleStatus(vacancy.id, vacancy.status)}
                        className={`${
                          vacancy.status === 'open'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        {vacancy.status === 'open' ? 'Cerrar' : 'Reabrir'}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setVacancyToDelete(vacancy);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Eliminar Vacante
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showDeleteConfirm && vacancyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Eliminar Vacante</h3>
            <p className="text-gray-600 mb-2">
              ¿Está seguro de que desea eliminar la vacante <strong>{vacancyToDelete.title}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer y eliminará todos los datos asociados.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setVacancyToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteVacancy}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
