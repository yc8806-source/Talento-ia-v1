const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

// Aplicar autenticación a todas las rutas de reports
router.use(verifyToken);

// Obtener analytics de competencias
router.get('/competencies', reportController.getCompetencyAnalytics);

// Obtener analytics de operaciones
router.get('/operations', reportController.getOperationAnalytics);

// Obtener performance de vacantes
router.get('/vacancies', reportController.getVacancyPerformance);

// Obtener performance de candidatos
router.get('/candidates', reportController.getCandidatePerformance);

// Exportar candidatos a CSV
router.get('/export/candidates', reportController.exportCandidatesToCSV);

module.exports = router;
