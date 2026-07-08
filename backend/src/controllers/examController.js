const pool = require('../config/database');

// CREAR NUEVO EXAMEN
exports.createExam = async (req, res) => {
  try {
    const { name, description, maxTimeMinutes, minScore, createdBy, questionIds } = req.body;

    if (!name || !maxTimeMinutes || !createdBy) {
      return res.status(400).json({
        error: 'Faltan datos: name, maxTimeMinutes, createdBy'
      });
    }

    // Crear examen
    const examResult = await pool.query(
      'INSERT INTO exams (name, description, max_time_minutes, min_score, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, maxTimeMinutes, minScore, createdBy]
    );

    const exam = examResult.rows[0];

    // Asignar preguntas si se proporcionan
    if (questionIds && questionIds.length > 0) {
      for (let i = 0; i < questionIds.length; i++) {
        await pool.query(
          'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)',
          [exam.id, questionIds[i], i + 1]
        );
      }
    }

    res.status(201).json({
      message: 'Examen creado exitosamente',
      exam: {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        maxTimeMinutes: exam.max_time_minutes,
        minScore: exam.min_score,
        questionsAdded: questionIds ? questionIds.length : 0,
        createdAt: exam.created_at
      }
    });
  } catch (error) {
    console.error('Error creando examen:', error);
    res.status(500).json({
      error: 'Error al crear examen',
      details: error.message
    });
  }
};

// OBTENER TODOS LOS EXÁMENES
exports.getExams = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM exams ORDER BY created_at DESC'
    );

    const exams = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      maxTimeMinutes: row.max_time_minutes,
      createdAt: row.created_at
    }));

    res.json({
      total: exams.length,
      exams: exams
    });
  } catch (error) {
    console.error('Error obteniendo exámenes:', error);
    res.status(500).json({
      error: 'Error al obtener exámenes',
      details: error.message
    });
  }
};

// OBTENER UN EXAMEN POR ID (con todas sus preguntas y opciones)
exports.getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const examResult = await pool.query(
      'SELECT * FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Examen no encontrado'
      });
    }

    const exam = examResult.rows[0];

    // Obtener preguntas del examen con sus opciones
    const questionsResult = await pool.query(
      `SELECT q.id, q.title, q.type, q.competency_id, eq.question_order
       FROM questions q
       INNER JOIN exam_questions eq ON q.id = eq.question_id
       WHERE eq.exam_id = $1
       ORDER BY eq.question_order`,
      [id]
    );

    // Para cada pregunta, obtener sus opciones
    const questionsWithOptions = await Promise.all(
      questionsResult.rows.map(async (question) => {
        const optionsResult = await pool.query(
          'SELECT id, text, score, option_order FROM question_options WHERE question_id = $1 ORDER BY option_order',
          [question.id]
        );

        return {
          id: question.id,
          title: question.title,
          type: question.type,
          competencyId: question.competency_id,
          order: question.question_order,
          options: optionsResult.rows.map(o => ({
            id: o.id,
            text: o.text,
            score: o.score,
            order: o.option_order
          }))
        };
      })
    );

    res.json({
      id: exam.id,
      name: exam.name,
      description: exam.description,
      maxTimeMinutes: exam.max_time_minutes,
      minScore: exam.min_score,
      totalQuestions: questionsWithOptions.length,
      questions: questionsWithOptions,
      createdAt: exam.created_at
    });
  } catch (error) {
    console.error('Error obteniendo examen:', error);
    res.status(500).json({
      error: 'Error al obtener examen',
      details: error.message
    });
  }
};

// AGREGAR PREGUNTAS A UN EXAMEN
exports.addQuestionsToExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionIds } = req.body;

    if (!questionIds || questionIds.length === 0) {
      return res.status(400).json({
        error: 'Se requiere al menos una pregunta'
      });
    }

    // Verificar que el examen existe
    const examExists = await pool.query(
      'SELECT * FROM exams WHERE id = $1',
      [examId]
    );

    if (examExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Examen no encontrado'
      });
    }

    // Obtener el orden máximo actual
    const maxOrderResult = await pool.query(
      'SELECT MAX(question_order) as max_order FROM exam_questions WHERE exam_id = $1',
      [examId]
    );

    let order = (maxOrderResult.rows[0].max_order || 0) + 1;

    // Agregar preguntas
    for (const questionId of questionIds) {
      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)',
        [examId, questionId, order]
      );
      order++;
    }

    res.status(201).json({
      message: 'Preguntas agregadas al examen exitosamente',
      examId,
      questionsAdded: questionIds.length
    });
  } catch (error) {
    console.error('Error agregando preguntas:', error);
    res.status(500).json({
      error: 'Error al agregar preguntas',
      details: error.message
    });
  }
};

// ACTUALIZAR EXAMEN
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, maxTimeMinutes, minScore } = req.body;

    const result = await pool.query(
      'UPDATE exams SET name = $1, description = $2, max_time_minutes = $3, min_score = $4 WHERE id = $5 RETURNING *',
      [name, description, maxTimeMinutes, minScore, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    res.json({
      message: 'Examen actualizado exitosamente',
      exam: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        maxTimeMinutes: result.rows[0].max_time_minutes,
        minScore: result.rows[0].min_score
      }
    });
  } catch (error) {
    console.error('Error actualizando examen:', error);
    res.status(500).json({
      error: 'Error al actualizar examen',
      details: error.message
    });
  }
};

// ELIMINAR EXAMEN
exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    // Primero eliminar las preguntas asociadas
    await pool.query('DELETE FROM exam_questions WHERE exam_id = $1', [id]);

    // Luego eliminar el examen
    const result = await pool.query(
      'DELETE FROM exams WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    res.json({
      message: 'Examen eliminado exitosamente',
      examId: id
    });
  } catch (error) {
    console.error('Error eliminando examen:', error);
    res.status(500).json({
      error: 'Error al eliminar examen',
      details: error.message
    });
  }
};

// REMOVER PREGUNTA DE EXAMEN
exports.removeQuestionFromExam = async (req, res) => {
  try {
    const { examId, questionId } = req.params;

    const result = await pool.query(
      'DELETE FROM exam_questions WHERE exam_id = $1 AND question_id = $2 RETURNING id',
      [examId, questionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada en el examen' });
    }

    res.json({
      message: 'Pregunta removida del examen exitosamente'
    });
  } catch (error) {
    console.error('Error removiendo pregunta:', error);
    res.status(500).json({
      error: 'Error al remover pregunta',
      details: error.message
    });
  }
};
