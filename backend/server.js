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

// LUEGO FUERZA con la lectura del archivo para asegurar que .env gana
forceLoadEnv();

const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');
const {
  helmetConfig,
  sanitizeMiddleware,
  auditLogger,
  tokenValidator,
  loginLimiter,
  registerLimiter,
  apiLimiter,
} = require('./src/middleware/securityMiddleware');

const app = express();

app.use(helmetConfig);
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://talento-ia-v1-frontend.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
}));

// IMPORTANTE: express.json() DEBE ir ANTES de otros middlewares que usen req.body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));

app.use(sanitizeMiddleware);
app.use(auditLogger);
app.use('/api/', apiLimiter);
app.use(tokenValidator);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

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

// Usar rutas
app.use('/api/auth', authRoutes);
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

console.log('✅ Rutas cargadas correctamente');

// Health check - UPDATED 2026-07-15
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando - Build 2026-07-15 13:15',
    typing_test: 'ENABLED',
    timer_delay: 'IMPLEMENTED',
    completion_status: 'IMPLEMENTED'
  });
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
      code: error.code,
      databaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET',
      railwayDatabaseUrl: process.env.RAILWAY_DATABASE_URL ? process.env.RAILWAY_DATABASE_URL.substring(0, 50) + '...' : 'NOT SET'
    });
  }
});

// DETAILED Diagnostics endpoint
app.get('/api/admin/diagnostics', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
  };

  // Check env vars
  diagnostics.envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? `postgresql://...${process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 30)}` : 'NOT SET',
    RAILWAY_DATABASE_URL: process.env.RAILWAY_DATABASE_URL ? `postgresql://...` : 'NOT SET',
    FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
  };

  // Check pool status
  diagnostics.pool = {
    connected: pool.isConnected ? pool.isConnected() : 'UNKNOWN',
    error: pool.getConnectionError ? (pool.getConnectionError()?.message || 'NONE') : 'UNKNOWN',
  };

  // Try connection test
  try {
    const testResult = await pool.query('SELECT NOW()');
    diagnostics.connectionTest = {
      status: 'SUCCESS',
      timestamp: testResult.rows[0].now,
    };
  } catch (err) {
    diagnostics.connectionTest = {
      status: 'FAILED',
      error: err.message,
      code: err.code,
      detail: err.detail,
    };
  }

  // Parse DB URL for debugging
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      diagnostics.dbUrlParsed = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        database: url.pathname.replace('/', ''),
        username: url.username,
      };
    } catch (e) {
      diagnostics.dbUrlParsed = { error: 'Invalid URL format' };
    }
  }

  diagnostics.recommendations = [
    '1. Verify DATABASE_URL in Render Environment Variables',
    '2. Check if Railway is online at https://status.railway.app/',
    '3. Try creating a new PostgreSQL database in Render instead',
    '4. Or use Railway Dashboard to verify credentials are correct',
  ];

  res.json(diagnostics);
});

// Public Exams Endpoint (no auth required) - Correctly fetches exam with questions and options
app.get('/api/exams-public/:id', async (req, res) => {
  try {
    const examId = parseInt(req.params.id, 10);

    if (isNaN(examId)) {
      return res.status(400).json({ error: 'ID de examen inválido' });
    }

    // Get exam data
    const examResult = await pool.query(
      `SELECT id, name, description, type, max_time_minutes
       FROM exams
       WHERE id = $1`,
      [examId]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Examen no encontrado' });
    }

    const exam = examResult.rows[0];

    // Get questions for this exam
    const questionsResult = await pool.query(
      `SELECT q.id, q.title, q.type, q.description, q.competency_id, q.is_inverse, eq.question_order
       FROM questions q
       INNER JOIN exam_questions eq ON q.id = eq.question_id
       WHERE eq.exam_id = $1
       ORDER BY eq.question_order ASC`,
      [examId]
    );

    // Get options for each question
    const questionsWithOptions = await Promise.all(
      questionsResult.rows.map(async (question) => {
        const optionsResult = await pool.query(
          `SELECT id, text, score, option_order
           FROM question_options
           WHERE question_id = $1
           ORDER BY option_order ASC`,
          [question.id]
        );

        return {
          id: question.id,
          title: question.title,
          type: question.type,
          description: question.description,
          competencyId: question.competency_id,
          isInverse: question.is_inverse,
          order: question.question_order,
          options: optionsResult.rows.map(o => ({
            id: o.id,
            text: o.text,
            score: parseFloat(o.score) || 0,
            order: o.option_order
          }))
        };
      })
    );

    res.json({
      id: exam.id,
      name: exam.name,
      description: exam.description,
      type: exam.type,
      maxTimeMinutes: exam.max_time_minutes || 60,
      totalQuestions: questionsWithOptions.length,
      questions: questionsWithOptions
    });
  } catch (error) {
    console.error('Error fetching public exam:', error);
    res.status(500).json({
      error: 'Error al cargar el examen',
      details: error.message
    });
  }
});

