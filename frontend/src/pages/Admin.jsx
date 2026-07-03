import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { questionAPI, examAPI } from '../api/api';
import { FiArrowRight } from 'react-icons/fi';

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
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-1">Crea preguntas y exámenes para evaluaciones</p>
        </div>
        <Link
          to="/admin/exams"
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
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
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Crear Preguntas
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'exams'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Crear Exámenes
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                + Agregar Opción
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
            >
              {loading ? 'Creando...' : 'Crear Examen'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Admin;
