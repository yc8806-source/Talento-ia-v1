import React, { useState, useEffect } from 'react';
import { examAPI, questionAPI } from '../api/api';
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX, FiChevronDown } from 'react-icons/fi';

function AdminExams() {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddQuestionsModal, setShowAddQuestionsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    maxTimeMinutes: 30,
    minScore: 60,
  });
  const [expandedExam, setExpandedExam] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsRes, questionsRes] = await Promise.all([
        examAPI.getAll(),
        questionAPI.getAll(),
      ]);
      setExams(examsRes.data.exams || []);
      setQuestions(questionsRes.data.questions || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (exam) => {
    setSelectedExam(exam);
    setEditForm({
      name: exam.name,
      description: exam.description,
      maxTimeMinutes: exam.maxTimeMinutes,
      minScore: exam.minScore,
    });
    setShowEditModal(true);
  };

  const handleSaveExam = async () => {
    try {
      await examAPI.update(selectedExam.id, editForm);
      alert('Examen actualizado exitosamente');
      setShowEditModal(false);
      loadData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este examen?')) {
      try {
        await examAPI.delete(examId);
        alert('Examen eliminado exitosamente');
        loadData();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleAddQuestions = async () => {
    if (selectedQuestions.length === 0) {
      alert('Selecciona al menos una pregunta');
      return;
    }
    try {
      await examAPI.addQuestions(selectedExam.id, {
        questionIds: selectedQuestions,
      });
      alert('Preguntas agregadas exitosamente');
      setShowAddQuestionsModal(false);
      setSelectedQuestions([]);
      loadData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRemoveQuestion = async (examId, questionId) => {
    if (window.confirm('¿Remover esta pregunta del examen?')) {
      try {
        await examAPI.removeQuestion(examId, questionId);
        loadData();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4">Cargando exámenes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Gestionar Exámenes</h1>
        <p className="text-gray-600 mt-1">Edita, elimina y agrega preguntas a exámenes</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg">No hay exámenes creados aún</p>
          <p className="text-gray-500 text-sm mt-1">Crea uno desde el panel de Admin</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header del examen */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)}
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{exam.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{exam.description}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-blue-600 font-semibold">
                      ⏱️ {exam.maxTimeMinutes} min
                    </span>
                    <span className="text-green-600 font-semibold">
                      ✓ {exam.totalQuestions} preguntas
                    </span>
                    <span className="text-purple-600 font-semibold">
                      📊 Mín. {exam.minScore}%
                    </span>
                  </div>
                </div>
                <FiChevronDown
                  className={`w-6 h-6 text-gray-400 transition-transform ${
                    expandedExam === exam.id ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Contenido expandido */}
              {expandedExam === exam.id && (
                <div className="border-t border-gray-200 p-6 space-y-4">
                  {/* Lista de preguntas */}
                  {exam.questions && exam.questions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Preguntas del Examen:</h4>
                      <div className="space-y-2">
                        {exam.questions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {idx + 1}. {q.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Tipo: {q.type === 'multiple_choice' ? 'Opción Múltiple' : q.type === 'true_false' ? 'Verdadero/Falso' : 'Likert'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveQuestion(exam.id, q.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remover pregunta"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedExam(exam);
                        setShowAddQuestionsModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <FiPlus className="w-5 h-5" />
                      Agregar Preguntas
                    </button>
                    <button
                      onClick={() => handleEditClick(exam)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <FiEdit2 className="w-5 h-5" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Editar Examen</h2>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Descripción</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Tiempo (min)</label>
                <input
                  type="number"
                  value={editForm.maxTimeMinutes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, maxTimeMinutes: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Puntaje Mín</label>
                <input
                  type="number"
                  value={editForm.minScore}
                  onChange={(e) => setEditForm({ ...editForm, minScore: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveExam}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Preguntas */}
      {showAddQuestionsModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Agregar Preguntas a: {selectedExam.name}
            </h2>

            <div className="space-y-2">
              {questions.map((q) => (
                <label
                  key={q.id}
                  className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(q.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuestions([...selectedQuestions, q.id]);
                      } else {
                        setSelectedQuestions(
                          selectedQuestions.filter((id) => id !== q.id)
                        );
                      }
                    }}
                    className="w-5 h-5 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{q.title}</p>
                    <p className="text-xs text-gray-600">
                      Tipo: {q.type} | Competencia: {q.competencyId}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAddQuestionsModal(false);
                  setSelectedQuestions([]);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddQuestions}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5" />
                Agregar ({selectedQuestions.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminExams;
