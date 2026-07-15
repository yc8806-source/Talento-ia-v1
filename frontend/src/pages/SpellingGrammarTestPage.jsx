import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

function SpellingGrammarTestPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const testId = searchParams.get('testId');

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://talento-ia-backend.onrender.com/api';

  useEffect(() => {
    if (!token || !testId) {
      setLoading(false);
      return;
    }

    const endpoint = window.location.hostname === 'localhost'
      ? `/spelling-grammar/tests/${testId}`
      : `/spelling-grammar/tests/${testId}/public`;

    fetch(`${API_URL}${endpoint}`)
      .then(res => res.json())
      .then(data => {
        setTest(data);
        if (data.questions) {
          setQuestions(data.questions);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando test:', err);
        setLoading(false);
      });
  }, [token, testId, API_URL]);

  // Timer
  useEffect(() => {
    if (!testStarted || timeLeft === null || testCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testStarted, testCompleted]);

  const handleStartTest = () => {
    setTestStarted(true);
    setStartedAt(new Date());
    setTimeLeft(test.duration_seconds || 1200); // 20 minutos
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0) {
      alert('Por favor responde al menos una pregunta antes de enviar');
      return;
    }

    setTestCompleted(true);

    try {
      const timeSeconds = Math.max(1, (test.duration_seconds || 1200) - (timeLeft || 0));

      const submitEndpoint = window.location.hostname === 'localhost'
        ? '/spelling-grammar/results/submit'
        : '/spelling-grammar/results/submit-public';

      const submitResponse = await fetch(`${API_URL}${submitEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          testId: testId,
          answers: answers,
          timeSeconds: timeSeconds,
          startedAt: startedAt,
        })
      });

      const data = await submitResponse.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error enviando resultado:', error);
      alert('Error al guardar el resultado');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando prueba de ortografía y gramática...</div>;
  }

  if (!test || questions.length === 0) {
    return <div className="p-8 text-center">Prueba no encontrada</div>;
  }

  if (testCompleted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-4xl font-bold text-center mb-8">🎉 ¡Prueba Completada!</h1>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-6">
                <p className="text-sm text-blue-600 font-semibold">Puntuación</p>
                <p className="text-4xl font-bold text-blue-900 mt-2">{result.score}%</p>
              </div>

              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-6">
                <p className="text-sm text-green-600 font-semibold">Respuestas Correctas</p>
                <p className="text-4xl font-bold text-green-900 mt-2">{result.correctAnswers}/{result.totalQuestions}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/evaluacion?token=${token}`)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-semibold"
            >
              Volver a Evaluaciones
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-4xl font-bold mb-4">{test.title}</h1>
            <p className="text-gray-600 mb-6">{test.description}</p>

            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h3 className="font-semibold mb-2">Información:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Total de preguntas: {questions.length}</li>
                <li>Tiempo disponible: {Math.floor((test.duration_seconds || 1200) / 60)} minutos</li>
                <li>Tipos: Selección múltiple, llenar espacios, identificar errores</li>
              </ul>
            </div>

            <button
              onClick={handleStartTest}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-lg font-bold text-lg"
            >
              Comenzar Prueba
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{test.title}</h2>
            <p className="text-gray-600">Pregunta {currentQuestion + 1} de {questions.length}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-red-600">{formatTime(timeLeft || 0)}</p>
            <p className="text-sm text-gray-600">Tiempo restante</p>
          </div>
        </div>

        {/* Pregunta */}
        <div className="bg-white p-8 border-l-4 border-blue-600">
          <h3 className="text-xl font-semibold mb-6">{currentQ.question_text}</h3>

          {/* Opciones según tipo */}
          <div className="space-y-4">
            {currentQ.question_type === 'multiple_choice' && currentQ.options && (
              <div className="space-y-3">
                {Object.entries(currentQ.options).map(([key, value]) => (
                  <label key={key} className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                    style={{ borderColor: answers[currentQ.id] === key ? '#3b82f6' : '#e5e7eb', backgroundColor: answers[currentQ.id] === key ? '#eff6ff' : 'white' }}>
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      value={key}
                      checked={answers[currentQ.id] === key}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      className="w-4 h-4 text-blue-600 mr-4"
                    />
                    <span className="text-lg">{key}. {value}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQ.question_type === 'fill_blank' && (
              <input
                type="text"
                placeholder="Escribe tu respuesta aquí..."
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              />
            )}

            {currentQ.question_type === 'identify_error' && (
              <input
                type="text"
                placeholder="Escribe la corrección..."
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              />
            )}
          </div>

          {currentQ.explanation && (
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800"><strong>Pista:</strong> {currentQ.explanation}</p>
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="bg-white rounded-b-2xl shadow-lg p-6 flex justify-between items-center gap-4">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
          >
            ← Anterior
          </button>

          <div className="flex gap-2 flex-wrap justify-center">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className="w-10 h-10 rounded-lg font-semibold transition"
                style={{
                  backgroundColor: idx === currentQuestion ? '#3b82f6' : answers[q.id] ? '#10b981' : '#e5e7eb',
                  color: idx === currentQuestion || answers[q.id] ? 'white' : 'black'
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestion === questions.length - 1}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
            >
              Siguiente →
            </button>
            {currentQuestion === questions.length - 1 && (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Enviar Prueba
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpellingGrammarTestPage;
