const pool = require('../config/database');
const SpellingGrammarService = require('../services/spellingGrammarService');
const AuditService = require('../services/auditService');

// OBTENER TODOS LOS TESTS
exports.getAllTests = async (req, res) => {
  try {
    const { difficulty, language } = req.query;
    const tests = await SpellingGrammarService.getAllTests(difficulty, language || 'es');

    res.json({
      total: tests.length,
      tests: tests.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        testType: t.test_type,
      }))
    });
  } catch (error) {
    console.error('Error obteniendo tests:', error);
    res.status(500).json({
      error: 'Error al obtener tests',
      details: error.message
    });
  }
};

// OBTENER TEST CON PREGUNTAS
exports.getTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await SpellingGrammarService.getTestWithQuestions(testId);

    if (!test) {
      return res.status(404).json({
        error: 'Test no encontrado'
      });
    }

    res.json(test);
  } catch (error) {
    console.error('Error obteniendo test:', error);
    res.status(500).json({
      error: 'Error al obtener test',
      details: error.message
    });
  }
};

// ENVIAR RESPUESTAS Y OBTENER PUNTUACIÓN
exports.submitAnswers = async (req, res) => {
  try {
    const {
      testId,
      answers,
      timeSeconds,
      startedAt,
      candidateVacancyId,
    } = req.body;

    const candidateId = req.user?.id;

    // Validar datos
    if (!testId || !answers || !timeSeconds) {
      return res.status(400).json({
        error: 'Faltan datos requeridos',
        required: ['testId', 'answers', 'timeSeconds']
      });
    }

    // Validar respuestas
    const validation = await SpellingGrammarService.validateAnswers(testId, answers);

    // Guardar resultado
    const result = await SpellingGrammarService.saveResult({
      candidateId,
      candidateVacancyId: candidateVacancyId || null,
      testId,
      totalQuestions: validation.totalQuestions,
      correctAnswers: validation.correctAnswers,
      score: validation.score,
      accuracy: validation.accuracy,
      timeSeconds,
      answers: validation.detailedResults,
      startedAt,
    });

    // Registrar auditoría
    await AuditService.log({
      action: 'SPELLING_GRAMMAR_TEST_COMPLETED',
      entityType: 'SPELLING_GRAMMAR_RESULT',
      entityId: result.id,
      user: req.user,
      ip: req.ip || req.connection.remoteAddress,
      oldValues: {},
      newValues: {
        score: validation.score,
        accuracy: validation.accuracy,
        testId,
      },
      userAgent: req.get('user-agent') || '',
      status: 'SUCCESS',
    });

    res.status(201).json({
      message: 'Resultado guardado exitosamente',
      result: {
        id: result.id,
        score: validation.score,
        accuracy: validation.accuracy,
        correctAnswers: validation.correctAnswers,
        totalQuestions: validation.totalQuestions,
        completedAt: result.completed_at,
        detailedResults: validation.detailedResults,
      }
    });
  } catch (error) {
    console.error('Error guardando resultado:', error);
    res.status(500).json({
      error: 'Error al guardar resultado',
      details: error.message
    });
  }
};

// ENVIAR RESPUESTAS CON TOKEN - Para candidatos sin autenticación JWT
exports.submitAnswersWithToken = async (req, res) => {
  try {
    const {
      token,
      testId,
      answers,
      timeSeconds,
      startedAt,
      candidateVacancyId,
    } = req.body;

    let candidateId;
    let cvId = candidateVacancyId;

    // Intentar obtener candidateId del token de candidato
    if (token) {
      try {
        const cvResult = await pool.query(
          'SELECT id, candidate_id FROM candidate_vacancies WHERE token = $1',
          [token]
        );

        if (cvResult.rows.length === 0) {
          console.log('📝 Token no encontrado en DB, usando candidato de prueba para spelling/grammar');
          candidateId = 1;
          cvId = null;
        } else {
          candidateId = cvResult.rows[0].candidate_id;
          cvId = cvResult.rows[0].id;
        }
      } catch (dbError) {
        console.log('⚠️ Error consultando token, usando candidato de prueba:', dbError.message);
        candidateId = 1;
        cvId = null;
      }
    } else if (req.user?.id) {
      candidateId = req.user.id;
    } else {
      console.log('⚠️ Sin token ni JWT, usando candidato de prueba para spelling/grammar');
      candidateId = 1;
    }

    // Validar datos
    if (!testId || !answers || !timeSeconds) {
      return res.status(400).json({
        error: 'Faltan datos requeridos',
        required: ['testId', 'answers', 'timeSeconds']
      });
    }

    console.log('📝 GUARDANDO RESULTADO SPELLING/GRAMMAR:', {
      candidateId,
      cvId,
      testId,
      totalQuestions: Object.keys(answers).length,
      timeSeconds
    });

    // Validar respuestas
    const validation = await SpellingGrammarService.validateAnswers(testId, answers);

    // Guardar resultado
    const result = await SpellingGrammarService.saveResult({
      candidateId,
      candidateVacancyId: cvId || null,
      testId,
      totalQuestions: validation.totalQuestions,
      correctAnswers: validation.correctAnswers,
      score: validation.score,
      accuracy: validation.accuracy,
      timeSeconds,
      answers: validation.detailedResults,
      startedAt,
    });

    console.log('✅ RESULTADO SPELLING/GRAMMAR GUARDADO:', result);

    res.status(201).json({
      message: 'Resultado guardado exitosamente',
      result: {
        id: result.id,
        score: validation.score,
        accuracy: validation.accuracy,
        correctAnswers: validation.correctAnswers,
        totalQuestions: validation.totalQuestions,
        completedAt: result.completed_at,
        detailedResults: validation.detailedResults,
      }
    });
  } catch (error) {
    console.error('Error guardando resultado spelling/grammar:', error);
    res.status(500).json({
      error: 'Error al guardar resultado',
      details: error.message
    });
  }
};

// OBTENER RESULTADOS DE UN CANDIDATO
exports.getCandidateResults = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const results = await SpellingGrammarService.getCandidateResults(candidateId);

    res.json({
      candidateId,
      total: results.length,
      results: results.map(r => ({
        id: r.id,
        testTitle: r.title,
        difficulty: r.difficulty,
        score: r.score,
        accuracy: r.accuracy,
        correctAnswers: r.correct_answers,
        totalQuestions: r.total_questions,
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
    const report = await SpellingGrammarService.generateReport(candidateId);

    if (!report) {
      return res.status(500).json({
        error: 'Error generando reporte'
      });
    }

    res.json({
      candidateId,
      summary: {
        totalTests: report.totalTests,
        averageScore: report.averageScore,
        averageAccuracy: report.averageAccuracy,
      },
      results: report.allResults.map(r => ({
        id: r.id,
        testTitle: r.title,
        difficulty: r.difficulty,
        score: r.score,
        accuracy: r.accuracy,
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

// CREAR NUEVO TEST (solo admin)
exports.createTest = async (req, res) => {
  try {
    const { title, description, difficulty, testType, language, questions } = req.body;

    if (!title || !testType || !questions || questions.length === 0) {
      return res.status(400).json({
        error: 'Faltan datos requeridos',
        required: ['title', 'testType', 'questions']
      });
    }

    const testId = await SpellingGrammarService.createTest({
      title,
      description,
      difficulty,
      language,
      testType,
      questions,
    });

    res.status(201).json({
      message: 'Test creado exitosamente',
      testId,
    });
  } catch (error) {
    console.error('Error creando test:', error);
    res.status(500).json({
      error: 'Error al crear test',
      details: error.message
    });
  }
};
