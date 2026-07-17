import React, { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiMail, FiDownload, FiTrash2 } from 'react-icons/fi';
import { bulkActionsAPI } from '../api/api';

function BulkActionsModal({ isOpen, onClose, vacancyId, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Select, 2: Action, 3: Confirm, 4: Processing
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [action, setAction] = useState('assign'); // assign, invite, export, delete
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && step === 1) {
      loadCandidates();
    }
  }, [isOpen, search, step]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const res = await bulkActionsAPI.getCandidates({
        vacancyId: vacancyId || null,
        search: search || null
      });
      setCandidates(res.data.candidates || []);
    } catch (error) {
      console.error('Error cargando candidatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(candidates.map(c => c.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectCandidate = (candidateId) => {
    if (selected.includes(candidateId)) {
      setSelected(selected.filter(id => id !== candidateId));
    } else {
      setSelected([...selected, candidateId]);
    }
  };

  const handleExecuteAction = async () => {
    // Validación doble - asegurar que hay candidatos seleccionados
    if (!selected || selected.length === 0) {
      alert('Por favor selecciona al menos un candidato');
      setStep(3); // Volver al paso 3
      return;
    }

    setStep(4);
    setProgress({ current: 0, total: selected.length });

    try {
      let response;

      switch (action) {
        case 'assign':
          response = await bulkActionsAPI.assignToVacancy({
            candidateIds: selected,
            vacancyId: vacancyId
          });
          break;

        case 'invite':
          response = await bulkActionsAPI.sendInvitations({
            candidateVacancyIds: selected
          });
          break;

        case 'export':
          response = await bulkActionsAPI.exportCSV({
            candidateIds: selected
          });
          // Descargar archivo
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'candidatos.csv');
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          break;

        case 'delete':
          if (window.confirm('¿Estás seguro de que deseas eliminar estos candidatos?')) {
            response = await bulkActionsAPI.deleteCandidates({
              candidateIds: selected
            });
          } else {
            setStep(3);
            return;
          }
          break;

        default:
          break;
      }

      setProgress({ current: selected.length, total: selected.length });
      setResult(response.data);
      setTimeout(() => {
        onSuccess && onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error ejecutando acción:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
      setStep(3);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelected([]);
    setAction('assign');
    setResult(null);
    setSearch('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Acciones Masivas</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar candidatos
                </label>
                <input
                  type="text"
                  placeholder="Nombre, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Tabla de selección */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selected.length === candidates.length && candidates.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          Cargando candidatos...
                        </td>
                      </tr>
                    ) : candidates.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          No hay candidatos disponibles
                        </td>
                      </tr>
                    ) : (
                      candidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected.includes(candidate.id)}
                              onChange={() => handleSelectCandidate(candidate.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {candidate.first_name} {candidate.last_name}
                          </td>
                          <td className="px-4 py-3">{candidate.email}</td>
                          <td className="px-4 py-3">{candidate.phone || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <strong>Seleccionados:</strong> {selected.length} / {candidates.length}
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={selected.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Action */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-gray-700 font-semibold">
                Selecciona una acción para {selected.length} candidato(s)
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setAction('assign');
                    setStep(3);
                  }}
                  className="p-4 border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 rounded-lg text-left transition"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FiCheckCircle className="w-6 h-6 text-blue-600" />
                    <span className="font-bold">Asignar a Vacante</span>
                  </div>
                  <p className="text-sm text-gray-600">Asignar a una vacante específica</p>
                </button>

                <button
                  onClick={() => {
                    setAction('invite');
                    setStep(3);
                  }}
                  className="p-4 border-2 border-gray-200 hover:border-green-600 hover:bg-green-50 rounded-lg text-left transition"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FiMail className="w-6 h-6 text-green-600" />
                    <span className="font-bold">Enviar Invitaciones</span>
                  </div>
                  <p className="text-sm text-gray-600">Enviar enlace de evaluación por email</p>
                </button>

                <button
                  onClick={() => {
                    setAction('export');
                    setStep(3);
                  }}
                  className="p-4 border-2 border-gray-200 hover:border-purple-600 hover:bg-purple-50 rounded-lg text-left transition"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FiDownload className="w-6 h-6 text-purple-600" />
                    <span className="font-bold">Exportar a CSV</span>
                  </div>
                  <p className="text-sm text-gray-600">Descargar datos como archivo CSV</p>
                </button>

                <button
                  onClick={() => {
                    setAction('delete');
                    setStep(3);
                  }}
                  className="p-4 border-2 border-gray-200 hover:border-red-600 hover:bg-red-50 rounded-lg text-left transition"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FiTrash2 className="w-6 h-6 text-red-600" />
                    <span className="font-bold">Eliminar</span>
                  </div>
                  <p className="text-sm text-gray-600">Eliminar candidatos permanentemente</p>
                </button>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-semibold transition"
                >
                  Atrás
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Acción:</strong> {
                    action === 'assign' && 'Asignar a vacante'
                    || action === 'invite' && 'Enviar invitaciones'
                    || action === 'export' && 'Exportar a CSV'
                    || action === 'delete' && 'Eliminar candidatos'
                  }
                </p>
                <p className="text-sm text-yellow-800">
                  <strong>Candidatos:</strong> {selected.length}
                </p>
              </div>

              {action === 'delete' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-semibold">
                    ⚠️ Esta acción es irreversible. Se eliminarán permanentemente {selected.length} candidato(s).
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-semibold transition"
                >
                  Atrás
                </button>
                <button
                  onClick={handleExecuteAction}
                  disabled={selected.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                >
                  Ejecutar Acción
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === 4 && (
            <div className="space-y-4 text-center py-8">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="font-semibold text-gray-900">Procesando...</p>
              <p className="text-sm text-gray-600">
                {progress.current} / {progress.total}
              </p>

              {result && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 text-green-800">
                  <p className="font-semibold">✓ {result.message}</p>
                  {result.results && (
                    <p className="text-sm mt-2">Exitosos: {result.results.length}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkActionsModal;
