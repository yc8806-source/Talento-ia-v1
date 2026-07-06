// Sistema de Permisos Granulares

// Definición de permisos
const PERMISSIONS = {
  // Candidatos
  'candidates.view': 'Ver candidatos',
  'candidates.create': 'Crear candidatos',
  'candidates.edit': 'Editar candidatos',
  'candidates.delete': 'Eliminar candidatos',
  'candidates.download_cv': 'Descargar CV',
  'candidates.send_invitation': 'Enviar invitaciones',

  // Vacantes
  'vacancies.view': 'Ver vacantes',
  'vacancies.create': 'Crear vacantes',
  'vacancies.edit': 'Editar vacantes',
  'vacancies.delete': 'Eliminar vacantes',
  'vacancies.close': 'Cerrar vacantes',

  // Evaluaciones
  'evaluations.view': 'Ver evaluaciones',
  'evaluations.create': 'Crear evaluaciones',
  'evaluations.submit': 'Enviar evaluaciones',
  'evaluations.view_results': 'Ver resultados',
  'evaluations.export_pdf': 'Exportar PDF',

  // Preguntas
  'questions.view': 'Ver preguntas',
  'questions.create': 'Crear preguntas',
  'questions.edit': 'Editar preguntas',
  'questions.delete': 'Eliminar preguntas',
  'questions.bulk_import': 'Importar preguntas',

  // Exámenes
  'exams.view': 'Ver exámenes',
  'exams.create': 'Crear exámenes',
  'exams.edit': 'Editar exámenes',
  'exams.delete': 'Eliminar exámenes',
  'exams.assign': 'Asignar exámenes',

  // Reportes
  'reports.view': 'Ver reportes',
  'reports.export': 'Exportar reportes',
  'reports.advanced_analytics': 'Analytics avanzados',

  // Usuarios
  'users.view': 'Ver usuarios',
  'users.create': 'Crear usuarios',
  'users.edit': 'Editar usuarios',
  'users.delete': 'Eliminar usuarios',
  'users.manage_roles': 'Gestionar roles',
  'users.manage_permissions': 'Gestionar permisos',

  // Equipos
  'teams.view': 'Ver equipos',
  'teams.create': 'Crear equipos',
  'teams.edit': 'Editar equipos',
  'teams.delete': 'Eliminar equipos',
  'teams.manage_members': 'Gestionar miembros',

  // Admin
  'admin.access': 'Acceso administrador',
  'admin.settings': 'Configurar sistema',
  'admin.audit_logs': 'Ver logs de auditoría',
  'admin.system_health': 'Ver salud del sistema',
};

// Roles predefinidos con permisos
const ROLES = {
  admin: {
    name: 'Administrador',
    description: 'Acceso total al sistema',
    permissions: Object.keys(PERMISSIONS),
  },

  rrhh: {
    name: 'RRHH Manager',
    description: 'Gestión de candidatos y evaluaciones',
    permissions: [
      // Candidatos
      'candidates.view',
      'candidates.create',
      'candidates.edit',
      'candidates.download_cv',
      'candidates.send_invitation',

      // Evaluaciones
      'evaluations.view',
      'evaluations.create',
      'evaluations.view_results',
      'evaluations.export_pdf',

      // Preguntas y Exámenes (solo lectura)
      'questions.view',
      'exams.view',

      // Reportes
      'reports.view',
      'reports.export',
      'reports.advanced_analytics',

      // Usuarios (solo lectura)
      'users.view',
    ],
  },

  manager: {
    name: 'Manager',
    description: 'Gestión de equipo y evaluaciones',
    permissions: [
      // Candidatos
      'candidates.view',
      'candidates.edit',
      'candidates.download_cv',

      // Evaluaciones
      'evaluations.view',
      'evaluations.view_results',
      'evaluations.export_pdf',

      // Reportes
      'reports.view',
      'reports.export',

      // Equipos
      'teams.view',
      'teams.manage_members',

      // Usuarios (solo lectura)
      'users.view',
    ],
  },

  evaluator: {
    name: 'Evaluador',
    description: 'Crear y ver evaluaciones',
    permissions: [
      // Candidatos
      'candidates.view',
      'candidates.download_cv',

      // Evaluaciones
      'evaluations.view',
      'evaluations.create',
      'evaluations.view_results',

      // Exámenes (solo lectura)
      'exams.view',

      // Reportes
      'reports.view',
    ],
  },

  viewer: {
    name: 'Viewer',
    description: 'Solo lectura',
    permissions: [
      // Candidatos
      'candidates.view',

      // Evaluaciones
      'evaluations.view',
      'evaluations.view_results',

      // Reportes
      'reports.view',
    ],
  },
};

// Middleware: Verificar permiso
const requirePermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const userPermissions = req.user?.permissions || [];

    // Admin tiene todos los permisos
    if (userRole === 'admin') {
      return next();
    }

    // Verificar si el usuario tiene el permiso
    if (!userPermissions.includes(permission)) {
      console.warn(`⛔ Usuario ${req.user?.id} intentó acceder a ${permission} sin permiso`);
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `No tienes permiso para: ${PERMISSIONS[permission] || permission}`,
      });
    }

    next();
  };
};

// Middleware: Verificar múltiples permisos (ANY)
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const userPermissions = req.user?.permissions || [];

    if (userRole === 'admin') {
      return next();
    }

    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos suficientes para esta acción',
      });
    }

    next();
  };
};

// Middleware: Verificar múltiples permisos (ALL)
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const userPermissions = req.user?.permissions || [];

    if (userRole === 'admin') {
      return next();
    }

    const hasAllPermissions = permissions.every(p => userPermissions.includes(p));

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes todos los permisos requeridos',
      });
    }

    next();
  };
};

// Middleware: Verificar pertenencia al equipo
const requireTeamMembership = async (req, res, next) => {
  const pool = require('../config/database-sqlite');
  const userId = req.user?.id;
  const teamId = req.body.teamId || req.params.teamId;

  if (!teamId) {
    return next();
  }

  try {
    const result = await pool.query(
      `SELECT * FROM team_members
       WHERE user_id = $1 AND team_id = $2`,
      [userId, teamId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No perteneces a este equipo',
      });
    }

    req.teamMembership = result.rows[0];
    next();
  } catch (error) {
    console.error('Error verificando pertenencia al equipo:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

// Función: Obtener permisos de un rol
const getPermissionsForRole = (role) => {
  return ROLES[role]?.permissions || [];
};

// Función: Obtener todos los permisos
const getAllPermissions = () => {
  return PERMISSIONS;
};

// Función: Obtener todos los roles
const getAllRoles = () => {
  return ROLES;
};

// Función: Validar permiso
const hasPermission = (userPermissions, permission) => {
  return userPermissions.includes(permission);
};

// Función: Validar múltiples permisos (ANY)
const hasAnyPermission = (userPermissions, permissions) => {
  return permissions.some(p => userPermissions.includes(p));
};

// Función: Validar múltiples permisos (ALL)
const hasAllPermissions = (userPermissions, permissions) => {
  return permissions.every(p => userPermissions.includes(p));
};

module.exports = {
  PERMISSIONS,
  ROLES,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireTeamMembership,
  getPermissionsForRole,
  getAllPermissions,
  getAllRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
};
