import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Evaluations from './pages/Evaluations';
import EvaluationTest from './pages/EvaluationTest';
import Admin from './pages/Admin';
import AdminExams from './pages/AdminExams';
import Reports from './pages/Reports';
import Vacantes from './pages/Vacantes';
import AssignEvaluationsToVacancy from './pages/AssignEvaluationsToVacancy';
import EvaluationByToken from './pages/EvaluationByToken';
import CandidatesByVacancy from './pages/CandidatesByVacancy';
import ShareEvaluations from './pages/ShareEvaluations';
import TypingTestPage from './pages/TypingTestPage';
import SpellingGrammarTestPage from './pages/SpellingGrammarTestPage';
import PermissionsManagement from './pages/PermissionsManagement';
import CandidateDashboard from './pages/CandidateDashboard';
import SkillsAssessmentsPage from './pages/SkillsAssessmentsPage';
import SkillsAssessmentTest from './components/SkillsAssessmentTest';
import SoftSkillsTest from './components/SoftSkillsTest';
import AdminEvaluationResults from './components/AdminEvaluationResults';
import NotificationCenter from './components/NotificationCenter';
import { connectNotificationSocket, disconnectNotificationSocket } from './services/notificationService';

// Typing test routes enabled - v1.0.1
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    setIsLoggedIn(!!token);
    setUserRole(role);

    // Conectar al servidor de notificaciones si está autenticado
    if (token && user.firstName) {
      connectNotificationSocket(token, `${user.firstName} ${user.lastName}`);

      return () => {
        disconnectNotificationSocket();
      };
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <Router>
      <NotificationCenter />
      <Routes>
        <Route path="/login" element={!isLoggedIn ? <Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isLoggedIn ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/evaluacion" element={<EvaluationByToken />} />
        <Route path="/evaluacion/:token" element={<EvaluationTest />} />
        <Route path="/typing-test/:token" element={<TypingTestPage />} />
        <Route path="/spelling-grammar-test/:token" element={<SpellingGrammarTestPage />} />
        <Route path="/exams/:examId" element={<SoftSkillsTest />} />
        <Route path="/skills-assessment" element={<SkillsAssessmentsPage />} />
        <Route path="/skills-assessment/:assessmentId" element={<SkillsAssessmentTest />} />

        <Route element={isLoggedIn ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard userRole={userRole} />} />
          <Route path="/mi-perfil" element={<CandidateDashboard />} />
          <Route path="/candidatos" element={<Candidates userRole={userRole} />} />
          <Route path="/vacantes" element={<Vacantes userRole={userRole} />} />
          <Route path="/vacantes/:vacancyId/assign-evaluations" element={<AssignEvaluationsToVacancy />} />
          <Route path="/vacantes/:vacancyId/candidatos" element={<CandidatesByVacancy />} />
          <Route path="/evaluaciones" element={<Evaluations userRole={userRole} />} />
          <Route path="/skills-assessments" element={<SkillsAssessmentsPage />} />
          <Route path="/skills-assessment/:assessmentId" element={<SkillsAssessmentTest />} />
          <Route path="/reportes" element={<Reports userRole={userRole} />} />
          <Route path="/compartir" element={userRole === 'admin' ? <ShareEvaluations /> : <Navigate to="/dashboard" />} />
          <Route path="/permisos" element={userRole === 'admin' ? <PermissionsManagement /> : <Navigate to="/dashboard" />} />
          <Route path="/admin" element={userRole === 'admin' ? <Admin /> : <Navigate to="/dashboard" />} />
          <Route path="/admin/exams" element={userRole === 'admin' ? <AdminExams /> : <Navigate to="/dashboard" />} />
          <Route path="/admin/resultados" element={userRole === 'admin' ? <AdminEvaluationResults /> : <Navigate to="/dashboard" />} />
        </Route>

        <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
