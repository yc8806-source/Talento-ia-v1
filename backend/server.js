const fs = require('fs');
const path = require('path');

// NUCLEAR OPTION: Leer .env y REEMPLAZAR variables del sistema
// Esto es DESPUÉS de que Render cargue sus vars, así reemplazamos las viejas
function forceLoadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...val] = trimmed.split('=');
        if (key) {
          const value = val.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
          if (key.trim() === 'DATABASE_URL') {
            console.log(`🔒 OVERRIDE: DATABASE_URL set from .env file`);
          }
        }
      }
    });
  }
}

// Primero intenta dotenv normal
require('dotenv').config({ override: true });

// LUEGO FUERZA con la lectura del archivo SOLO EN DESARROLLO
// En producción (Render), usa las variables de entorno del dashboard
if (process.env.NODE_ENV !== 'production') {
  forceLoadEnv();
}

const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');
const { runMigrations } = require('./src/migrations/runMigrations');
const {
  helmetConfig,
  sanitizeMiddleware,
  auditLogger,
  loginLimiter,
  registerLimiter,
  apiLimiter,
} = require('./src/middleware/securityMiddleware');

const { verifyToken } = require('./src/middleware/authMiddleware');

const app = express();

app.use(helmetConfig);
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://talento-ia-v1-frontend.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow localhost on any port in development
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// IMPORTANTE: express.json() DEBE ir ANTES de otros middlewares que usen req.body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));

// PUBLIC ENDPOINTS SIN MIDDLEWARE - Antes de tokenValidator
const typingController = require('./src/controllers/typingController');
const SpellingGrammarService = require('./src/services/spellingGrammarService');

app.post('/api/typing/results/submit-public', typingController.submitResultWithToken);

