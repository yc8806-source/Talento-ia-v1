const pool = require('../config/database-sqlite');
const { PERMISSIONS, ROLES } = require('../middleware/permissionsMiddleware');

// Obtener todos los permisos disponibles
const getAllPermissions = async (req, res) => {
  try {
    res.json({ permissions: PERMISSIONS });
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
};

// Obtener todos los roles
const getAllRoles = async (req, res) => {
  try {
    res.json({ roles: ROLES });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

// Obtener permisos de un usuario
const getUserPermissions = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        permission_key,
        team_id,
        created_at
      FROM user_permissions
      WHERE user_id = $1
      ORDER BY team_id, permission_key
    `, [userId]);

    res.json({ permissions: result.rows });
  } catch (error) {
    console.error('Error obteniendo permisos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
};

// Obtener permisos de un usuario en un equipo
const getUserTeamPermissions = async (req, res) => {
  const { userId, teamId } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        permission_key,
        created_at,
        granted_by
      FROM user_permissions
      WHERE user_id = $1 AND (team_id = $2 OR team_id IS NULL)
      ORDER BY permission_key
    `, [userId, teamId]);

    res.json({ permissions: result.rows });
  } catch (error) {
    console.error('Error obteniendo permisos del usuario en equipo:', error);
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
};

// Asignar permiso a usuario
const grantPermission = async (req, res) => {
  const { userId } = req.params;
  const { permission_key, team_id } = req.body;
  const actorId = req.user?.id;

  if (!permission_key) {
    return res.status(400).json({ error: 'permission_key es requerido' });
  }

  if (!PERMISSIONS[permission_key]) {
    return res.status(400).json({ error: 'Permiso no válido' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_permissions (user_id, team_id, permission_key, granted_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, team_id, permission_key) DO NOTHING
       RETURNING *`,
      [userId, team_id || null, permission_key, actorId]
    );

    // Registrar en audit log
    await pool.query(
      `INSERT INTO permission_audit_logs
       (user_id, action, permission_key, team_id, actor_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        'grant',
        permission_key,
        team_id || null,
        actorId,
        req.ip,
        req.get('user-agent'),
      ]
    );

    res.status(201).json({
      message: 'Permiso asignado correctamente',
      permission: result.rows[0],
    });
  } catch (error) {
    console.error('Error asignando permiso:', error);
    res.status(500).json({ error: 'Error al asignar permiso' });
  }
};

// Revocar permiso
const revokePermission = async (req, res) => {
  const { userId } = req.params;
  const { permission_key, team_id } = req.body;
  const actorId = req.user?.id;

  try {
    const result = await pool.query(
      `DELETE FROM user_permissions
       WHERE user_id = $1 AND permission_key = $2 AND (team_id = $3 OR ($3 IS NULL AND team_id IS NULL))
       RETURNING *`,
      [userId, permission_key, team_id || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permiso no encontrado' });
    }

    // Registrar en audit log
    await pool.query(
      `INSERT INTO permission_audit_logs
       (user_id, action, permission_key, team_id, actor_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        'revoke',
        permission_key,
        team_id || null,
        actorId,
        req.ip,
        req.get('user-agent'),
      ]
    );

    res.json({ message: 'Permiso revocado correctamente' });
  } catch (error) {
    console.error('Error revocando permiso:', error);
    res.status(500).json({ error: 'Error al revocar permiso' });
  }
};

// Obtener permisos por rol
const getPermissionsByRole = async (req, res) => {
  const { role } = req.params;

  try {
    const result = await pool.query(`
      SELECT permission_key
      FROM role_permissions
      WHERE role_name = $1
      ORDER BY permission_key
    `, [role]);

    res.json({
      role,
      permissions: result.rows.map(r => r.permission_key),
    });
  } catch (error) {
    console.error('Error obteniendo permisos del rol:', error);
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
};

// Obtener audit logs
const getAuditLogs = async (req, res) => {
  const { userId, teamId, action, limit = 100, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM permission_audit_logs WHERE 1=1';
    const params = [];

    if (userId) {
      query += ` AND user_id = $${params.length + 1}`;
      params.push(userId);
    }

    if (teamId) {
      query += ` AND team_id = $${params.length + 1}`;
      params.push(teamId);
    }

    if (action) {
      query += ` AND action = $${params.length + 1}`;
      params.push(action);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Error obteniendo audit logs:', error);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

// Asignar rol a usuario en equipo
const assignRoleToTeam = async (req, res) => {
  const { teamId, userId } = req.params;
  const { role } = req.body;

  if (!['admin', 'manager', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Rol no válido' });
  }

  try {
    const result = await pool.query(
      `UPDATE team_members
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE team_id = $2 AND user_id = $3
       RETURNING *`,
      [role, teamId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Miembro del equipo no encontrado' });
    }

    res.json({ member: result.rows[0] });
  } catch (error) {
    console.error('Error asignando rol:', error);
    res.status(500).json({ error: 'Error al asignar rol' });
  }
};

module.exports = {
  getAllPermissions,
  getAllRoles,
  getUserPermissions,
  getUserTeamPermissions,
  grantPermission,
  revokePermission,
  getPermissionsByRole,
  getAuditLogs,
  assignRoleToTeam,
};
