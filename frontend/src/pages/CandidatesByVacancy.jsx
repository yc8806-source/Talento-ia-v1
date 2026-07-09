import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CandidatesByVacancy() {
  const { vacancyId } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [invitingToken, setInvitingToken] = useState(null);

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

  const loadAvailableCandidates = async () => {
    try {
      const res = await axios.get(`${API_URL}/candidates`);
      const invitedIds = candidates.map(c => c.candidateId);
      const candidatesList = res.data.candidates || res.data;
      // Filtrar candidatos que NO estén invitados a esta vacante (comparar por id)
      const available = candidatesList.filter(c => !invitedIds.includes(c.id));
      setAvailableCandidates(available);
      setSelectedCandidateId(null);  // Resetear selección
      setInvitingToken(null);  // Resetear token
      setShowInviteModal(true);
    } catch (error) {
      alert('Error al cargar candidatos: ' + error.message);
    }
  };

  const handleInviteCandidate = async () => {
    if (!selectedCandidateId) {
      alert('Selecciona un candidato');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/candidates/invite`, {
        candidateId: parseInt(selectedCandidateId, 10),
        vacancyId: parseInt(vacancyId, 10)
      });

      console.log('📢 Respuesta completa:', response.data);
      console.log('📢 candidateVacancy:', response.data.candidateVacancy);
      console.log('📢 token:', response.data.candidateVacancy?.token);

      setInvitingToken(response.data.candidateVacancy.token);
      console.log('📢 setInvitingToken ejecutado con:', response.data.candidateVacancy.token);
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      alert('Error al invitar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setSelectedCandidateId(null);
    setInvitingToken(null);
    fetchData();
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Candidatos Invitados</h2>
        <button
          onClick={loadAvailableCandidates}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.95em'
          }}
        >
          + Invitar Candidato
        </button>
      </div>
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

      {/* Modal de Invitación */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            {!invitingToken ? (
              <>
                <h2 style={{ marginTop: 0 }}>Invitar Candidato</h2>
                <p style={{ color: '#666' }}>Selecciona un candidato para invitarlo a esta vacante</p>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Candidatos Disponibles:
                  </label>
                  <select
                    value={selectedCandidateId || ''}
                    onChange={(e) => setSelectedCandidateId(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '0.95em'
                    }}
                  >
                    <option value="">-- Selecciona un candidato --</option>
                    {availableCandidates.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleInviteCandidate}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.95em'
                    }}
                  >
                    Invitar
                  </button>
                  <button
                    onClick={handleCloseInviteModal}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.95em'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: 0, color: '#28a745' }}>✅ Candidato Invitado</h2>
                <p style={{ color: '#666' }}>
                  El candidato ha sido invitado. Aquí está el enlace para que acceda a los exámenes:
                </p>

                <div style={{
                  backgroundColor: '#f0f4ff',
                  padding: '15px',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  wordBreak: 'break-all'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.85em', color: '#666' }}>Token:</p>
                  <code style={{
                    display: 'block',
                    padding: '10px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    fontFamily: 'monospace',
                    marginBottom: '10px'
                  }}>
                    {invitingToken}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(invitingToken);
                      alert('Token copiado al portapapeles');
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#0066ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85em'
                    }}
                  >
                    📋 Copiar Token
                  </button>
                </div>

                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  fontSize: '0.9em',
                  color: '#856404'
                }}>
                  <strong>💡 Instrucciones:</strong> Envía este enlace al candidato via WhatsApp:
                  <br />
                  <code style={{ display: 'block', marginTop: '8px', wordBreak: 'break-all' }}>
                    {typeof window !== 'undefined' ? window.location.origin : 'https://talento-ia-v1-frontend.onrender.com'}/evaluacion?token={invitingToken}
                  </code>
                </div>

                <button
                  onClick={handleCloseInviteModal}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.95em'
                  }}
                >
                  Listo
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
