import React, { useState, useEffect } from 'react';
import { FiCheck, FiCopy, FiAlertCircle } from 'react-icons/fi';

const AdminAssignEvaluations = () => {
  const [candidates, setCandidates] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedEvals, setSelectedEvals] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [generatedToken, setGeneratedToken] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('access_token');

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

        // Cargar candidatos
        const candidatesRes = await fetch(
          `${apiUrl}/candidates`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const candidatesData = await candidatesRes.json();
        setCandidates(candidatesData.candidates || []);

        // Cargar evaluaciones
        const evalsRes = await fetch(
          `${apiUrl}/exams`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const evalsData = await evalsRes.json();
        setEvaluations(evalsData.exams || []);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSelectEval = (evalId) => {
    setSelectedEvals(prev =>
      prev.includes(evalId)
        ? prev.filter(id => id !== evalId)
        : [...prev, evalId]
    );
  };

  const handleAssignEvaluations = async () => {
    if (!selectedCandidate || selectedEvals.length === 0) {
      alert('Selecciona un candidato y al menos una evaluación');
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const response = await fetch(
        `${apiUrl}/assignments/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            candidateId: parseInt(selectedCandidate),
            vacancyId: null,
            evaluationIds: selectedEvals
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setGeneratedToken(data.accessToken);
        setSuccessMessage(
          `✅ ${selectedEvals.length} evaluaciones asignadas al candidato`
        );
        setSelectedCandidate('');
        setSelectedEvals([]);

        setTimeout(() => {
          setSuccessMessage(null);
          setGeneratedToken(null);
        }, 10000);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error asignando evaluaciones:', error);
      alert('Error al asignar evaluaciones');
    } finally {
      setAssigning(false);
    }
  };

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(generatedToken);
    alert('Token copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Asignar Evaluaciones
          </h1>
          <p className="text-gray-600">
            Asigna evaluaciones específicas a candidatos
          </p>
        </div>

        {/* Alert Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex gap-3">
          <FiAlertCircle className="text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">Sistema de Tokens</p>
            <p className="text-blue-800 text-sm">
              Cuando asignes evaluaciones, se generará un token único que el candidato usará para acceder solo a las evaluaciones asignadas. No podrá ver dificultad, ni ver los resultados.
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold mb-4">
                <FiCheck className="inline mr-2" />
                {successMessage}
              </p>

              {generatedToken && (
                <div className="bg-white p-4 rounded border border-green-300">
                  <p className="text-sm text-gray-600 mb-2">
                    Token de acceso para el candidato:
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-900 text-green-400 p-2 rounded font-mono text-sm break-all">
                      {generatedToken}
                    </code>
                    <button
                      onClick={copyTokenToClipboard}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      title="Copiar token"
                    >
                      <FiCopy size={20} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Envía este token al candidato para que acceda a sus evaluaciones.
                  </p>
                  <p className="text-xs text-gray-600">
                    URL: {process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3001'}/skills-assessments?token={generatedToken}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Select Candidate */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-2">
              Candidato *
            </label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Selecciona un candidato...</option>
              {candidates.map(candidate => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.first_name} {candidate.last_name} ({candidate.email})
                </option>
              ))}
            </select>
          </div>

          {/* Select Evaluations */}
          <div className="mb-8">
            <label className="block text-gray-800 font-semibold mb-4">
              Evaluaciones a Asignar *
            </label>
            <div className="space-y-3">
              {evaluations.length === 0 ? (
                <p className="text-gray-600">No hay evaluaciones disponibles</p>
              ) : (
                evaluations.map(evaluation => (
                  <div
                    key={evaluation.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <input
                      type="checkbox"
                      id={`eval-${evaluation.id}`}
                      checked={selectedEvals.includes(evaluation.id)}
                      onChange={() => handleSelectEval(evaluation.id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`eval-${evaluation.id}`}
                      className="ml-3 flex-1 cursor-pointer"
                    >
                      <p className="font-semibold text-gray-800">
                        {evaluation.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {evaluation.description}
                      </p>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedEvals.length > 0 && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-900 font-semibold">
                {selectedEvals.length} evaluación(es) seleccionada(s)
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleAssignEvaluations}
            disabled={assigning || !selectedCandidate || selectedEvals.length === 0}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {assigning ? 'Asignando...' : 'Asignar Evaluaciones'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAssignEvaluations;
