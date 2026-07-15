const express = require('express');
const router = express.Router();
const spellingGrammarController = require('../controllers/spellingGrammarController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware para verificar que es admin
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Solo administradores pueden crear tests'
    });
  }
  next();
};

// OBTENER TODOS LOS TESTS (público)
router.get('/tests', spellingGrammarController.getAllTests);

// OBTENER TEST CON PREGUNTAS (público - sin middleware)
router.get('/tests/:testId', spellingGrammarController.getTest);

// ENVIAR RESPUESTAS (requiere autenticación)
router.post('/results/submit', verifyToken, spellingGrammarController.submitAnswers);

// OBTENER RESULTADOS DE UN CANDIDATO (protegido)
router.get('/results/candidate/:candidateId', verifyToken, spellingGrammarController.getCandidateResults);

// OBTENER REPORTE (protegido)
router.get('/report/candidate/:candidateId', verifyToken, spellingGrammarController.getReport);

// CREAR NUEVO TEST (solo admin)
router.post('/tests', verifyToken, isAdmin, spellingGrammarController.createTest);

module.exports = router;
