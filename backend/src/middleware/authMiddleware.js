const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { getPermissionsForRole } = require('./permissionsMiddleware');

// Verificar y extraer token JWT o token de candidato
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bodyToken = req.body?.token;

    // Intenta primero con token de candidato en body (para typing tests)
    if (bodyToken) {
      const cvResult = await pool.query(
        'SELECT id, candidate_id FROM candidate_vacancies WHERE token = $1',
        [bodyToken]
      );

      if (cvResult.rows.length > 0) {
        req.user = {
          id: cvResult.rows[0].candidate_id,
        };
        req.candidateVacancy = {
          id: cvResult.rows[0].id,
          candidateId: cvResult.rows[0].candidate_id,
        };
        return next();
      }
    }

    // Si no hay token de candidato, requiere JWT
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        message: 'Se requiere un token JWT en el header Authorization',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar firma del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener usuario y permisos de la BD
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Obtener permisos del usuario
    let userPermissions = [];

    // 1. Permisos por rol global
    const rolePermissions = getPermissionsForRole(user.role);
    userPermissions = [...rolePermissions];

    // 2. Permisos granulares adicionales (si la tabla existe)
    try {
      const additionalPermsResult = await pool.query(
        `SELECT DISTINCT permission_key FROM user_permissions
         WHERE user_id = $1 AND team_id IS NULL`,
        [user.id]
      );

      const additionalPerms = additionalPermsResult.rows.map(r => r.permission_key);
      userPermissions = [...new Set([...userPermissions, ...additionalPerms])];
    } catch (error) {
      // Tabla user_permissions no existe aún, usar solo permisos del rol
      console.log('Tabla user_permissions no existe, usando permisos del rol');
    }

    // Asignar al request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      permissions: userPermissions,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Por favor inicia sesión nuevamente',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token no es válido',
      });
    }

    console.error('Error verificando token:', error);
    res.status(500).json({ error: 'Error al verificar token' });
  }
};

// Middleware para obtener equipo y permisos del equipo
const getTeamPermissions = async (req, res, next) => {
  try {
    const teamId = req.params.teamId || req.body.teamId;

    if (!teamId) {
      return next();
    }

    const userId = req.user?.id;

    // Obtener membresía del equipo
    const membershipResult = await pool.query(
      `SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId]
    );

    if (membershipResult.rows.length === 0) {
      return res.status(403).json({
        error: 'No perteneces a este equipo',
      });
    }

    const membership = membershipResult.rows[0];

    // Obtener permisos en el equipo
    const teamPermsResult = await pool.query(
      `SELECT permission_key FROM user_permissions
       WHERE user_id = $1 AND team_id = $2`,
      [userId, teamId]
    );

    const teamPerms = teamPermsResult.rows.map(r => r.permission_key);

    req.teamMembership = {
      ...membership,
      teamPermissions: teamPerms,
    };

    next();
  } catch (error) {
    console.error('Error obteniendo permisos del equipo:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

// Middleware para verificar token de candidato (para typing tests anónimos)
const verifyTypingToken = async (req, res, next) => {
  try {
    const token = req.body.token || req.query.token;

    if (!token) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        message: 'Se requiere un token de candidato',
      });
    }

    // Buscar candidate_vacancy con este token
    const cvResult = await pool.query(
      'SELECT id, candidate_id FROM candidate_vacancies WHERE token = $1',
      [token]
    );

    if (cvResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Token inválido o expirado',
      });
    }

    // Asignar datos al request
    req.candidateVacancy = {
      id: cvResult.rows[0].id,
      candidateId: cvResult.rows[0].candidate_id,
    };

    req.user = {
      id: cvResult.rows[0].candidate_id,
    };

    next();
  } catch (error) {
    console.error('Error verificando typing token:', error);
    res.status(500).json({ error: 'Error al verificar token' });
  }
};

module.exports = {
  verifyToken,
  getTeamPermissions,
  verifyTypingToken,
};
