import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiDownload } from 'react-icons/fi';

function Reports() {
  const [competencyData, setCompetencyData] = useState([]);
  const [operationData, setOperationData] = useState([]);
  const [vacancyData, setVacancyData] = useState([]);
  const [candidateData, setCandidateData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('competencies');

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const [compRes, opsRes, vacRes, candRes] = await Promise.all([
        fetch('http://localhost:3000/api/reports/competencies').then(r => r.json()),
        fetch('http://localhost:3000/api/reports/operations').then(r => r.json()),
        fetch('http://localhost:3000/api/reports/vacancies').then(r => r.json()),
        fetch('http://localhost:3000/api/reports/candidates').then(r => r.json()),
      ]);

      setCompetencyData(compRes.competencies || []);
      setOperationData(opsRes.operations || []);
      setVacancyData(vacRes.vacancies || []);
      setCandidateData(candRes.candidates || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    window.open('http://localhost:3000/api/reports/export/candidates', '_blank');
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Reportes y Analytics</h1>
          <p className="text-gray-600 mt-1">Análisis detallado del desempeño de candidatos</p>
        </div>
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2"
        >
          <FiDownload className="w-5 h-5" />
          Descargar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 flex-wrap">
        {[
          { id: 'competencies', label: '📚 Competencias', icon: '📚' },
          { id: 'operations', label: '🎯 Operaciones', icon: '🎯' },
          { id: 'vacancies', label: '💼 Vacantes', icon: '💼' },
          { id: 'candidates', label: '👥 Candidatos', icon: '👥' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Competencias Tab */}
      {activeTab === 'competencies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Puntajes Promedio por Competencia
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={competencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="competency" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avg_percentage" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Resumen</h3>
              <p className="text-sm text-gray-600 mb-4">Competencias más fuertes</p>
              {competencyData.slice(0, 3).map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">{comp.competency}</span>
                  <span className="font-bold text-blue-600">{comp.avg_percentage}%</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Evaluaciones</h3>
              <p className="text-3xl font-bold text-purple-600">
                {competencyData.reduce((sum, c) => sum + (c.total_candidates || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total de candidatos evaluados</p>
            </div>
          </div>
        </div>
      )}

      {/* Operaciones Tab */}
      {activeTab === 'operations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Distribución de Recomendaciones
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={operationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total_recommendations"
                >
                  {operationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {operationData.map((op, idx) => (
              <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{op.operation}</h3>
                  <span className="text-2xl font-bold text-blue-600">{op.avg_affinity}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {op.total_recommendations} recomendaciones
                </p>
                <div className="flex justify-between text-xs">
                  <span>Min: {op.min_affinity}</span>
                  <span>Max: {op.max_affinity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vacantes Tab */}
      {activeTab === 'vacancies' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Desempeño por Vacante
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={vacancyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vacancy_title" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="completed_evaluations" fill="#3B82F6" name="Evaluaciones Completadas" />
              <Bar yAxisId="right" dataKey="completion_rate" fill="#10B981" name="% Completitud" />
            </BarChart>
          </ResponsiveContainer>

          {/* Tabla */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Vacante</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Completadas</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">% Completitud</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Afinidad Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vacancyData.map((vac, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{vac.vacancy_title}</td>
                    <td className="px-4 py-3">{vac.total_candidates}</td>
                    <td className="px-4 py-3">{vac.completed_evaluations}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        {vac.completion_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{vac.avg_affinity_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidatos Tab */}
      {activeTab === 'candidates' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Desempeño Individual de Candidatos
          </h2>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Candidato</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Vacante</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Puntaje Promedio</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Operación Recomendada</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {candidateData.map((cand, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {cand.candidate_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{cand.vacancy || '-'}</td>
                    <td className="px-4 py-3">
                      {cand.avg_competency_score ? (
                        <span className="font-semibold text-blue-600">{cand.avg_competency_score}%</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {cand.recommended_operation ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {cand.recommended_operation}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        cand.status === 'completed' ? 'bg-green-100 text-green-700' :
                        cand.status === 'invited' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {cand.status === 'completed' ? '✓ Completado' :
                         cand.status === 'invited' ? '📧 Invitado' :
                         'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