// Admin Seeding Endpoint - DEVELOPMENT ONLY
app.post('/api/admin/seed', async (req, res) => {
  try {
    // Security check - solo en development o con secret key
    const seedKey = req.headers['x-seed-key'];
    if (process.env.NODE_ENV === 'production' && seedKey !== process.env.SEED_KEY) {
      return res.status(403).json({ error: 'Seeding no permitido en producción sin clave' });
    }

    console.log('🌱 Iniciando seeding de BD...');

    // Crear usuario admin de prueba
    const bcryptjs = require('bcryptjs');
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('Admin123!', salt);

    // Verificar si el usuario ya existe
    const existingAdmin = await pool.query(
      'SELECT id FROM "Users" WHERE email = $1',
      ['admin@talent-ia.com']
    );

    let adminUserId;
    if (existingAdmin.rows.length === 0) {
      const adminResult = await pool.query(
        `INSERT INTO "Users" (email, password, name, role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        ['admin@talent-ia.com', hashedPassword, 'Admin Test', 'admin']
      );
      adminUserId = adminResult.rows[0].id;
      console.log('✅ Usuario admin creado');
    } else {
      adminUserId = existingAdmin.rows[0].id;
      console.log('✅ Usuario admin ya existe');
    }

    // Crear usuario RRHH de prueba
    const existingRRHH = await pool.query(
      'SELECT id FROM "Users" WHERE email = $1',
      ['rrhh@talent-ia.com']
    );

    if (existingRRHH.rows.length === 0) {
      const rrhhResult = await pool.query(
        `INSERT INTO "Users" (email, password, name, role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        ['rrhh@talent-ia.com', await bcryptjs.hash('RrHh123!', salt), 'RRHH Test', 'rrhh_analyst']
      );
      console.log('✅ Usuario RRHH creado');
    } else {
      console.log('✅ Usuario RRHH ya existe');
    }

    res.json({
      status: 'OK',
      message: 'Seeding completado',
      adminEmail: 'admin@talent-ia.com',
      rrhhEmail: 'rrhh@talent-ia.com',
      adminPassword: 'Admin123!',
      rrhhPassword: 'RrHh123!'
    });
  } catch (error) {
    console.error('Error en seeding:', error);
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      details: error.detail || 'Error durante el seeding'
    });
  }
});

