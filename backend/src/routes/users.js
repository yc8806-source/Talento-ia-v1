const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, cleanupTestData } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionsMiddleware');

// Middleware de autenticación para todas las rutas
router.use(verifyToken);

// GET /api/users - Obtener todos los usuarios (admin only)
router.get(
  '/',
  requirePermission('users.view'),
  getAllUsers
);

// DELETE /api/users/:userId - Eliminar usuario (admin only)
router.delete(
  '/:userId',
  requirePermission('users.delete'),
  deleteUser
);

// POST /api/users/cleanup-test-data - Limpiar datos de prueba (admin only)
router.post(
  '/cleanup/test-data',
  requirePermission('users.delete'),
  cleanupTestData
);

module.exports = router;
