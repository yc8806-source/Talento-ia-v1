import React, { useState, useEffect } from 'react';
import { vacancyAPI, candidateAPI, evaluationAPI } from '../api/api';

function Evaluations() {
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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

  const handleSelectVacancy = async (vacancy) => {
    setSelectedVacancy(vacancy);
    try {
      const res = await candidateAPI.getByVacancy(vacancy.id);
      setCandidates(res.data.candidates);
    } catch (error) {
      console.error('Error cargando candidatos:', error);
    }
  };

  const handleViewResults = async (candidate) => {
    try {
      // Usar API real si candidateVacancyId está disponible
      if (candidate.candidateVacancyId) {
        const res = await evaluationAPI.getResults(candidate.candidateVacancyId);
        setResults(res.data);
        setSelectedCandidate({ ...candidate, candidateVacancyId: candidate.candidateVacancyId });
      } else {
        // Mock results - en producción vendrían del backend
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
      // Obtener el candidateVacancyId del candidato seleccionado
      const candidateVacancyId = selectedCandidate?.candidateVacancyId || selectedCandidate?.id;

      if (!candidateVacancyId) {
        alert('No se puede generar PDF sin ID de evaluación');
        return;
      }

      const response = await evaluationAPI.generatePDF(candidateVacancyId);

      if (response.data.pdf && response.data.pdf.url) {
        window.open(response.data.pdf.url, '_blank');
      }
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al generar PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Evaluaciones</h1>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Cargando...</div>
      ) : (
        <div className="space-y-6">
          {/* Seleccionar Vacante */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Selecciona una Vacante
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vacancies.map((vacancy) => (
                <button
                  key={vacancy.id}
                  onClick={() => handleSelectVacancy(vacancy)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedVacancy?.id === vacancy.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-bold text-gray-900">{vacancy.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {vacancy.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Candidatos de la Vacante Seleccionada */}
          {selectedVacancy && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Candidatos - {selectedVacancy.title}
              </h2>

              {candidates.length === 0 ? (
                <p className="text-gray-500">
                  No hay candidatos para esta vacante
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((candidate) => (
                        <tr
                          key={candidate.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {candidate.firstName} {candidate.lastName}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {candidate.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                candidate.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : candidate.status === 'in_evaluation'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {candidate.status === 'completed'
                                ? 'Completada'
                                : candidate.status === 'in_evaluation'
                                ? 'En progreso'
                                : 'Invitado'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {candidate.status === 'completed' && (
                              <button
                                onClick={() => handleViewResults(candidate)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                              >
                                Ver Resultados
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Resultados */}
      {showResultsModal && results && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header Mejorado */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white p-6 sticky top-0">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-lg">
                      👤
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {results.candidate.firstName} {results.candidate.lastName}
                      </h2>
                      <p className="text-blue-100 text-sm">{results.candidate.email}</p>
                    </div>
                  </div>
                  <p className="text-blue-100 mt-2">
                    <span className="font-semibold">📍 Vacante:</span> {results.vacancy}
                  </p>
                </div>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="text-2xl leading-none opacity-75 hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-8">
              {/* Card de Recomendación Principal */}
              {results.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
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
                          <span className="text-2xl font-bold text-blue-600">
                            {comp.percentage}%
                          </span>
                          <p className="text-xs text-gray-600">
                            {comp.score}/{comp.maxScore} pts
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${comp.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Otras Recomendaciones */}
              {results.recommendations.length > 1 && (
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
                        <p className="text-blue-600 font-semibold mt-2">
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
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-lg font-semibold disabled:opacity-50 transition-all"
                >
                  {downloadingPDF ? '⏳ Generando PDF...' : '📄 Descargar Reporte'}
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
