const pool = require('../config/database');

// CREAR NUEVA VACANTE
exports.createVacancy = async (req, res) => {
  try {
    const { title, description, department, status, available_positions } = req.body;
    const userId = req.user?.id; // Get analyst ID from JWT token

    if (!title) {
      return res.status(400).json({
        error: 'Falta dato requerido: title'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    // Crear vacante con assigned_to_user_id
    const vacancyResult = await pool.query(
      'INSERT INTO vacancies (title, description, department, status, available_positions, assigned_to_user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description || '', department || '', status || 'open', available_positions || 1, userId]
    );

    const vacancy = vacancyResult.rows[0];

    res.status(201).json({
      message: 'Vacante creada exitosamente',
      vacancy: {
        id: vacancy.id,
        title: vacancy.title,
        description: vacancy.description,
        department: vacancy.department,
        status: vacancy.status,
        availablePositions: vacancy.available_positions,
        filledPositions: vacancy.filled_positions,
        createdAt: vacancy.created_at
      }
    });
  } catch (error) {
    console.error('Error creando vacante:', error);
    res.status(500).json({
      error: 'Error al crear vacante',
      details: error.message
    });
  }
};

// OBTENER TODAS LAS VACANTES
exports.getVacancies = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admins see all vacancies, analysts see only theirs
    let query = 'SELECT * FROM vacancies';
    const params = [];

    if (userRole !== 'admin' && userId) {
      query += ' WHERE assigned_to_user_id = $1';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    const vacancies = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      department: row.department,
      status: row.status,
      availablePositions: row.available_positions,
      filledPositions: row.filled_positions,
      createdAt: row.created_at,
      assignedToUserId: row.assigned_to_user_id
    }));

    res.json({
      total: vacancies.length,
      vacancies: vacancies
    });
  } catch (error) {
    console.error('Error obteniendo vacantes:', error);
    res.status(500).json({
      error: 'Error al obtener vacantes',
      details: error.message
    });
  }
};

// OBTENER UNA VACANTE POR ID
exports.getVacancyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const vacancyResult = await pool.query(
      'SELECT * FROM vacancies WHERE id = $1',
      [id]
    );

    if (vacancyResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vacante no encontrada'
      });
    }

    const vacancy = vacancyResult.rows[0];

    // Check access: only owner or admin can view
    if (userRole !== 'admin' && vacancy.assigned_to_user_id !== userId) {
      return res.status(403).json({
        error: 'No tienes permiso para acceder a esta vacante'
      });
    }

    // Obtener exámenes de esta vacante
    const examsResult = await pool.query(
      `SELECT e.id, e.name, e.description, e.max_time_minutes
       FROM exams e
       INNER JOIN vacancy_exams ve ON e.id = ve.exam_id
       WHERE ve.vacancy_id = $1
       ORDER BY ve.exam_order`,
      [id]
    );

    res.json({
      id: vacancy.id,
      title: vacancy.title,
      description: vacancy.description,
      status: vacancy.status,
      exams: examsResult.rows.map(e => ({
        id: e.id,
        name: e.name,
        description: e.description,
        maxTimeMinutes: e.max_time_minutes
      })),
      createdAt: vacancy.created_at
    });
  } catch (error) {
    console.error('Error obteniendo vacante:', error);
    res.status(500).json({
      error: 'Error al obtener vacante',
      details: error.message
    });
  }
};

// ACTUALIZAR VACANTE
exports.updateVacancy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, available_positions } = req.body;

    const result = await pool.query(
      'UPDATE vacancies SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), available_positions = COALESCE($4, available_positions), updated_at = NOW() WHERE id = $5 RETURNING *',
      [title, description, status, available_positions, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Vacante no encontrada'
      });
    }

    res.json({
      message: 'Vacante actualizada exitosamente',
      vacancy: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        status: result.rows[0].status,
        availablePositions: result.rows[0].available_positions,
        filledPositions: result.rows[0].filled_positions
      }
    });
  } catch (error) {
    console.error('Error actualizando vacante:', error);
    res.status(500).json({
      error: 'Error al actualizar vacante',
      details: error.message
    });
  }
};

