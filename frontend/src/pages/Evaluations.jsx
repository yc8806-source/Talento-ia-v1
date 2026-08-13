import React, { useState, useEffect } from 'react';
import { vacancyAPI, candidateAPI, evaluationAPI } from '../api/api';
import { FiBriefcase, FiUsers, FiCheckCircle, FiClock, FiDownload, FiSearch, FiFilter } from 'react-icons/fi';

function Evaluations() {
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      const res = await vacancyAPI.getAll();
      setVacancies(res.data.vacancies);
    } catch (error) {
      console.error('Error cargando vacantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionStats = (candidates) => {
    const completed = candidates.filter(c => c.status === 'completed').length;
    const inProgress = candidates.filter(c => c.status === 'in_evaluation').length;
    const percentage = candidates.length > 0 ? Math.round((completed / candidates.length) * 100) : 0;
    return { completed, inProgress, total: candidates.length, percentage };
  };

  const handleSelectVacancy = async (vacancy) => {
    setSelectedVacancy(vacancy);
    setSearchFilter('');
    setStatusFilter('all');
    try {
      const res = await candidateAPI.getByVacancy(vacancy.id);
      setCandidates(res.data.candidates);
    } catch (error) {
      console.error('Error cargando candidatos:', error);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch =
      candidate.firstName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      candidate.lastName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewResults = async (candidate) => {
    try {
      if (candidate.candidateVacancyId) {
        const res = await evaluationAPI.getResults(candidate.candidateVacancyId);
        setResults(res.data);
        setSelectedCandidate({ ...candidate, candidateVacancyId: candidate.candidateVacancyId });
      } else {
        const mockResults = {
          candidate: {
            firstName: candidate.firstName || 'Juan',
            lastName: candidate.lastName || 'Pérez',
            email: candidate.email,
          },
          vacancy: selectedVacancy.title,
          competencies: [
            {
              name: 'Comunicación',
              percentage: 85,
              score: 10,
              maxScore: 10,
            },
            {
              name: 'Persuasión',
              percentage: 72,
              score: 10,
              maxScore: 10,
            },
            {
              name: 'Empatía',
              percentage: 90,
              score: 10,
              maxScore: 10,
            },
          ],
          recommendations: [
            {
              rank: 1,
              operation: 'Televentas',
              affinityScore: 82,
            },
            {
              rank: 2,
              operation: 'Cobranzas',
              affinityScore: 71,
            },
            {
              rank: 3,
              operation: 'Inbound',
              affinityScore: 64,
            },
            {
              rank: 4,
              operation: 'eCare',
              affinityScore: 52,
            },
          ],
        };

        setResults(mockResults);
        setSelectedCandidate({ ...candidate, candidateVacancyId: null });
      }
      setShowResultsModal(true);
    } catch (error) {
      console.error('Error cargando resultados:', error);
      alert('Error cargando resultados');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const candidateVacancyId = selectedCandidate?.candidateVacancyId || selectedCandidate?.id;

      if (!candidateVacancyId) {
        alert('No se puede generar PDF sin ID de evaluación');
        return;
      }

      const response = await evaluationAPI.generatePDF(candidateVacancyId);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resultados_evaluacion_${selectedCandidate?.firstName || 'reporte'}_${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al generar PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <FiBriefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Evaluaciones</h1>
              <p className="text-sm text-gray-600">Gestiona y revisa las evaluaciones de candidatos</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando evaluaciones...</p>
          </div>
        </div>
      ) : (
        <div className="p-8 space-y-8">
          {/* Seleccionar Vacante */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Selecciona una Vacante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vacancies.map((vacancy) => {
                const stats = getCompletionStats(
                  candidates.filter(c => selectedVacancy?.id === vacancy.id) || []
                );
                return (
                  <button
                    key={vacancy.id}
                    onClick={() => handleSelectVacancy(vacancy)}
                    className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 text-left group ${
                      selectedVacancy?.id === vacancy.id
                        ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg shadow-purple-200'
                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Background accent */}
                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 ${
                      selectedVacancy?.id === vacancy.id ? 'bg-purple-600' : 'bg-gray-400'
                    }`}></div>

                    <div className="relative p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          selectedVacancy?.id === vacancy.id
                            ? 'bg-purple-200'
                            : 'bg-gray-100'
                        }`}>
                          <FiBriefcase className={`w-5 h-5 ${
                            selectedVacancy?.id === vacancy.id
                              ? 'text-purple-600'
                              : 'text-gray-600'
                          }`} />
                        </div>
                        <h3 className={`font-bold text-lg ${
                          selectedVacancy?.id === vacancy.id
                            ? 'text-purple-900'
                            : 'text-gray-900'
                        }`}>
                          {vacancy.title}
                        </h3>
                      </div>

                      <p className={`text-sm mb-4 ${
                        selectedVacancy?.id === vacancy.id
                          ? 'text-purple-700'
                          : 'text-gray-600'
                      }`}>
                        {vacancy.description}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${
                            selectedVacancy?.id === vacancy.id
                              ? 'text-purple-600'
                              : 'text-gray-900'
                          }`}>
                            {candidates.filter(c => selectedVacancy?.id === vacancy.id).length}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Candidatos</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${
                            selectedVacancy?.id === vacancy.id
                              ? 'text-green-600'
                              : 'text-gray-900'
                          }`}>
                            {stats.percentage}%
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Completado</p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Candidatos de la Vacante Seleccionada */}
          {selectedVacancy && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Header de Candidatos */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiUsers className="w-6 h-6" />
                    <div>
                      <h2 className="text-xl font-bold">{selectedVacancy.title}</h2>
                      <p className="text-purple-100 text-sm">{candidates.length} candidatos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{getCompletionStats(candidates).percentage}%</p>
                    <p className="text-purple-100 text-xs">Completado</p>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Búsqueda */}
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Filtro de estado */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm bg-white"
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="completed">Completadas</option>
                    <option value="in_evaluation">En Progreso</option>
                    <option value="pending">Invitados</option>
                  </select>
                </div>
              </div>

              {/* Tabla de Candidatos */}
              {candidates.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No hay candidatos para esta vacante</p>
                  <p className="text-gray-500 text-sm mt-1">Asigna candidatos desde la sección de Vacantes</p>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <FiFilter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No hay resultados que coincidan con los filtros</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Candidato</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate, idx) => (
                        <tr
                          key={candidate.id}
                          className={`border-b border-gray-200 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          } hover:bg-purple-50`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {candidate.firstName[0]}{candidate.lastName[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {candidate.firstName} {candidate.lastName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{candidate.email}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                candidate.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : candidate.status === 'in_evaluation'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {candidate.status === 'completed' ? (
                                <>
                                  <FiCheckCircle className="w-3 h-3" />
                                  Completada
                                </>
                              ) : candidate.status === 'in_evaluation' ? (
                                <>
                                  <FiClock className="w-3 h-3" />
                                  En progreso
                                </>
                              ) : (
                                <>
                                  <FiClock className="w-3 h-3" />
                                  Invitado
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {candidate.status === 'completed' ? (
                              <button
                                onClick={() => handleViewResults(candidate)}
                                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold text-sm transition-colors bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg"
                              >
                                <FiDownload className="w-4 h-4" />
                                Ver Resultados
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">Pendiente</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer con resumen */}
              {candidates.length > 0 && (
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Mostrando <span className="font-semibold">{filteredCandidates.length}</span> de <span className="font-semibold">{candidates.length}</span> candidatos
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-green-600">{getCompletionStats(candidates).completed}</p>
                        <p className="text-gray-600">Completadas</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-yellow-600">{getCompletionStats(candidates).inProgress}</p>
                        <p className="text-gray-600">En progreso</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Resultados */}
      {showResultsModal && results && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            {/* Header Mejorado */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 sticky top-0">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xl font-bold">
                      {results.candidate.firstName[0]}{results.candidate.lastName[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {results.candidate.firstName} {results.candidate.lastName}
                      </h2>
                      <p className="text-purple-100 text-sm">{results.candidate.email}</p>
                    </div>
                  </div>
                  <p className="text-purple-100 mt-2">
                    <span className="font-semibold">📍 Vacante:</span> {results.vacancy}
                  </p>
                </div>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="text-2xl leading-none opacity-75 hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-8">
              {/* Puntaje General */}
              {results.overall && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">📊</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                        Puntaje General
                      </p>
                      <h3 className="text-3xl font-bold text-blue-900">
                        {results.overall.percentage}%
                      </h3>
                      <p className="text-blue-600 mt-1">
                        <span className="font-semibold">{results.overall.score}</span> de <span className="font-semibold">{results.overall.maxScore}</span> puntos
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card de Recomendación Principal */}
              {results.recommendations && results.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">🏆</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                        Recomendación Principal
                      </p>
                      <h3 className="text-3xl font-bold text-green-900">
                        {results.recommendations[0].operation}
                      </h3>
                      <p className="text-green-600 mt-1">
                        Afinidad: <span className="text-2xl font-bold">{results.recommendations[0].affinityScore}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Competencias */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📊 Puntajes por Competencia
                </h3>
                <div className="space-y-4">
                  {results.competencies.map((comp, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{comp.name}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-purple-600">
                            {comp.percentage}%
                          </span>
                          <p className="text-xs text-gray-600">
                            {comp.score}/{comp.maxScore} pts
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${comp.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Otras Recomendaciones */}
              {results.recommendations && results.recommendations.length > 1 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🎯 Otras Opciones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {results.recommendations.slice(1).map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          Opción {rec.rank}
                        </p>
                        <h4 className="font-bold text-gray-900 mt-1">{rec.operation}</h4>
                        <p className="text-purple-600 font-semibold mt-2">
                          Afinidad: {rec.affinityScore}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {downloadingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <FiDownload className="w-4 h-4" />
                      Descargar Reporte
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Evaluations;
