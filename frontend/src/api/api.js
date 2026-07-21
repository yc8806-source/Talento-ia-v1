import axios from 'axios';

// Use localhost in development, Render in production
const API_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://talento-ia-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agregar token a las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Candidates
export const candidateAPI = {
  register: (data) => api.post('/candidates', data),
  getAll: () => api.get('/candidates'),
  getById: (id) => api.get(`/candidates/${id}`),
  updateProfile: (id, data) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.put(`/candidates/${id}`, data, config);
  },
  invite: (data) => api.post('/candidates/invite', data),
  getByVacancy: (vacancyId) => api.get(`/candidates/vacancy/${vacancyId}`),
  assignVacancy: (data) => api.post('/candidates/assign-vacancy', data),
  importCSV: (data) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.post('/candidates/import-csv', data, config);
  },
  getCandidateTokens: (candidateId) => api.get(`/candidates/${candidateId}/tokens`),
};

// Vacancies
export const vacancyAPI = {
  create: (data) => api.post('/vacancies', data),
  getAll: () => api.get('/vacancies'),
  getById: (id) => api.get(`/vacancies/${id}`),
  update: (id, data) => api.put(`/vacancies/${id}`, data),
  delete: (id) => api.delete(`/vacancies/${id}`),
  assignExams: (vacancyId, data, config = {}) => api.post(`/vacancies/${vacancyId}/exams`, data, {
    headers: { 'Content-Type': 'application/json' },
    ...config
  }),
};

// Questions
export const questionAPI = {
  create: (data) => api.post('/questions', data),
  getAll: (filters) => api.get('/questions', { params: filters }),
  getById: (id) => api.get(`/questions/${id}`),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
};

// Exams
export const examAPI = {
  create: (data) => api.post('/exams', data),
  getAll: () => api.get('/exams'),
  getById: (id) => api.get(`/exams/${id}`),
  addQuestions: (examId, data) => api.post(`/exams/${examId}/questions`, data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  removeQuestion: (examId, questionId) => api.delete(`/exams/${examId}/questions/${questionId}`),
};

// Evaluations
export const evaluationAPI = {
  start: (data) => api.post('/evaluations/start', data),
  answer: (data) => api.post('/evaluations/answer', data),
  submit: (evaluationId) => api.post(`/evaluations/${evaluationId}/submit`, {}),
  getResults: (candidateVacancyId) => api.get(`/evaluations/${candidateVacancyId}/results`),
  generatePDF: (candidateVacancyId) => api.get(`/evaluations/${candidateVacancyId}/pdf-download`, { responseType: 'blob' }),
  createAndShareLink: (data) => api.post('/evaluations/share-link', data),
  getByToken: (token) => api.get(`/evaluations/token/${token}`),
};

// Reports
export const reportAPI = {
  getCompetencyAnalytics: () => api.get('/reports/competency-analytics'),
  getOperationAnalytics: () => api.get('/reports/operation-analytics'),
  getVacancyPerformance: () => api.get('/reports/vacancy-performance'),
  getCandidatePerformance: () => api.get('/reports/candidate-performance'),
  exportCandidatesToCSV: () => api.get('/reports/export-candidates'),
};

// Teams
export const teamAPI = {
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  getMembers: (id) => api.get(`/teams/${id}/members`),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
  removeMember: (id, memberId) => api.delete(`/teams/${id}/members/${memberId}`),
};

// Permissions
export const permissionAPI = {
  getAllPermissions: () => api.get('/permissions'),
  getAllRoles: () => api.get('/permissions/roles/all'),
  getPermissionsByRole: (role) => api.get(`/permissions/roles/${role}`),
  getUserPermissions: (userId) => api.get(`/permissions/users/${userId}`),
  getUserTeamPermissions: (userId, teamId) => api.get(`/permissions/users/${userId}/teams/${teamId}`),
  grantPermission: (userId, data) => api.post(`/permissions/users/${userId}/grant`, data),
  revokePermission: (userId, data) => api.post(`/permissions/users/${userId}/revoke`, data),
  assignRoleToTeam: (teamId, userId, data) => api.post(`/permissions/teams/${teamId}/users/${userId}/role`, data),
  getAuditLogs: (filters) => api.get('/permissions/audit/logs', { params: filters }),
};

// Candidate Dashboard
export const candidateDashboardAPI = {
  getSummary: (candidateId) => api.get(`/candidate-dashboard/${candidateId}/summary`),
  getStatus: (candidateId) => api.get(`/candidate-dashboard/${candidateId}/status`),
  getHistory: (candidateId) => api.get(`/candidate-dashboard/${candidateId}/history`),
  getResults: (candidateId, candidateVacancyId) => api.get(`/candidate-dashboard/${candidateId}/${candidateVacancyId}/results`),
};

// Bulk Actions
export const bulkActionsAPI = {
  getCandidates: (params) => api.get('/bulk-actions/candidates', { params }),
  assignToVacancy: (data) => api.post('/bulk-actions/assign', data),
  sendInvitations: (data) => api.post('/bulk-actions/send-invitations', data),
  exportCSV: (data) => api.post('/bulk-actions/export', data, { responseType: 'blob' }),
  deleteCandidates: (data) => api.post('/bulk-actions/delete', data),
  updateStatus: (data) => api.post('/bulk-actions/update-status', data),
};

// Typing Tests
export const typingAPI = {
  getAllTests: (difficulty) => api.get('/typing/tests', { params: { difficulty } }),
  getTestInfo: (testId) => api.get(`/typing/tests/${testId}`),
  getTestText: (testId) => api.get(`/typing/tests/${testId}/text`),
  submitResult: (data) => api.post('/typing/results/submit', data),
  getCandidateResults: (candidateId) => api.get(`/typing/results/candidate/${candidateId}`),
  getReport: (candidateId) => api.get(`/typing/report/candidate/${candidateId}`),
  createTest: (data) => api.post('/typing/tests', data),
};

// Spelling & Grammar Tests
export const spellingGrammarAPI = {
  getAllTests: (difficulty, language) => api.get('/spelling-grammar/tests', { params: { difficulty, language } }),
  getTest: (testId) => api.get(`/spelling-grammar/tests/${testId}`),
  submitResult: (data) => api.post('/spelling-grammar/results/submit', data),
  getCandidateResults: (candidateId) => api.get(`/spelling-grammar/results/candidate/${candidateId}`),
  getReport: (candidateId) => api.get(`/spelling-grammar/report/candidate/${candidateId}`),
  createTest: (data) => api.post('/spelling-grammar/tests', data),
};

// Skills Assessment
export const skillsAssessmentAPI = {
  getAllAssessments: (skillType, difficulty) => api.get('/skills/assessments', { params: { skillType, difficulty } }),
  getAssessment: (assessmentId) => api.get(`/skills/assessments/${assessmentId}`),
  submitSolution: (assessmentId, problemId, code, output) => api.post('/skills/solutions/submit', {
    assessmentId,
    problemId,
    code,
    output,
  }),
  completeAssessment: (assessmentId, totalPoints, pointsEarned, problemsSolved, totalProblems, timeSeconds, startedAt, candidateVacancyId) => api.post('/skills/assessments/complete', {
    assessmentId,
    totalPoints,
    pointsEarned,
    problemsSolved,
    totalProblems,
    timeSeconds,
    startedAt,
    candidateVacancyId,
  }),
  getCandidateResults: (candidateId) => api.get(`/skills/results/candidate/${candidateId}`),
  getReport: (candidateId) => api.get(`/skills/report/candidate/${candidateId}`),
};

export default api;
