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

// Obtener información de vacante y exámenes por token (para invitación sin login)
router.get('/vacancy-by-token/:token', evaluationController.getVacancyEvaluationByToken);

// Obtener estado de exámenes (cuáles ya fueron completados)
router.get('/status/:token', evaluationController.getExamStatusByToken);

// Guardar respuestas de examen por token
router.post('/:token/exam-answers', evaluationController.submitExamAnswersByToken);

// Obtener resultados
router.get('/:candidateVacancyId/results', evaluationController.getEvaluationResults);

// Generar PDF ON-DEMAND (nuevo - funciona garantizado)
router.get('/:candidateVacancyId/pdf-download', evaluationController.generatePDFOnDemand);

// Generar PDF de resultados (legacy)
router.get('/:candidateVacancyId/pdf', evaluationController.generatePDF);

// Descargar PDF (acceso directo al archivo)
router.get('/:candidateVacancyId/pdf/download', evaluationController.downloadPDF);

// DEBUG: PDF data sin generar archivo
router.get('/:candidateVacancyId/pdf/debug', evaluationController.debugPDF);

module.exports = router;
