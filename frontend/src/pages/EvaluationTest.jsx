import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { evaluationAPI, examAPI } from '../api/api';

function EvaluationTest() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get('examId');

  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [evaluationId, setEvaluationId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    if (!token || !examId) {
      setLoading(false);
      return;
    }

    fetchExamData();
  }, [token, examId]);

  const fetchExamData = async () => {
    try {
      const API_URL = typeof window !== 'undefined' && window.location.hostname === 'talento-ia-v1-frontend.onrender.com'
        ? 'https://talento-ia-v1-production.up.railway.app/api'
        : 'http://localhost:3000/api';

      const response = await examAPI.getExamById(examId);

      if (response.data) {
        const examData = {
          id: response.data.id,
          name: response.data.name,
          maxTimeMinutes: response.data.maxTimeMinutes || 60,
          questions: response.data.questions || []
        };

        setExam(examData);
        setTimeLeft(examData.maxTimeMinutes * 60);
      }
    } catch (error) {
      console.error('Error cargando examen:', error);
      alert('Error al cargar el examen');
      navigate(`/evaluacion?token=${token}`);
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (timeLeft === null || completed) return;

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
  }, [timeLeft, completed]);

  const handleSelectAnswer = (optionId) => {
    setSelectedAnswer(optionId);
  };

  const handleNext = () => {
    if (selectedAnswer === null) {
      alert('Por favor selecciona una respuesta');
      return;
    }

    setAnswers({ ...answers, [currentQuestionIndex]: selectedAnswer });

    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setCompleted(true);

      // Preparar respuestas para enviar
      const answersToSend = {};
      Object.entries(answers).forEach(([indexStr, optionId]) => {
        const index = parseInt(indexStr, 10);
        const question = exam.questions[index];
        answersToSend[index] = {
          id: question.id,
          questionId: question.id,
          optionId: optionId,
          selected: optionId,
          timeSpent: exam.maxTimeMinutes * 60 - (timeLeft || 0)
        };
      });

      // Enviar respuestas al backend
      const API_URL = typeof window !== 'undefined' && window.location.hostname === 'talento-ia-v1-frontend.onrender.com'
        ? 'https://talento-ia-v1-production.up.railway.app/api'
        : 'http://localhost:3000/api';

      await axios.post(`${API_URL}/evaluations/${token}/exam-answers`, {
        examId: parseInt(examId, 10),
        answers: answersToSend
      });

      alert(
        'Evaluación completada. Tu evaluación ha sido registrada y será revisada por nuestro equipo.'
      );
    } catch (error) {
      console.error('Error enviando respuestas:', error);
      alert('Error al guardar evaluación: ' + (error.response?.data?.error || error.message));
      setCompleted(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-700">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <p className="text-gray-700 mb-4">Link de evaluación no encontrado</p>
          <p className="text-gray-600 text-sm">
            Asegúrate de usar el enlace correcto proporcionado por RR.HH
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Evaluación Completada!
          </h1>
          <p className="text-gray-600 mb-6">
            Gracias por completar la evaluación. Tu respuesta ha sido registrada.
          </p>
          <p className="text-gray-600 text-sm">
            Nuestro equipo de RR.HH te contactará en los próximos 5 días hábiles.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {exam.name}
            </h1>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">
                Pregunta {currentQuestionIndex + 1} de {exam.questions.length}
              </span>
              <span className="text-lg font-bold text-blue-600">
                ⏱️ {formatTime(timeLeft)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Pregunta */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.title}
            </h2>

            {/* Opciones */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedAnswer === option.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option.id}
                    checked={selectedAnswer === option.id}
                    onChange={() => handleSelectAnswer(option.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-700">{option.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-between gap-4">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                  setSelectedAnswer(
                    answers[currentQuestionIndex - 1] || null
                  );
                }
              }}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-2 rounded-lg font-medium ${
                currentQuestionIndex === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Anterior
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              {currentQuestionIndex === exam.questions.length - 1
                ? 'Finalizar'
                : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EvaluationTest;
