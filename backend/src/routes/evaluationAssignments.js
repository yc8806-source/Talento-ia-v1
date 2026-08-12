const express = require('express');
const router = express.Router();
const EvaluationAssignmentService = require('../services/evaluationAssignmentService');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * ADMIN: Asignar evaluaciones a candidato
 */
router.post('/assign', verifyToken, async (req, res) => {
  try {
    const { candidateId, vacancyId, evaluationIds } = req.body;

    if (!candidateId || !evaluationIds || evaluationIds.length === 0) {
      return res.status(400).json({
        error: 'candidateId y evaluationIds son requeridos',
      });
    }

    const assignment = await EvaluationAssignmentService.assignEvaluations(
      candidateId,
      vacancyId,
      evaluationIds
    );

    res.status(201).json({
      message: `${evaluationIds.length} evaluaciones asignadas al candidato`,
      assignmentId: assignment.id,
      accessToken: assignment.access_token,
      assignedAt: assignment.assigned_at,
    });
  } catch (error) {
    console.error('Error asignando evaluaciones:', error);
    res.status(500).json({
      error: 'Error al asignar evaluaciones',
      details: error.message,
    });
  }
});

/**
 * CANDIDATO: Obtener siguiente evaluación asignada (usa token)
 */
router.get('/next', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token es requerido' });
    }

    const isValid = await EvaluationAssignmentService.isTokenValid(token);
    if (!isValid) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const nextEval = await EvaluationAssignmentService.getNextEvaluation(token);

    if (!nextEval) {
      return res.status(200).json({ message: 'Todas las evaluaciones completadas' });
    }

    res.json(nextEval);
  } catch (error) {
    console.error('Error obteniendo siguiente evaluación:', error);
    res.status(500).json({
      error: 'Error al obtener evaluación',
      details: error.message,
    });
  }
});

/**
 * CANDIDATO: Marcar evaluación como completada
 */
router.post('/mark-complete', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token es requerido' });
    }

    const isValid = await EvaluationAssignmentService.isTokenValid(token);
    if (!isValid) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const result = await EvaluationAssignmentService.markEvaluationComplete(token);

    res.json({
      message: 'Evaluación marcada como completada',
      allCompleted: result.allCompleted,
      nextEvaluationNumber: result.nextEvaluationNumber,
    });
  } catch (error) {
    console.error('Error marcando evaluación:', error);
    res.status(500).json({
      error: 'Error al marcar evaluación',
      details: error.message,
    });
  }
});

/**
 * ADMIN: Obtener resultados de evaluaciones de un candidato
 */
router.get('/results/:candidateId', verifyToken, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const pool = require('../config/database');

    // Obtener datos del candidato
    const candidateResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM candidates WHERE id = $1',
      [candidateId]
    );

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Candidato no encontrado',
      });
    }

    const candidate = candidateResult.rows[0];

    // Obtener todas las respuestas del candidato agrupadas por examen
    const answersResult = await pool.query(
      `SELECT DISTINCT e.id, e.name, e.description, e.max_time_minutes,
              COUNT(ea.id) as answers_count
       FROM exams e
       LEFT JOIN exam_answers ea ON e.id = ea.exam_id AND ea.candidate_id = $1
       WHERE ea.id IS NOT NULL OR e.id IN (
         SELECT DISTINCT exam_id FROM exam_answers WHERE candidate_id = $1
       )
       GROUP BY e.id, e.name, e.description, e.max_time_minutes`,
      [candidateId]
    );

    // Para cada examen, obtener las respuestas del candidato
    const evaluationResults = [];
    for (const exam of answersResult.rows) {
      const answersDetail = await pool.query(
        `SELECT ea.id, ea.answer_text, ea.is_correct, ea.question_id
         FROM exam_answers ea
         WHERE ea.candidate_id = $1 AND ea.exam_id = $2`,
        [candidateId, exam.id]
      );

      const totalQuestions = await pool.query(
        'SELECT COUNT(*) as count FROM exam_questions WHERE exam_id = $1',
        [exam.id]
      );

      evaluationResults.push({
        evaluationId: exam.id,
        evaluation: {
          id: exam.id,
          name: exam.name,
          description: exam.description,
          max_time_minutes: exam.max_time_minutes,
        },
        answersSubmitted: answersDetail.rows.length,
        totalQuestions: parseInt(totalQuestions.rows[0].count),
        answers: answersDetail.rows,
      });
    }

    res.json({
      candidateId,
      candidateName: `${candidate.first_name} ${candidate.last_name}`,
      email: candidate.email,
      assignedAt: new Date().toISOString(),
      completedAt: evaluationResults.length > 0 ? new Date().toISOString() : null,
      evaluationResults,
    });
  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({
      error: 'Error al obtener resultados',
      details: error.message,
    });
  }
});

/**
 * ADMIN: Obtener asignaciones de un candidato
 */
router.get('/candidate/:candidateId', verifyToken, async (req, res) => {
  try {
    const { candidateId } = req.params;

    const assignments = await EvaluationAssignmentService.getCandidateAssignments(
      candidateId
    );

    res.json({
      candidateId,
      total: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error('Error obteniendo asignaciones:', error);
    res.status(500).json({
      error: 'Error al obtener asignaciones',
      details: error.message,
    });
  }
});

module.exports = router;
