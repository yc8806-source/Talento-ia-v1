const pool = require('../config/database-sqlite');

// Obtener todos los equipos
const getAllTeams = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.*,
        u.first_name as manager_name,
        COUNT(tm.id)::int as member_count
      FROM teams t
      LEFT JOIN users u ON t.manager_id = u.id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      GROUP BY t.id, u.first_name
      ORDER BY t.created_at DESC
    `);

    res.json({ teams: result.rows });
  } catch (error) {
    console.error('Error obteniendo equipos:', error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
};

// Obtener equipo por ID
const getTeamById = async (req, res) => {
  const { id } = req.params;

  try {
    const teamResult = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const membersResult = await pool.query(`
      SELECT
        tm.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.joined_at DESC
    `, [id]);

    res.json({
      team: teamResult.rows[0],
      members: membersResult.rows,
    });
  } catch (error) {
    console.error('Error obteniendo equipo:', error);
    res.status(500).json({ error: 'Error al obtener equipo' });
  }
};

// Crear equipo
const createTeam = async (req, res) => {
  const { name, description, department, manager_id } = req.body;

  if (!name || !department) {
    return res.status(400).json({
      error: 'Validación',
      message: 'name y department son requeridos',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO teams (name, description, department, manager_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || null, department, manager_id || null]
    );

    res.status(201).json({ team: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El equipo ya existe' });
    }
    console.error('Error creando equipo:', error);
    res.status(500).json({ error: 'Error al crear equipo' });
  }
};

// Actualizar equipo
const updateTeam = async (req, res) => {
  const { id } = req.params;
  const { name, description, department, manager_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE teams
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           department = COALESCE($3, department),
           manager_id = COALESCE($4, manager_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, description, department, manager_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json({ team: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando equipo:', error);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

// Eliminar equipo
const deleteTeam = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM teams WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando equipo:', error);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
};

// Agregar miembro al equipo
const addTeamMember = async (req, res) => {
  const { id } = req.params;
  const { user_id, role = 'member' } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id es requerido' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO UPDATE SET role = $3
       RETURNING *`,
      [id, user_id, role]
    );

    res.status(201).json({ member: result.rows[0] });
  } catch (error) {
    console.error('Error agregando miembro:', error);
    res.status(500).json({ error: 'Error al agregar miembro' });
  }
};

// Remover miembro del equipo
const removeTeamMember = async (req, res) => {
  const { id, memberId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND id = $2 RETURNING *',
      [id, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Miembro no encontrado' });
    }

    res.json({ message: 'Miembro removido correctamente' });
  } catch (error) {
    console.error('Error removiendo miembro:', error);
    res.status(500).json({ error: 'Error al remover miembro' });
  }
};

// Obtener miembros del equipo
const getTeamMembers = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        tm.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role as user_role
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.joined_at DESC
    `, [id]);

    res.json({ members: result.rows });
  } catch (error) {
    console.error('Error obteniendo miembros:', error);
    res.status(500).json({ error: 'Error al obtener miembros' });
  }
};

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
};
