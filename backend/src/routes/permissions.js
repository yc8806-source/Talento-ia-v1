const express = require('express');
const router = express.Router();
const {
  getAllPermissions,
  getAllRoles,
  getUserPermissions,
  getUserTeamPermissions,
  grantPermission,
  revokePermission,
  getPermissionsByRole,
  getAuditLogs,
  assignRoleToTeam,
} = require('../controllers/permissionController');
const { requirePermission } = require('../middleware/permissionsMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/permissions - Obtener todos los permisos (sin autenticación)
router.get('/', getAllPermissions);

// GET /api/permissions/roles/all - Obtener todos los roles (sin autenticación)
router.get('/roles/all', getAllRoles);

// Middleware de autenticación para el resto de rutas
router.use(verifyToken);

// GET /api/permissions/roles/:role - Obtener permisos de un rol
router.get(
  '/roles/:role',
  requirePermission('users.manage_permissions'),
  getPermissionsByRole
);

// GET /api/permissions/users/:userId - Obtener permisos de un usuario
router.get(
  '/users/:userId',
  requirePermission('users.manage_permissions'),
  getUserPermissions
);

// GET /api/permissions/users/:userId/teams/:teamId - Obtener permisos en equipo
router.get(
  '/users/:userId/teams/:teamId',
  requirePermission('teams.manage_members'),
  getUserTeamPermissions
);

// POST /api/permissions/users/:userId/grant - Asignar permiso
router.post(
  '/users/:userId/grant',
  requirePermission('users.manage_permissions'),
  grantPermission
);

// POST /api/permissions/users/:userId/revoke - Revocar permiso
router.post(
  '/users/:userId/revoke',
  requirePermission('users.manage_permissions'),
  revokePermission
);

// POST /api/permissions/teams/:teamId/users/:userId/role - Asignar rol en equipo
router.post(
  '/teams/:teamId/users/:userId/role',
  requirePermission('teams.manage_members'),
  assignRoleToTeam
);

// GET /api/permissions/audit-logs - Obtener logs de auditoría
router.get(
  '/audit/logs',
  requirePermission('admin.audit_logs'),
  getAuditLogs
);

module.exports = router;