// ASIGNAR EXÁMENES A VACANTE
exports.assignExamsToVacancy = async (req, res) => {
  try {
    let { vacancyId } = req.params;
    let { examIds } = req.body;

    // Validar vacancyId
    if (!vacancyId) {
      return res.status(400).json({
        error: 'Se requiere vacancyId como parámetro'
      });
    }

    // Validar y procesar examIds
    if (!examIds) {
      return res.status(400).json({
        error: 'Se requiere examIds en el body'
      });
    }

    // Si examIds es objeto con claves numéricas (resultado de form-urlencoded), convertir a array
    if (typeof examIds === 'object' && !Array.isArray(examIds)) {
      const keys = Object.keys(examIds);
      if (keys.every(k => /^\d+$/.test(k))) {
        // Es un objeto con claves numéricas - convertir a array
        examIds = keys.map(k => parseInt(examIds[k], 10));
      } else {
        // Objeto regular - envolver en array
        examIds = [examIds];
      }
    }

    if (examIds.length === 0) {
      return res.status(400).json({
        error: 'Se requiere al menos un examen'
      });
    }

    // Verificar que la vacante existe
    const vacancyExists = await pool.query(
      'SELECT * FROM vacancies WHERE id = $1',
      [vacancyId]
    );

    if (vacancyExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Vacante no encontrada'
      });
    }

    // Eliminar exámenes actuales
    await pool.query('DELETE FROM vacancy_exams WHERE vacancy_id = $1', [vacancyId]);

    // Asignar nuevos exámenes
    let insertedCount = 0;
    for (let i = 0; i < examIds.length; i++) {
      const insertResult = await pool.query(
        'INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order) VALUES ($1, $2, $3)',
        [vacancyId, examIds[i], i + 1]
      );
      insertedCount += insertResult.rowCount;
    }

    // Verificar que se guardaron
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as count FROM vacancy_exams WHERE vacancy_id = $1',
      [vacancyId]
    );

    res.json({
      message: 'Exámenes asignados exitosamente',
      vacancyId,
      examsAssigned: examIds.length,
      insertedCount,
      verification: verifyResult.rows[0].count
    });
  } catch (error) {
    console.error('Error asignando exámenes:', error);
    res.status(500).json({
      error: 'Error al asignar exámenes',
      details: error.message
    });
  }
};

// ELIMINAR VACANTE
exports.deleteVacancy = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Se requiere ID de la vacante'
      });
    }

    // Verificar que la vacante existe
    const checkResult = await pool.query(
      'SELECT id, status FROM vacancies WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Vacante no encontrada'
      });
    }

    const vacancy = checkResult.rows[0];

    // Solo permitir eliminar vacantes cerradas
    if (vacancy.status !== 'closed') {
      return res.status(400).json({
        error: 'Solo se pueden eliminar vacantes cerradas'
      });
    }

    // Eliminar referencias en cascada
    // 1. Eliminar vacancy_exams
    await pool.query(
      'DELETE FROM vacancy_exams WHERE vacancy_id = $1',
      [id]
    );

    // 2. Eliminar candidate_vacancies
    await pool.query(
      'DELETE FROM candidate_vacancies WHERE vacancy_id = $1',
      [id]
    );

    // 3. Finalmente, eliminar la vacante
    const result = await pool.query(
      'DELETE FROM vacancies WHERE id = $1 RETURNING id, title',
      [id]
    );

    res.json({
      message: 'Vacante eliminada exitosamente',
      deletedId: result.rows[0].id,
      deletedTitle: result.rows[0].title
    });
  } catch (error) {
    console.error('Error eliminando vacante:', error);
    res.status(500).json({
      error: 'Error al eliminar vacante',
      details: error.message
    });
  }
};
