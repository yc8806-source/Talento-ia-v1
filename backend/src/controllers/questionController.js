const pool = require('../config/database');

// CREAR NUEVA PREGUNTA
exports.createQuestion = async (req, res) => {
  try {
    const { title, type, competencyId, description, options } = req.body;

    if (!title || !type || !competencyId || !options || options.length === 0) {
      return res.status(400).json({
        error: 'Faltan datos: title, type, competencyId, options'
      });
    }

    if (!['multiple_choice', 'true_false', 'likert'].includes(type)) {
      return res.status(400).json({
        error: 'Tipo de pregunta inválido'
      });
    }

    // Crear pregunta
    const questionResult = await pool.query(
      'INSERT INTO questions (title, type, competency_id, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, type, competencyId, description]
    );

    const question = questionResult.rows[0];

    // Crear opciones
    const savedOptions = [];
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const optionResult = await pool.query(
        'INSERT INTO question_options (question_id, text, score, option_order) VALUES ($1, $2, $3, $4) RETURNING *',
        [question.id, option.text, option.score, i + 1]
      );
      savedOptions.push({
        id: optionResult.rows[0].id,
        text: optionResult.rows[0].text,
        score: optionResult.rows[0].score,
        order: optionResult.rows[0].option_order
      });
    }

    res.status(201).json({
      message: 'Pregunta creada exitosamente',
      question: {
        id: question.id,
        title: question.title,
        type: question.type,
        competencyId: question.competency_id,
        options: savedOptions,
        createdAt: question.created_at
      }
    });
  } catch (error) {
    console.error('Error creando pregunta:', error);
    res.status(500).json({
      error: 'Error al crear pregunta',
      details: error.message
    });
  }
};

// OBTENER TODAS LAS PREGUNTAS
exports.getQuestions = async (req, res) => {
  try {
    const { competencyId, type } = req.query;

    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (competencyId) {
      query += ` AND competency_id = $${params.length + 1}`;
      params.push(competencyId);
    }

    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    // Para cada pregunta, obtener sus opciones
    const questionsWithOptions = await Promise.all(
      result.rows.map(async (question) => {
        const optionsResult = await pool.query(
          'SELECT id, text, score, option_order FROM question_options WHERE question_id = $1 ORDER BY option_order',
          [question.id]
        );

        return {
          id: question.id,
          title: question.title,
          type: question.type,
          competencyId: question.competency_id,
          description: question.description,
          options: optionsResult.rows.map(o => ({
            id: o.id,
            text: o.text,
            score: o.score,
            order: o.option_order
          })),
          createdAt: question.created_at
        };
      })
    );

    res.json({
      total: questionsWithOptions.length,
      questions: questionsWithOptions
    });
  } catch (error) {
    console.error('Error obteniendo preguntas:', error);
    res.status(500).json({
      error: 'Error al obtener preguntas',
      details: error.message
    });
  }
};

// OBTENER UNA PREGUNTA POR ID
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const questionResult = await pool.query(
      'SELECT * FROM questions WHERE id = $1',
      [id]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Pregunta no encontrada'
      });
    }

    const question = questionResult.rows[0];

    // Obtener opciones
    const optionsResult = await pool.query(
      'SELECT id, text, score, option_order FROM question_options WHERE question_id = $1 ORDER BY option_order',
      [id]
    );

    res.json({
      id: question.id,
      title: question.title,
      type: question.type,
      competencyId: question.competency_id,
      description: question.description,
      options: optionsResult.rows.map(o => ({
        id: o.id,
        text: o.text,
        score: o.score,
        order: o.option_order
      })),
      createdAt: question.created_at
    });
  } catch (error) {
    console.error('Error obteniendo pregunta:', error);
    res.status(500).json({
      error: 'Error al obtener pregunta',
      details: error.message
    });
  }
};

// ACTUALIZAR PREGUNTA
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, competencyId, description, options } = req.body;

    // Actualizar pregunta
    const result = await pool.query(
      'UPDATE questions SET title = $1, type = $2, competency_id = $3, description = $4 WHERE id = $5 RETURNING *',
      [title, type, competencyId, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Pregunta no encontrada'
      });
    }

    const question = result.rows[0];

    // Actualizar opciones si se proporcionan
    if (options && options.length > 0) {
      // Eliminar opciones anteriores
      await pool.query('DELETE FROM question_options WHERE question_id = $1', [id]);

      // Crear nuevas opciones
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        await pool.query(
          'INSERT INTO question_options (question_id, text, score, option_order) VALUES ($1, $2, $3, $4)',
          [id, option.text, option.score, i + 1]
        );
      }
    }

    res.json({
      message: 'Pregunta actualizada exitosamente',
      question: {
        id: question.id,
        title: question.title,
        type: question.type,
        competencyId: question.competency_id,
        description: question.description
      }
    });
  } catch (error) {
    console.error('Error actualizando pregunta:', error);
    res.status(500).json({
      error: 'Error al actualizar pregunta',
      details: error.message
    });
  }
};

// ELIMINAR PREGUNTA
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // Primero eliminar las opciones
    await pool.query('DELETE FROM question_options WHERE question_id = $1', [id]);

    // Luego eliminar la pregunta
    const result = await pool.query(
      'DELETE FROM questions WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Pregunta no encontrada'
      });
    }

    res.json({
      message: 'Pregunta eliminada exitosamente',
      questionId: id
    });
  } catch (error) {
    console.error('Error eliminando pregunta:', error);
    res.status(500).json({
      error: 'Error al eliminar pregunta',
      details: error.message
    });
  }
};
