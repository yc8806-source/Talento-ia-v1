const express = require('express');
const router = express.Router();
const EvaluationAssignmentService = require('../services/evaluationAssignmentService');
const ExamScoreService = require('../services/examScoreService');
const { verifyToken } = require('../middleware/authMiddleware');
const pool = require('../config/database');
const { generateEvaluationResultsPDF } = require('../services/pdfService');
const { calculateTPLResults } = require('../services/examScoreService');

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
    const evaluationResults = [];

    // 1. Obtener resultados de Typing Tests
    try {
      const typingResults = await pool.query(
        `SELECT tr.id, tt.title, tt.description, tr.wpm, tr.net_wpm, tr.accuracy,
                tr.total_errors, tr.completed_at
         FROM typing_results tr
         JOIN typing_tests tt ON tr.typing_test_id = tt.id
         WHERE tr.candidate_id = $1
         ORDER BY tr.completed_at DESC`,
        [candidateId]
      );

      typingResults.rows.forEach(result => {
        evaluationResults.push({
          type: 'typing',
          name: result.title || 'Prueba de Mecanografía',
          description: result.description,
          completedAt: result.completed_at,
          data: {
            wpm: result.wpm,
            netWPM: result.net_wpm,
            accuracy: parseFloat(result.accuracy) || 0,
            totalErrors: result.total_errors,
          }
        });
      });
    } catch (err) {
      console.log('No typing results found:', err.message);
    }

    // 2. Obtener resultados de Spelling & Grammar Tests
    try {
      const spellingResults = await pool.query(
        `SELECT sgr.id, sgt.title, sgt.description, sgr.score, sgr.percentage,
                sgr.correct_answers, sgr.completed_at
         FROM spelling_grammar_results sgr
         JOIN spelling_grammar_tests sgt ON sgr.test_id = sgt.id
         WHERE sgr.candidate_id = $1
         ORDER BY sgr.completed_at DESC`,
        [candidateId]
      );

      spellingResults.rows.forEach(result => {
        evaluationResults.push({
          type: 'spelling',
          name: result.title || 'Prueba de Ortografía',
          description: result.description,
          completedAt: result.completed_at,
          data: {
            score: parseFloat(result.score) || 0,
            accuracy: parseFloat(result.percentage) || 0,
            correctAnswers: result.correct_answers,
          }
        });
      });
    } catch (err) {
      console.log('No spelling results found:', err.message);
    }

    // 3. Obtener resultados de Evaluations (exam-based, with competency_results in JSONB)
    try {
      const evaluationResults_query = await pool.query(
        `SELECT er.id, er.overall_score, er.competency_results, er.created_at, e.name, e.description
         FROM evaluation_results er
         LEFT JOIN exams e ON er.exam_id = e.id
         WHERE er.candidate_id = $1
         ORDER BY er.created_at DESC`,
        [candidateId]
      );

      evaluationResults_query.rows.forEach(result => {
        // Parse competency_results JSONB if it exists
        const competencies = {};
        if (result.competency_results && typeof result.competency_results === 'object') {
          Object.entries(result.competency_results).forEach(([key, value]) => {
            competencies[key] = {
              score: value.score || 0,
              maxScore: value.maxScore || 100,
              percentage: parseFloat(value.percentage) || 0
            };
          });
        }

        evaluationResults.push({
          type: 'evaluation',
          name: result.name || 'Evaluación de Competencias',
          description: result.description,
          completedAt: result.created_at,
          data: competencies
        });
      });
    } catch (err) {
      console.log('No evaluation results found:', err.message);
    }

    // Ordenar por fecha completada
    evaluationResults.sort((a, b) => {
      const dateA = new Date(a.completedAt || 0);
      const dateB = new Date(b.completedAt || 0);
      return dateB - dateA;
    });

    res.json({
      candidateId,
      candidateName: `${candidate.first_name} ${candidate.last_name}`,
      email: candidate.email,
      assignedAt: new Date().toISOString(),
      completedAt: evaluationResults.length > 0 ? evaluationResults[0].completedAt : null,
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
 * INTERNAL: Inicializar tabla de puntuaciones de exámenes
 */
router.post('/init-scores-table', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_scores (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL,
        exam_id INTEGER NOT NULL,
        total_score INTEGER NOT NULL DEFAULT 0,
        max_score INTEGER NOT NULL DEFAULT 0,
        percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(candidate_id, exam_id),
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      )
    `);

    await pool.query('CREATE INDEX IF NOT EXISTS idx_exam_scores_candidate ON exam_scores(candidate_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_exam_scores_exam ON exam_scores(exam_id)');

    res.json({ message: 'exam_scores table initialized successfully' });
  } catch (error) {
    console.error('Error initializing scores table:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ADMIN: Calcular y guardar puntuación de un examen completado
 */
router.post('/calculate-score/:candidateId/:examId', verifyToken, async (req, res) => {
  try {
    const { candidateId, examId } = req.params;

    const score = await ExamScoreService.calculateAndSaveScore(parseInt(candidateId), parseInt(examId));

    if (!score) {
      return res.status(404).json({ error: 'No se pudo calcular la puntuación' });
    }

    res.json({
      message: 'Puntuación guardada exitosamente',
      score,
    });
  } catch (error) {
    console.error('Error calculating score:', error);
    res.status(500).json({ error: error.message });
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

/**
 * DEBUG: Ver qué datos se pasan al PDF
 */
router.get('/debug-pdf/:candidateId', verifyToken, async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Obtener datos del candidato
    const candidateResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM candidates WHERE id = $1',
      [candidateId]
    );

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    const candidate = candidateResult.rows[0];
    const evaluationResults = [];

    // Obtener evaluation results
    const evaluationResults_query = await pool.query(
      `SELECT er.id, er.overall_score, er.competency_results, er.created_at, e.name, e.description
       FROM evaluation_results er
       LEFT JOIN exams e ON er.exam_id = e.id
       WHERE er.candidate_id = $1
       ORDER BY er.created_at DESC`,
      [candidateId]
    );

    evaluationResults_query.rows.forEach(result => {
      const competencies = {};
      if (result.competency_results && typeof result.competency_results === 'object') {
        Object.entries(result.competency_results).forEach(([key, value]) => {
          competencies[key] = {
            score: value.score || 0,
            maxScore: value.maxScore || 100,
            percentage: parseFloat(value.percentage) || 0
          };
        });
      }

      evaluationResults.push({
        type: 'evaluation',
        name: result.name || 'Evaluación de Competencias',
        description: result.description,
        completedAt: result.created_at,
        data: competencies
      });
    });

    res.json({
      candidateId,
      candidateName: `${candidate.first_name} ${candidate.last_name}`,
      email: candidate.email,
      evaluationResults
    });
  } catch (error) {
    console.error('Error en debug-pdf:', error);
    res.status(500).json({
      error: 'Error',
      details: error.message,
    });
  }
});

/**
 * ADMIN: Descargar resultados como PDF
 */
router.get('/results-pdf/:candidateId', verifyToken, async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Obtener datos del candidato
    const candidateResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM candidates WHERE id = $1',
      [candidateId]
    );

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    const candidate = candidateResult.rows[0];
    const evaluationResults = [];

    // 1. Obtener resultados de TPL-80
    try {
      const competencies = await calculateTPLResults(candidateId, 27);
      if (competencies && competencies.length > 0) {
        const totalScore = competencies.reduce((sum, c) => sum + c.score, 0);
        const maxScore = competencies.length * 40;
        const overallPercentage = (totalScore / maxScore) * 100;

        let overallLevel;
        if (overallPercentage >= 85) overallLevel = 'Muy Alto';
        else if (overallPercentage >= 70) overallLevel = 'Alto';
        else if (overallPercentage >= 55) overallLevel = 'Medio';
        else if (overallPercentage >= 40) overallLevel = 'Bajo';
        else overallLevel = 'Muy Bajo';

        evaluationResults.push({
          type: 'evaluation',
          name: 'TEST DE PERSONALIDAD LABORAL (TPL-80)',
          data: competencies.reduce((acc, comp) => {
            acc[comp.name] = {
              score: comp.score,
              maxScore: comp.maxScore,
              percentage: comp.percentage,
              level: comp.level
            };
            return acc;
          }, {})
        });
      }
    } catch (err) {
      console.log('No TPL-80 results:', err.message);
    }

    // 3. Obtener typing results
    try {
      const typingResults = await pool.query(
        `SELECT tr.*, tt.duration_seconds, tt.word_count
         FROM typing_results tr
         INNER JOIN typing_tests tt ON tr.typing_test_id = tt.id
         WHERE tr.candidate_id = $1
         ORDER BY tr.completed_at DESC`,
        [candidateId]
      );

      if (typingResults.rows.length > 0) {
        const typing = typingResults.rows[0];
        evaluationResults.push({
          type: 'evaluation',
          name: 'PRUEBA DE VELOCIDAD DE MECANOGRAFÍA',
          data: {
            'Velocidad (WPM)': {
              score: typing.wpm || 0,
              percentage: typing.wpm ? Math.min((typing.wpm / 80) * 100, 100) : 0,
              level: (typing.wpm || 0) >= 60 ? 'Alto' : (typing.wpm || 0) >= 40 ? 'Medio' : 'Bajo'
            },
            'Precisión': {
              score: typing.accuracy || 0,
              percentage: typing.accuracy || 0,
              level: (typing.accuracy || 0) >= 95 ? 'Alto' : (typing.accuracy || 0) >= 85 ? 'Medio' : 'Bajo'
            },
            'Tiempo (seg)': {
              score: typing.time_taken_seconds || 0,
              percentage: 100,
              level: 'Completado'
            }
          }
        });
      }
    } catch (err) {
      console.log('No typing results:', err.message);
    }

    // 4. Obtener spelling results
    try {
      const spellingResults = await pool.query(
        `SELECT sr.*, sg.difficulty, sg.title
         FROM spelling_grammar_results sr
         INNER JOIN spelling_grammar_tests sg ON sr.test_id = sg.id
         WHERE sr.candidate_id = $1
         ORDER BY sr.completed_at DESC`,
        [candidateId]
      );

      if (spellingResults.rows.length > 0) {
        const spelling = spellingResults.rows[0];
        const spellingPercentage = spelling.total_questions > 0
          ? (spelling.correct_answers / spelling.total_questions) * 100
          : 0;

        evaluationResults.push({
          type: 'evaluation',
          name: 'PRUEBA DE ORTOGRAFÍA Y GRAMÁTICA',
          data: {
            'Respuestas Correctas': {
              score: spelling.correct_answers || 0,
              maxScore: spelling.total_questions || 0,
              percentage: Math.round(spellingPercentage * 100) / 100,
              level: spellingPercentage >= 80 ? 'Alto' : spellingPercentage >= 60 ? 'Medio' : 'Bajo'
            },
            'Precisión': {
              score: spelling.accuracy || 0,
              percentage: spelling.accuracy || 0,
              level: (spelling.accuracy || 0) >= 85 ? 'Alto' : (spelling.accuracy || 0) >= 70 ? 'Medio' : 'Bajo'
            },
            'Dificultad': {
              score: spelling.difficulty || 'N/A',
              percentage: 100,
              level: 'Completado'
            }
          }
        });
      }
    } catch (err) {
      console.log('No spelling results:', err.message);
    }

    // 5. Obtener otras evaluation results (si las hay)
    try {
      const evaluationResults_query = await pool.query(
        `SELECT er.id, er.overall_score, er.competency_results, er.created_at, e.name, e.description
         FROM evaluation_results er
         LEFT JOIN exams e ON er.exam_id = e.id
         WHERE er.candidate_id = $1 AND e.id != 27
         ORDER BY er.created_at DESC`,
        [candidateId]
      );

      evaluationResults_query.rows.forEach(result => {
        const competencies = {};
        if (result.competency_results && typeof result.competency_results === 'object') {
          Object.entries(result.competency_results).forEach(([key, value]) => {
            competencies[key] = {
              score: value.score || 0,
              maxScore: value.maxScore || 100,
              percentage: parseFloat(value.percentage) || 0
            };
          });
        }

        evaluationResults.push({
          type: 'evaluation',
          name: result.name || 'Evaluación de Competencias',
          description: result.description,
          completedAt: result.created_at,
          data: competencies
        });
      });
    } catch (err) {
      console.log('No additional evaluation results found:', err.message);
    }

    // Log datos para debugging
    console.log('📋 PDF Data - Evaluation Results:', JSON.stringify(evaluationResults, null, 2));

    // Generar PDF
    const pdfResult = await generateEvaluationResultsPDF({
      candidateId,
      candidateName: `${candidate.first_name} ${candidate.last_name}`,
      email: candidate.email,
      evaluationResults
    });

    // Enviar PDF
    res.download(pdfResult.filepath);
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({
      error: 'Error al generar PDF',
      details: error.message,
    });
  }
});

module.exports = router;
