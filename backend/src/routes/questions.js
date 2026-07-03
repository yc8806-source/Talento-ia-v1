const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// Crear nueva pregunta
router.post('/', questionController.createQuestion);

// Obtener todas las preguntas
router.get('/', questionController.getQuestions);

// Obtener una pregunta por ID
router.get('/:id', questionController.getQuestionById);

// Actualizar pregunta
router.put('/:id', questionController.updateQuestion);

// Eliminar pregunta
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
