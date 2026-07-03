import React, { useState, useEffect } from 'react';
import { FiClock, FiTarget, FiBook, FiArrowRight } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { skillsAssessmentAPI } from '../api/api';

const SkillsAssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [hasToken, setHasToken] = useState(false);
  const [nextEvaluation, setNextEvaluation] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleStartAssessment = (assessmentId) => {
    if (token) {
      navigate(`/exams/${assessmentId}?token=${token}`);
    } else {
      navigate(`/exams/${assessmentId}`);
    }
  };

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        if (token) {
          // Modo asignación: obtener siguiente evaluación
          setHasToken(true);
          const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
          const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
          const response = await fetch(
            `${apiUrl}/assignments/next?token=${token}`
          );
          const data = await response.json();

          if (data.evaluationId) {
            setNextEvaluation(data);
            setAssessments([{
              id: data.evaluationId,
              title: `${data.evaluation.name} (${data.evaluationNumber} de ${data.totalEvaluations})`,
              description: data.evaluation.description || 'Evaluación asignada',
              estimatedTime: data.evaluation.max_time_minutes || 30,
              difficulty: 'medium',
              skillType: 'general',
              totalPoints: 100,
              passingScore: 60,
              isAssigned: true
            }]);
          } else {
            setAssessments([]);
          }
        } else {
          // Modo libre: mostrar todas las evaluaciones
          setHasToken(false);
          const difficulty = selectedDifficulty !== 'all' ? selectedDifficulty : undefined;
          const response = await skillsAssessmentAPI.getAllAssessments(undefined, difficulty);
          setAssessments(response.data.assessments || []);
        }
      } catch (error) {
        console.error('Error cargando evaluaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [selectedDifficulty, token]);

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      hard: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[difficulty] || colors.medium;
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      easy: 'Fácil',
      medium: 'Medio',
      hard: 'Difícil',
    };
    return labels[difficulty] || difficulty;
  };

  const skillTypeLabels = {
    logic: 'Lógica',
    programming: 'Programación',
    'problem-solving': 'Resolución de Problemas',
    'data-structures': 'Estructuras de Datos',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando evaluaciones...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {token ? 'Tus Evaluaciones Asignadas' : 'Evaluaciones de Habilidades'}
          </h1>
          <p className="text-gray-600">
            {token
              ? 'Completa las evaluaciones que te han sido asignadas'
              : 'Demuestra tus habilidades técnicas y resuelve problemas desafiantes'
            }
          </p>
        </div>

        {/* Filtros - Solo mostrar si no hay token */}
        {!token && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por Dificultad</h2>
            <div className="flex gap-4">
              {['all', 'easy', 'medium', 'hard'].map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedDifficulty(level)}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    selectedDifficulty === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {level === 'all' ? 'Todas' : getDifficultyLabel(level)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid de Evaluaciones */}
        {assessments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">
              {token
                ? 'No hay más evaluaciones pendientes. ¡Todas completadas!'
                : 'No hay evaluaciones disponibles en este nivel'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map(assessment => (
              <div
                key={assessment.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex-1">
                      {assessment.title}
                    </h3>
                    {!token && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(
                          assessment.difficulty
                        )}`}
                      >
                        {getDifficultyLabel(assessment.difficulty)}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{assessment.description}</p>

                  {/* Tipo de Habilidad - Solo mostrar si no es asignado */}
                  {!assessment.isAssigned && (
                    <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs font-semibold mb-4">
                      {skillTypeLabels[assessment.skillType] || assessment.skillType}
                    </div>
                  )}

                  {/* Estadísticas */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FiClock size={18} className="text-blue-600" />
                      <span className="text-sm">
                        Tiempo estimado: {assessment.estimatedTime} minutos
                      </span>
                    </div>
                    {!assessment.isAssigned && (
                      <>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FiTarget size={18} className="text-green-600" />
                          <span className="text-sm">
                            Total de puntos: {assessment.totalPoints}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FiBook size={18} className="text-purple-600" />
                          <span className="text-sm">
                            Puntuación mínima: {assessment.passingScore}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Botón de Inicio */}
                  <button
                    onClick={() => handleStartAssessment(assessment.id)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Comenzar Evaluación
                    <FiArrowRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estadísticas - Solo mostrar si no hay token */}
        {!token && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tipos de Evaluaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { type: 'Lógica', icon: '🧠', count: 1 },
                { type: 'Programación', icon: '💻', count: 1 },
                { type: 'Resolución de Problemas', icon: '🎯', count: 1 },
                { type: 'Estructuras de Datos', icon: '📊', count: 1 },
              ].map((item, idx) => (
                <div key={idx} className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg text-center">
                  <div className="text-4xl mb-2">{item.icon}</div>
                  <p className="font-semibold text-gray-800">{item.type}</p>
                  <p className="text-sm text-gray-600">{item.count} evaluación</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsAssessmentsPage;
