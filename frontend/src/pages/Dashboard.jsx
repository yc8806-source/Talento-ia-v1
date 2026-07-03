import React, { useState, useEffect } from 'react';
import { vacancyAPI, candidateAPI } from '../api/api';
import CustomizableDashboard from '../components/CustomizableDashboard';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    active_vacancies: 0,
    total_candidates: 0,
    pending_evaluations: 0,
    average_score: 0,
    candidates_by_vacancy_data: [],
    top_competencies_data: [],
    evaluation_status_data: [],
    operation_recommendations_data: [],
    recent_candidates_data: [],
    recent_candidates_columns: ['Nombre', 'Email', 'Vacante', 'Fecha'],
    top_performers_data: [],
    top_performers_columns: ['Candidato', 'Puntaje', 'Operación'],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vacanciesRes, candidatesRes] = await Promise.all([
        vacancyAPI.getAll(),
        candidateAPI.getAll(),
      ]);

      const allVacancies = vacanciesRes.data.vacancies || [];
      const allCandidates = candidatesRes.data.candidates || [];

      const activeVacs = allVacancies.filter((v) => v.status === 'open').length;
      const totalCands = allCandidates.length;

      // Mock data para gráficos
      const vacancyChartData = allVacancies.slice(0, 5).map(v => ({
        name: v.title.substring(0, 15),
        value: Math.floor(Math.random() * 15) + 1,
      }));

      const competencyData = [
        { name: 'Comunicación', value: 85 },
        { name: 'Persuasión', value: 72 },
        { name: 'Empatía', value: 78 },
        { name: 'Negociación', value: 65 },
      ];

      const evaluationStatusData = [
        { name: 'Completadas', value: 24 },
        { name: 'Pendientes', value: 8 },
        { name: 'No Iniciadas', value: 12 },
      ];

      const operationsData = [
        { name: 'Televentas', value: 12 },
        { name: 'Cobranzas', value: 8 },
        { name: 'Inbound', value: 6 },
        { name: 'eCare', value: 4 },
      ];

      const recentCandidatesData = allCandidates.slice(0, 5).map(c => ({
        Nombre: `${c.first_name} ${c.last_name}`,
        Email: c.email,
        Vacante: 'Evaluación',
        Fecha: new Date(c.created_at).toLocaleDateString('es-ES'),
      }));

      const topPerformersData = [
        { Candidato: 'Juan Pérez', Puntaje: '95%', Operación: 'Televentas' },
        { Candidato: 'María García', Puntaje: '92%', Operación: 'Cobranzas' },
        { Candidato: 'Carlos López', Puntaje: '88%', Operación: 'Inbound' },
        { Candidato: 'Ana Martínez', Puntaje: '85%', Operación: 'eCare' },
        { Candidato: 'Roberto Sánchez', Puntaje: '82%', Operación: 'Televentas' },
      ];

      setDashboardData({
        active_vacancies: activeVacs,
        total_candidates: totalCands,
        pending_evaluations: Math.floor(Math.random() * 15) + 3,
        average_score: 78,
        candidates_by_vacancy_data: vacancyChartData,
        top_competencies_data: competencyData,
        evaluation_status_data: evaluationStatusData,
        operation_recommendations_data: operationsData,
        recent_candidates_data: recentCandidatesData,
        recent_candidates_columns: ['Nombre', 'Email', 'Vacante', 'Fecha'],
        top_performers_data: topPerformersData,
        top_performers_columns: ['Candidato', 'Puntaje', 'Operación'],
      });
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <CustomizableDashboard data={dashboardData} />
  );
}

export default Dashboard;
