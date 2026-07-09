const pool = require('../config/database');
const crypto = require('crypto');
const { generateResultsPDF } = require('../services/pdfService');
const { sendEvaluationCompleteEmail } = require('../services/emailService');

// INICIAR EVALUACIÓN
exports.startEvaluation = async (req, res) => {
  try {
    const { candidateVacancyId, examId } = req.body;

    if (!candidateVacancyId || !examId) {
      return res.status(400).json({
        error: 'candidateVacancyId y examId son requeridos'
      });
    }

    // Verificar que existe candidate_vacancy
    const candidateVacancyExists = await pool.query(
      'SELECT * FROM candidate_vacancies WHERE id = $1',
      [candidateVacancyId]
    );

    if (candidateVacancyExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Candidato-Vacante no encontrado'
      });
    }

    // Generar token único de acceso
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Crear evaluación
    const result = await pool.query(
      'INSERT INTO evaluations (candidate_vacancy_id, exam_id, status, access_token, started_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [candidateVacancyId, examId, 'in_progress', accessToken]
    );

    res.status(201).json({
      message: 'Evaluación iniciada',
      evaluation: {
        id: result.rows[0].id,
        accessToken: accessToken,
        startedAt: result.rows[0].started_at
      }
    });
  } catch (error) {
    console.error('Error iniciando evaluación:', error);
    res.status(500).json({
      error: 'Error al iniciar evaluación',
      details: error.message
    });
  }
};

// RESPONDER UNA PREGUNTA
exports.answerQuestion = async (req, res) => {
  try {
    const { evaluationId, questionId, questionOptionId, responseTimeSec } = req.body;

    if (!evaluationId || !questionId || !questionOptionId) {
      return res.status(400).json({
        error: 'evaluationId, questionId y questionOptionId son requeridos'
      });
    }

    // Obtener el puntaje de la opción
    const optionResult = await pool.query(
      'SELECT score FROM question_options WHERE id = $1 AND question_id = $2',
      [questionOptionId, questionId]
    );

    if (optionResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Opción no encontrada'
      });
    }

    const scoreObtained = optionResult.rows[0].score;

    // Guardar respuesta
    const result = await pool.query(
      'INSERT INTO evaluation_answers (evaluation_id, question_id, question_option_id, score_obtained, response_time_seconds) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [evaluationId, questionId, questionOptionId, scoreObtained, responseTimeSec]
    );

    res.status(201).json({
      message: 'Respuesta guardada',
      answer: {
        id: result.rows[0].id,
        scoreObtained: result.rows[0].score_obtained,
        answeredAt: result.rows[0].answered_at
      }
    });
  } catch (error) {
    console.error('Error guardando respuesta:', error);
    res.status(500).json({
      error: 'Error al guardar respuesta',
      details: error.message
    });
  }
};

