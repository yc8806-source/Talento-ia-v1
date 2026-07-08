import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Vacantes() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    status: 'open'
  });
  const navigate = useNavigate();

  // Cargar vacantes
  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      const response = await axios.get('/api/vacancies');
      setVacancies(response.data || []);
    } catch (error) {
      console.error('Error cargando vacantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/vacancies', formData);
      setFormData({ title: '', description: '', department: '', status: 'open' });
      setShowForm(false);
      fetchVacancies();
    } catch (error) {
      alert('Error al crear vacante: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando vacantes...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Vacantes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Cancelar' : '+ Nueva Vacante'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '5px',
            marginBottom: '20px'
          }}
        >
          <input
            type="text"
            name="title"
            placeholder="Título de la vacante"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <textarea
            name="description"
            placeholder="Descripción"
            value={formData.description}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '100px' }}
          />
          <input
            type="text"
            name="department"
            placeholder="Departamento"
            value={formData.department}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          >
            <option value="open">Abierta</option>
            <option value="closed">Cerrada</option>
          </select>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Crear Vacante
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {vacancies.length === 0 ? (
          <p>No hay vacantes registradas</p>
        ) : (
          vacancies.map(vacancy => (
            <div
              key={vacancy.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '5px',
                padding: '15px',
                backgroundColor: '#fff'
              }}
            >
              <h3>{vacancy.title}</h3>
              <p><strong>Departamento:</strong> {vacancy.department}</p>
              <p><strong>Estado:</strong> <span style={{ color: vacancy.status === 'open' ? 'green' : 'red' }}>{vacancy.status === 'open' ? 'Abierta' : 'Cerrada'}</span></p>
              <p>{vacancy.description}</p>
              <button
                onClick={() => navigate(`/evaluaciones`)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Asignar Evaluación
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
