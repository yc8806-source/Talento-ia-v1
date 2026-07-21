import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../api/api';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentVacancies, setRecentVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    if (userRole === 'admin') {
      loadAdminMetrics();
    } else {
      loadMyMetrics();
    }
  }, [userRole]);

  const loadMyMetrics = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getMyMetrics();
      setMetrics(response.data.metrics);
      setRecentVacancies(response.data.recentVacancies || []);
      setError('');
    } catch (err) {
      console.error('Error cargando métricas:', err);
      setError('Error al cargar las métricas');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminMetrics = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getAllAnalystsMetrics();
      setMetrics(response.data.analysts || []);
      setError('');
    } catch (err) {
      console.error('Error cargando métricas de analistas:', err);
      setError('Error al cargar las métricas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando métricas...</div>;
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '5px'
      }}>
        {error}
      </div>
    );
  }

  // Dashboard del Analista
  if (userRole !== 'admin') {
    return (
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>📊 Mi Dashboard</h1>

        {/* Tarjetas de Métricas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {/* Vacantes Creadas */}
          <div style={{
            backgroundColor: '#e7f3ff',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: '4px solid #0066cc'
          }}>
            <p style={{ color: '#666', margin: '0 0 10px 0' }}>Vacantes Creadas</p>
            <h2 style={{ margin: 0, fontSize: '2.5em', color: '#0066cc' }}>
              {metrics?.vacanciesCreated || 0}
            </h2>
          </div>

          {/* Candidatos Asignados */}
          <div style={{
            backgroundColor: '#f0f8e7',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: '4px solid #28a745'
          }}>
            <p style={{ color: '#666', margin: '0 0 10px 0' }}>Candidatos Asignados</p>
            <h2 style={{ margin: 0, fontSize: '2.5em', color: '#28a745' }}>
              {metrics?.candidatesAssigned || 0}
            </h2>
          </div>

          {/* Pruebas Enviadas */}
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: '4px solid #ffc107'
          }}>
            <p style={{ color: '#666', margin: '0 0 10px 0' }}>Pruebas Enviadas</p>
            <h2 style={{ margin: 0, fontSize: '2.5em', color: '#ffc107' }}>
              {metrics?.evaluationsSent || 0}
            </h2>
          </div>

          {/* Pruebas Completadas */}
          <div style={{
            backgroundColor: '#f0e7ff',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: '4px solid #6f42c1'
          }}>
            <p style={{ color: '#666', margin: '0 0 10px 0' }}>Pruebas Completadas</p>
            <h2 style={{ margin: 0, fontSize: '2.5em', color: '#6f42c1' }}>
              {metrics?.evaluationsCompleted || 0}
            </h2>
          </div>

          {/* Tasa de Conversión */}
          <div style={{
            backgroundColor: '#ffe7f0',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: '4px solid #e83e8c',
            gridColumn: 'span 1'
          }}>
            <p style={{ color: '#666', margin: '0 0 10px 0' }}>Tasa de Conversión</p>
            <h2 style={{ margin: 0, fontSize: '2.5em', color: '#e83e8c' }}>
              {metrics?.conversionRate || '0%'}
            </h2>
          </div>

          {/* Estado de Vacantes */}
          <div style={{
            backgroundColor: '#e7f5ff',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: '4px solid #17a2b8'
          }}>
            <p style={{ color: '#666', margin: '0 0 10px 0' }}>Estado de Vacantes</p>
            <div style={{ fontSize: '0.9em' }}>
              <p style={{ margin: '5px 0' }}>
                🔓 <strong>Abiertas:</strong> {metrics?.vacancyStatus?.open || 0}
              </p>
              <p style={{ margin: '5px 0' }}>
                🔒 <strong>Cerradas:</strong> {metrics?.vacancyStatus?.closed || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Vacantes Recientes */}
        {recentVacancies.length > 0 && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h3>📋 Vacantes Recientes</h3>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Vacante</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Creada</th>
                </tr>
              </thead>
              <tbody>
                {recentVacancies.map(vacancy => (
                  <tr key={vacancy.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{vacancy.title}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: vacancy.status === 'open' ? '#d4edda' : '#f8d7da',
                        color: vacancy.status === 'open' ? '#155724' : '#721c24',
                        fontSize: '0.85em'
                      }}>
                        {vacancy.status === 'open' ? 'Abierta' : 'Cerrada'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '0.9em', color: '#666' }}>
                      {new Date(vacancy.createdAt).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Dashboard Admin - Tabla de Analistas
  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>📊 Dashboard de Analistas</h1>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '800px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Analista</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Vacantes</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Candidatos</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Pruebas Enviadas</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Completadas</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Conversión</th>
            </tr>
          </thead>
          <tbody>
            {metrics && metrics.map((analyst, idx) => (
              <tr
                key={analyst.id}
                style={{
                  backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                  borderBottom: '1px solid #ddd'
                }}
              >
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{analyst.name}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.9em', color: '#666' }}>
                  {analyst.email}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    backgroundColor: '#e7f3ff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    color: '#0066cc'
                  }}>
                    {analyst.vacanciesCreated}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    backgroundColor: '#f0f8e7',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    color: '#28a745'
                  }}>
                    {analyst.candidatesAssigned}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    backgroundColor: '#fff3cd',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    color: '#856404'
                  }}>
                    {analyst.evaluationsSent}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    backgroundColor: '#f0e7ff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    color: '#6f42c1'
                  }}>
                    {analyst.evaluationsCompleted}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    backgroundColor: analyst.conversionRate > '50%' ? '#d4edda' : '#fff3cd',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    color: analyst.conversionRate > '50%' ? '#155724' : '#856404'
                  }}>
                    {analyst.conversionRate}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
