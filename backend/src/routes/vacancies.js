const express = require('express');
const router = express.Router();
const vacancyController = require('../controllers/vacancyController');

// Crear nueva vacante
router.post('/', vacancyController.createVacancy);

// Obtener todas las vacantes
router.get('/', vacancyController.getVacancies);

// Obtener una vacante por ID
router.get('/:id', vacancyController.getVacancyById);

// Actualizar vacante
router.put('/:id', vacancyController.updateVacancy);

// Asignar exámenes a vacante
router.post('/:vacancyId/exams', vacancyController.assignExamsToVacancy);

module.exports = router;
