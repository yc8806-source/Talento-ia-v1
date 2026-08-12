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

  const renderTypingResults = (data) => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '6px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066ff' }}>
            {Math.round(data.wpm || 0)}
          </div>
          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Palabras/Minuto (WPM)</div>
        </div>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '6px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066ff' }}>
            {parseFloat(data.accuracy || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Precisión</div>
        </div>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
            {data.netWPM || 0}
          </div>
          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Net WPM</div>
        </div>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#ffebee', borderRadius: '6px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
            {data.totalErrors || 0}
          </div>
          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Errores</div>
        </div>
      </div>
    );
  };

  const renderSpellingResults = (data) => {
    const accuracy = parseFloat(data.accuracy || 0);
    const getScoreColor = (pct) => {
      if (pct >= 80) return '#28a745';
      if (pct >= 60) return '#ffc107';
      return '#dc3545';
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '6px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(accuracy) }}>
            {data.correctAnswers || 0}/{data.totalQuestions || 0}
          </div>
          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Respuestas Correctas</div>
        </div>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '6px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(accuracy) }}>
            {accuracy.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Precisión</div>
        </div>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '6px', gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {Math.round(data.score || 0)} pts
          </div>
          <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>Puntuación Total</div>
        </div>
      </div>
    );
  };

  const renderEvaluationResults = (data) => {
    const competencies = Object.entries(data).map(([name, values]) => ({
      name,
      percentage: parseFloat(values.percentage || 0),
      score: values.score,
      maxScore: values.maxScore
    }));

    const getScoreColor = (pct) => {
      if (pct >= 80) return '#28a745';
      if (pct >= 60) return '#ffc107';
      return '#dc3545';
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {competencies.map((comp, idx) => (
          <div key={idx} style={{
            textAlign: 'center',
            padding: '15px',
            backgroundColor: '#f9f9f9',
            borderRadius: '6px',
            border: `2px solid ${getScoreColor(comp.percentage)}`
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
              {comp.name}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: getScoreColor(comp.percentage) }}>
              {comp.percentage.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '8px' }}>
              {comp.score}/{comp.maxScore} puntos
            </div>
          </div>
        ))}
      </div>
    );
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
        maxWidth: '900px',
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

        {/* Results by Type */}
        {results.evaluationResults.map((evalResult, idx) => (
          <div key={idx} style={{
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#0066ff', fontSize: '18px' }}>
                {evalResult.name}
              </h3>
              {evalResult.description && (
                <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9em' }}>
                  {evalResult.description}
                </p>
              )}
              {evalResult.completedAt && (
                <p style={{ margin: '5px 0', color: '#999', fontSize: '0.85em' }}>
                  Completado: {new Date(evalResult.completedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>

            {/* Render based on type */}
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '6px' }}>
              {evalResult.type === 'typing' && renderTypingResults(evalResult.data)}
              {evalResult.type === 'spelling' && renderSpellingResults(evalResult.data)}
              {evalResult.type === 'evaluation' && renderEvaluationResults(evalResult.data)}
            </div>
          </div>
        ))}

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
