const pool = require('../config/database');
const TypingService = require('../services/typingService');
const AuditService = require('../services/auditService');

// OBTENER TYPING TEST POR TOKEN (para URL sharing modal)
exports.getTypingTestByToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar candidate_vacancy por token
    const cvResult = await pool.query(
      `SELECT cv.id, cv.candidate_id, cv.vacancy_id, c.first_name, c.last_name, v.title
       FROM candidate_vacancies cv
       INNER JOIN candidates c ON cv.candidate_id = c.id
       INNER JOIN vacancies v ON cv.vacancy_id = v.id
       WHERE cv.token = $1`,
      [token]
    );

    if (cvResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Token inválido'
      });
    }

    const candidateVacancy = cvResult.rows[0];

    // Obtener el typing test vinculado al exam asignado a esta vacante
    const examCheck = await pool.query(
      `SELECT e.id, e.typing_test_id FROM vacancy_exams ve
       INNER JOIN exams e ON ve.exam_id = e.id
       WHERE ve.vacancy_id = $1 AND e.type = 'typing'
       LIMIT 1`,
      [candidateVacancy.vacancy_id]
    );

    if (examCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'No hay typing test asignado a esta vacante'
      });
    }

    const examRow = examCheck.rows[0];
    const typingTestId = examRow.typing_test_id;

    if (!typingTestId) {
      return res.status(404).json({
        error: 'El exam de typing no tiene un typing_test vinculado'
      });
    }

    // Obtener el typing test específico
    const testResult = await pool.query(
      `SELECT id, title, description, text, difficulty, duration_seconds, word_count
       FROM typing_tests
       WHERE id = $1`,
      [typingTestId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Typing test no encontrado'
      });
    }

    const test = testResult.rows[0];

    res.json({
      candidateVacancy: {
        id: candidateVacancy.id,
        candidateName: `${candidateVacancy.first_name} ${candidateVacancy.last_name}`,
        candidateId: candidateVacancy.candidate_id,
        vacancyTitle: candidateVacancy.title
      },
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        text: test.text,
        difficulty: test.difficulty,
        durationSeconds: test.duration_seconds,
        wordCount: test.word_count
      }
    });
  } catch (error) {
    console.error('Error obteniendo typing test por token:', error);
    res.status(500).json({
      error: 'Error al obtener typing test',
      details: error.message
    });
  }
};

// OBTENER TODOS LOS TYPING TESTS
exports.getAllTests = async (req, res) => {
  try {
    const { difficulty } = req.query;
    const tests = await TypingService.getAllTests(difficulty);

    res.json({
      total: tests.length,
      tests: tests.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        durationSeconds: t.duration_seconds,
        wordCount: t.word_count,
      }))
    });
  } catch (error) {
    console.error('Error obteniendo typing tests:', error);
    res.status(500).json({
      error: 'Error al obtener typing tests',
      details: error.message
    });
  }
};

// OBTENER UN TYPING TEST POR ID (sin el texto para no revelar respuesta)
exports.getTestInfo = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await TypingService.getTest(testId);

    if (!test) {
      return res.status(404).json({
        error: 'Typing test no encontrado'
      });
    }

    console.log('🔍 DEBUG getTestInfo:', { testId, test_keys: Object.keys(test), has_text: !!test.text });

    // Incluir el texto en la respuesta
    res.json({
      id: test.id,
      title: test.title,
      description: test.description,
      difficulty: test.difficulty,
      durationSeconds: test.duration_seconds,
      wordCount: test.word_count,
      text: test.text,
    });
  } catch (error) {
    console.error('Error obteniendo typing test:', error);
    res.status(500).json({
      error: 'Error al obtener typing test',
      details: error.message
    });
  }
};

// OBTENER TEXTO DEL TYPING TEST (solo cuando el candidato está listo)
exports.getTestText = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await TypingService.getTest(testId);

    if (!test) {
      return res.status(404).json({
        error: 'Typing test no encontrado'
      });
    }

    res.json({
      id: test.id,
      title: test.title,
      text: test.text,
      durationSeconds: test.duration_seconds,
    });
  } catch (error) {
    console.error('Error obteniendo texto de test:', error);
    res.status(500).json({
      error: 'Error al obtener texto',
      details: error.message
    });
  }
};

