const express = require('express');
const router = express.Router();
const {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
} = require('../controllers/teamController');
const { requirePermission, requireTeamMembership } = require('../middleware/permissionsMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware de autenticación
router.use(verifyToken);

// GET /api/teams - Obtener todos los equipos
router.get('/', requirePermission('teams.view'), getAllTeams);

// POST /api/teams - Crear equipo
router.post('/', requirePermission('teams.create'), createTeam);

// GET /api/teams/:id - Obtener equipo por ID
router.get('/:id', requirePermission('teams.view'), getTeamById);

// PUT /api/teams/:id - Actualizar equipo
router.put('/:id', requirePermission('teams.edit'), updateTeam);

// DELETE /api/teams/:id - Eliminar equipo
router.delete('/:id', requirePermission('teams.delete'), deleteTeam);

// GET /api/teams/:id/members - Obtener miembros del equipo
router.get('/:id/members', requirePermission('teams.view'), getTeamMembers);

// POST /api/teams/:id/members - Agregar miembro al equipo
router.post(
  '/:id/members',
  requirePermission('teams.manage_members'),
  addTeamMember
);

// DELETE /api/teams/:id/members/:memberId - Remover miembro del equipo
router.delete(
  '/:id/members/:memberId',
  requirePermission('teams.manage_members'),
  removeTeamMember
);

module.exports = router;
