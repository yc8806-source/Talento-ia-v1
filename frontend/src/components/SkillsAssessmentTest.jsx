import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FiPlay, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';
import { skillsAssessmentAPI } from '../api/api';

const SkillsAssessmentTest = ({ onComplete }) => {
  const { assessmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [assessment, setAssessment] = useState(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await skillsAssessmentAPI.getAssessment(assessmentId);
        const data = response.data || response;
        setAssessment(data);
        if (data.problems?.[0]) {
          setCode(data.problems[0].starterCode || '');
        }
        setStartTime(Date.now());
        setLoading(false);
      } catch (error) {
        console.error('Error cargando evaluación:', error);
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  // Timer para contar tiempo
  useEffect(() => {
    if (!startTime || assessmentComplete) return;

    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, assessmentComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando evaluación...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Error al cargar la evaluación</div>
      </div>
    );
  }

  const currentProblem = assessment.problems[currentProblemIndex];
  const problemsSolved = Object.values(results).filter(r => r.isCorrect).length;

  const handleSubmitSolution = async () => {
    if (!output.trim()) {
      alert('Por favor ingresa un output para validar');
      return;
    }

    setSubmitting(true);

    try {
      const response = await skillsAssessmentAPI.submitSolution(
        assessmentId,
        currentProblem.id,
        code,
        output
      );

      const data = response.data || response;

      setResults(prev => ({
        ...prev,
        [currentProblem.id]: data.result
      }));

      if (data.result.isCorrect) {
        setTotalPoints(prev => prev + currentProblem.points);
      }

      alert(data.message);
    } catch (error) {
      console.error('Error guardando solución:', error);
      alert('Error al guardar la solución');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteAssessment = async () => {
    const timeSeconds = timeElapsed;

    try {
      const response = await skillsAssessmentAPI.completeAssessment(
        assessmentId,
        assessment.total_points,
        totalPoints,
        problemsSolved,
        assessment.totalProblems,
        timeSeconds,
        new Date(startTime)
      );

      const data = response.data || response;

      setAssessmentComplete(true);
      setFinalScore(data.result.score);

      // Si hay token, marcar como completada en el sistema de asignaciones
      if (token) {
        try {
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
          await fetch(`${apiUrl}/assignments/mark-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
        } catch (error) {
          console.error('Error marcando evaluación en sistema de asignaciones:', error);
        }
      }

      if (onComplete) {
        onComplete(data.result);
      }
    } catch (error) {
      console.error('Error completando evaluación:', error);
      alert('Error al completar la evaluación');
    }
  };

  const goToPrevious = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
      setCode(assessment.problems[currentProblemIndex - 1].starterCode || '');
      setOutput('');
    }
  };

  const goToNext = () => {
    if (currentProblemIndex < assessment.problems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      setCode(assessment.problems[currentProblemIndex + 1].starterCode || '');
      setOutput('');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${secs}s`;
  };

  if (assessmentComplete) {
    // Si hay token (evaluación asignada), ocultar resultados
    if (token) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center border-t-4 border-green-500">
              <h2 className="text-4xl font-bold mb-4 text-green-600">✓ Evaluación Completada</h2>

              <div className="mb-8">
                <p className="text-lg text-gray-700">
                  Gracias por completar esta evaluación.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <p className="text-gray-700">
                  El equipo de RRHH revisará tus respuestas y se pondrá en contacto contigo pronto.
                </p>
              </div>

              <button
                onClick={() => window.location.href = '/candidate-dashboard'}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Sin token: mostrar resultados completos (para vista de administrador/prueba local)
    const passedAssessment = finalScore >= assessment.passing_score;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className={`bg-white rounded-lg shadow-lg p-8 text-center ${passedAssessment ? 'border-t-4 border-green-500' : 'border-t-4 border-red-500'}`}>
            <h2 className="text-3xl font-bold mb-4">
              {passedAssessment ? '🎉 ¡Evaluación Aprobada!' : '❌ Evaluación No Aprobada'}
            </h2>

            <div className="mb-8">
              <div className="text-6xl font-bold text-blue-600 mb-2">{finalScore}%</div>
              <p className="text-gray-600">Puntuación Total</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-2xl font-bold text-blue-600">{problemsSolved}</div>
                <p className="text-gray-600">Resolvidas</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
                <p className="text-gray-600">Puntos Ganados</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-2xl font-bold text-purple-600">{formatTime(timeElapsed)}</div>
                <p className="text-gray-600">Tiempo Total</p>
              </div>
            </div>

            {!passedAssessment && (
              <p className="text-gray-600 mb-6">
                Necesitabas {assessment.passing_score}% para aprobar. ¡Intenta de nuevo!
              </p>
            )}

            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Volver a Evaluaciones
            </button>
          </div>
        </div>
      </div>
    );
  }

  const problemResult = results[currentProblem.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{assessment.title}</h1>
              <p className="text-gray-600">{assessment.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <FiClock size={24} />
                  {formatTime(timeElapsed)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
                <p className="text-gray-600">Puntos</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{
                width: `${((currentProblemIndex + 1) / assessment.totalProblems) * 100}%`
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Problema {currentProblemIndex + 1} de {assessment.totalProblems}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Problem Panel */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentProblem.title}</h2>
              <p className="text-gray-600 mb-4">{currentProblem.description}</p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="font-semibold text-gray-800">Salida Esperada:</p>
                <p className="text-blue-900 font-mono">{currentProblem.expectedOutput}</p>
              </div>

              {currentProblem.testCases && currentProblem.testCases.length > 0 && (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold text-gray-800 mb-2">Test Cases:</p>
                  <div className="space-y-2">
                    {currentProblem.testCases.map((tc, idx) => (
                      <div key={idx} className="text-sm text-gray-600">
                        <p>Entrada: {tc.input || '(vacío)'}</p>
                        <p>Salida esperada: {tc.expectedOutput}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2 mt-auto">
              <button
                onClick={goToPrevious}
                disabled={currentProblemIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FiChevronLeft /> Anterior
              </button>
              <button
                onClick={goToNext}
                disabled={currentProblemIndex === assessment.problems.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Siguiente <FiChevronRight />
              </button>
            </div>
          </div>

          {/* Code Panel */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Tu Código
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-40 bg-gray-900 text-green-400 font-mono text-sm p-3 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                placeholder="Escribe tu código aquí..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Output (Resultado)
              </label>
              <textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="w-full h-24 bg-gray-50 text-gray-800 font-mono text-sm p-3 rounded border border-gray-300 focus:outline-none focus:border-blue-500"
                placeholder="Paste el resultado de ejecutar tu código..."
              />
            </div>

            {problemResult && (
              <div className={`mb-4 p-4 rounded ${problemResult.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {problemResult.isCorrect ? (
                    <>
                      <FiCheck className="text-green-600" size={20} />
                      <p className="font-semibold text-green-800">¡Solución Correcta!</p>
                    </>
                  ) : (
                    <>
                      <FiX className="text-red-600" size={20} />
                      <p className="font-semibold text-red-800">Solución Incorrecta</p>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-700">{problemResult.feedback}</p>
              </div>
            )}

            <div className="flex gap-2 mt-auto">
              <button
                onClick={handleSubmitSolution}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FiPlay size={20} />
                {submitting ? 'Validando...' : 'Validar Solución'}
              </button>

              {currentProblemIndex === assessment.problems.length - 1 && (
                <button
                  onClick={handleCompleteAssessment}
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
                >
                  Completar Evaluación
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsAssessmentTest;