// ENVIAR RESULTADO - Maneja tanto JWT como token de candidato
exports.submitResultWithToken = async (req, res) => {
  try {
    const {
      token,
      typingTestId,
      inputText,
      timeSeconds,
      startedAt,
      candidateVacancyId,
    } = req.body;

    let candidateId;
    let cvId = candidateVacancyId;

    // Intentar obtener candidateId del token de candidato
    if (token) {
      // Primero buscar en candidate_vacancies.token (nuevo sistema URL sharing)
      let tokenResult = await pool.query(
        `SELECT id, candidate_id FROM candidate_vacancies WHERE token = $1`,
        [token]
      );

      if (tokenResult.rows.length > 0) {
        candidateId = tokenResult.rows[0].candidate_id;
        cvId = tokenResult.rows[0].id;
        console.log(`✅ Token encontrado en candidate_vacancies: cvId=${cvId}, candidateId=${candidateId}`);

        // Verificar que el candidato existe, si no, crear uno
        const candidateCheck = await pool.query(
          `SELECT id FROM candidates WHERE id = $1`,
          [candidateId]
        );

        if (candidateCheck.rows.length === 0) {
          console.log(`⚠️ Candidato ${candidateId} no encontrado, creando automáticamente...`);

          // Crear candidato con setval para asegurar que el SERIAL continúa correctamente
          try {
            await pool.query('BEGIN');

            // Obtener el siguiente ID serial
            const seqResult = await pool.query(
              `SELECT setval('candidates_id_seq', (SELECT MAX(id) FROM candidates))`
            );

            // Insertar directamente con el ID específico
            const insertResult = await pool.query(
              `INSERT INTO candidates (id, first_name, last_name, email, status)
               VALUES ($1, $2, $3, $4, $5)`,
              [candidateId, 'Candidato', 'Automático', `candidato${candidateId}@system.local`, 'pending']
            );

            await pool.query('COMMIT');
            console.log(`✅ Candidato ${candidateId} creado automáticamente`);
          } catch (err) {
            await pool.query('ROLLBACK').catch(() => {});

            // Si el error es por duplicate key, el candidato ya existe ahora
            if (err.message.includes('duplicate') || err.message.includes('unique')) {
              console.log(`✅ Candidato ${candidateId} ya existe`);
            } else {
              console.error(`⚠️ Error creando candidato ${candidateId}:`, err.message);
              // Continuar de todas formas, quizás el candidato ya existe
            }
          }
        } else {
          console.log(`✅ Candidato ${candidateId} verificado`);
        }
      } else {
        // Fallback: buscar en evaluations.access_token (legacy system)
        tokenResult = await pool.query(
          `SELECT e.id, e.candidate_vacancy_id, cv.candidate_id
           FROM evaluations e
           JOIN candidate_vacancies cv ON e.candidate_vacancy_id = cv.id
           WHERE e.access_token = $1`,
          [token]
        );

        if (tokenResult.rows.length > 0) {
          candidateId = tokenResult.rows[0].candidate_id;
          cvId = tokenResult.rows[0].candidate_vacancy_id;
          console.log(`✅ Token encontrado en evaluations: cvId=${cvId}, candidateId=${candidateId}`);
        } else {
          // Token no encontrado en ningún lugar
          console.error('❌ Token no encontrado:', token);
          return res.status(401).json({
            error: 'Token inválido'
          });
        }
      }
    } else if (req.user?.id) {
      // Usar JWT si no hay token de candidato
      candidateId = req.user.id;
    } else {
      return res.status(401).json({
        error: 'Autenticación requerida'
      });
    }

    // Validar datos
    if (!typingTestId || !inputText || !timeSeconds) {
      return res.status(400).json({
        error: 'Faltan datos requeridos',
        required: ['typingTestId', 'inputText', 'timeSeconds']
      });
    }

    if (timeSeconds < 10) {
      return res.status(400).json({
        error: 'El tiempo mínimo es 10 segundos'
      });
    }

    // Obtener el texto original del test
    const test = await TypingService.getTest(typingTestId);
    if (!test) {
      return res.status(404).json({
        error: 'Typing test no encontrado'
      });
    }

    // Calcular WPM y métricas
    const metrics = TypingService.calculateWPM(test.text, inputText, timeSeconds);

    // Guardar resultado
    console.log('📝 GUARDANDO RESULTADO:', {
      candidateId,
      cvId,
      typingTestId,
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      totalErrors: metrics.totalErrors,
      timeSeconds
    });

    const result = await TypingService.saveResult({
      candidateId,
      candidateVacancyId: cvId || null,
      typingTestId,
      inputText,
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      grossWPM: metrics.grossWPM,
      netWPM: metrics.netWPM,
      totalErrors: metrics.totalErrors,
      timeSeconds,
      startedAt,
    });

    console.log('✅ RESULTADO GUARDADO:', result);

    res.status(201).json({
      message: 'Resultado de typing test guardado exitosamente',
      result: {
        id: result.id,
        wpm: metrics.wpm,
        grossWPM: metrics.grossWPM,
        netWPM: metrics.netWPM,
        accuracy: metrics.accuracy,
        totalErrors: metrics.totalErrors,
        wordCount: metrics.wordCount,
        completedAt: result.completed_at,
      }
    });
  } catch (error) {
    console.error('❌ Error guardando resultado de typing:', error.message);
    console.error('Stack:', error.stack);
    console.error('Datos que se intentaban guardar:', {
      candidateId,
      cvId,
      typingTestId,
      inputTextLength: inputText?.length,
      timeSeconds
    });

    res.status(500).json({
      error: 'Error al guardar resultado',
      details: error.message,
      debug: {
        candidateId,
        cvId,
        typingTestId,
        hasTes: !!test
      }
    });
  }
};

