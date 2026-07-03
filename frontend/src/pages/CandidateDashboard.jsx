import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiTrendingUp, FiFileText, FiDownload, FiUpload } from 'react-icons/fi';
import { candidateDashboardAPI, candidateAPI } from '../api/api';

function CandidateDashboard() {
  const [candidateId, setCandidateId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [cvFile, setCVFile] = useState(null);
  const [cvFileName, setCVFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Obtener ID del usuario autenticado
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      setCandidateId(user.id);
    }
  }, []);

  useEffect(() => {
    if (candidateId) {
      loadData();
    }
  }, [candidateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, historyRes] = await Promise.all([
        candidateDashboardAPI.getSummary(candidateId),
        candidateDashboardAPI.getHistory(candidateId),
      ]);

      setSummary(summaryRes.data);
      setHistory(historyRes.data.history || []);
    } catch (error) {
      console.error('Error cargando datos del candidato:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = async (evaluation) => {
    try {
      const res = await candidateDashboardAPI.getResults(candidateId, evaluation.id);
      setSelectedEvaluation(res.data);
      setActiveTab('results');
    } catch (error) {
      console.error('Error cargando resultados:', error);
    }
  };

  const handleCVChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadMessage('❌ Solo se aceptan archivos PDF');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadMessage('❌ El archivo no debe exceder 5MB');
        return;
      }

      setCVFile(file);
      setCVFileName(file.name);
      setUploadMessage('');
    }
  };

  const handleUploadCV = async () => {
    if (!cvFile) {
      setUploadMessage('❌ Selecciona un archivo primero');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('cv', cvFile);

      const res = await candidateAPI.updateProfile(candidateId, formData);

      setUploadMessage('✅ CV actualizado exitosamente');
      setCVFile(null);
      setCVFileName('');

      // Recargar datos
      setTimeout(() => {
        loadData();
      }, 1500);
    } catch (error) {
      setUploadMessage('❌ Error al subir CV: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4">Cargando tu dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">
          Bienvenido, {summary?.candidate.name}
        </h1>
        <p className="text-blue-100">Aquí puedes ver tus evaluaciones y resultados</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Evaluaciones</p>
              <p className="text-3xl font-bold text-blue-600">
                {summary?.statistics.totalEvaluations}
              </p>
            </div>
            <FiFileText className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completadas</p>
              <p className="text-3xl font-bold text-green-600">
                {summary?.statistics.completedEvaluations}
              </p>
            </div>
            <FiCheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">En Progreso</p>
              <p className="text-3xl font-bold text-yellow-600">
                {summary?.statistics.inProgressEvaluations}
              </p>
            </div>
            <FiClock className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Promedio Puntaje</p>
              <p className="text-3xl font-bold text-purple-600">
                {summary?.statistics.averageScore}%
              </p>
            </div>
            <FiTrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-4 font-semibold transition ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Vista General
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-4 font-semibold transition ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Historial
          </button>
          {selectedEvaluation && (
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 px-4 py-4 font-semibold transition ${
                activeTab === 'results'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎯 Resultados Detallados
            </button>
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Información Personal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{summary?.candidate.email}</p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="text-lg font-semibold text-gray-900">{summary?.candidate.phone || 'No proporcionado'}</p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Registrado el</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(summary?.candidate.joinedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Mejor Puntuación</p>
                  <p className="text-lg font-semibold text-green-600">{summary?.statistics.bestScore}%</p>
                </div>
              </div>
            </div>

            {/* CV Upload Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu Currículum</h2>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1">
                    <p className="text-gray-600 mb-2">Actualiza tu CV en PDF</p>
                    <p className="text-sm text-gray-500 mb-4">Máximo 5MB, solo archivos PDF</p>

                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition">
                      <div className="flex items-center gap-2">
                        <FiUpload className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-700">
                          {cvFileName || 'Selecciona tu CV'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleCVChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleUploadCV}
                    disabled={!cvFile || uploading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    {uploading ? '⏳ Subiendo...' : '📤 Subir'}
                  </button>
                </div>

                {uploadMessage && (
                  <div className="mt-4 p-3 bg-white rounded text-center font-semibold">
                    {uploadMessage}
                  </div>
                )}

                {summary?.candidate.cvUrl && (
                  <div className="mt-4 p-3 bg-white rounded text-sm">
                    <p className="text-gray-600">CV actual: <a href={summary.candidate.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Ver archivo</a></p>
                  </div>
                )}
              </div>
            </div>

            {summary?.recentEvaluation && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Evaluación Más Reciente</h2>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Vacante</p>
                      <p className="text-xl font-bold text-gray-900">
                        {summary.recentEvaluation.vacancy_title}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Operación</p>
                      <p className="text-xl font-bold text-gray-900">
                        {summary.recentEvaluation.operation}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Estado</p>
                      <p className="font-semibold">
                        {summary.recentEvaluation.status === 'completed' && (
                          <span className="text-green-600">✓ Completada</span>
                        )}
                        {summary.recentEvaluation.status === 'in_progress' && (
                          <span className="text-yellow-600">⏳ En Progreso</span>
                        )}
                        {summary.recentEvaluation.status === 'not_started' && (
                          <span className="text-gray-600">○ No Iniciada</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Puntaje</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {summary.recentEvaluation.score || '-'}%
                      </p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-sm text-gray-600">Fecha</p>
                      <p className="font-semibold">
                        {new Date(summary.recentEvaluation.completed_at || summary.recentEvaluation.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Historial de Evaluaciones</h2>

            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tienes evaluaciones aún</p>
            ) : (
              <div className="space-y-3">
                {history.map((evaluation, idx) => (
                  <div
                    key={evaluation.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{evaluation.vacancy_title}</h3>
                        <p className="text-sm text-gray-600">
                          {evaluation.operation} • {evaluation.exam_title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Creada el {new Date(evaluation.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Estado</p>
                          <p className="font-semibold">
                            {evaluation.status_label}
                          </p>
                        </div>

                        {evaluation.status === 'completed' && (
                          <>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Puntaje</p>
                              <p className="text-2xl font-bold text-green-600">
                                {evaluation.score}%
                              </p>
                            </div>

                            <button
                              onClick={() => handleViewResults(evaluation)}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm transition"
                            >
                              Ver Detalles
                            </button>
                          </>
                        )}

                        {evaluation.status === 'in_progress' && (
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Progreso</p>
                            <p className="font-semibold">
                              {evaluation.answers_count}/{evaluation.total_questions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && selectedEvaluation && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Resultados - {selectedEvaluation.evaluation.vacancyTitle}
              </h2>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6 border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Puntaje Total</p>
                    <p className="text-4xl font-bold text-green-600">
                      {selectedEvaluation.evaluation.totalScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Preguntas Respondidas</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {selectedEvaluation.evaluation.answersSubmitted}/{selectedEvaluation.evaluation.totalQuestions}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completada el</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedEvaluation.evaluation.completedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Competencies */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Desempeño por Competencia</h3>

              <div className="space-y-3">
                {selectedEvaluation.competencies.map((comp, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{comp.name}</h4>
                        <p className="text-xs text-gray-500">Peso: {comp.weight}%</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{comp.score}%</p>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${comp.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Answers */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Tus Respuestas</h3>

              <div className="space-y-4">
                {selectedEvaluation.answers.map((comp, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-3">{comp.name}</h4>

                    <div className="space-y-3">
                      {comp.answers.map((ans, ansIdx) => (
                        <div key={ansIdx} className="bg-white rounded p-3">
                          <p className="text-sm text-gray-600 font-semibold mb-1">
                            Q{ansIdx + 1}: {ans.question}
                          </p>
                          <p className="text-gray-900">{ans.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-center pt-6">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition">
                <FiDownload className="w-5 h-5" />
                Descargar PDF de Resultados
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>💡 Información:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Puedes ver el estado de todas tus evaluaciones aquí</li>
          <li>Los resultados detallados están disponibles cuando completas una evaluación</li>
          <li>Tu puntuación se calcula basada en tus respuestas</li>
          <li>Puedes descargar tus resultados en PDF</li>
        </ul>
      </div>
    </div>
  );
}

export default CandidateDashboard;
