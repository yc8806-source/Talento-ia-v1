import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vacancyAPI, examAPI } from '../api/api';

export default function AssignEvaluationsToVacancy() {
  const { vacancyId } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExams, setSelectedExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener información de la vacante
        const vacancyRes = await vacancyAPI.getById(vacancyId);
        setVacancy(vacancyRes.data);

        // Obtener exámenes disponibles
        const examsRes = await examAPI.getAll();
        setExams(examsRes.data || []);
      } catch (error) {
        console.error('Error cargando datos:', error);
        alert('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vacancyId]);

  const handleToggleExam = (examId) => {
    if (selectedExams.includes(examId)) {
      setSelectedExams(selectedExams.filter(id => id !== examId));
    } else {
      setSelectedExams([...selectedExams, examId]);
    }
  };

  const handleAssign = async () => {
    if (selectedExams.length === 0) {
      alert('Por favor selecciona al menos un examen');
      return;
    }

    try {
      await vacancyAPI.assignExams(vacancyId, { examIds: selectedExams });
      alert('Evaluaciones asignadas correctamente');
      navigate('/vacantes');
    } catch (error) {
      alert('Error al asignar evaluaciones: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Asignar Evaluaciones a Vacante</h1>

      {vacancy && (
        <div style={{
          backgroundColor: '#f0f4ff',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #0066ff'
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#0066ff' }}>{vacancy.title}</h2>
          <p style={{ margin: '5px 0' }}><strong>Departamento:</strong> {vacancy.department}</p>
          <p style={{ margin: '5px 0' }}><strong>Estado:</strong> {vacancy.status === 'open' ? 'Abierta' : 'Cerrada'}</p>
          <p style={{ margin: '5px 0' }}><strong>Descripción:</strong> {vacancy.description}</p>
        </div>
      )}

      <h3>Selecciona los Exámenes a Asignar</h3>
      <div style={{
        display: 'grid',
        gap: '10px',
        marginBottom: '30px',
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #ddd',
        padding: '15px',
        borderRadius: '8px'
      }}>
        {exams.length === 0 ? (
          <p>No hay exámenes disponibles</p>
        ) : (
          exams.map(exam => (
            <label key={exam.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: selectedExams.includes(exam.id) ? '#e6f2ff' : '#fff',
              borderRadius: '5px',
              border: '1px solid #ddd',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={selectedExams.includes(exam.id)}
                onChange={() => handleToggleExam(exam.id)}
                style={{ marginRight: '10px', cursor: 'pointer' }}
              />
              <div>
                <strong>{exam.name || `Examen ${exam.id}`}</strong>
                {exam.description && <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9em' }}>{exam.description}</p>}
              </div>
            </label>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleAssign}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: 'bold'
          }}
        >
          Asignar Exámenes
        </button>
        <button
          onClick={() => navigate('/vacantes')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1em'
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
