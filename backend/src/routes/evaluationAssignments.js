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
 * ADMIN: Obtener resultados de evaluaciones asignadas a candidato
 */
router.get('/results/:candidateId', verifyToken, async (req, res) => {
  try {
    const { candidateId } = req.params;

    const results = await EvaluationAssignmentService.getAssignmentResults(candidateId);

    if (!results) {
      return res.status(404).json({
        error: 'No hay asignaciones para este candidato',
      });
    }

    res.json(results);
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
