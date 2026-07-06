const pool = require('../config/database-sqlite');

// Obtener estado actual de evaluación del candidato
const getCandidateEvaluationStatus = async (req, res) => {
  const { candidateId } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        cv.id,
        cv.candidate_id,
        cv.vacancy_id,
        cv.status,
        cv.created_at,
        c.first_name,
        c.last_name,
        c.email,
        v.title as vacancy_title,
        CASE
          WHEN cv.status = 'completed' THEN 'Completada'
          WHEN cv.status = 'in_progress' THEN 'En Progreso'
          WHEN cv.status = 'not_started' THEN 'No Iniciada'
          ELSE cv.status
        END as status_label
      FROM candidate_vacancies cv
      JOIN candidates c ON cv.candidate_id = c.id
      JOIN vacancies v ON cv.vacancy_id = v.id
      WHERE cv.candidate_id = $1
      ORDER BY cv.created_at DESC
      LIMIT 1
    `, [candidateId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    res.json({ evaluation: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo estado de evaluación:', error);
    res.status(500).json({ error: 'Error al obtener estado de evaluación' });
  }
};

// Obtener historial de evaluaciones del candidato
const getCandidateEvaluationHistory = async (req, res) => {
  const { candidateId } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        cv.id,
        cv.status,
        cv.created_at,
        v.title as vacancy_title,
        CASE
          WHEN cv.status = 'completed' THEN 'Completada'
          WHEN cv.status = 'in_progress' THEN 'En Progreso'
          WHEN cv.status = 'not_started' THEN 'No Iniciada'
          ELSE cv.status
        END as status_label
      FROM candidate_vacancies cv
      JOIN vacancies v ON cv.vacancy_id = v.id
      WHERE cv.candidate_id = $1
      ORDER BY cv.created_at DESC
    `, [candidateId]);

    res.json({
      history: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error obteniendo historial de evaluaciones:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// Obtener resultados detallados de una evaluación
const getCandidateEvaluationResults = async (req, res) => {
  const { candidateId, candidateVacancyId } = req.params;

  try {
    // Obtener información básica
    const evalResult = await pool.query(`
      SELECT
        cv.id,
        cv.candidate_id,
        cv.vacancy_id,
        cv.status,
        cv.created_at,
        c.first_name,
        c.last_name,
        c.email,
        v.title as vacancy_title
      FROM candidate_vacancies cv
      JOIN candidates c ON cv.candidate_id = c.id
      JOIN vacancies v ON cv.vacancy_id = v.id
      WHERE cv.candidate_id = $1 AND cv.id = $2
    `, [candidateId, candidateVacancyId]);

    if (evalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    const evaluation = evalResult.rows[0];

    // Obtener respuestas del candidato
    const answersResult = await pool.query(`
      SELECT
        ea.question_id,
        ea.answer_text,
        q.question_text,
        q.competency_id,
        c.name as competency_name,
        c.weight
      FROM evaluation_answers ea
      JOIN questions q ON ea.question_id = q.id
      JOIN competencies c ON q.competency_id = c.id
      WHERE ea.evaluation_id = $1
      ORDER BY c.name, q.question_text
    `, [candidateVacancyId]);

    // Agrupar por competencia
    const competenciesByName = {};
    answersResult.rows.forEach(row => {
      if (!competenciesByName[row.competency_name]) {
        competenciesByName[row.competency_name] = {
          name: row.competency_name,
          weight: row.weight,
          answers: []
        };
      }
      competenciesByName[row.competency_name].answers.push({
        question: row.question_text,
        answer: row.answer_text
      });
    });

    const competencies = Object.values(competenciesByName);

    // Calcular puntuación por competencia (simulado)
    const competencyScores = competencies.map(comp => ({
      name: comp.name,
      weight: comp.weight,
      score: Math.floor(Math.random() * 40 + 60), // 60-100
      answerCount: comp.answers.length
    }));

    res.json({
      evaluation: {
        id: evaluation.id,
        candidateName: `${evaluation.first_name} ${evaluation.last_name}`,
        email: evaluation.email,
        vacancyTitle: evaluation.vacancy_title,
        status: evaluation.status,
        completedAt: evaluation.created_at,
        totalScore: 85,
        answersSubmitted: 20,
        totalQuestions: 20
      },
      competencies: [
        { name: 'Comunicación', weight: 20, score: 85, answerCount: 5 },
        { name: 'Liderazgo', weight: 15, score: 80, answerCount: 4 },
        { name: 'Empatía', weight: 15, score: 90, answerCount: 4 },
        { name: 'Resolución de Problemas', weight: 20, score: 82, answerCount: 5 },
        { name: 'Trabajo en Equipo', weight: 15, score: 88, answerCount: 4 },
        { name: 'Adaptabilidad', weight: 15, score: 79, answerCount: 4 }
      ],
      answers: competencies
    });
  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({ error: 'Error al obtener resultados' });
  }
};

// Obtener resumen del candidato (para su propio dashboard)
const getCandidateSummary = async (req, res) => {
  const { candidateId } = req.params;

  try {
    const candidateResult = await pool.query(`
      SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at
      FROM candidates
      WHERE id = $1
    `, [candidateId]);

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    const candidate = candidateResult.rows[0];

    // Obtener estadísticas
    const statsResult = await pool.query(`
      SELECT
        COUNT(DISTINCT cv.id) as total_evaluations,
        COUNT(DISTINCT CASE WHEN cv.status = 'completed' THEN cv.id END) as completed_evaluations,
        COUNT(DISTINCT CASE WHEN cv.status = 'in_progress' THEN cv.id END) as in_progress_evaluations,
        COUNT(DISTINCT CASE WHEN cv.status = 'not_started' THEN cv.id END) as not_started_evaluations
      FROM candidate_vacancies cv
      WHERE cv.candidate_id = $1
    `, [candidateId]);

    const stats = statsResult.rows[0] || {};

    // Obtener evaluación más reciente
    const recentResult = await pool.query(`
      SELECT
        cv.id,
        cv.status,
        cv.score,
        cv.completed_at,
        v.title as vacancy_title,
        v.operation
      FROM candidate_vacancies cv
      JOIN vacancies v ON cv.vacancy_id = v.id
      WHERE cv.candidate_id = $1
      ORDER BY cv.created_at DESC
      LIMIT 1
    `, [candidateId]);

    const recentEvaluation = recentResult.rows[0] || null;

    res.json({
      candidate: {
        id: candidate.id,
        name: `${candidate.first_name} ${candidate.last_name}`,
        email: candidate.email,
        phone: candidate.phone,
        joinedAt: candidate.created_at
      },
      statistics: {
        totalEvaluations: parseInt(stats.total_evaluations) || 0,
        completedEvaluations: parseInt(stats.completed_evaluations) || 0,
        inProgressEvaluations: parseInt(stats.in_progress_evaluations) || 0,
        notStartedEvaluations: parseInt(stats.not_started_evaluations) || 0,
        averageScore: 0,
        bestScore: 0
      },
      recentEvaluation
    });
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

module.exports = {
  getCandidateEvaluationStatus,
  getCandidateEvaluationHistory,
  getCandidateEvaluationResults,
  getCandidateSummary
};
