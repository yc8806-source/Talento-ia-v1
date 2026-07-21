import React, { useState, useEffect } from 'react';
import { authAPI } from '../api/api';

export default function UserProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'analista'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await authAPI.register({
        ...newUser,
        first_name: newUser.firstName,
        last_name: newUser.lastName
      });

      setMessage(`✅ Usuario ${newUser.firstName} ${newUser.lastName} creado exitosamente como ${newUser.role}`);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'analista'
      });
      setShowCreateForm(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando perfil...</div>;
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Datos del Usuario Actual */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h2>Mi Perfil</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div>
            <p><strong>Nombre:</strong></p>
            <p>{currentUser.firstName || 'No disponible'} {currentUser.lastName || ''}</p>
          </div>
          <div>
            <p><strong>Email:</strong></p>
            <p>{currentUser.email || 'No disponible'}</p>
          </div>
          <div>
            <p><strong>Rol:</strong></p>
            <p style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: currentUser.role === 'admin' ? '#dc3545' : '#007bff',
              color: 'white'
            }}>
              {currentUser.role === 'admin' ? 'Administrador' : 'Analista'}
            </p>
          </div>
        </div>
      </div>

      {/* Sección para Crear Usuarios (Solo Admin) */}
      {currentUser.role === 'admin' && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Gestionar Usuarios</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1em'
              }}
            >
              {showCreateForm ? '✕ Cancelar' : '+ Crear Nuevo Usuario'}
            </button>
          </div>

          {message && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              borderRadius: '5px',
              backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
              color: message.includes('✅') ? '#155724' : '#721c24',
              border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {message}
            </div>
          )}

          {showCreateForm && (
            <form
              onSubmit={handleCreateUser}
              style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '500px'
              }}
            >
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Nombre
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={newUser.firstName}
                  onChange={handleInputChange}
                  placeholder="Nombre"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    fontSize: '1em'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Apellido
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={newUser.lastName}
                  onChange={handleInputChange}
                  placeholder="Apellido"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    fontSize: '1em'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  placeholder="correo@empresa.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    fontSize: '1em'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  placeholder="Contraseña segura"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    fontSize: '1em'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Rol
                </label>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    fontSize: '1em'
                  }}
                >
                  <option value="analista">Analista de RRHH</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1em',
                  fontWeight: 'bold',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
