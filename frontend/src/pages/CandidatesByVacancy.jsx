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
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCandidate, setShareCandidate] = useState(null);
  const [shareEvaluations, setShareEvaluations] = useState([]);

  const API_URL = typeof window !== 'undefined' && window.location.hostname === 'talento-ia-v1-frontend.onrender.com'
    ? 'https://talento-ia-backend.onrender.com/api'
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

      setInvitingToken(response.data.candidateVacancy.token);
    } catch (error) {
      alert('Error al invitar: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setSelectedCandidateId(null);
    setInvitingToken(null);
    fetchData();
  };

  const handleOpenShareModal = async (candidate) => {
    setShareCandidate(candidate);
    try {
      const response = await axios.get(`${API_URL}/evaluations/vacancy-by-token/${candidate.token}`);
      setShareEvaluations(response.data.exams || []);
    } catch (error) {
      console.error('Error al obtener evaluaciones:', error);
      setShareEvaluations([]);
    }
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setShareCandidate(null);
    setShareEvaluations([]);
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

  const handleDownloadPDF = async (candidateVacancyId) => {
    try {
      const response = await axios.get(`${API_URL}/evaluations/${candidateVacancyId}/pdf-download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resultados_${candidateVacancyId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert('Error al descargar PDF: ' + (error.response?.data?.error || error.message));
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {candidate.status === 'invited' && (
                        <>
                          <button
                            onClick={() => handleOpenShareModal(candidate)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#17a2b8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85em'
                            }}
                            title="Copiar y compartir URL"
                          >
                            🔗 URL
                          </button>
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
                        </>
                      )}
                      {candidate.status === 'completed' && (
                        <>
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
                          <button
                            onClick={() => handleDownloadPDF(candidate.candidateVacancyId)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85em'
                            }}
                          >
                            📄 PDF
                          </button>
                        </>
                      )}
                      {candidate.status === 'apto' && (
                        <>
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
                          <button
                            onClick={() => handleDownloadPDF(candidate.candidateVacancyId)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85em'
                            }}
                          >
                            📄 PDF
                          </button>
                        </>
                      )}
                      {candidate.status === 'rechazado' && (
                        <>
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
                          <button
                            onClick={() => handleDownloadPDF(candidate.candidateVacancyId)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85em'
                            }}
                          >
                            📄 PDF
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Compartir URL */}
      {showShareModal && shareCandidate && (
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
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderLeft: '4px solid #28a745'
          }}>
            <div style={{ padding: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>✅ {shareCandidate.firstName} {shareCandidate.lastName}</h2>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>{shareCandidate.email}</p>
                </div>
              </div>

              {/* Enlaces de Evaluación */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '0.95em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔗 <span>Enlaces de Evaluación:</span>
                </h3>
                {shareEvaluations.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {shareEvaluations.map((exam, idx) => (
                      <div key={idx} style={{
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        borderLeft: '3px solid #17a2b8'
                      }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: '#333', fontWeight: '500' }}>
                          {exam.name}
                        </p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.8em', color: '#666' }}>
                          {exam.description}
                        </p>
                        <code style={{
                          display: 'block',
                          padding: '8px',
                          backgroundColor: '#fff',
                          borderRadius: '3px',
                          fontSize: '0.8em',
                          fontFamily: 'monospace',
                          color: '#0066ff',
                          wordBreak: 'break-all',
                          marginBottom: '8px'
                        }}>
                          {`${window.location.origin}/evaluacion?token=${shareCandidate.token}`}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/evaluacion?token=${shareCandidate.token}`);
                            alert('Enlace copiado al portapapeles');
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#0066ff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.8em'
                          }}
                        >
                          📋 Copiar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '4px',
                    color: '#856404',
                    fontSize: '0.9em'
                  }}>
                    No hay evaluaciones asignadas aún. Usa el enlace de evaluación general:
                    <br />
                    <code style={{
                      display: 'block',
                      padding: '8px',
                      backgroundColor: '#fff',
                      borderRadius: '3px',
                      fontSize: '0.8em',
                      fontFamily: 'monospace',
                      color: '#0066ff',
                      marginTop: '8px',
                      wordBreak: 'break-all'
                    }}>
                      {`${window.location.origin}/evaluacion?token=${shareCandidate.token}`}
                    </code>
                  </div>
                )}
              </div>

              {/* Mensaje WhatsApp */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '0.95em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💬 <span>Mensaje de WhatsApp:</span>
                </h3>
                <div style={{
                  padding: '15px',
                  backgroundColor: '#e7f5e8',
                  borderRadius: '4px',
                  borderLeft: '3px solid #28a745',
                  fontSize: '0.9em',
                  color: '#333',
                  lineHeight: '1.6'
                }}>
                  <p style={{ margin: '0 0 10px 0' }}>¡Hola {shareCandidate.firstName}! 👋</p>
                  <p style={{ margin: '0 0 10px 0' }}>Te invitamos a participar en evaluaciones en IMPULSA TALENTO.</p>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Accede con este enlace:</p>
                  <p style={{ margin: '0 0 10px 0', padding: '10px', backgroundColor: '#fff', borderRadius: '3px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {`${window.location.origin}/evaluacion?token=${shareCandidate.token}`}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85em', color: '#666' }}>⏱️ Por favor, envía uno a la vez para evitar que WhatsApp bloquee el número por spam.</p>
                </div>
              </div>

              {/* Botón WhatsApp */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const message = `¡Hola ${shareCandidate.firstName}! 👋\n\nTe invitamos a participar en evaluaciones en IMPULSA TALENTO.\n\nAccede con este enlace:\n${window.location.origin}/evaluacion?token=${shareCandidate.token}\n\n⏱️ Por favor, envía uno a la vez para evitar que WhatsApp bloquee el número por spam.`;
                    const phone = shareCandidate.phone?.replace(/[^0-9]/g, '') || '';
                    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#25d366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.95em',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  📱 Enviar este candidato por WhatsApp
                </button>
                <button
                  onClick={handleCloseShareModal}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.95em'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Invitación - DEBUG */}
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
                  <button
                    onClick={() => {
                      const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://talento-ia-v1-frontend.onrender.com'}/evaluacion?token=${invitingToken}`;
                      navigator.clipboard.writeText(fullUrl);
                      alert('Enlace copiado al portapapeles');
                    }}
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#25d366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85em',
                      fontWeight: 'bold'
                    }}
                  >
                    📱 Copiar Enlace WhatsApp
                  </button>
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
