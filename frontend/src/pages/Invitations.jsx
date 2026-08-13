import React, { useState, useEffect } from 'react';
import { candidateAPI, vacancyAPI, examAPI, evaluationAPI } from '../api/api';
import { FiMessageCircle, FiCheck, FiAlertCircle, FiCopy, FiChevronRight, FiUsers, FiFileText, FiBook } from 'react-icons/fi';

function Invitations() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Data
  const [candidates, setCandidates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [exams, setExams] = useState([]);
  const [invitationHistory, setInvitationHistory] = useState([]);

  // Selections
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const [vacancyExams, setVacancyExams] = useState([]);

  // Results
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Search & Filters
  const [candidateSearch, setCandidateSearch] = useState('');
  const [vacancySearch, setVacancySearch] = useState('');

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

      const cands = Array.isArray(candRes.data) ? candRes.data : (candRes.data?.candidates || []);
      const vacs = Array.isArray(vacRes.data) ? vacRes.data : (vacRes.data?.vacancies || []);
      const exs = Array.isArray(examRes.data) ? examRes.data : (examRes.data?.exams || []);

      // Normalizar nombres de campos (camelCase a snake_case)
      const normalizedCands = cands.map(c => ({
        ...c,
        first_name: c.first_name || c.firstName || '',
        last_name: c.last_name || c.lastName || '',
        email: c.email || ''
      }));

      setCandidates(normalizedCands);
      setVacancies(vacs);
      setExams(exs);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateToggle = (candidateId) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleVacancySelect = async (vacancyId) => {
    setSelectedVacancy(vacancyId);

    // Cargar los exámenes de la vacante
    try {
      const response = await vacancyAPI.getById(vacancyId);
      setVacancyExams(response.data.exams || []);
    } catch (error) {
      console.error('Error cargando exámenes de la vacante:', error);
      setVacancyExams([]);
    }
  };

  const handleSendInvitations = async () => {
    if (!selectedVacancy || vacancyExams.length === 0 || selectedCandidates.length === 0) {
      alert('Por favor completa todos los pasos');
      return;
    }

    setSending(true);
    setResults([]);

    try {
      const invitationResults = [];

      for (const candidateId of selectedCandidates) {
        try {
          // Asignar vacante al candidato
          const cvRes = await candidateAPI.assignVacancy({
            candidateId,
            vacancyId: selectedVacancy,
          });

          const candidateVacancyId = cvRes.data.candidateVacancyId;
          const candidate = candidates.find(c => c.id === candidateId);
          const vacancy = vacancies.find(v => v.id === parseInt(selectedVacancy));

          // Crear links de evaluación para cada examen de la vacante
          const evaluationLinks = [];
          for (const exam of vacancyExams) {
            try {
              const linkRes = await evaluationAPI.createAndShareLink({
                candidateVacancyId,
                examId: exam.id,
              });
              evaluationLinks.push(linkRes.data.evaluation.link);
            } catch (err) {
              console.error(`Error creando link para examen ${exam.id}:`, err);
            }
          }

          if (evaluationLinks.length === 0) {
            throw new Error('No se pudieron crear los links de evaluación');
          }

          const candidatePhone = (candidate.phone || '').replace(/\D/g, ''); // Solo dígitos
          const examNames = vacancyExams.map(e => e.name).join(', ');

          // Texto predefinido profesional para WhatsApp
          const whatsappMessage = `¡Hola ${candidate.first_name}! 👋\n\nTe invitamos a participar en evaluaciones de ${vacancy.title} en IMPULSA TALENTO.\n\nExámenes: ${examNames}\n\nAccede a los siguientes enlaces:\n\n${evaluationLinks.map((link, idx) => `${idx + 1}. ${link}`).join('\n\n')}\n\n¡Mucho éxito! 🚀`;

          // Crear link de WhatsApp Web
          const whatsappLink = candidatePhone
            ? `https://wa.me/${candidatePhone}?text=${encodeURIComponent(whatsappMessage)}`
            : null;

          invitationResults.push({
            success: true,
            candidateName: `${candidate.first_name} ${candidate.last_name}`,
            candidateEmail: candidate.email,
            candidatePhone: candidate.phone,
            links: evaluationLinks,
            whatsappLink: whatsappLink,
            whatsappMessage: whatsappMessage,
            message: 'Links de evaluación generados exitosamente',
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
      setInvitationHistory([...invitationResults, ...invitationHistory]);
      setSelectedCandidates([]);
    } catch (error) {
      console.error('Error enviando invitaciones:', error);
      alert('Error al enviar invitaciones');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  const filteredCandidates = candidates.filter(c =>
    `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(candidateSearch.toLowerCase())
  );

  const filteredVacancies = vacancies.filter(v =>
    v.title.toLowerCase().includes(vacancySearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
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
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <FiMail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invitaciones</h1>
              <p className="text-sm text-gray-600">Envía evaluaciones a candidatos de forma centralizada</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {!showResults ? (
          <div className="space-y-8">
            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Paso 1: Selecciona Candidatos</h2>
              <p className="text-gray-600">Busca y selecciona los candidatos a invitar</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between bg-white rounded-lg p-6 shadow-sm">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <button
                    onClick={() => setStep(s)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      s === step
                        ? 'bg-purple-600 text-white shadow-lg'
                        : s < step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {s < step ? <FiCheck /> : s}
                  </button>
                  {s < 3 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        s < step ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className={`font-semibold ${step === 1 ? 'text-purple-600' : 'text-gray-600'}`}>
                  Candidatos
                </p>
              </div>
              <div>
                <p className={`font-semibold ${step === 2 ? 'text-purple-600' : 'text-gray-600'}`}>
                  Vacante
                </p>
              </div>
              <div>
                <p className={`font-semibold ${step === 3 ? 'text-purple-600' : 'text-gray-600'}`}>
                  Revisar & Enviar
                </p>
              </div>
            </div>

            {/* Step 1: Select Candidates */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FiUsers className="w-6 h-6 text-purple-600" />
                    Selecciona Candidatos
                  </h2>
                  <p className="text-gray-600">
                    {selectedCandidates.length} de {candidates.length} candidatos seleccionados
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />

                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {filteredCandidates.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No se encontraron candidatos</p>
                  ) : (
                    filteredCandidates.map(candidate => (
                      <div
                        key={candidate.id}
                        className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
                      >
                        <input
                          type="checkbox"
                          id={`candidate-${candidate.id}`}
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={() => handleCandidateToggle(candidate.id)}
                          className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                        />
                        <label htmlFor={`candidate-${candidate.id}`} className="ml-3 cursor-pointer flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {(candidate.first_name || 'C')[0]}{(candidate.last_name || 'C')[0]}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {candidate.first_name || 'N/A'} {candidate.last_name || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-500">{candidate.email || 'N/A'}</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedCandidates(filteredCandidates.map(c => c.id))}
                    className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                  >
                    Seleccionar Todo
                  </button>
                  <button
                    onClick={() => setSelectedCandidates([])}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Deseleccionar Todo
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Vacancy */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FiFileText className="w-6 h-6 text-purple-600" />
                    Selecciona una Vacante
                  </h2>
                  <p className="text-gray-600">Elige la posición para la cual deseas evaluar</p>
                </div>

                <input
                  type="text"
                  placeholder="Buscar vacante..."
                  value={vacancySearch}
                  onChange={(e) => setVacancySearch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />

                <div className="grid grid-cols-1 gap-3">
                  {filteredVacancies.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No se encontraron vacantes</p>
                  ) : (
                    filteredVacancies.map(vacancy => (
                      <button
                        key={vacancy.id}
                        onClick={() => {
                          handleVacancySelect(vacancy.id);
                          setStep(3);
                        }}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedVacancy === vacancy.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{vacancy.title}</p>
                            <p className="text-sm text-gray-600">{vacancy.description}</p>
                          </div>
                          {selectedVacancy === vacancy.id && (
                            <FiCheck className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review & Send */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Resumen de Invitación</h2>
                  <p className="text-gray-600">Revisa los datos antes de enviar</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">📋 CANDIDATOS</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedCandidates.length} candidato{selectedCandidates.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">🎯 VACANTE</p>
                    <p className="text-lg font-bold text-gray-900">
                      {vacancies.find(v => v.id === parseInt(selectedVacancy))?.title || 'No seleccionada'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">📚 EXÁMENES</p>
                    <div className="space-y-1">
                      {vacancyExams.length === 0 ? (
                        <p className="text-lg font-bold text-gray-900">Sin exámenes asignados</p>
                      ) : (
                        vacancyExams.map(exam => (
                          <p key={exam.id} className="text-lg font-bold text-gray-900">
                            • {exam.name}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    ✅ <strong>Se generarán enlaces únicos</strong> para cada candidato que podrás compartir por WhatsApp Web.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && selectedCandidates.length === 0) ||
                    (step === 2 && !selectedVacancy)
                  }
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  Siguiente <FiChevronRight />
                </button>
              ) : (
                <button
                  onClick={handleSendInvitations}
                  disabled={sending}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <FiMessageCircle />
                      Generar Enlaces
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FiCheck className="w-6 h-6 text-green-600" />
                  Resultados
                </h2>
                <button
                  onClick={() => {
                    setShowResults(false);
                    setStep(1);
                    setSelectedCandidates([]);
                    setSelectedVacancy('');
                    setVacancyExams([]);
                  }}
                  className="px-4 py-2 text-purple-600 hover:text-purple-700 font-semibold"
                >
                  ← Nueva Invitación
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-green-700 mb-1">Exitosas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {results.filter(r => r.success).length}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-red-700 mb-1">Fallidas</p>
                  <p className="text-3xl font-bold text-red-600">
                    {results.filter(r => !r.success).length}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-blue-700 mb-1">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{results.length}</p>
                </div>
              </div>

              {/* Individual Results */}
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
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

                        {result.success && result.links && (
                          <div className="bg-white p-4 rounded border border-gray-300 space-y-4">
                            {/* Links de Evaluación */}
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-2">🔗 Links de Evaluación:</p>
                              <div className="space-y-2">
                                {result.links.map((link, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded">
                                    <div className="flex-1">
                                      <p className="text-xs text-gray-600 font-semibold mb-1">
                                        {vacancyExams[idx]?.name || `Examen ${idx + 1}`}
                                      </p>
                                      <code className="text-xs text-gray-700 break-all">
                                        {link}
                                      </code>
                                    </div>
                                    <button
                                      onClick={() => copyToClipboard(link)}
                                      className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                      title="Copiar"
                                    >
                                      <FiCopy className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Mensaje de WhatsApp */}
                            {result.whatsappMessage && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">💬 Mensaje de WhatsApp:</p>
                                <div className="bg-green-50 p-3 rounded border border-green-200 text-xs text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                  {result.whatsappMessage}
                                </div>
                              </div>
                            )}

                            {/* Advertencia sobre envío uno a uno */}
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <p className="text-xs text-blue-900">
                                ℹ️ Para evitar que WhatsApp bloquee el número por spam, los mensajes se deben enviar <strong>uno a la vez</strong> con una pausa entre cada uno.
                              </p>
                            </div>

                            {/* Botón para Enviar por WhatsApp */}
                            {result.whatsappLink ? (
                              <button
                                onClick={() => window.open(result.whatsappLink, '_blank')}
                                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold flex items-center justify-center gap-2 transition-colors"
                              >
                                <FiMessageCircle className="w-5 h-5" />
                                📱 Enviar este candidato por WhatsApp
                              </button>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                <p className="text-xs text-yellow-800">
                                  ⚠️ El candidato no tiene número de teléfono registrado. Copia los links y comparte manualmente.
                                </p>
                              </div>
                            )}
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Invitations;
