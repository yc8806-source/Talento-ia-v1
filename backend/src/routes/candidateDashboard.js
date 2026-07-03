const express = require('express');
const router = express.Router();
const {
  getCandidateEvaluationStatus,
  getCandidateEvaluationHistory,
  getCandidateEvaluationResults,
  getCandidateSummary
} = require('../controllers/candidateDashboardController');

// GET /api/candidate-dashboard/:candidateId/summary - Resumen del candidato
router.get('/:candidateId/summary', getCandidateSummary);

// GET /api/candidate-dashboard/:candidateId/status - Estado actual de evaluación
router.get('/:candidateId/status', getCandidateEvaluationStatus);

// GET /api/candidate-dashboard/:candidateId/history - Historial de evaluaciones
router.get('/:candidateId/history', getCandidateEvaluationHistory);

// GET /api/candidate-dashboard/:candidateId/:candidateVacancyId/results - Resultados detallados
router.get('/:candidateId/:candidateVacancyId/results', getCandidateEvaluationResults);

module.exports = router;