// FINALIZAR EVALUACIÓN Y CALCULAR RESULTADOS
exports.submitEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;

    // Obtener evaluación
    const evalResult = await pool.query(
      'SELECT * FROM evaluations WHERE id = $1',
      [evaluationId]
    );

    if (evalResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Evaluación no encontrada'
      });
    }

    const evaluation = evalResult.rows[0];

    // Marcar como completada
    await pool.query(
      'UPDATE evaluations SET status = $1, completed_at = NOW() WHERE id = $2',
      ['completed', evaluationId]
    );

    // Obtener todas las respuestas de la evaluación
    const answersResult = await pool.query(
      `SELECT ea.score_obtained, q.competency_id
       FROM evaluation_answers ea
       INNER JOIN questions q ON ea.question_id = q.id
       WHERE ea.evaluation_id = $1`,
      [evaluationId]
    );

    // Agrupar puntuaciones por competencia
    const competencyScores = {};
    const competencyMaxScores = {};

    // Obtener todas las preguntas del examen
    const questionsResult = await pool.query(
      `SELECT q.competency_id, MAX(qo.score) as max_score
       FROM exam_questions eq
       INNER JOIN questions q ON eq.question_id = q.id
       INNER JOIN question_options qo ON q.id = qo.question_id
       WHERE eq.exam_id = $1
       GROUP BY q.competency_id`,
      [evaluation.exam_id]
    );

    // Inicializar scores máximos
    questionsResult.rows.forEach(row => {
      competencyMaxScores[row.competency_id] = row.max_score;
    });

    // Sumar respuestas por competencia
    answersResult.rows.forEach(answer => {
      const competencyId = answer.competency_id;
      if (!competencyScores[competencyId]) {
        competencyScores[competencyId] = 0;
      }
      competencyScores[competencyId] += answer.score_obtained;
    });

    // Guardar resultados por competencia
    for (const [competencyId, totalScore] of Object.entries(competencyScores)) {
      const maxScore = competencyMaxScores[competencyId] || totalScore;

      await pool.query(
        `INSERT INTO evaluation_results (candidate_vacancy_id, competency_id, total_score, max_possible_score, calculated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (candidate_vacancy_id, competency_id) DO UPDATE SET total_score = $3`,
        [evaluation.candidate_vacancy_id, competencyId, totalScore, maxScore]
      );
    }

    // Calcular recomendaciones por operación
    await calculateAndSaveRecommendations(evaluation.candidate_vacancy_id);

    // Enviar email de confirmación
    const candidateQuery = await pool.query(
      'SELECT c.first_name, c.last_name, c.email FROM candidates c INNER JOIN candidate_vacancies cv ON c.id = cv.candidate_id WHERE cv.id = $1',
      [evaluation.candidate_vacancy_id]
    );

    if (candidateQuery.rows.length > 0) {
      const candidate = candidateQuery.rows[0];
      await sendEvaluationCompleteEmail(candidate.email, `${candidate.first_name} ${candidate.last_name}`, {});
    }

    res.json({
      message: 'Evaluación completada exitosamente',
      evaluationId: evaluationId
    });
  } catch (error) {
    console.error('Error finalizando evaluación:', error);
    res.status(500).json({
      error: 'Error al finalizar evaluación',
      details: error.message
    });
  }
};

// CALCULAR RECOMENDACIONES (Motor de scoring)
async function calculateAndSaveRecommendations(candidateVacancyId) {
  try {
    // Obtener todos los scores de competencias del candidato
    const resultsQuery = await pool.query(
      `SELECT competency_id, total_score, max_possible_score,
              CASE WHEN max_possible_score > 0
                   THEN (total_score::float / max_possible_score * 100)
                   ELSE 0
              END as percentage
       FROM evaluation_results
       WHERE candidate_vacancy_id = $1`,
      [candidateVacancyId]
    );

    const competencyScores = {};
    resultsQuery.rows.forEach(row => {
      competencyScores[row.competency_id] = row.percentage;
    });

    // Obtener la matriz de pesos
    const weightsQuery = await pool.query(
      `SELECT o.id as operation_id, o.name as operation_name,
              c.id as competency_id, w.weight
       FROM competency_operation_weights w
       INNER JOIN competencies c ON w.competency_id = c.id
       INNER JOIN operations o ON w.operation_id = o.id`
    );

    // Calcular score por operación
    const operationScores = {};
    weightsQuery.rows.forEach(row => {
      const operationId = row.operation_id;
      const competencyId = row.competency_id;
      const weight = parseFloat(row.weight);
      const score = competencyScores[competencyId] || 0;

      if (!operationScores[operationId]) {
        operationScores[operationId] = {
          name: row.operation_name,
          score: 0
        };
      }

      operationScores[operationId].score += score * weight;
    });

    // Ordenar por score descendente
    const sortedOperations = Object.entries(operationScores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 4); // Top 4 operaciones

    // Guardar recomendaciones
    for (let i = 0; i < sortedOperations.length; i++) {
      const [operationId, operationData] = sortedOperations[i];

      await pool.query(
        `INSERT INTO candidate_recommendations (candidate_vacancy_id, operation_id, affinity_score, ranking, calculated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (candidate_vacancy_id, operation_id, ranking) DO UPDATE SET affinity_score = $3`,
        [candidateVacancyId, operationId, Math.round(operationData.score * 100) / 100, i + 1]
      );
    }

    // Actualizar recomendación principal en candidate_vacancies
    if (sortedOperations.length > 0) {
      const mainOperationId = sortedOperations[0][0];
      await pool.query(
        'UPDATE candidate_vacancies SET recommended_operation_id = $1 WHERE id = $2',
        [mainOperationId, candidateVacancyId]
      );
    }
  } catch (error) {
    console.error('Error calculando recomendaciones:', error);
    throw error;
  }
}