// OBTENER RESULTADOS DE TYPING DEL CANDIDATO
exports.getCandidateResults = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const results = await TypingService.getCandidateResults(candidateId);

    res.json({
      candidateId,
      total: results.length,
      results: results.map(r => ({
        id: r.id,
        testTitle: r.title,
        difficulty: r.difficulty,
        wpm: r.wpm,
        accuracy: r.accuracy,
        netWPM: r.net_wpm,
        totalErrors: r.total_errors,
        timeSeconds: r.time_taken_seconds,
        completedAt: r.completed_at,
      }))
    });
  } catch (error) {
    console.error('Error obteniendo resultados de typing:', error);
    res.status(500).json({
      error: 'Error al obtener resultados',
      details: error.message
    });
  }
};

// OBTENER REPORTE DE TYPING DEL CANDIDATO
exports.getTypingReport = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const report = await TypingService.generateReport(candidateId);

    if (!report) {
      return res.status(500).json({
        error: 'Error generando reporte'
      });
    }

    res.json({
      candidateId,
      summary: {
        totalTests: report.totalTests,
        averageWPM: report.averageWPM,
        averageAccuracy: report.averageAccuracy,
        bestWPM: report.bestWPM,
        bestAccuracy: report.bestAccuracy,
      },
      results: report.allResults.map(r => ({
        id: r.id,
        testTitle: r.title,
        difficulty: r.difficulty,
        wpm: r.wpm,
        accuracy: r.accuracy,
        completedAt: r.completed_at,
      }))
    });
  } catch (error) {
    console.error('Error generando reporte de typing:', error);
    res.status(500).json({
      error: 'Error al generar reporte',
      details: error.message
    });
  }
};

// CREAR NUEVO TYPING TEST (solo admin)
exports.createTest = async (req, res) => {
  try {
    const { title, description, text, difficulty, durationSeconds } = req.body;

    if (!title || !text || !durationSeconds) {
      return res.status(400).json({
        error: 'Faltan datos requeridos',
        required: ['title', 'text', 'durationSeconds']
      });
    }

    const wordCount = text.trim().split(/\s+/).length;

    const result = await pool.query(
      `INSERT INTO typing_tests
       (title, description, text, difficulty, duration_seconds, word_count)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, difficulty, duration_seconds, word_count`,
      [title, description || '', text, difficulty || 'medium', durationSeconds, wordCount]
    );

    const test = result.rows[0];

    res.status(201).json({
      message: 'Typing test creado exitosamente',
      test: {
        id: test.id,
        title: test.title,
        difficulty: test.difficulty,
        durationSeconds: test.duration_seconds,
        wordCount: test.word_count,
      }
    });
  } catch (error) {
    console.error('Error creando typing test:', error);
    res.status(500).json({
      error: 'Error al crear typing test',
      details: error.message
    });
  }
};
