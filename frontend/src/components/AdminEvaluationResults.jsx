import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiDownload, FiEye, FiCheck, FiX } from 'react-icons/fi';

const AdminEvaluationResults = () => {
  const { candidateId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedEval, setExpandedEval] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
        const response = await fetch(
          `${apiUrl}/assignments/results/${candidateId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error cargando resultados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando resultados...</div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">No hay resultados disponibles</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Resultados de Evaluación
          </h1>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600">Candidato</p>
              <p className="text-lg font-semibold text-gray-800">
                {results.candidateName}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="text-lg font-semibold text-gray-800">
                {results.email}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Asignado</p>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(results.assignedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {results.completedAt && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">
                <FiCheck className="inline mr-2" />
                Completado: {new Date(results.completedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Evaluaciones */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Evaluaciones Asignadas
          </h2>

          {results.evaluationResults.map((evalResult, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition"
                onClick={() =>
                  setExpandedEval(expandedEval === idx ? null : idx)
                }
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">
                      {evalResult.evaluation?.name || 'Evaluación'}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {evalResult.evaluation?.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {evalResult.answersSubmitted}/{evalResult.totalQuestions}
                    </div>
                    <p className="text-gray-600 text-sm">Respuestas</p>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-gray-600">Tiempo Máximo</p>
                    <p className="font-semibold text-gray-800">
                      {evalResult.evaluation?.max_time_minutes} min
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-gray-600">Preguntas Totales</p>
                    <p className="font-semibold text-gray-800">
                      {evalResult.totalQuestions}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-gray-600">Estado</p>
                    <p className="font-semibold text-gray-800">
                      {evalResult.answersSubmitted > 0 ? 'Enviado' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedEval === idx && evalResult.answers.length > 0 && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <h4 className="font-bold text-gray-800 mb-4">
                    Respuestas Enviadas
                  </h4>
                  <div className="space-y-3">
                    {evalResult.answers.map((answer, ansIdx) => (
                      <div
                        key={ansIdx}
                        className="bg-white p-4 rounded border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-800">
                            Pregunta {ansIdx + 1}
                          </p>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              answer.is_correct
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {answer.is_correct ? (
                              <>
                                <FiCheck className="inline mr-1" />
                                Correcta
                              </>
                            ) : (
                              <>
                                <FiX className="inline mr-1" />
                                Incorrecta
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">
                          <strong>Respuesta:</strong> {answer.answer_text}
                        </p>
                        {answer.explanation && (
                          <p className="text-gray-600 text-sm">
                            <strong>Explicación:</strong> {answer.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expandedEval === idx && evalResult.answers.length === 0 && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <p className="text-gray-600">No hay respuestas registradas</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Export Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            <FiDownload size={20} />
            Descargar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEvaluationResults;
