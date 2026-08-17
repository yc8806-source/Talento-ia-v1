import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import SpellingGrammarTest from '../components/SpellingGrammarTest';
import axios from 'axios';

function SpellingGrammarTestPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const testId = searchParams.get('testId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);

  useEffect(() => {
    if (!token || !testId) {
      setError('Parámetros inválidos');
      setLoading(false);
      return;
    }

    verifyAndLoadTest();
  }, [token, testId]);

  const verifyAndLoadTest = async () => {
    try {
      const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : 'https://talento-ia-backend.onrender.com/api';

      // Verificar que el candidato tiene acceso a esta prueba
      const statusResponse = await axios.get(`${API_URL}/evaluations/vacancy-by-token/${token}`);
      const examStatus = statusResponse.data.exams.find(e => e.id === parseInt(testId, 10));

      if (!examStatus) {
        throw new Error('Prueba no asignada');
      }

      if (examStatus.completed) {
        setError('Esta prueba ya ha sido completada');
        setLoading(false);
        return;
      }

      setExam(examStatus);
      setLoading(false);
    } catch (err) {
      console.error('Error verificando prueba:', err);
      setError(err.response?.data?.error || 'Error al cargar la prueba');
      setLoading(false);
    }
  };

  const handleComplete = (result) => {
    navigate(`/evaluacion?token=${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-700">Cargando prueba...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/evaluacion?token=${token}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <p className="text-gray-700 mb-4">Prueba no encontrada</p>
          <button
            onClick={() => navigate(`/evaluacion?token=${token}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <SpellingGrammarTest
          testId={parseInt(testId, 10)}
          testTitle={exam.name}
          testType="spelling"
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}

export default SpellingGrammarTestPage;