// Submit Evaluation Endpoint
app.post('/api/evaluations/:evaluationId/submit', async (req, res) => {
  try {
    const { evaluationId } = req.params;

    if (!evaluationId) {
      return res.status(400).json({ error: 'Evaluation ID requerido' });
    }

    // Marcar evaluación como completada
    const result = await pool.query(
      `UPDATE evaluations
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1
       RETURNING id, status, completed_at`,
      [evaluationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    res.json({
      status: 'success',
      message: 'Evaluación completada exitosamente',
      evaluation: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    res.status(500).json({
      error: 'Error al completar evaluación',
      details: error.message
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

// DEBUG ENDPOINT: Check table structures
app.get('/api/debug/table-structures', async (req, res) => {
  try {
    const tables = ['typing_results', 'spelling_grammar_results', 'evaluation_results', 'typing_tests', 'spelling_grammar_tests'];
    const structures = {};

    for (const tableName of tables) {
      try {
        const result = await pool.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        if (result.rows.length === 0) {
          structures[tableName] = ['TABLE NOT FOUND'];
        } else {
          structures[tableName] = result.rows.map(r => `${r.column_name} (${r.data_type})`);
        }
      } catch (err) {
        structures[tableName] = [`ERROR: ${err.message}`];
      }
    }

    res.json(structures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TEST ENDPOINT: Mark candidate vacancy as completed
app.get('/api/test/mark-completed/:candidateVacancyId', async (req, res) => {
  try {
    const { candidateVacancyId } = req.params;
    await pool.query('UPDATE candidate_vacancies SET status = $1 WHERE id = $2', ['completed', parseInt(candidateVacancyId)]);
    res.json({ success: true, message: 'Marked as completed', candidateVacancyId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TEST ENDPOINT: Create test data for results modal
app.get('/api/test/create-test-results', async (req, res) => {
  try {
    // Get first candidate-vacancy pair from "Asesores de televentas" vacancy (id 28)
    const cvResult = await pool.query(`
      SELECT cv.id, cv.candidate_id, c.first_name, c.last_name
      FROM candidate_vacancies cv
      JOIN candidates c ON cv.candidate_id = c.id
      WHERE cv.vacancy_id = 28
      LIMIT 1
    `);

    if (cvResult.rows.length === 0) {
      return res.status(404).json({ error: 'No candidate_vacancies found' });
    }

    const { id: candidateVacancyId, candidate_id: candidateId, first_name, last_name } = cvResult.rows[0];
    const results = { typing: false, spelling: false, evaluation: false };

    // Insert typing results
    try {
      await pool.query(`
        INSERT INTO typing_results (candidate_id, typing_test_id, wpm, net_wpm, accuracy, total_errors, completed_at)
        VALUES ($1, 1, 85, 82, 94.5, 8, NOW())
        ON CONFLICT DO NOTHING
      `, [candidateId]);
      results.typing = true;
    } catch (err) {
      console.log('Typing results skipped:', err.message);
    }

    // Insert spelling results - use only the columns that should exist
    try {
      await pool.query(`
        INSERT INTO spelling_grammar_results (candidate_id, test_id, total_questions, correct_answers, score, accuracy, completed_at)
        VALUES ($1, 1, 13, 12, 95, 92.3, NOW())
        ON CONFLICT DO NOTHING
      `, [candidateId]);
      results.spelling = true;
    } catch (err) {
      console.log('Spelling results skipped:', err.message);
    }

    // Insert evaluation results (competencies)
    try {
      const competencies = [
        { id: 1, name: 'Responsabilidad', score: 77 },
        { id: 2, name: 'Comunicación', score: 85 },
        { id: 3, name: 'Liderazgo', score: 72 }
      ];

      for (const comp of competencies) {
        await pool.query(`
          INSERT INTO evaluation_results (candidate_vacancy_id, competency_id, total_score, max_possible_score)
          VALUES ($1, $2, $3, 100)
          ON CONFLICT DO NOTHING
        `, [candidateVacancyId, comp.id, comp.score]);
      }
      results.evaluation = true;
    } catch (err) {
      console.log('Evaluation results skipped:', err.message);
    }

    // Update candidate_vacancy status to completed
    await pool.query(`
      UPDATE candidate_vacancies SET status = 'completed' WHERE id = $1
    `, [candidateVacancyId]);

    res.json({
      success: true,
      message: 'Test results created',
      candidate: { id: candidateId, name: `${first_name} ${last_name}` },
      candidateVacancyId,
      resultsCreated: results
    });
  } catch (error) {
    console.error('Error creating test results:', error);
    res.status(500).json({
      error: 'Error creating test results',
      details: error.message
    });
  }
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

  // Initialize exam_scores table if not exists
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

    console.log('✅ exam_scores table initialized');
  } catch (error) {
    console.error('⚠️ Error initializing exam_scores table:', error.message);
  }
});
