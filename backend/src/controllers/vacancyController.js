const pool = require('../config/database');

// CREAR NUEVA VACANTE
exports.createVacancy = async (req, res) => {
  try {
    const { title, description, createdBy, examIds } = req.body;

    if (!title || !createdBy) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: title, createdBy'
      });
    }

    // Crear vacante
    const vacancyResult = await pool.query(
      'INSERT INTO vacancies (title, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [title, description, createdBy]
    );

    const vacancy = vacancyResult.rows[0];

    // Si hay exámenes, asignarlos a la vacante
    if (examIds && examIds.length > 0) {
      for (let i = 0; i < examIds.length; i++) {
        await pool.query(
          'INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order) VALUES ($1, $2, $3)',
          [vacancy.id, examIds[i], i + 1]
        );
      }
    }

    res.status(201).json({
      message: 'Vacante creada exitosamente',
      vacancy: {
        id: vacancy.id,
        title: vacancy.title,
        description: vacancy.description,
        status: vacancy.status,
        examsAssigned: examIds ? examIds.length : 0,
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

    // Para cada vacante, obtener sus exámenes
    const vacanciesWithExams = await Promise.all(
      result.rows.map(async (vacancy) => {
        const examsResult = await pool.query(
          `SELECT e.id, e.name, e.description, e.max_time_minutes
           FROM exams e
           INNER JOIN vacancy_exams ve ON e.id = ve.exam_id
           WHERE ve.vacancy_id = $1
           ORDER BY ve.exam_order`,
          [vacancy.id]
        );

        return {
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
        };
      })
    );

    res.json({
      total: vacanciesWithExams.length,
      vacancies: vacanciesWithExams
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
    const { title, description, status } = req.body;

    const result = await pool.query(
      'UPDATE vacancies SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), updated_at = NOW() WHERE id = $4 RETURNING *',
      [title, description, status, id]
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
        status: result.rows[0].status
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
    const { vacancyId } = req.params;
    const { examIds } = req.body;

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

    // Eliminar exámenes actuales
    await pool.query('DELETE FROM vacancy_exams WHERE vacancy_id = $1', [vacancyId]);

    // Asignar nuevos exámenes
    for (let i = 0; i < examIds.length; i++) {
      await pool.query(
        'INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order) VALUES ($1, $2, $3)',
        [vacancyId, examIds[i], i + 1]
      );
    }

    res.json({
      message: 'Exámenes asignados exitosamente',
      vacancyId,
      examsAssigned: examIds.length
    });
  } catch (error) {
    console.error('Error asignando exámenes:', error);
    res.status(500).json({
      error: 'Error al asignar exámenes',
      details: error.message
    });
  }
};
