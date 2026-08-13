import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionAPI, examAPI, authAPI, userAPI } from '../api/api';
import { FiArrowRight, FiTrash2, FiPlus } from 'react-icons/fi';

function Admin() {
  const [activeTab, setActiveTab] = useState('questions');
  const [questionForm, setQuestionForm] = useState({
    title: '',
    type: 'multiple_choice',
    competencyId: 1,
    options: [{ text: '', score: 0 }],
  });
  const [examForm, setExamForm] = useState({
    name: '',
    description: '',
    maxTimeMinutes: 30,
    minScore: 60,
  });
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Cargar usuarios cuando se monta el componente
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setUserLoading(true);
      const response = await userAPI.getAll();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setMessage('❌ Error al cargar usuarios');
    } finally {
      setUserLoading(false);
    }
  };

  const handleAddOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { text: '', score: 0 }],
    });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index][field] = field === 'score' ? parseInt(value) : value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const handleRemoveOption = (index) => {
    setQuestionForm({
      ...questionForm,
      options: questionForm.options.filter((_, i) => i !== index),
    });
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await questionAPI.create(questionForm);
      alert('Pregunta creada exitosamente');
      setQuestionForm({
        title: '',
        type: 'multiple_choice',
        competencyId: 1,
        options: [{ text: '', score: 0 }],
      });
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await examAPI.create({ ...examForm, createdBy: 1, questionIds: [] });
      alert('Examen creado exitosamente');
      setExamForm({
        name: '',
        description: '',
        maxTimeMinutes: 30,
        minScore: 60,
      });
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.password) {
      setMessage('❌ Todos los campos son requeridos');
      return;
    }

    if (userForm.password !== userForm.confirmPassword) {
      setMessage('❌ Las contraseñas no coinciden');
      return;
    }

    if (userForm.password.length < 6) {
      setMessage('❌ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await authAPI.register({
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        password: userForm.password,
        role: 'rrhh'
      });

      setMessage('✅ Usuario RRHH creado exitosamente');
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      // Recargar la lista de usuarios
      setTimeout(() => {
        loadUsers();
        setMessage('');
      }, 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Error al crear el usuario';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        setLoading(true);
        await userAPI.delete(userId);
        setMessage('✅ Usuario eliminado exitosamente');
        await loadUsers();
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setMessage(`❌ ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-1">Gestiona preguntas, exámenes y usuarios</p>
        </div>
        <Link
          to="/admin/exams"
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
        >
          Gestionar Exámenes
          <FiArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'questions'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Preguntas
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'exams'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Exámenes
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'users'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👤 Gestión de Usuarios
        </button>
      </div>

      {/* Crear Preguntas */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📝 Crear Nueva Pregunta
          </h2>

          <form onSubmit={handleCreateQuestion} className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Texto de la Pregunta
              </label>
              <input
                type="text"
                value={questionForm.title}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="¿Cuál es tu pregunta?"
                required
              />
            </div>

            {/* Tipo de Pregunta */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Tipo
              </label>
              <select
                value={questionForm.type}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="multiple_choice">Opción Múltiple</option>
                <option value="true_false">Verdadero/Falso</option>
                <option value="likert">Escala Likert (1-5)</option>
              </select>
            </div>

            {/* Competencia */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Competencia
              </label>
              <select
                value={questionForm.competencyId}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    competencyId: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value={1}>Comunicación</option>
                <option value={2}>Persuasión</option>
                <option value={3}>Negociación</option>
                <option value={10}>Empatía</option>
              </select>
            </div>

            {/* Opciones */}
            <div>
              <label className="block text-gray-700 font-medium mb-4">
                Opciones de Respuesta
              </label>
              <div className="space-y-4">
                {questionForm.options.map((option, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-end p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) =>
                          handleOptionChange(idx, 'text', e.target.value)
                        }
                        placeholder="Texto de la opción"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        value={option.score}
                        onChange={(e) =>
                          handleOptionChange(idx, 'score', e.target.value)
                        }
                        placeholder="Pts"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                        min="0"
                      />
                    </div>
                    {questionForm.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-4 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
              >
                + Agregar Opción
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium"
            >
              {loading ? 'Creando...' : 'Crear Pregunta'}
            </button>
          </form>
        </div>
      )}

      {/* Crear Exámenes */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📋 Crear Nuevo Examen
          </h2>

          <form onSubmit={handleCreateExam} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Nombre del Examen
              </label>
              <input
                type="text"
                value={examForm.name}
                onChange={(e) =>
                  setExamForm({ ...examForm, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Ej: Prueba Psicométrica"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Descripción
              </label>
              <textarea
                value={examForm.description}
                onChange={(e) =>
                  setExamForm({ ...examForm, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Descripción del examen"
                rows="4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Tiempo Máximo (minutos)
                </label>
                <input
                  type="number"
                  value={examForm.maxTimeMinutes}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      maxTimeMinutes: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Puntaje Mínimo
                </label>
                <input
                  type="number"
                  value={examForm.minScore}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      minScore: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium"
            >
              {loading ? 'Creando...' : 'Crear Examen'}
            </button>
          </form>
        </div>
      )}

      {/* Gestión de Usuarios */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Crear Usuario */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              👤 Crear Usuario RRHH
            </h2>

            {message && (
              <div className={`p-3 rounded-lg text-center font-semibold mb-4 ${
                message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                    placeholder="Juan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                  <input
                    type="text"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                    placeholder="Pérez"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar Contraseña</label>
                  <input
                    type="password"
                    value={userForm.confirmPassword}
                    onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {loading ? '⏳ Creando...' : '✅ Crear Usuario RRHH'}
              </button>
            </form>
          </div>

          {/* Lista de Usuarios */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📋 Usuarios del Sistema
            </h2>

            {userLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-gray-600">Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No hay usuarios registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rol</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha Registro</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.firstName} {user.lastName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? 'Administrador' : 'RRHH'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={loading}
                              className="text-red-600 hover:bg-red-50 p-2 rounded transition disabled:opacity-50"
                              title="Eliminar usuario"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