// OBTENER RESULTADOS DE EVALUACIÓN (por candidateVacancyId)
exports.getEvaluationResults = async (req, res) => {
  try {
    const { candidateVacancyId } = req.params;

    // Obtener información básica
    const infoQuery = await pool.query(
      `SELECT cv.id, cv.candidate_id, c.first_name, c.last_name, c.email, v.title
       FROM candidate_vacancies cv
       INNER JOIN candidates c ON cv.candidate_id = c.id
       INNER JOIN vacancies v ON cv.vacancy_id = v.id
       WHERE cv.id = $1`,
      [candidateVacancyId]
    );

    if (infoQuery.rows.length === 0) {
      return res.status(404).json({
        error: 'Evaluación no encontrada'
      });
    }

    const info = infoQuery.rows[0];
    const candidateId = info.candidate_id;

    // Obtener respuestas por competencia con scores correctos
    const resultsQuery = await pool.query(
      `SELECT
        comp.id,
        comp.name,
        COUNT(DISTINCT ea.question_id) as total_questions_answered,
        SUM(CAST(COALESCE(qo.score, '0') AS FLOAT)) as total_score
       FROM exam_answers ea
       INNER JOIN questions q ON ea.question_id = q.id
       LEFT JOIN question_options qo ON qo.id = ea.answer_value AND qo.question_id = q.id
       INNER JOIN competencies comp ON q.competency_id = comp.id
       WHERE ea.candidate_id = $1
       GROUP BY comp.id, comp.name
       ORDER BY total_score DESC`,
      [candidateId]
    );

    // Calcular puntajes por competencia
    const competencies = resultsQuery.rows.map(r => {
      // Máximo posible = preguntas respondidas * 5 (puntuación máxima por pregunta)
      const maxScore = (r.total_questions_answered || 0) * 5;
      const percentage = maxScore > 0
        ? (r.total_score / maxScore) * 100
        : 0;
      return {
        name: r.name,
        id: r.id,
        score: Math.round(r.total_score || 0),
        maxScore: maxScore,
        percentage: Math.round(percentage)
      };
    });

    // Obtener total general
    const totalScore = competencies.reduce((sum, c) => sum + (c.score || 0), 0);
    const totalMax = competencies.reduce((sum, c) => sum + (c.maxScore || 0), 0);
    const overallPercentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

    console.log(`Results calculation for candidate ${candidateId}:`, {
      totalScore,
      totalMax,
      overallPercentage: Math.round(overallPercentage),
      competencies: competencies.map(c => ({ name: c.name, score: c.score, max: c.maxScore, pct: c.percentage }))
    });

    res.json({
      candidate: {
        firstName: info.first_name,
        lastName: info.last_name,
        email: info.email
      },
      vacancy: info.title,
      overall: {
        score: totalScore,
        maxScore: totalMax,
        percentage: Math.round(overallPercentage * 100) / 100
      },
      competencies: competencies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({
      error: 'Error al obtener resultados',
      details: error.message
    });
  }
};

// OBTENER EVALUACIÓN POR TOKEN (ACCESO ANÓNIMO)
exports.getEvaluationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT e.*, c.first_name, c.last_name, c.email, v.title, ex.id as exam_id, ex.time_limit_minutes
       FROM evaluations e
       INNER JOIN candidate_vacancies cv ON e.candidate_vacancy_id = cv.id
       INNER JOIN candidates c ON cv.candidate_id = c.id
       INNER JOIN vacancies v ON cv.vacancy_id = v.id
       INNER JOIN exams ex ON e.exam_id = ex.id
       WHERE e.access_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Token inválido o evaluación no encontrada'
      });
    }

    const evaluation = result.rows[0];

    // Verificar si ya fue completada
    if (evaluation.status === 'completed') {
      return res.status(403).json({
        error: 'Esta evaluación ya ha sido completada',
        completedAt: evaluation.completed_at
      });
    }

    // Obtener preguntas del examen
    const questionsResult = await pool.query(
      `SELECT q.id, q.title, q.type, q.competency_id,
              jsonb_agg(jsonb_build_object('id', qo.id, 'value', qo.value, 'score', qo.score)) as options
       FROM exam_questions eq
       INNER JOIN questions q ON eq.question_id = q.id
       LEFT JOIN question_options qo ON q.id = qo.question_id
       WHERE eq.exam_id = $1
       GROUP BY q.id, q.title, q.type, q.competency_id
       ORDER BY eq.question_order`,
      [evaluation.exam_id]
    );

    res.json({
      evaluation: {
        id: evaluation.id,
        token: token,
        candidateName: `${evaluation.first_name} ${evaluation.last_name}`,
        vacancyTitle: evaluation.title,
        timeLimitMinutes: evaluation.time_limit_minutes,
        startedAt: evaluation.started_at
      },
      questions: questionsResult.rows
    });
  } catch (error) {
    console.error('Error obteniendo evaluación por token:', error);
    res.status(500).json({
      error: 'Error al obtener evaluación',
      details: error.message
    });
  }
};

