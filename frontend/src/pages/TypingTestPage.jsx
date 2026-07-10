import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://talento-ia-backend.onrender.com/api';

function TypingTestPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typingTestId = searchParams.get('typingTestId');

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [startedAt, setStartedAt] = useState(null);

  useEffect(() => {
    if (!token || !typingTestId) {
      setLoading(false);
      return;
    }
    fetchTestData();
  }, [token, typingTestId]);

  const fetchTestData = async () => {
    try {
      const testIdNum = parseInt(typingTestId, 10);
      const response = await axios.get(`${API_URL}/typing/tests/${testIdNum}`);
      setTest(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando typing test:', error);
      alert('Error al cargar el test de tipeo');
      navigate(`/evaluacion?token=${token}`);
    }
  };

  // Timer que comienza cuando inicia el test
  useEffect(() => {
    if (!testStarted || timeLeft === null || testCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
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
    // No iniciar timer aquí - esperamos a que escriba la 1ª letra
    setTimeLeft(null);
  };

  const handleInputChange = (e) => {
    const newText = e.target.value;
    setInputText(newText);
    // Iniciar timer solo cuando escribe la 1ª letra
    if (newText.length === 1 && timeLeft === null) {
      setTimeLeft(test.durationSeconds);
    }
  };

  const handleSubmit = async () => {
    if (!testStarted || inputText.trim().length === 0) {
      alert('Por favor escribe algo antes de enviar');
      return;
    }

    setTestCompleted(true);

    try {
      const timeSeconds = Math.max(1, test.durationSeconds - timeLeft);

      const submitResponse = await axios.post(`${API_URL}/typing/results/submit`, {
        typingTestId: test.id,
        inputText: inputText,
        timeSeconds: timeSeconds,
        startedAt: startedAt,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      setResult(submitResponse.data.result);
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
    return <div className="p-8 text-center">Cargando prueba de tipeo...</div>;
  }

  if (!test) {
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
                <p className="text-sm text-blue-600 font-semibold">Palabras por Minuto</p>
                <p className="text-4xl font-bold text-blue-900 mt-2">{result.wpm}</p>
              </div>

              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-6">
                <p className="text-sm text-green-600 font-semibold">Precisión</p>
                <p className="text-4xl font-bold text-green-900 mt-2">{result.accuracy}%</p>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-6">
                <p className="text-sm text-purple-600 font-semibold">WPM Bruto</p>
                <p className="text-4xl font-bold text-purple-900 mt-2">{result.grossWPM}</p>
              </div>

              <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-lg p-6">
                <p className="text-sm text-red-600 font-semibold">Errores</p>
                <p className="text-4xl font-bold text-red-900 mt-2">{result.totalErrors}</p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-lg mb-3">Análisis Detallado:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Caracteres escritos: {result.charCount}</li>
                <li>✓ Caracteres correctos: {result.correctChars}</li>
                <li>✓ Caracteres erróneos: {result.charErrors}</li>
                <li>✓ Palabras en el texto: {result.wordCount}</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/evaluacion?token=${token}`)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Volver a Evaluaciones
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">⌨️ {test.title}</h1>
            {testStarted && timeLeft !== null && (
              <div className={`text-3xl font-bold ${timeLeft < 10 ? 'text-red-600' : 'text-blue-600'}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {!testStarted ? (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="font-bold text-lg mb-3">Instrucciones:</h2>
                <ol className="space-y-2 text-gray-700 list-decimal list-inside">
                  <li>Lee cuidadosamente el texto que aparecerá</li>
                  <li>Haz clic en "Comenzar Prueba" cuando estés listo</li>
                  <li>Tienes {test.durationSeconds} segundos para transcribir el texto</li>
                  <li>Tu velocidad (WPM) y precisión serán calculados automáticamente</li>
                  <li>Los errores se penalizarán en el cálculo final de WPM</li>
                </ol>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <p className="font-bold text-green-900">📊 Criterios de Evaluación:</p>
                <p className="text-green-800 mt-2">
                  Se evaluará tu velocidad de mecanografía (palabras por minuto) y precisión.
                  Intenta mantener un buen balance entre velocidad y exactitud.
                </p>
              </div>

              <button
                onClick={handleStartTest}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-lg font-bold text-lg transition-all"
              >
                🚀 Comenzar Prueba
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-300">
                <p className="text-sm text-gray-600 font-semibold mb-3">TEXTO A TRANSCRIBIR:</p>
                <p className="text-xl text-gray-900 leading-relaxed font-serif">
                  {test.text}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-semibold mb-3">TU RESPUESTA:</p>
                <textarea
                  value={inputText}
                  onChange={handleInputChange}
                  disabled={testCompleted}
                  placeholder="Empieza a escribir aquí..."
                  className="w-full h-40 p-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono text-lg"
                  autoFocus
                />
              </div>

              {!testCompleted && (
                <button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-lg font-bold text-lg transition-all"
                >
                  ✅ Enviar Prueba
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TypingTestPage;
