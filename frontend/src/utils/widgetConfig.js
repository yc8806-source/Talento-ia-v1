// Configuración de widgets disponibles
export const AVAILABLE_WIDGETS = {
  // KPI Cards
  active_vacancies: {
    id: 'active_vacancies',
    name: 'Vacantes Activas',
    category: 'kpi',
    icon: '💼',
    defaultSize: { width: 2, height: 1 },
    description: 'Total de vacantes activas en el sistema',
  },
  total_candidates: {
    id: 'total_candidates',
    name: 'Total Candidatos',
    category: 'kpi',
    icon: '👥',
    defaultSize: { width: 2, height: 1 },
    description: 'Cantidad total de candidatos registrados',
  },
  pending_evaluations: {
    id: 'pending_evaluations',
    name: 'Evaluaciones Pendientes',
    category: 'kpi',
    icon: '📋',
    defaultSize: { width: 2, height: 1 },
    description: 'Evaluaciones que aún no han sido completadas',
  },
  average_score: {
    id: 'average_score',
    name: 'Promedio de Resultados',
    category: 'kpi',
    icon: '📈',
    defaultSize: { width: 2, height: 1 },
    description: 'Promedio de puntajes en evaluaciones',
  },

  // Charts
  candidates_by_vacancy: {
    id: 'candidates_by_vacancy',
    name: 'Candidatos por Vacante',
    category: 'chart',
    icon: '📊',
    defaultSize: { width: 4, height: 2 },
    description: 'Distribución de candidatos por vacante',
    chartType: 'bar',
  },
  top_competencies: {
    id: 'top_competencies',
    name: 'Competencias Top',
    category: 'chart',
    icon: '⭐',
    defaultSize: { width: 4, height: 2 },
    description: 'Competencias con mejor desempeño',
    chartType: 'pie',
  },
  evaluation_status: {
    id: 'evaluation_status',
    name: 'Estado de Evaluaciones',
    category: 'chart',
    icon: '🔄',
    defaultSize: { width: 4, height: 2 },
    description: 'Desglose de estado de evaluaciones',
    chartType: 'donut',
  },
  operation_recommendations: {
    id: 'operation_recommendations',
    name: 'Recomendaciones por Operación',
    category: 'chart',
    icon: '🎯',
    defaultSize: { width: 4, height: 2 },
    description: 'Distribución de recomendaciones',
    chartType: 'bar',
  },

  // Tables
  recent_candidates: {
    id: 'recent_candidates',
    name: 'Candidatos Recientes',
    category: 'table',
    icon: '🆕',
    defaultSize: { width: 6, height: 2 },
    description: 'Últimos candidatos registrados',
  },
  top_performers: {
    id: 'top_performers',
    name: 'Mejores Desempeños',
    category: 'table',
    icon: '🏆',
    defaultSize: { width: 6, height: 2 },
    description: 'Candidatos con mejores puntajes',
  },
  pending_actions: {
    id: 'pending_actions',
    name: 'Acciones Pendientes',
    category: 'table',
    icon: '✓',
    defaultSize: { width: 6, height: 2 },
    description: 'Acciones que requieren atención',
  },

  // Activity
  recent_activity: {
    id: 'recent_activity',
    name: 'Actividad Reciente',
    category: 'activity',
    icon: '📝',
    defaultSize: { width: 6, height: 2 },
    description: 'Feed de actividades del sistema',
  },
};

// Layout presets
export const DASHBOARD_PRESETS = {
  default: {
    name: 'Vista por Defecto',
    description: 'Configuración estándar del dashboard',
    widgets: [
      { id: 'active_vacancies', position: { row: 0, col: 0 } },
      { id: 'total_candidates', position: { row: 0, col: 2 } },
      { id: 'pending_evaluations', position: { row: 0, col: 4 } },
      { id: 'average_score', position: { row: 0, col: 6 } },
      { id: 'candidates_by_vacancy', position: { row: 1, col: 0 } },
      { id: 'top_competencies', position: { row: 1, col: 4 } },
    ],
  },
  compact: {
    name: 'Vista Compacta',
    description: 'Solo KPIs y resumen',
    widgets: [
      { id: 'active_vacancies', position: { row: 0, col: 0 } },
      { id: 'total_candidates', position: { row: 0, col: 2 } },
      { id: 'pending_evaluations', position: { row: 0, col: 4 } },
      { id: 'average_score', position: { row: 0, col: 6 } },
    ],
  },
  detailed: {
    name: 'Vista Detallada',
    description: 'Todos los widgets disponibles',
    widgets: [
      { id: 'active_vacancies', position: { row: 0, col: 0 } },
      { id: 'total_candidates', position: { row: 0, col: 2 } },
      { id: 'pending_evaluations', position: { row: 0, col: 4 } },
      { id: 'average_score', position: { row: 0, col: 6 } },
      { id: 'candidates_by_vacancy', position: { row: 1, col: 0 } },
      { id: 'top_competencies', position: { row: 1, col: 4 } },
      { id: 'evaluation_status', position: { row: 2, col: 0 } },
      { id: 'operation_recommendations', position: { row: 2, col: 4 } },
      { id: 'recent_candidates', position: { row: 3, col: 0 } },
      { id: 'top_performers', position: { row: 3, col: 4 } },
    ],
  },
};

// Obtener configuración guardada o default
export const getDefaultDashboardConfig = () => {
  try {
    const saved = localStorage.getItem('dashboardConfig');
    return saved ? JSON.parse(saved) : DASHBOARD_PRESETS.default.widgets;
  } catch (error) {
    console.error('Error loading dashboard config:', error);
    return DASHBOARD_PRESETS.default.widgets;
  }
};

// Guardar configuración
export const saveDashboardConfig = (config) => {
  try {
    localStorage.setItem('dashboardConfig', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving dashboard config:', error);
  }
};

// Validar widget
export const isValidWidget = (widgetId) => {
  return widgetId in AVAILABLE_WIDGETS;
};

// Obtener información del widget
export const getWidgetInfo = (widgetId) => {
  return AVAILABLE_WIDGETS[widgetId] || null;
};

// Obtener widgets por categoría
export const getWidgetsByCategory = (category) => {
  return Object.values(AVAILABLE_WIDGETS).filter(w => w.category === category);
};
