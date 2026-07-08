const pool = require('../config/database');

// CREAR NUEVA VACANTE
exports.createVacancy = async (req, res) => {
  try {
    const { title, description, department, status, available_positions } = req.body;

    if (!title) {
      return res.status(400).json({
        error: 'Falta dato requerido: title'
      });
    }

    // Crear vacante
    const vacancyResult = await pool.query(
      'INSERT INTO vacancies (title, description, department, status, available_positions) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description || '', department || '', status || 'open', available_positions || 1]
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
    const result = await pool.query(
      'SELECT * FROM vacancies ORDER BY created_at DESC'
    );

    const vacancies = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      department: row.department,
      status: row.status,
      availablePositions: row.available_positions,
      filledPositions: row.filled_positions,
      createdAt: row.created_at
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

    // Convertir a números explícitamente
    vacancyId = parseInt(vacancyId, 10);
    if (!Array.isArray(examIds)) {
      examIds = [examIds];
    }
    examIds = examIds.map(id => parseInt(id, 10));

    console.log('[ASSIGN-EXAMS] vacancyId (int):', vacancyId, typeof vacancyId);
    console.log('[ASSIGN-EXAMS] examIds (int[]):', examIds, examIds.map(e => typeof e));
    console.log('[ASSIGN-EXAMS] req.params:', req.params);
    console.log('[ASSIGN-EXAMS] req.body:', req.body);

    if (!examIds || examIds.length === 0) {
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

    console.log('[ASSIGN-EXAMS] Vacante encontrada, ID:', vacancyId);

    // Eliminar exámenes actuales
    const deleteResult = await pool.query('DELETE FROM vacancy_exams WHERE vacancy_id = $1', [vacancyId]);
    console.log('[ASSIGN-EXAMS] Eliminados exámenes previos:', deleteResult.rowCount);

    // Asignar nuevos exámenes
    let insertedCount = 0;
    for (let i = 0; i < examIds.length; i++) {
      try {
        const examId = examIds[i];
        const examOrder = i + 1;
        console.log(`[ASSIGN-EXAMS] Intentando insertar: vacancyId=${vacancyId}, examId=${examId}, order=${examOrder}`);

        const insertResult = await pool.query(
          'INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order) VALUES ($1, $2, $3)',
          [vacancyId, examId, examOrder]
        );
        console.log(`[ASSIGN-EXAMS] ✅ Insertado examen ${examId} en orden ${examOrder}:`, insertResult.rowCount);
        insertedCount += insertResult.rowCount;
      } catch (insertError) {
        console.error(`[ASSIGN-EXAMS] ❌ Error insertando examen ${examIds[i]}:`, insertError.message);
        throw insertError;
      }
    }

    console.log(`[ASSIGN-EXAMS] Total insertados: ${insertedCount}/${examIds.length}`);

    // Verificar que se guardaron
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as count FROM vacancy_exams WHERE vacancy_id = $1',
      [vacancyId]
    );
    console.log(`[ASSIGN-EXAMS] Verificación final: ${verifyResult.rows[0].count} exámenes en vacante ${vacancyId}`);

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
