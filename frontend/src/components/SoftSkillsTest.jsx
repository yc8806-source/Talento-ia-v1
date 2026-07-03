import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiClock, FiCheck } from 'react-icons/fi';

const SoftSkillsTest = ({ onComplete }) => {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testComplete, setTestComplete] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
        const response = await fetch(`${apiUrl}/exams/${examId}`);
        const data = await response.json();
        setExam(data);
        setQuestions(data.questions || []);
        setStartTime(Date.now());
        setLoading(false);
      } catch (error) {
        console.error('Error cargando examen:', error);
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  // Timer
  useEffect(() => {
    if (!startTime || testComplete) return;

    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, testComplete]);

  const handleAnswerSelect = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  const handleCompleteTest = async () => {
    const timeSeconds = timeElapsed;

    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

      // Guardar respuestas
      for (const question of questions) {
        const answer = answers[question.id];
        if (answer) {
          await fetch(`${apiUrl}/soft-skills/${examId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId: question.id,
              answerValue: answer,
              competencyId: question.competencyId,
              timeSeconds
            })
          });
        }
      }

      // Calcular resultados por competencia
      const competencies = {};
      questions.forEach(q => {
        if (!competencies[q.competencyId]) {
          competencies[q.competencyId] = { scores: [], name: q.competencyName };
        }
        if (answers[q.id]) {
          competencies[q.competencyId].scores.push(answers[q.id]);
        }
      });

      const competencyResults = Object.entries(competencies).map(([id, data]) => {
        const avg = data.scores.length > 0
          ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 20)
          : 0;
        return {
          competencyId: parseInt(id),
          competencyName: data.name,
          averageScore: avg,
          responses: data.scores.length
        };
      });

      const overallScore = Math.round(
        competencyResults.reduce((sum, c) => sum + c.averageScore, 0) / competencyResults.length
      );

      const resultData = {
        overallScore,
        competencyResults,
        totalQuestions: questions.length,
        answeredQuestions: Object.keys(answers).length,
        timeSeconds
      };

      setResults(resultData);
      setTestComplete(true);

      // Si hay token, marcar como completada
      if (token) {
        try {
          const completeBody = { token };
          await fetch(`${apiUrl}/assignments/mark-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(completeBody)
          });
        } catch (error) {
          console.error('Error marcando en assignments:', error);
        }
      }

      if (onComplete) {
        onComplete(resultData);
      }
    } catch (error) {
      console.error('Error completando test:', error);
      alert('Error al guardar respuestas');
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const competencyNames = {
    1: 'Comunicación',
    2: 'Liderazgo',
    3: 'Trabajo en Equipo',
    4: 'Resolución de Problemas',
    5: 'Adaptabilidad',
    6: 'Empatía',
    7: 'Gestión del Tiempo',
    8: 'Proactividad',
    9: 'Integridad',
    10: 'Creatividad'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando evaluación...</div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Error al cargar la evaluación</div>
      </div>
    );
  }

  // Resultados - Si token, ocultar; si no, mostrar
  if (testComplete) {
    if (token) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center border-t-4 border-green-500">
              <h2 className="text-4xl font-bold mb-4 text-green-600">✓ Evaluación Completada</h2>

              <div className="mb-8">
                <p className="text-lg text-gray-700">
                  Gracias por completar esta evaluación de competencias blandas.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <p className="text-gray-700">
                  El equipo de RRHH revisará tus respuestas y se pondrá en contacto contigo pronto con feedback personalizado sobre tus competencias.
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

    // Sin token: mostrar resultados completos
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-4xl font-bold mb-2 text-center text-blue-600">
              Resultados - Evaluación de Competencias Blandas
            </h2>

            {/* Score General */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-8 mb-8 text-center">
              <div className="text-6xl font-bold mb-2">{results.overallScore}%</div>
              <p className="text-lg">Puntuación General</p>
              <p className="text-sm opacity-90">
                {results.answeredQuestions} de {results.totalQuestions} preguntas respondidas
              </p>
            </div>

            {/* Resultados por Competencia */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Resultados por Competencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.competencyResults.map((comp, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-gray-800">{comp.competencyName}</h4>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {comp.averageScore}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${comp.averageScore}%` }}
                      ></div>
                    </div>

                    <p className="text-sm text-gray-600">
                      {comp.responses} preguntas respondidas
                    </p>

                    {/* Interpretación */}
                    <p className="text-xs text-gray-500 mt-2">
                      {comp.averageScore >= 80 && '✅ Excelente'}
                      {comp.averageScore >= 60 && comp.averageScore < 80 && '👍 Bueno'}
                      {comp.averageScore >= 40 && comp.averageScore < 60 && '⚠️ Área de mejora'}
                      {comp.averageScore < 40 && '🎯 Desarrollo necesario'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiempo */}
            <div className="text-center text-gray-600 text-sm">
              <p>Tiempo total: {formatTime(results.timeSeconds)}</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test en Progreso
  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const compName = competencyNames[currentQuestion.competencyId] || 'Competencia';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{exam.name}</h1>
              <p className="text-gray-600 text-sm">{compName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <FiClock size={20} />
                  {formatTime(timeElapsed)}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </p>
        </div>

        {/* Pregunta */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {currentQuestion.title}
          </h2>

          {/* Likert Scale */}
          <div className="mb-8">
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  onClick={() => handleAnswerSelect(currentQuestion.id, value)}
                  className={`py-4 px-3 rounded-lg font-bold transition transform hover:scale-105 ${
                    answers[currentQuestion.id] === value
                      ? 'bg-blue-600 text-white ring-2 ring-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs mt-1">
                    {value === 1 && 'Muy en\nDesacuerdo'}
                    {value === 2 && 'En\nDesacuerdo'}
                    {value === 3 && 'Neutral'}
                    {value === 4 && 'De\nAcuerdo'}
                    {value === 5 && 'Muy de\nAcuerdo'}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-4">
              <span>Muy en Desacuerdo</span>
              <span>Muy de Acuerdo</span>
            </div>
          </div>

          {/* Navegación */}
          <div className="flex gap-2">
            <button
              onClick={goToPrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FiChevronLeft /> Anterior
            </button>

            <button
              onClick={goToNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Siguiente <FiChevronRight />
            </button>

            {currentQuestionIndex === questions.length - 1 && (
              <button
                onClick={handleCompleteTest}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
              >
                <FiCheck size={20} />
                Completar Evaluación
              </button>
            )}
          </div>
        </div>

        {/* Indicador de respuesta */}
        {isAnswered && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold">✓ Pregunta respondida</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoftSkillsTest;
