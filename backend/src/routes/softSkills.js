const express = require('express');
const router = express.Router();
const pool = require('../config/database-sqlite');

/**
 * Guardar respuesta a pregunta de soft skills
 */
router.post('/:examId/answers', async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionId, answerValue, competencyId, timeSeconds } = req.body;
    const candidateId = req.user?.id || 1; // En producción, del JWT

    if (!questionId || answerValue === undefined) {
      return res.status(400).json({
        error: 'questionId y answerValue son requeridos'
      });
    }

    // Validar que answerValue está entre 1-5
    if (answerValue < 1 || answerValue > 5) {
      return res.status(400).json({
        error: 'answerValue debe estar entre 1 y 5'
      });
    }

    // Guardar respuesta
    const result = await pool.query(
      `INSERT INTO exam_answers
       (candidate_id, exam_id, question_id, answer_value, competency_id, time_spent_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (candidate_id, exam_id, question_id)
       DO UPDATE SET answer_value = $4, updated_at = NOW()
       RETURNING id`,
      [candidateId, examId, questionId, answerValue, competencyId, timeSeconds]
    );

    res.status(201).json({
      message: 'Respuesta guardada exitosamente',
      answerId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error guardando respuesta:', error);
    res.status(500).json({
      error: 'Error al guardar respuesta',
      details: error.message
    });
  }
});

/**
 * Obtener respuestas de soft skills de un candidato
 */
router.get('/:examId/candidate-answers', async (req, res) => {
  try {
    const { examId } = req.params;
    const candidateId = req.user?.id || 1;

    const result = await pool.query(
      `SELECT ea.id, ea.question_id, ea.answer_value, ea.competency_id, eq.title
       FROM exam_answers ea
       JOIN exam_questions eq ON ea.question_id = eq.id
       WHERE ea.exam_id = $1 AND ea.candidate_id = $2
       ORDER BY eq.competency_id, eq.id`,
      [examId, candidateId]
    );

    res.json({
      examId,
      candidateId,
      answers: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo respuestas:', error);
    res.status(500).json({
      error: 'Error al obtener respuestas',
      details: error.message
    });
  }
});

/**
 * Calcular resultados por competencia
 */
router.get('/:examId/results/:candidateId', async (req, res) => {
  try {
    const { examId, candidateId } = req.params;

    // Obtener respuestas agrupadas por competencia
    const result = await pool.query(
      `SELECT
        c.id as competency_id,
        c.name as competency_name,
        COUNT(ea.id) as total_questions,
        AVG(ea.answer_value) as average_score,
        ROUND(AVG(ea.answer_value) * 20) as percentage_score
       FROM exam_questions eq
       LEFT JOIN exam_answers ea ON eq.id = ea.question_id
         AND ea.exam_id = $1
         AND ea.candidate_id = $2
       LEFT JOIN competencies c ON eq.competency_id = c.id
       WHERE eq.exam_id = $1
       GROUP BY c.id, c.name
       ORDER BY c.id`,
      [examId, candidateId]
    );

    // Calcular score general
    const overallScore = result.rows.length > 0
      ? Math.round(
          result.rows.reduce((sum, row) => sum + (row.percentage_score || 0), 0) / result.rows.length
        )
      : 0;

    res.json({
      examId,
      candidateId,
      overallScore,
      competencyResults: result.rows.map(row => ({
        competencyId: row.competency_id,
        competencyName: row.competency_name,
        totalQuestions: parseInt(row.total_questions),
        averageScore: parseFloat(row.average_score || 0),
        percentageScore: parseInt(row.percentage_score || 0)
      }))
    });
  } catch (error) {
    console.error('Error calculando resultados:', error);
    res.status(500).json({
      error: 'Error al calcular resultados',
      details: error.message
    });
  }
});

module.exports = router;