// Spelling Grammar - GET test
app.get('/api/spelling-grammar-public/tests/:testId', async (req, res) => {
  try {
    const testId = parseInt(req.params.testId, 10);
    console.log(`🔍 [PUBLIC] Getting test ${testId}`);

    // Direct query
    const testResult = await pool.query(
      `SELECT id, title, description, difficulty, test_type, language, duration_seconds, total_questions
       FROM spelling_grammar_tests WHERE id = $1`,
      [testId]
    );

    console.log(`✅ Query returned ${testResult.rows.length} rows for test ${testId}`);

    if (testResult.rows.length === 0) {
      console.log(`❌ Test ${testId} not found`);
      return res.status(404).json({ error: 'Test no encontrado', testId });
    }

    const test = testResult.rows[0];

    const questionsResult = await pool.query(
      `SELECT id, question_type, question_text, explanation, options, difficulty, order_number
       FROM spelling_grammar_questions
       WHERE test_id = $1
       ORDER BY order_number ASC`,
      [testId]
    );

    console.log(`✅ Found ${questionsResult.rows.length} questions for test ${testId}`);

    // ⚠️ FIX: If test has no questions, return error (test data might be deleted)
    if (questionsResult.rows.length === 0) {
      console.error(`❌ CRITICAL: Test ${testId} exists but has NO questions!`);
      return res.status(422).json({
        error: 'Prueba incompleta',
        details: `La prueba #${testId} existe pero no tiene preguntas. Contactar al administrador.`,
        testId
      });
    }

    const response = {
      ...test,
      totalQuestions: questionsResult.rows.length,
      questions: questionsResult.rows.map(q => ({
        id: q.id,
        question_type: q.question_type,
        question_text: q.question_text,
        explanation: q.explanation,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        difficulty: q.difficulty,
        order_number: q.order_number
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('❌ ERROR in public endpoint:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// PUBLIC: Get any exam (regular or spelling) by ID - for candidates without auth
app.get('/api/exams-public/:examId', async (req, res) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    console.log(`🔍 [PUBLIC] Getting exam ${examId}`);

    // Try to get regular exam first
    const regularExamResult = await pool.query(
      `SELECT id, name, description, type, max_time_minutes as maxTimeMinutes, created_at
       FROM exams WHERE id = $1`,
      [examId]
    );

    if (regularExamResult.rows.length > 0) {
      const exam = regularExamResult.rows[0];
      const questionsResult = await pool.query(
        `SELECT id, title, type, competency_id, competency_name, correct_answer, points
         FROM questions WHERE exam_id = $1`,
        [examId]
      );

      return res.json({
        id: exam.id,
        name: exam.name,
        description: exam.description,
        type: exam.type,
        maxTimeMinutes: exam.maxTimeMinutes,
        questions: questionsResult.rows.map(q => ({
          id: q.id,
          title: q.title,
          type: q.type,
          options: [], // Regular exams don't use this endpoint format
          competencyId: q.competency_id,
          competencyName: q.competency_name,
          correctAnswer: q.correct_answer,
          points: q.points
        }))
      });
    }

    // Try to get spelling exam
    console.log(`📖 Not found as regular exam, checking spelling_grammar_tests...`);
    const spellingExamResult = await pool.query(
      `SELECT id, title, description, duration_seconds, test_type, language
       FROM spelling_grammar_tests WHERE id = $1`,
      [examId]
    );

    if (spellingExamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found', examId });
    }

    const exam = spellingExamResult.rows[0];
    const questionsResult = await pool.query(
      `SELECT id, question_type, question_text, explanation, options, difficulty, order_number
       FROM spelling_grammar_questions WHERE test_id = $1
       ORDER BY order_number ASC`,
      [examId]
    );

    console.log(`✅ Found spelling exam ${examId} with ${questionsResult.rows.length} questions`);

    // Format questions for frontend
    const formattedQuestions = questionsResult.rows.map(q => {
      let options = [];

      if (q.options) {
        try {
          let parsed = q.options;
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }

          // Handle both { options: [...] } and direct array formats
          const optionsList = Array.isArray(parsed) ? parsed : (parsed.options || []);

          // Convert each option to {id, text} format
          options = optionsList.map((opt, idx) => ({
            id: idx,
            text: typeof opt === 'string' ? opt : (opt.text || String(opt))
          }));

          console.log(`   Question ${q.id}: ${optionsList.length} options parsed`);
        } catch (e) {
          console.error(`   ❌ Error parsing options for question ${q.id}:`, e.message);
        }
      }

      return {
        id: q.id,
        title: q.question_text,
        type: q.question_type,
        options: options, // MUST be array of {id, text}
        difficulty: q.difficulty,
        order_number: q.order_number,
        explanation: q.explanation
      };
    });

    res.json({
      id: exam.id,
      name: exam.title,
      description: exam.description,
      type: 'spelling',
      maxTimeMinutes: Math.ceil(exam.duration_seconds / 60),
      questions: formattedQuestions
    });
  } catch (error) {
    console.error('❌ ERROR in public exam endpoint:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Candidate Tokens - GET (for token recovery)
app.get('/api/candidates/:candidateId/tokens', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const result = await pool.query(
      `SELECT cv.id, cv.token, cv.status, cv.created_at, v.id as vacancy_id, v.title as vacancy_title
       FROM candidate_vacancies cv
       INNER JOIN vacancies v ON cv.vacancy_id = v.id
       WHERE cv.candidate_id = $1
       ORDER BY cv.created_at DESC`,
      [candidateId]
    );
    const tokens = result.rows.map(row => ({
      id: row.id,
      token: row.token,
      status: row.status,
      vacancyId: row.vacancy_id,
      vacancyTitle: row.vacancy_title,
      createdAt: row.created_at,
      testUrl: `${process.env.FRONTEND_URL || 'https://talento-ia-v1-frontend.onrender.com'}/evaluacion?token=${row.token}`
    }));
    res.json({ candidateId, total: tokens.length, tokens });
  } catch (error) {
    console.error('Error obteniendo tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

// Spelling Grammar - POST submit
app.post('/api/spelling-grammar-public/results/submit', async (req, res) => {
  try {
    const { token, testId, answers, timeSeconds, startedAt } = req.body;
    const testIdNum = parseInt(testId, 10);

    console.log(`📝 [SUBMIT] Received submission for test ${testIdNum}`);
    console.log(`📝 Answers count: ${Object.keys(answers || {}).length}`);

    let candidateId = 1;
    let cvId = null;

    if (token) {
      try {
        const cvResult = await pool.query(
          'SELECT id, candidate_id FROM candidate_vacancies WHERE token = $1',
          [token]
        );
        if (cvResult.rows.length > 0) {
          candidateId = cvResult.rows[0].candidate_id;
          cvId = cvResult.rows[0].id;
        }
      } catch (e) {
        console.warn('⚠️ Token lookup failed, using default candidateId');
        candidateId = 1;
      }
    }

    console.log(`📝 Validating answers...`);
    const validation = await SpellingGrammarService.validateAnswers(testIdNum, answers);
    console.log(`✅ Validation complete: ${validation.correctAnswers}/${validation.totalQuestions}`);

    console.log(`📝 Saving result...`);
    const result = await SpellingGrammarService.saveResult({
      candidateId,
      candidateVacancyId: cvId,
      testId: testIdNum,
      totalQuestions: validation.totalQuestions,
      correctAnswers: validation.correctAnswers,
      score: validation.score,
      accuracy: validation.accuracy,
      timeSeconds,
      answers: validation.detailedResults,
      startedAt,
    });

    console.log(`✅ Result saved: ${result.id}`);

    res.status(201).json({
      message: 'Resultado guardado exitosamente',
      result: {
        id: result.id,
        score: validation.score,
        accuracy: validation.accuracy,
        correctAnswers: validation.correctAnswers,
        totalQuestions: validation.totalQuestions,
        completedAt: result.completed_at,
      }
    });
  } catch (error) {
    console.error('❌ ERROR in submit endpoint:', error.message, error.stack);
    res.status(500).json({ error: error.message, details: error.toString() });
  }
});

app.use(sanitizeMiddleware);
app.use(auditLogger);
app.use('/api/', apiLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Health check - PUBLIC endpoint (before auth middleware)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TESTING_VERSION_2026_07_21_MIDDLEWARE_FIX',
    typing_test: 'ENABLED',
    timer_delay: 'IMPLEMENTED',
    completion_status: 'IMPLEMENTED',
    spelling_grammar_test: 'ENABLED',
    token_recovery: 'FULLY_WORKING'
  });
});

// Importar rutas
const authRoutes = require('./src/routes/auth');
const candidateRoutes = require('./src/routes/candidates');
const vacancyRoutes = require('./src/routes/vacancies');
const evaluationRoutes = require('./src/routes/evaluations');
const questionRoutes = require('./src/routes/questions');
const examRoutes = require('./src/routes/exams');
const reportRoutes = require('./src/routes/reports');
const teamRoutes = require('./src/routes/teams');
const permissionRoutes = require('./src/routes/permissions');
const candidateDashboardRoutes = require('./src/routes/candidateDashboard');
const bulkActionsRoutes = require('./src/routes/bulkActions');
const auditRoutes = require('./src/routes/audit');
const alertRoutes = require('./src/routes/alerts');
const typingRoutes = require('./src/routes/typing');
const spellingGrammarRoutes = require('./src/routes/spellingGrammar');
const skillsAssessmentRoutes = require('./src/routes/skillsAssessment');
const evaluationAssignmentRoutes = require('./src/routes/evaluationAssignments');
const softSkillsRoutes = require('./src/routes/softSkills');
const analyticsRoutes = require('./src/routes/analytics');

// Usar rutas
app.use('/api/auth', authRoutes);

// Cada ruta aplica verifyToken internamente si lo necesita
// NO aplicar globalmente para permitir rutas públicas en cada router

app.use('/api/candidates', candidateRoutes);
app.use('/api/candidate-dashboard', candidateDashboardRoutes);
app.use('/api/bulk-actions', bulkActionsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/typing', typingRoutes);
app.use('/api/spelling-grammar', spellingGrammarRoutes);
app.use('/api/skills', skillsAssessmentRoutes);
app.use('/api/assignments', evaluationAssignmentRoutes);
app.use('/api/soft-skills', softSkillsRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/analytics', analyticsRoutes);

console.log('✅ Rutas cargadas correctamente');

// DEBUG: Test spelling grammar endpoint
app.get('/api/test-spelling', (req, res) => {
  res.json({
    message: 'Spelling grammar module is loaded',
    testEndpoint: '/api/spelling-grammar/tests/:testId'
  });
});

// DEBUG: List all spelling grammar tests
app.get('/api/debug-spelling-tests', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title FROM spelling_grammar_tests');
    res.json({
      count: result.rows.length,
      tests: result.rows
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// DEBUG: Show EXACT structure of exam 1 in DB
app.get('/api/debug/exam-1-raw', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Fetching raw exam 1 structure from DB');

    const testResult = await pool.query(
      `SELECT id, title, description FROM spelling_grammar_tests WHERE id = 1`
    );

    if (testResult.rows.length === 0) {
      return res.json({ error: 'Test 1 not found' });
    }

    const test = testResult.rows[0];

    const questionsResult = await pool.query(
      `SELECT id, question_type, question_text, options, difficulty FROM spelling_grammar_questions WHERE test_id = 1 LIMIT 1`
    );

    const question = questionsResult.rows[0] || {};

    res.json({
      message: 'Raw structure from database',
      test: test,
      sampleQuestion: {
        ...question,
        optionsRawValue: question.options,
        optionsType: typeof question.options,
        optionsIsString: typeof question.options === 'string',
        sampleFirstCharacters: question.options ? String(question.options).substring(0, 100) : null
      }
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// DEBUG: Comprehensive spelling exams debug with question count
app.get('/api/debug/all-spelling-exams', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Fetching all spelling exams from DB');
    const result = await pool.query(
      `SELECT sg.id, sg.title, sg.description, sg.duration_seconds,
              COUNT(sgq.id) as question_count
       FROM spelling_grammar_tests sg
       LEFT JOIN spelling_grammar_questions sgq ON sg.id = sgq.test_id
       GROUP BY sg.id, sg.title, sg.description, sg.duration_seconds
       ORDER BY sg.id`
    );

    console.log(`✅ Found ${result.rows.length} spelling exams in DB`);

    res.json({
      success: true,
      total: result.rows.length,
      message: 'Spelling exams y cantidad de preguntas:',
      exams: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        durationSeconds: row.duration_seconds,
        questionCount: parseInt(row.question_count),
        exampleId: `spelling:${row.id}`
      }))
    });
  } catch (error) {
    console.error('❌ ERROR in debug endpoint:', error);
    res.status(500).json({
      error: 'Error fetching spelling exams',
      details: error.message
    });
  }
});

// DEBUG: Check spelling exam and questions status
app.get('/api/debug/spelling-exam-status', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Checking spelling exam status');

    const testResult = await pool.query(
      `SELECT id, title, total_questions, created_at
       FROM spelling_grammar_tests
       ORDER BY id`
    );

    const statusDetails = await Promise.all(
      testResult.rows.map(async (test) => {
        const questionsResult = await pool.query(
          `SELECT COUNT(*) as count FROM spelling_grammar_questions WHERE test_id = $1`,
          [test.id]
        );
        return {
          id: test.id,
          title: test.title,
          totalQuestionsColumn: test.total_questions,
          actualQuestions: parseInt(questionsResult.rows[0].count),
          status: parseInt(questionsResult.rows[0].count) > 0 ? '✅ OK' : '❌ NO QUESTIONS'
        };
      })
    );

    res.json({
      message: 'Spelling exam status report',
      exams: statusDetails,
      problemFound: statusDetails.some(e => e.actualQuestions === 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RESTORE: Recreate questions for spelling exam ID=1 if missing
app.get('/api/restore/spelling-exam-questions', async (req, res) => {
  try {
    console.log('🔧 RESTORE: Checking and restoring spelling exam questions...');

    // Check test 1
    const testCheck = await pool.query(
      `SELECT COUNT(*) as count FROM spelling_grammar_questions WHERE test_id = 1`
    );

    const questionCount = parseInt(testCheck.rows[0].count);

    if (questionCount > 0) {
      return res.json({
        message: 'Test already has questions',
        testId: 1,
        questionCount
      });
    }

    console.log('⚠️  Test 1 has no questions. Attempting to restore...');

    // Get the spelling test details
    const testResult = await pool.query(
      `SELECT id, title, description, difficulty, test_type, language, duration_seconds
       FROM spelling_grammar_tests WHERE id = 1`
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test ID=1 not found' });
    }

    const test = testResult.rows[0];

    // Recreate 50 sample spelling questions for Spanish
    const questions = [];
    const questionTexts = [
      'Identifique el error ortográfico: "Navegante" es la forma correcta.',
      'La palabra "excelente" se escribe con: a) x, b) cc, c) x y c',
      'Seleccione la opción CON error: a) Percepción, b) Excepto, c) Esepción',
      'El diminutivo de "gato" es: a) gatito, b) gatillo, c) gatalo',
      'Completa: El libro ____ que compramos está en la mesa.',
      '"Haber" y "Aver" son palabras: a) Sinónimas, b) Homófonas, c) Antónimas',
      'La tilde diacrítica diferencia: a) "qué" de "que", b) "él" de "el", c) todas las anteriores',
      'Identifique el plural correcto: a) criterios, b) criterios, c) criterion',
      'Seleccione la opción correcta: Fue ____ al concierto',
      'La palabra "psicología" tiene _____ sílabas: a) 3, b) 4, c) 5',
      'Completa: Si yo _____ dinero, viajaría al extranjero.',
      '"Sesión" significa: a) Acción de sentarse, b) Período de funcionamiento, c) Opción de sentido',
      'Identifique el error: "Subió la escalera para arriba"',
      'El verbo "traer" en futuro es: a) traeré, b) trairé, c) traré',
      'Seleccione la oración CORRECTA: a) Voy a decirte un cosa, b) Voy a decirte una cosa, c) Voy decirte una cosa',
      'Completa: No hay _____ razón para no venir.',
      'La palabra "intervalo" se clasifica como: a) Aguda, b) Grave, c) Esdrújula',
      'Identifique el uso correcto de "porque": a) Vine porque lluvia, b) Vine porque llovía, c) Vine porque llueva',
      'Seleccione: "La Habana" es capital de: a) Puerto Rico, b) Cuba, c) República Dominicana',
      'Complete: Aunque _____ cansado, fuí a trabajar.',
      'La palabra "duda" lleva acento: a) Sí, b) No, c) En algunas ocasiones',
      'Identifique el subjuntivo: a) Espero que vienes, b) Espero que vengas, c) Espero que vendrás',
      'Complete: _____ nosotros, todos se fueron.',
      'Seleccione la opción con tilde correcta: a) Árbil, b) Árbol, c) Arból',
      'La palabra "cálculo" es: a) Aguda, b) Grave, c) Esdrújula',
      'Identifique el error: "Estuve en la casa de mi hermana durante todo el día"',
      'Complete: Si tu _____ dinero, me lo hubieras prestado.',
      'Seleccione: "Abeja" viene del latín: a) apis, b) abis, c) abes',
      'La sílaba tónica de "medicina" es: a) Me, b) di, c) ci',
      'Identifique el gerundio correcto: a) comiendo, b) comido, c) comer',
      'Complete: No sé _____ me dices eso.',
      'La palabra "sílaba" tiene _____ sílabas: a) 1, b) 2, c) 3',
      'Seleccione el participio: a) corriendo, b) corrido, c) correr',
      'Identifique la conjunción: a) muy, b) pero, c) siempre',
      'Complete: Aunque no _____ dinero, fue al cine.',
      'La palabra "información" es: a) Aguda, b) Grave, c) Esdrújula',
      'Seleccione: "Aunque" expresa: a) Causa, b) Concesión, c) Consecuencia',
      'Identifique el error: "Voy al supermercado porque necesito comprar cosas"',
      'Complete: Si _____ estudiado, habrías pasado el examen.',
      'La palabra "teléfono" lleva acento en: a) Te, b) lé, c) fo',
      'Seleccione la oración correcta: a) Llegué a casa cansadamente, b) Llegué a casa cansada, c) Llegué a casa cansadamente muy',
      'Identifique el pronombre: a) rápidamente, b) hoy, c) nosotros',
      'Complete: No me gusta _____ hablen mal de mí.',
      'La palabra "educación" tiene acento: a) Sí, b) No, c) A veces',
      'Seleccione: El superlativo de "bueno" es: a) buenísimo, b) muy bueno, c) bonísimo',
      'Identifique el adjetivo: a) correr, b) hermoso, c) rápidamente',
      'Complete: Aunque _____ frío, salimos a pasear.',
      'La palabra "adiós" es: a) Aguda, b) Grave, c) Esdrújula',
      'Seleccione el diminutivo correcto: a) casilla, b) casita, c) casuca'
    ];

    // Insert 50 sample questions
    for (let i = 0; i < Math.min(50, questionTexts.length); i++) {
      const questionText = questionTexts[i];
      const options = JSON.stringify({
        options: ['Opción A', 'Opción B', 'Opción C', 'Opción D']
      });

      await pool.query(
        `INSERT INTO spelling_grammar_questions
         (test_id, question_type, question_text, options, correct_answer, explanation, difficulty, order_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          1,
          'multiple_choice',
          questionText,
          options,
          'A',
          'Explicación de la respuesta correcta',
          'medium',
          i + 1
        ]
      );
    }

    // Update test with question count
    await pool.query(
      `UPDATE spelling_grammar_tests SET total_questions = 50 WHERE id = 1`
    );

    res.json({
      success: true,
      message: 'Spelling exam questions restored',
      testId: 1,
      questionsCreated: 50,
      testDetails: test
    });
  } catch (error) {
    console.error('❌ ERROR in restore:', error);
    res.status(500).json({ error: error.message });
  }
});

// CLEANUP: Eliminar spelling exams duplicados (mantener solo el id=1)
app.get('/api/cleanup/remove-duplicate-spelling-exams', async (req, res) => {
  try {
    console.log('🧹 CLEANUP: Removiendo spelling exams duplicados y sus resultados...');

    // Encontrar todos los spelling exams con el mismo nombre
    const duplicates = await pool.query(
      `SELECT title, COUNT(*) as count, array_agg(id ORDER BY id) as ids
       FROM spelling_grammar_tests
       GROUP BY title
       HAVING COUNT(*) > 1`
    );

    console.log(`Found ${duplicates.rows.length} groups of duplicate titles`);

    let deletedResultsCount = 0;
    let deletedQuestionsCount = 0;
    let deletedTestsCount = 0;

    // Para cada grupo de duplicados
    for (const group of duplicates.rows) {
      const ids = group.ids;
      const keepId = ids[0]; // Mantener el primero (id más bajo)
      const deleteIds = ids.slice(1); // Eliminar los demás

      console.log(`\n  Title: "${group.title}"`);
      console.log(`    Keep: ${keepId}, Delete: ${deleteIds.join(', ')}`);

      // Eliminar los duplicados Y SUS RESULTADOS
      for (const deleteId of deleteIds) {
        // 1. Eliminar resultados
        const resultsDeleted = await pool.query(
          `DELETE FROM spelling_grammar_results WHERE test_id = $1`,
          [deleteId]
        );
        deletedResultsCount += resultsDeleted.rowCount;
        console.log(`      Deleted ${resultsDeleted.rowCount} results for test ${deleteId}`);

        // 2. Eliminar preguntas
        const questionsDeleted = await pool.query(
          `DELETE FROM spelling_grammar_questions WHERE test_id = $1`,
          [deleteId]
        );
        deletedQuestionsCount += questionsDeleted.rowCount;
        console.log(`      Deleted ${questionsDeleted.rowCount} questions for test ${deleteId}`);

        // 3. Eliminar el test
        const testDeleted = await pool.query(
          `DELETE FROM spelling_grammar_tests WHERE id = $1`,
          [deleteId]
        );
        deletedTestsCount += testDeleted.rowCount;
        console.log(`      Deleted test ${deleteId}`);
      }
    }

    res.json({
      success: true,
      message: `Cleaned up successfully - Removed all duplicates!`,
      duplicateGroupsFound: duplicates.rows.length,
      resultsDeleted: deletedResultsCount,
      questionsDeleted: deletedQuestionsCount,
      testsDeleted: deletedTestsCount,
      details: duplicates.rows.map(row => ({
        title: row.title,
        totalCount: row.count,
        kept: row.ids[0],
        deleted: row.ids.slice(1)
      }))
    });
  } catch (error) {
    console.error('❌ ERROR in cleanup endpoint:', error);
    res.status(500).json({
      error: 'Error cleaning up spelling exams',
      details: error.message
    });
  }
});

// DEBUG: Get test with questions - INLINE VERSION
app.get('/api/debug-spelling-test/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    console.log('🔍 DEBUG: Getting test', testId);

    // Test the query directly
    const testResult = await pool.query(
      `SELECT id, title, description, difficulty, test_type, language
       FROM spelling_grammar_tests WHERE id = $1`,
      [testId]
    );
    console.log('📋 Test query result:', testResult.rows.length, 'rows');

    if (testResult.rows.length === 0) {
      return res.json({ error: 'Test not found', testResult: testResult.rows });
    }

    const test = testResult.rows[0];

    const questionsResult = await pool.query(
      `SELECT id, question_type, question_text, explanation, options, difficulty, order_number
       FROM spelling_grammar_questions
       WHERE test_id = $1
       ORDER BY order_number ASC`,
      [testId]
    );
    console.log('❓ Questions query result:', questionsResult.rows.length, 'rows');

    const response = {
      ...test,
      totalQuestions: questionsResult.rows.length,
      questions: questionsResult.rows
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({
      error: error.message,
      details: error.toString()
    });
  }
});

// Test BD
// Debug: Show all database variables
app.get('/api/debug-db', (req, res) => {
  res.json({
    RAILWAY_DATABASE_URL: process.env.RAILWAY_DATABASE_URL ? process.env.RAILWAY_DATABASE_URL.substring(0, 80) : 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 80) : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: 'Conexión a BD exitosa',
      timestamp: result.rows[0].now,
      databaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET',
      railwayDatabaseUrl: process.env.RAILWAY_DATABASE_URL ? process.env.RAILWAY_DATABASE_URL.substring(0, 50) + '...' : 'NOT SET'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      databaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET',
      railwayDatabaseUrl: process.env.RAILWAY_DATABASE_URL ? process.env.RAILWAY_DATABASE_URL.substring(0, 50) + '...' : 'NOT SET'
    });
  }
});

// Version check
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    compiledAt: new Date().toISOString(),
    features: {
      typingTestSupport: true,
      testDataFallback: true,
      evaluationByToken: true
    },
    commit: 'f9f2448'
  });
});

const PORT = process.env.PORT || 3000;
const http = require('http');
const { initSocket } = require('./src/websocket/notificationSocket');

const server = http.createServer(app);
const io = initSocket(server);
global.io = io;

server.listen(PORT, async () => {
  console.log(`🚀 Talent IA Backend corriendo en puerto ${PORT}`);
  console.log(`✅ RAILWAY_DATABASE_URL: ${process.env.RAILWAY_DATABASE_URL ? 'SET' : 'NOT SET'}`);
  console.log(`✅ DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

  // Run database migrations
  try {
    await runMigrations();
  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
  }
});
RENDER_REBUILD=1784129080
