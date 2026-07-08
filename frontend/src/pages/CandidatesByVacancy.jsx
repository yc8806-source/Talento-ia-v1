import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CandidatesByVacancy() {
  const { vacancyId } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = typeof window !== 'undefined' && window.location.hostname === 'talento-ia-v1-frontend.onrender.com'
    ? 'https://talento-ia-v1-production.up.railway.app/api'
    : 'http://localhost:3000/api';

  useEffect(() => {
    fetchData();
  }, [vacancyId]);

  const fetchData = async () => {
    try {
      const [vacancyRes, candidatesRes] = await Promise.all([
        axios.get(`${API_URL}/vacancies/${vacancyId}`),
        axios.get(`${API_URL}/candidates/vacancy/${vacancyId}`)
      ]);
      setVacancy(vacancyRes.data);
      setCandidates(candidatesRes.data.candidates);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkStatus = async (candidateVacancyId, newStatus) => {
    try {
      await axios.post(`${API_URL}/candidates/mark-status`, {
        candidateVacancyId,
        status: newStatus
      });
      fetchData();
      alert(`Candidato marcado como ${newStatus}`);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!vacancy) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Vacante no encontrada</div>;
  }

  const aptos = candidates.filter(c => c.status === 'apto').length;
  const rechazados = candidates.filter(c => c.status === 'rechazado').length;
  const invitados = candidates.filter(c => c.status === 'invited').length;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => navigate('/vacantes')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          ← Volver a Vacantes
        </button>

        <h1>{vacancy.title}</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          {vacancy.description}
        </p>

        <div style={{
          backgroundColor: '#f0f4ff',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '15px'
        }}>
          <div>
            <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>Posiciones</p>
            <p style={{ margin: '5px 0', fontSize: '1.3em', fontWeight: 'bold', color: '#0066ff' }}>
              {vacancy.filledPositions}/{vacancy.availablePositions}
            </p>
          </div>
          <div>
            <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>Aptos ✅</p>
            <p style={{ margin: '5px 0', fontSize: '1.3em', fontWeight: 'bold', color: '#28a745' }}>
              {aptos}
            </p>
          </div>
          <div>
            <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>Invitados ⏳</p>
            <p style={{ margin: '5px 0', fontSize: '1.3em', fontWeight: 'bold', color: '#ffc107' }}>
              {invitados}
            </p>
          </div>
          <div>
            <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>Rechazados ❌</p>
            <p style={{ margin: '5px 0', fontSize: '1.3em', fontWeight: 'bold', color: '#dc3545' }}>
              {rechazados}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Candidatos */}
      <h2>Candidatos Invitados</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '20px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nombre</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Teléfono</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  Sin candidatos aún
                </td>
              </tr>
            ) : (
              candidates.map(candidate => (
                <tr key={candidate.candidateVacancyId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{candidate.firstName} {candidate.lastName}</strong>
                  </td>
                  <td style={{ padding: '12px' }}>{candidate.email}</td>
                  <td style={{ padding: '12px' }}>{candidate.phone || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85em',
                      fontWeight: 'bold',
                      backgroundColor: candidate.status === 'apto' ? '#d4edda' :
                        candidate.status === 'rechazado' ? '#f8d7da' : '#fff3cd',
                      color: candidate.status === 'apto' ? '#155724' :
                        candidate.status === 'rechazado' ? '#721c24' : '#856404'
                    }}>
                      {candidate.status === 'apto' ? '✅ Apto' :
                       candidate.status === 'rechazado' ? '❌ Rechazado' : '⏳ Invitado'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {candidate.status === 'invited' && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleMarkStatus(candidate.candidateVacancyId, 'apto')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85em'
                          }}
                        >
                          ✅ Apto
                        </button>
                        <button
                          onClick={() => handleMarkStatus(candidate.candidateVacancyId, 'rechazado')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85em'
                          }}
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    )}
                    {candidate.status === 'apto' && (
                      <button
                        onClick={() => handleMarkStatus(candidate.candidateVacancyId, 'invited')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffc107',
                          color: '#333',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85em'
                        }}
                      >
                        Desmarcar
                      </button>
                    )}
                    {candidate.status === 'rechazado' && (
                      <button
                        onClick={() => handleMarkStatus(candidate.candidateVacancyId, 'invited')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffc107',
                          color: '#333',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85em'
                        }}
                      >
                        Reconsiderar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