// CREAR Y COMPARTIR LINK DE EVALUACIÓN
exports.createAndShareEvaluationLink = async (req, res) => {
  try {
    const { candidateVacancyId, examId } = req.body;

    if (!candidateVacancyId || !examId) {
      return res.status(400).json({
        error: 'candidateVacancyId y examId son requeridos'
      });
    }

    // Verificar que existe candidate_vacancy
    const candidateVacancyExists = await pool.query(
      'SELECT cv.*, c.email, c.first_name, c.last_name, v.title FROM candidate_vacancies cv INNER JOIN candidates c ON cv.candidate_id = c.id INNER JOIN vacancies v ON cv.vacancy_id = v.id WHERE cv.id = $1',
      [candidateVacancyId]
    );

    if (candidateVacancyExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Candidato-Vacante no encontrado'
      });
    }

    const candidateVacancy = candidateVacancyExists.rows[0];

    // Generar token único
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Crear evaluación
    const result = await pool.query(
      'INSERT INTO evaluations (candidate_vacancy_id, exam_id, status, access_token, started_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [candidateVacancyId, examId, 'pending', accessToken]
    );

    const evaluation = result.rows[0];
    const evaluationLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/evaluacion/${accessToken}`;

    // Enviar email con link
    const { sendInvitationEmail } = require('../services/emailService');
    await sendInvitationEmail(
      candidateVacancy.email,
      candidateVacancy.first_name,
      evaluationLink,
      candidateVacancy.title
    );

    // Actualizar estado de candidate_vacancy
    await pool.query(
      'UPDATE candidate_vacancies SET status = $1 WHERE id = $2',
      ['invited', candidateVacancyId]
    );

    res.status(201).json({
      message: 'Link de evaluación generado y enviado por email',
      evaluation: {
        id: evaluation.id,
        token: accessToken,
        link: evaluationLink,
        candidateEmail: candidateVacancy.email,
        candidateName: `${candidateVacancy.first_name} ${candidateVacancy.last_name}`,
        vacancy: candidateVacancy.title
      }
    });
  } catch (error) {
    console.error('Error creando link de evaluación:', error);
    res.status(500).json({
      error: 'Error al crear link de evaluación',
      details: error.message
    });
  }
};

// GENERAR PDF DE RESULTADOS
exports.generatePDF = async (req, res) => {
  try {
    const { candidateVacancyId } = req.params;

    // Obtener información del candidato
    const infoQuery = await pool.query(
      `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, v.title
       FROM candidate_vacancies cv
       INNER JOIN candidates c ON cv.candidate_id = c.id
       INNER JOIN vacancies v ON cv.vacancy_id = v.id
       WHERE cv.id = $1`,
      [candidateVacancyId]
    );

    if (infoQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    const info = infoQuery.rows[0];

    // Obtener competencias y recomendaciones
    const resultsQuery = await pool.query(
      `SELECT c.name, er.total_score, er.max_possible_score,
              ROUND((er.total_score::float / er.max_possible_score * 100)::numeric, 2) as percentage
       FROM evaluation_results er
       INNER JOIN competencies c ON er.competency_id = c.id
       WHERE er.candidate_vacancy_id = $1
       ORDER BY er.percentage DESC`,
      [candidateVacancyId]
    );

    const recommendationsQuery = await pool.query(
      `SELECT o.name, cr.affinity_score, cr.ranking
       FROM candidate_recommendations cr
       INNER JOIN operations o ON cr.operation_id = o.id
       WHERE cr.candidate_vacancy_id = $1
       ORDER BY cr.ranking`,
      [candidateVacancyId]
    );

    const candidateData = {
      id: info.id,
      firstName: info.first_name,
      lastName: info.last_name,
      email: info.email,
      phone: info.phone
    };

    const evaluationData = {
      vacancy: info.title,
      competencies: resultsQuery.rows.map(r => ({
        name: r.name,
        score: r.total_score,
        maxScore: r.max_possible_score,
        percentage: parseFloat(r.percentage)
      })),
      recommendations: recommendationsQuery.rows.map(r => ({
        rank: r.ranking,
        operation: r.name,
        affinityScore: r.affinity_score
      }))
    };

    // Generar PDF
    const pdfData = await generateResultsPDF(candidateData, evaluationData);

    res.json({
      message: 'PDF generado exitosamente',
      pdf: pdfData
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({
      error: 'Error al generar PDF',
      details: error.message
    });
  }
};

// OBTENER INFORMACIÓN DE VACANTE Y EXÁMENES POR TOKEN (para acceso sin login)
exports.getVacancyEvaluationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar el token en candidate_vacancies
    const cvResult = await pool.query(
      `SELECT cv.id, cv.candidate_id, cv.vacancy_id, c.first_name, c.last_name, c.email, v.title, v.description
       FROM candidate_vacancies cv
       INNER JOIN candidates c ON cv.candidate_id = c.id
       INNER JOIN vacancies v ON cv.vacancy_id = v.id
       WHERE cv.token = $1`,
      [token]
    );

    if (cvResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Token inválido o no encontrado'
      });
    }

    const candidateVacancy = cvResult.rows[0];

    // Obtener los exámenes asignados a la vacante con estado de completitud
    const examsResult = await pool.query(
      `SELECT e.id, e.name, e.description, e.type, e.max_time_minutes,
              (COUNT(ea.id) > 0) as completed
       FROM exams e
       INNER JOIN vacancy_exams ve ON e.id = ve.exam_id
       LEFT JOIN exam_answers ea ON e.id = ea.exam_id AND ea.candidate_id = $2
       WHERE ve.vacancy_id = $1
       GROUP BY e.id, e.name, e.description, e.type, e.max_time_minutes, ve.exam_order
       ORDER BY ve.exam_order`,
      [candidateVacancy.vacancy_id, candidateVacancy.candidate_id]
    );

    res.json({
      candidateVacancy: {
        id: candidateVacancy.id,
        candidateName: `${candidateVacancy.first_name} ${candidateVacancy.last_name}`,
        candidateEmail: candidateVacancy.email,
        vacancyTitle: candidateVacancy.title,
        vacancyDescription: candidateVacancy.description
      },
      exams: examsResult.rows.map(exam => ({
        id: exam.id,
        name: exam.name,
        description: exam.description,
        type: exam.type,
        maxTimeMinutes: exam.max_time_minutes,
        completed: exam.completed
      }))
    });
  } catch (error) {
    console.error('Error obteniendo información de vacante:', error);
    res.status(500).json({
      error: 'Error al obtener información',
      details: error.message
    });
  }
};

// OBTENER ESTADO DE EXÁMENES POR TOKEN
exports.getExamStatusByToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar candidate_vacancy
    const cvResult = await pool.query(
      'SELECT cv.id, cv.candidate_id, cv.vacancy_id FROM candidate_vacancies cv WHERE cv.token = $1',
      [token]
    );

    if (cvResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Token inválido'
      });
    }

    const candidateVacancy = cvResult.rows[0];
    const candidateId = candidateVacancy.candidate_id;
    const vacancyId = candidateVacancy.vacancy_id;

    // Obtener todos los exámenes de la vacante
    const examsResult = await pool.query(
      `SELECT e.id, e.name, e.max_time_minutes
       FROM exams e
       INNER JOIN vacancy_exams ve ON e.id = ve.exam_id
       WHERE ve.vacancy_id = $1
       ORDER BY ve.exam_order`,
      [vacancyId]
    );

    // Para cada examen, verificar si ya fue completado
    const examsWithStatus = await Promise.all(
      examsResult.rows.map(async (exam) => {
        const completedResult = await pool.query(
          'SELECT COUNT(*) as count FROM exam_answers WHERE candidate_id = $1 AND exam_id = $2',
          [candidateId, exam.id]
        );

        const isCompleted = completedResult.rows[0].count > 0;

        return {
          id: exam.id,
          name: exam.name,
          maxTimeMinutes: exam.max_time_minutes,
          completed: isCompleted
        };
      })
    );

    res.json({
      candidateId,
      vacancyId,
      exams: examsWithStatus
    });
  } catch (error) {
    console.error('Error obteniendo estado de exámenes:', error);
    res.status(500).json({
      error: 'Error al obtener estado',
      details: error.message
    });
  }
};

// GUARDAR RESPUESTAS DE EXAMEN CON TOKEN
exports.submitExamAnswersByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { examId, answers } = req.body;

    if (!token || !examId || !answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        error: 'Token, examId y answers son requeridos'
      });
    }

    // Buscar candidate_vacancy con el token
    const cvResult = await pool.query(
      'SELECT * FROM candidate_vacancies WHERE token = $1',
      [token]
    );

    if (cvResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Token inválido'
      });
    }

    const candidateVacancy = cvResult.rows[0];
    const candidateId = candidateVacancy.candidate_id;

    // Guardar cada respuesta
    let totalScore = 0;
    let savedCount = 0;

    for (const [questionIndexStr, answerData] of Object.entries(answers)) {
      const questionIndex = parseInt(questionIndexStr, 10);
      const questionId = answerData.questionId || answerData.id;
      const optionId = answerData.optionId || answerData.selected;
      const timeSpent = answerData.timeSpent || 0;

      if (!questionId || !optionId) {
        console.warn(`Skipping answer: missing questionId (${questionId}) or optionId (${optionId})`);
        continue;
      }

      // Obtener puntaje de la opción
      const scoreResult = await pool.query(
        'SELECT score FROM question_options WHERE id = $1 AND question_id = $2',
        [optionId, questionId]
      );

      let score = 0;
      if (scoreResult.rows.length > 0) {
        score = parseFloat(scoreResult.rows[0].score) || 0;
        totalScore += score;
      }

      // Guardar respuesta - usar DELETE + INSERT para mayor confiabilidad
      try {
        await pool.query(
          'DELETE FROM exam_answers WHERE candidate_id = $1 AND exam_id = $2 AND question_id = $3',
          [candidateId, examId, questionId]
        );

        const insertResult = await pool.query(
          'INSERT INTO exam_answers (candidate_id, exam_id, question_id, answer_value, time_spent_seconds) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [candidateId, examId, questionId, optionId, timeSpent]
        );

        if (insertResult.rows.length > 0) {
          savedCount++;
        }
      } catch (insertError) {
        console.error(`Error inserting answer for question ${questionId}:`, insertError.message);
      }
    }

    // Actualizar estado de candidate_vacancy a 'completed'
    await pool.query(
      'UPDATE candidate_vacancies SET status = $1, updated_at = NOW() WHERE id = $2',
      ['completed', candidateVacancy.id]
    );

    res.status(201).json({
      message: 'Respuestas guardadas exitosamente',
      candidateId,
      examId,
      answersCount: Object.keys(answers).length,
      savedCount: savedCount,
      totalScore,
      status: 'completed'
    });
  } catch (error) {
    console.error('Error guardando respuestas:', error);
    res.status(500).json({
      error: 'Error al guardar respuestas',
      details: error.message
    });
  }
};
