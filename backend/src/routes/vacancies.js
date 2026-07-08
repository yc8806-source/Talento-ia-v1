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

// DEBUG: Endpoint para ver exactamente qué llega
router.post('/:vacancyId/exams-debug', (req, res) => {
  console.log('[DEBUG] ===== RAW REQUEST =====');
  console.log('[DEBUG] params:', req.params);
  console.log('[DEBUG] body:', req.body);
  console.log('[DEBUG] body keys:', Object.keys(req.body));
  console.log('[DEBUG] body.examIds:', req.body.examIds);
  console.log('[DEBUG] typeof body.examIds:', typeof req.body.examIds);
  console.log('[DEBUG] isArray:', Array.isArray(req.body.examIds));
  console.log('[DEBUG] ========================');

  res.json({
    debug: {
      paramsVacancyId: req.params.vacancyId,
      bodyExamIds: req.body.examIds,
      bodyKeys: Object.keys(req.body),
      fullBody: req.body
    }
  });
});

module.exports = router;
