const express = require('express');
const router = express.Router();
const skillsAssessmentController = require('../controllers/skillsAssessmentController');
const { verifyToken } = require('../middleware/authMiddleware');

// OBTENER TODAS LAS EVALUACIONES (público)
router.get('/assessments', skillsAssessmentController.getAllAssessments);

// OBTENER EVALUACIÓN CON PROBLEMAS (requiere autenticación)
router.get('/assessments/:assessmentId', verifyToken, skillsAssessmentController.getAssessment);

// ENVIAR SOLUCIÓN A UN PROBLEMA (requiere autenticación)
router.post('/solutions/submit', verifyToken, skillsAssessmentController.submitSolution);

// COMPLETAR EVALUACIÓN (requiere autenticación)
router.post('/assessments/complete', verifyToken, skillsAssessmentController.completeAssessment);

// OBTENER RESULTADOS DE UN CANDIDATO (protegido)
router.get('/results/candidate/:candidateId', verifyToken, skillsAssessmentController.getCandidateResults);

// OBTENER REPORTE (protegido)
router.get('/report/candidate/:candidateId', verifyToken, skillsAssessmentController.getReport);

module.exports = router;
