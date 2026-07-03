import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiChevronRight, FiChevronLeft, FiRotateCcw } from 'react-icons/fi';

function SpellingGrammarTest({ testId, testTitle, testType, onComplete }) {
  const [test, setTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadTest();
  }, [testId]);

  const loadTest = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/spelling-grammar/tests/${testId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTest(data);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando test:', error);
    }
  };

  const handleAnswerChange = (value) => {
    setAnswers({
      ...answers,
      [test.questions[currentQuestion].id]: value
    });
  };

  const handleNext = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const timeSeconds = Math.floor((Date.now() - startTime) / 1000);

      // Crear objeto de respuestas con IDs de preguntas
      const answersData = {};
      test.questions.forEach(q => {
        answersData[q.id] = answers[q.id] || '';
      });

      const response = await fetch('http://localhost:3000/api/spelling-grammar/results/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          testId,
          answers: answersData,
          timeSeconds,
          startedAt: new Date(startTime).toISOString()
        })
      });

      const data = await response.json();
      setResults(data.result);
      setShowResults(true);

      if (onComplete) {
        onComplete(data.result);
      }
    } catch (error) {
      console.error('Error enviando respuestas:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando test...</div>;
  }

  if (!test) {
    return <div className="text-center py-12 text-red-600">Error cargando el test</div>;
  }

  const question = test.questions[currentQuestion];
  const isAnswered = answers[question.id] !== undefined && answers[question.id] !== '';
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;

  if (showResults && results) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Prueba Completada!</h2>
          <p className="text-gray-600">Ortografía y Gramática</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Puntuación</p>
            <p className="text-4xl font-bold text-blue-600">{results.score}%</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Correctas</p>
            <p className="text-4xl font-bold text-green-600">
              {results.correctAnswers}/{results.totalQuestions}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Precisión</p>
            <p className="text-4xl font-bold text-purple-600">{results.accuracy}%</p>
          </div>
        </div>

        {/* Detalle de respuestas */}
        <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
          {results.detailedResults.map((detail, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-l-4 ${
                detail.isCorrect
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-start gap-3">
                {detail.isCorrect ? (
                  <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                ) : (
                  <FiX className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">
                    Pregunta {idx + 1}
                  </p>
                  {!detail.isCorrect && (
                    <div className="text-sm space-y-1">
                      <p className="text-gray-600">
                        <strong>Tu respuesta:</strong> {detail.userAnswer || '(sin respuesta)'}
                      </p>
                      <p className="text-green-700">
                        <strong>Respuesta correcta:</strong> {detail.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
      {/* Título */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{testTitle}</h2>
        <p className="text-gray-600">Tipo: {testType === 'spelling' ? 'Ortografía' : 'Gramática'}</p>
      </div>

      {/* Progreso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">
            Pregunta {currentQuestion + 1} de {test.questions.length}
          </span>
          <span className="text-sm font-semibold text-gray-700">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Pregunta */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
        <p className="text-lg font-semibold text-gray-900 mb-4">{question.text}</p>

        {/* Opciones según tipo de pregunta */}
        {question.options ? (
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <label key={idx} className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-3 text-gray-800">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className="w-full h-24 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
          />
        )}

        {question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-sm text-blue-700">
            <strong>Explicación:</strong> {question.explanation}
          </div>
        )}
      </div>

      {/* Controles de navegación */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
        >
          <FiChevronLeft className="w-5 h-5" /> Anterior
        </button>

        {currentQuestion < test.questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Siguiente <FiChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="ml-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            Enviar y Ver Resultados
          </button>
        )}
      </div>

      {/* Indicador de respuesta */}
      <div className="flex items-center justify-center gap-2 text-sm">
        {isAnswered ? (
          <>
            <FiCheck className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Pregunta respondida</span>
          </>
        ) : (
          <>
            <FiX className="w-4 h-4 text-red-600" />
            <span className="text-red-600">No respondida</span>
          </>
        )}
      </div>
    </div>
  );
}

export default SpellingGrammarTest;
