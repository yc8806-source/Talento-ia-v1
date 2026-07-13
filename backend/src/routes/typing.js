const express = require('express');
const router = express.Router();
const typingController = require('../controllers/typingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware para verificar que es admin
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Solo administradores pueden crear typing tests'
    });
  }
  next();
};

// OBTENER TODOS LOS TYPING TESTS (público)
router.get('/tests', typingController.getAllTests);

// OBTENER INFORMACIÓN DEL TEST (público - sin mostrar el texto)
router.get('/tests/:testId', typingController.getTestInfo);

// OBTENER TEXTO DEL TEST (requiere autenticación)
router.get('/tests/:testId/text', verifyToken, typingController.getTestText);

// ENVIAR RESULTADO DE TYPING TEST (requiere autenticación)
router.post('/results/submit', verifyToken, typingController.submitResult);

// ENVIAR RESULTADO DE TYPING TEST (para candidatos anónimos con token)
router.post('/results/submit-anonymous', typingController.submitResultAnonymous);

// SUBMIT SIN AUTENTICACIÓN (fallback para typing tests)
router.post('/results/submit-token', typingController.submitResultAnonymous);

// OBTENER RESULTADOS DE UN CANDIDATO (protegido)
router.get('/results/candidate/:candidateId', verifyToken, typingController.getCandidateResults);

// OBTENER REPORTE DE TYPING (protegido)
router.get('/report/candidate/:candidateId', verifyToken, typingController.getTypingReport);

// CREAR NUEVO TYPING TEST (solo admin)
router.post('/tests', verifyToken, isAdmin, typingController.createTest);

module.exports = router;
