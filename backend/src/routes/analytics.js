const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware: verificar autenticación
router.use(verifyToken);

// GET /api/analytics/my-metrics - Métricas del analista actual
router.get('/my-metrics', analyticsController.getMyMetrics);

// GET /api/analytics/all-analysts - Tabla de todos los analistas (solo admin)
router.get('/all-analysts', analyticsController.getAllAnalystsMetrics);

module.exports = router;
