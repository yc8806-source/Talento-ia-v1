import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiRotateCcw, FiAward, FiTarget, FiZap } from 'react-icons/fi';

function TypingTest({ testId, testTitle, testText, durationSeconds, onComplete }) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState(null);
  const [startTime] = useState(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const startTest = () => {
    setIsRunning(true);
    setTimeRemaining(durationSeconds);
    setInputValue('');
    setResults(null);
  };

  const pauseTest = () => {
    setIsRunning(false);
  };

  const resetTest = () => {
    setIsRunning(false);
    setTimeRemaining(durationSeconds);
    setInputValue('');
    setResults(null);
  };

  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Cuando el tiempo se acaba, calcular resultados
  useEffect(() => {
    if (!isRunning && timeRemaining === 0 && inputValue.length > 0) {
      calculateResults();
    }
  }, [isRunning, timeRemaining]);

  const calculateResults = () => {
    const timeUsed = durationSeconds - timeRemaining;

    // WPM = (caracteres / 5) / (minutos)
    const charCount = inputValue.length;
    const minutes = timeUsed / 60;
    const grossWPM = (charCount / 5) / minutes;

    // Contar errores
    const textArray = testText.split('');
    const inputArray = inputValue.split('');
    let errors = 0;

    for (let i = 0; i < Math.max(textArray.length, inputArray.length); i++) {
      if (textArray[i] !== inputArray[i]) {
        errors++;
      }
    }

    const netWPM = Math.max(0, grossWPM - (errors / minutes));

    // Precisión
    const correctChars = charCount - errors;
    const accuracy = (correctChars / charCount) * 100;

    const result = {
      wpm: Math.round(netWPM * 100) / 100,
      grossWPM: Math.round(grossWPM * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      errors,
      timeUsed,
      charCount,
      correctChars,
    };

    setResults(result);

    if (onComplete) {
      onComplete(result);
    }
  };

  const handleInputChange = (e) => {
    if (isRunning) {
      setInputValue(e.target.value);
    }
  };

  const progress = ((durationSeconds - timeRemaining) / durationSeconds) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl">
      {/* Título */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{testTitle}</h2>
        <p className="text-gray-600">Velocidad de escritura - WPM (Palabras por Minuto)</p>
      </div>

      {/* Temporizador y progreso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold text-gray-700">Tiempo</span>
          <span className="text-3xl font-bold text-blue-600">{timeRemaining}s</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Texto a escribir */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
        <div className="text-lg leading-relaxed font-mono text-gray-800">
          {testText.split('').map((char, idx) => {
            let charClass = 'text-gray-700';
            if (idx < inputValue.length) {
              charClass =
                inputValue[idx] === char
                  ? 'text-green-600 font-semibold'
                  : 'text-red-600 font-semibold bg-red-100';
            }
            return (
              <span key={idx} className={charClass}>
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Área de input */}
      <div className="mb-6">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          disabled={!isRunning || timeRemaining === 0}
          className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50 resize-none font-mono"
          placeholder={isRunning ? 'Comienza a escribir aquí...' : 'Presiona "Iniciar" para comenzar'}
        />
      </div>

      {/* Controles */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={startTest}
          disabled={isRunning || timeRemaining === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
        >
          <FiPlay className="w-5 h-5" /> Iniciar
        </button>

        <button
          onClick={pauseTest}
          disabled={!isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
        >
          <FiPause className="w-5 h-5" /> Pausar
        </button>

        <button
          onClick={resetTest}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
        >
          <FiRotateCcw className="w-5 h-5" /> Reiniciar
        </button>
      </div>

      {/* Resultados */}
      {results && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-6">
            <FiAward className="w-6 h-6 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-900">¡Resultado!</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* WPM */}
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FiZap className="w-4 h-4" />
                <p className="text-sm font-semibold">WPM (Neto)</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{results.wpm}</p>
              <p className="text-xs text-gray-500">Palabras/Minuto</p>
            </div>

            {/* Gross WPM */}
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm font-semibold text-gray-600 mb-1">WPM (Bruto)</p>
              <p className="text-3xl font-bold text-blue-400">{results.grossWPM}</p>
              <p className="text-xs text-gray-500">Sin penalidad</p>
            </div>

            {/* Precisión */}
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FiTarget className="w-4 h-4" />
                <p className="text-sm font-semibold">Precisión</p>
              </div>
              <p className="text-3xl font-bold text-green-600">{results.accuracy}%</p>
              <p className="text-xs text-gray-500">{results.correctChars}/{results.charCount}</p>
            </div>

            {/* Errores */}
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm font-semibold text-gray-600 mb-1">Errores</p>
              <p className="text-3xl font-bold text-red-600">{results.errors}</p>
              <p className="text-xs text-gray-500">Caracteres incorrectos</p>
            </div>
          </div>

          {/* Interpretación de resultados */}
          <div className="mt-6 bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Interpretación:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                🚀 <strong>WPM:</strong> {results.wpm > 60 ? '¡Excelente!' : results.wpm > 40 ? 'Bueno' : 'Practica más'}
              </li>
              <li>
                🎯 <strong>Precisión:</strong> {results.accuracy > 95 ? '¡Muy preciso!' : results.accuracy > 90 ? 'Buena' : 'Hay errores'}
              </li>
              <li>
                📊 <strong>Rendimiento:</strong> {results.wpm > 60 && results.accuracy > 95 ? 'Nivel profesional' : 'Sigue mejorando'}
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Estadísticas en vivo */}
      {isRunning && (
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-600 text-sm">Caracteres</p>
            <p className="text-2xl font-bold text-gray-900">{inputValue.length}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Palabras</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((inputValue.length / 5) * (60 / (durationSeconds - timeRemaining)) * 100) / 100 || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">WPM (Estimado)</p>
            <p className="text-2xl font-bold text-blue-600">
              {durationSeconds - timeRemaining > 0
                ? Math.round(((inputValue.length / 5) / ((durationSeconds - timeRemaining) / 60)) * 100) / 100
                : 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TypingTest;
