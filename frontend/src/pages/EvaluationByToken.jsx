import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EvaluationByToken() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }

    fetchVacancyData();
  }, [token]);

  const fetchVacancyData = async () => {
    try {
      // Determinar la URL base del API
      const API_URL = typeof window !== 'undefined' && window.location.hostname === 'talento-ia-v1-frontend.onrender.com'
        ? 'https://talento-ia-v1-production.up.railway.app/api'
        : 'http://localhost:3000/api';

      const response = await axios.get(`${API_URL}/evaluations/vacancy-by-token/${token}`);
      setData(response.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Error al cargar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Error</h1>
        <p>No se proporcionó un token válido</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Cargando...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Error</h1>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Sin datos</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Información del Candidato */}
      <div style={{
        backgroundColor: '#f0f4ff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #0066ff'
      }}>
        <h1 style={{ margin: '0 0 15px 0', color: '#0066ff' }}>
          {data.candidateVacancy.vacancyTitle}
        </h1>
        <p style={{ margin: '5px 0' }}>
          <strong>Candidato:</strong> {data.candidateVacancy.candidateName}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Email:</strong> {data.candidateVacancy.candidateEmail}
        </p>
        <p style={{ margin: '5px 0', color: '#666' }}>
          {data.candidateVacancy.vacancyDescription}
        </p>
      </div>

      {/* Exámenes Disponibles */}
      <div>
        <h2>Exámenes a Realizar</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Se han asignado {data.exams.length} examen(es) para esta vacante.
        </p>

        <div style={{
          display: 'grid',
          gap: '15px',
          marginBottom: '30px'
        }}>
          {data.exams.map((exam, index) => (
            <div
              key={exam.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>
                    Examen {index + 1}: {exam.name}
                  </h3>
                  {exam.description && (
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                      {exam.description}
                    </p>
                  )}
                  <p style={{ margin: '5px 0', color: '#999', fontSize: '0.85em' }}>
                    ⏱️ Tiempo: {exam.maxTimeMinutes} minutos
                  </p>
                </div>
                <button
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    whiteSpace: 'nowrap',
                    marginLeft: '20px'
                  }}
                >
                  Iniciar
                </button>
              </div>
            </div>
          ))}
        </div>

        <p style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '5px',
          borderLeft: '4px solid #ffc107',
          color: '#856404'
        }}>
          <strong>Importante:</strong> Por favor completa todos los exámenes en una sola sesión.
          Asegúrate de tener una conexión estable a internet.
        </p>
      </div>
    </div>
  );
}
