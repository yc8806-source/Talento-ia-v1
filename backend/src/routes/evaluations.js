const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { evaluationLimiter } = require('../middleware/securityMiddleware');

// RATE LIMITING - Limitar creación de evaluaciones
router.post('/start', evaluationLimiter, evaluationController.startEvaluation);

// RATE LIMITING - Limitar compartir links
router.post('/share-link', evaluationLimiter, evaluationController.createAndShareEvaluationLink);

// Responder una pregunta
router.post('/answer', evaluationController.answerQuestion);

// Finalizar evaluación
router.post('/:evaluationId/submit', evaluationController.submitEvaluation);

// Obtener evaluación por token (acceso anónimo)
router.get('/token/:token', evaluationController.getEvaluationByToken);

// Obtener resultados
router.get('/:candidateVacancyId/results', evaluationController.getEvaluationResults);

// Generar PDF de resultados
router.get('/:candidateVacancyId/pdf', evaluationController.generatePDF);

module.exports = router;
