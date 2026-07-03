const express = require('express');
const router = express.Router();
const {
  bulkAssignCandidatesToVacancy,
  bulkSendInvitations,
  exportCandidatesToCSV,
  bulkDeleteCandidates,
  bulkUpdateEvaluationStatus,
  getCandidatesForBulkAction
} = require('../controllers/bulkActionsController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionsMiddleware');

// Middleware de autenticación para todas las rutas
router.use(verifyToken);

// GET /api/bulk-actions/candidates - Obtener candidatos para acciones masivas
router.get('/candidates', requirePermission('candidates.view'), getCandidatesForBulkAction);

// POST /api/bulk-actions/assign - Asignar múltiples candidatos a vacante
router.post(
  '/assign',
  requirePermission('candidates.edit'),
  bulkAssignCandidatesToVacancy
);

// POST /api/bulk-actions/send-invitations - Enviar invitaciones en batch
router.post(
  '/send-invitations',
  requirePermission('candidates.send_invitation'),
  bulkSendInvitations
);

// POST /api/bulk-actions/export - Exportar candidatos a CSV
router.post(
  '/export',
  requirePermission('candidates.view'),
  exportCandidatesToCSV
);

// POST /api/bulk-actions/delete - Eliminar múltiples candidatos
router.post(
  '/delete',
  requirePermission('candidates.delete'),
  bulkDeleteCandidates
);

// POST /api/bulk-actions/update-status - Cambiar estado de múltiples evaluaciones
router.post(
  '/update-status',
  requirePermission('evaluations.view'),
  bulkUpdateEvaluationStatus
);

module.exports = router;
