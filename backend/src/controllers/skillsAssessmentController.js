const pool = require('../config/database');
const SkillsAssessmentService = require('../services/skillsAssessmentService');
const AuditService = require('../services/auditService');

// OBTENER TODAS LAS EVALUACIONES
exports.getAllAssessments = async (req, res) => {
  try {
    const { skillType, difficulty } = req.query;
    const assessments = await SkillsAssessmentService.getAllAssessments(skillType, difficulty);

    res.json({
      total: assessments.length,
      assessments: assessments.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        skillType: a.skill_type,
        difficulty: a.difficulty,
        estimatedTime: a.estimated_time_minutes,
        totalPoints: a.total_points,
        passingScore: a.passing_score,
      }))
    });
  } catch (error) {
    console.error('Error obteniendo assessments:', error);
    res.status(500).json({
      error: 'Error al obtener evaluaciones',
      details: error.message
    });
  }
};

// OBTENER EVALUACIÓN CON PROBLEMAS
exports.getAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await SkillsAssessmentService.getAssessmentWithProblems(assessmentId);

    if (!assessment) {
      return res.status(404).json({
        error: 'Evaluación no encontrada'
      });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error obteniendo evaluación:', error);
    res.status(500).json({
      error: 'Error al obtener evaluación',
      details: error.message
    });
  }
};

// ENVIAR SOLUCIÓN A UN PROBLEMA
exports.submitSolution = async (req, res) => {
  try {
    const {
      assessmentId,
      problemId,
      code,
      output,
    } = req.body;

    const candidateId = req.user?.id;

    // Validar datos
    if (!assessmentId || !problemId || !code) {
      return res.status(400).json({
        error: 'Faltan datos requeridos',
        required: ['assessmentId', 'problemId', 'code']
      });
    }

    // Obtener problema
    const problemResult = await pool.query(
      `SELECT id, expected_output, test_cases, points
       FROM skills_problems WHERE id = $1 AND assessment_id = $2`,
      [problemId, assessmentId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Problema no encontrado'
      });
    }

    const problem = problemResult.rows[0];
    const testCases = problem.test_cases ? (typeof problem.test_cases === 'string' ? JSON.parse(problem.test_cases) : problem.test_cases) : [];

    // Validar solución
    const validation = SkillsAssessmentService.validateSolution(
      output,
      testCases,
      problem.expected_output
    );

    const pointsEarned = validation.isCorrect ? problem.points : 0;

    // Guardar submission
    const submission = await SkillsAssessmentService.saveSubmission({
      candidateId,
      assessmentId,
      problemId,
      code,
      output,
      isCorrect: validation.isCorrect,
      pointsEarned,
      feedback: validation.feedback,
    });

    // Registrar auditoría
    await AuditService.log({
      action: 'SKILL_SOLUTION_SUBMITTED',
      entityType: 'SKILL_SUBMISSION',
      entityId: submission.id,
      user: req.user,
      ip: req.ip || req.connection.remoteAddress,
      oldValues: {},
      newValues: {
        isCorrect: validation.isCorrect,
        pointsEarned,
        problemId,
      },
      userAgent: req.get('user-agent') || '',
      status: 'SUCCESS',
    });

    res.status(201).json({
      message: validation.isCorrect ? 'Solución correcta!' : 'Solución incorrecta',
      result: {
        id: submission.id,
        isCorrect: validation.isCorrect,
        pointsEarned,
        feedback: validation.feedback,
        testResults: validation.testResults,
        submittedAt: submission.submitted_at,
      }
    });
  } catch (error) {
    console.error('Error guardando solución:', error);
    res.status(500).json({
      error: 'Error al guardar solución',
      details: error.message
    });
  }
};

// COMPLETAR EVALUACIÓN
exports.completeAssessment = async (req, res) => {
  try {
    const {
      assessmentId,
      totalPoints,
      pointsEarned,
      problemsSolved,
      totalProblems,
      timeSeconds,
      startedAt,
      candidateVacancyId,
    } = req.body;

    const candidateId = req.user?.id;

    // Validar datos
    if (!assessmentId || !timeSeconds) {
      return res.status(400).json({
        error: 'Faltan datos requeridos'
      });
    }

    // Guardar resultado
    const result = await SkillsAssessmentService.saveResult({
      candidateId,
      candidateVacancyId: candidateVacancyId || null,
      assessmentId,
      totalPoints,
      pointsEarned,
      problemsSolved,
      totalProblems,
      timeSeconds,
      startedAt,
    });

    // Registrar auditoría
    await AuditService.log({
      action: 'SKILL_ASSESSMENT_COMPLETED',
      entityType: 'SKILL_RESULT',
      entityId: result.id,
      user: req.user,
      ip: req.ip || req.connection.remoteAddress,
      oldValues: {},
      newValues: {
        score: result.score,
        passed: result.passed,
        assessmentId,
      },
      userAgent: req.get('user-agent') || '',
      status: 'SUCCESS',
    });

    res.status(201).json({
      message: 'Evaluación completada',
      result: {
        id: result.id,
        score: result.score,
        passed: result.passed,
        completedAt: result.completed_at,
      }
    });
  } catch (error) {
    console.error('Error completando evaluación:', error);
    res.status(500).json({
      error: 'Error al completar evaluación',
      details: error.message
    });
  }
};

// OBTENER RESULTADOS DE UN CANDIDATO
exports.getCandidateResults = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const results = await SkillsAssessmentService.getCandidateResults(candidateId);

    res.json({
      candidateId,
      total: results.length,
      results: results.map(r => ({
        id: r.id,
        assessmentTitle: r.title,
        skillType: r.skill_type,
        difficulty: r.difficulty,
        score: r.score,
        passed: r.passed,
        problemsSolved: r.problems_solved,
        totalProblems: r.total_problems,
        timeSeconds: r.time_taken_seconds,
        completedAt: r.completed_at,
      }))
    });
  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({
      error: 'Error al obtener resultados',
      details: error.message
    });
  }
};

// OBTENER REPORTE
exports.getReport = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const report = await SkillsAssessmentService.generateReport(candidateId);

    if (!report) {
      return res.status(500).json({
        error: 'Error generando reporte'
      });
    }

    res.json({
      candidateId,
      summary: {
        totalAssessments: report.totalAssessments,
        averageScore: report.averageScore,
        passedCount: report.passedCount,
        averageCompletion: report.averageCompletion,
      },
      bySkillType: report.bySkillType,
      results: report.allResults.map(r => ({
        id: r.id,
        assessmentTitle: r.title,
        skillType: r.skill_type,
        score: r.score,
        passed: r.passed,
        completedAt: r.completed_at,
      }))
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({
      error: 'Error al generar reporte',
      details: error.message
    });
  }
};
