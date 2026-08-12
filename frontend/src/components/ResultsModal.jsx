import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ResultsModal({ candidateId, onClose }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [candidateId]);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = 'https://talento-ia-backend.onrender.com/api';
      const response = await axios.get(
        `${apiUrl}/assignments/results/${candidateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          Cargando resultados...
        </div>
      </div>
    );
  }

  if (!results || results.evaluationResults.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <p>No hay resultados disponibles</p>
          <button onClick={onClose} style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: 'auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: 0, color: '#333' }}>Resultados de Evaluación</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>
            {results.candidateName} ({results.email})
          </p>
        </div>

        {/* Results Summary */}
        {results.evaluationResults.map((evalResult, idx) => {
          const percentage = evalResult.percentage ? parseFloat(evalResult.percentage) : 0;
          const getScoreColor = (pct) => {
            if (pct >= 80) return '#28a745'; // Verde
            if (pct >= 60) return '#ffc107'; // Amarillo
            return '#dc3545'; // Rojo
          };

          return (
            <div key={idx} style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#0066ff' }}>
                {evalResult.evaluation?.name || 'Examen'}
              </h3>
              <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                {evalResult.evaluation?.description || ''}
              </p>

              {/* Score Display */}
              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '4px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: getScoreColor(percentage) }}>
                    {evalResult.answersSubmitted}/{evalResult.totalQuestions}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>Respuestas Correctas</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: getScoreColor(percentage) }}>
                    {typeof percentage === 'number' ? percentage.toFixed(1) : '0'}%
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>Puntuación</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0066ff' }}>
                    ✅
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>Completado</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Close Button */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={onClose} style={{
            padding: '10px 30px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1em'
          }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
