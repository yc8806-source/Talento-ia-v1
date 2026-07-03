import React, { useState, useEffect } from 'react';
import { candidateAPI, vacancyAPI, examAPI, evaluationAPI } from '../api/api';
import { FiSend, FiLink2, FiCheck, FiAlertCircle, FiCopy } from 'react-icons/fi';

function ShareEvaluations() {
  const [candidates, setCandidates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [candRes, vacRes, examRes] = await Promise.all([
        candidateAPI.getAll(),
        vacancyAPI.getAll(),
        examAPI.getAll(),
      ]);

      // Extraer array de candidatos (puede venir en data.candidates o directamente)
      const cands = Array.isArray(candRes.data) ? candRes.data : (candRes.data?.candidates || []);

      // Extraer array de vacantes
      const vacs = Array.isArray(vacRes.data) ? vacRes.data : (vacRes.data?.vacancies || []);

      // Extraer array de exámenes
      const exs = Array.isArray(examRes.data) ? examRes.data : (examRes.data?.exams || []);

      setCandidates(cands);
      setVacancies(vacs);
      setExams(exs);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSendInvitations = async () => {
    if (!selectedVacancy || !selectedExam || selectedCandidates.length === 0) {
      alert('Por favor selecciona una vacante, un examen y al menos un candidato');
      return;
    }

    setSending(true);
    setResults([]);

    try {
      const invitationResults = [];

      for (const candidateId of selectedCandidates) {
        try {
          // Crear candidate_vacancy
          const cvRes = await candidateAPI.assignVacancy({
            candidateId,
            vacancyId: selectedVacancy,
          });

          const candidateVacancyId = cvRes.data.candidateVacancyId;
          const candidate = candidates.find(c => c.id === candidateId);

          // Crear y compartir link de evaluación
          const linkRes = await evaluationAPI.createAndShareLink({
            candidateVacancyId,
            examId: selectedExam,
          });

          invitationResults.push({
            success: true,
            candidateName: `${candidate.first_name} ${candidate.last_name}`,
            candidateEmail: candidate.email,
            link: linkRes.data.evaluation.link,
            message: 'Invitación enviada exitosamente',
          });
        } catch (error) {
          const candidate = candidates.find(c => c.id === candidateId);
          invitationResults.push({
            success: false,
            candidateName: `${candidate.first_name} ${candidate.last_name}`,
            candidateEmail: candidate.email,
            error: error.response?.data?.error || 'Error desconocido',
          });
        }
      }

      setResults(invitationResults);
      setShowResults(true);
      setSelectedCandidates([]);
    } catch (error) {
      console.error('Error enviando invitaciones:', error);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Link copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">🔐 Compartir Evaluaciones</h1>
        <p className="text-gray-600 mt-2">Envía links únicos de acceso anónimo a candidatos</p>
      </div>

      {/* Forma de Invitación */}
      {!showResults && (
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Seleccionar Vacante */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              📋 Selecciona una Vacante
            </label>
            <select
              value={selectedVacancy}
              onChange={(e) => setSelectedVacancy(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="">-- Selecciona una vacante --</option>
              {vacancies.map(vacancy => (
                <option key={vacancy.id} value={vacancy.id}>
                  {vacancy.title} ({vacancy.description})
                </option>
              ))}
            </select>
          </div>

          {/* Seleccionar Examen */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              📝 Selecciona un Examen
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="">-- Selecciona un examen --</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.question_count || 0} preguntas)
                </option>
              ))}
            </select>
          </div>

          {/* Seleccionar Candidatos */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              👥 Selecciona Candidatos ({selectedCandidates.length} seleccionados)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
              {candidates.map(candidate => (
                <div key={candidate.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`candidate-${candidate.id}`}
                    checked={selectedCandidates.includes(candidate.id)}
                    onChange={() => handleCandidateSelect(candidate.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor={`candidate-${candidate.id}`} className="ml-3 cursor-pointer flex-1">
                    <div className="font-medium text-gray-900">
                      {candidate.first_name} {candidate.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{candidate.email}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Botón Enviar */}
          <button
            onClick={handleSendInvitations}
            disabled={sending || !selectedVacancy || !selectedExam || selectedCandidates.length === 0}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enviando invitaciones...
              </>
            ) : (
              <>
                <FiSend className="w-5 h-5" />
                Enviar Invitaciones
              </>
            )}
          </button>
        </div>
      )}

      {/* Resultados */}
      {showResults && (
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">✅ Resultados</h2>
            <button
              onClick={() => setShowResults(false)}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← Volver
            </button>
          </div>

          {results.map((result, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-lg border-l-4 ${
                result.success
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <FiCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <FiAlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <h3 className="font-bold text-gray-900">{result.candidateName}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{result.candidateEmail}</p>

                  {result.success && result.link && (
                    <div className="bg-white p-3 rounded border border-gray-300 mt-3">
                      <p className="text-xs text-gray-600 mb-2">Link de acceso:</p>
                      <div className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded">
                        <code className="text-xs text-gray-700 break-all flex-1">
                          {result.link}
                        </code>
                        <button
                          onClick={() => copyToClipboard(result.link)}
                          className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-700"
                          title="Copiar link"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {result.error && (
                    <p className="text-sm text-red-600 mt-2">
                      <strong>Error:</strong> {result.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Resumen */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              ✓ <strong>{results.filter(r => r.success).length}</strong> invitaciones enviadas exitosamente
            </p>
            {results.filter(r => !r.success).length > 0 && (
              <p className="text-sm text-red-700 mt-2">
                ✗ <strong>{results.filter(r => !r.success).length}</strong> invitaciones fallidas
              </p>
            )}
          </div>
        </div>
      )}

      {/* Información Importante */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-3">ℹ️ Información Importante</h3>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li>✓ Cada link es único y de un solo uso</li>
          <li>✓ Los candidatos no necesitan login para acceder</li>
          <li>✓ El acceso es completamente anónimo</li>
          <li>✓ Las invitaciones se envían por email automáticamente</li>
          <li>✓ Los links expiran después de 7 días</li>
        </ul>
      </div>
    </div>
  );
}

export default ShareEvaluations;
