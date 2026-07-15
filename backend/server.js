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

// PUBLIC ENDPOINTS SIN MIDDLEWARE - Antes de tokenValidator
const typingController = require('./src/controllers/typingController');

app.post('/api/typing/results/submit-public', typingController.submitResultWithToken);

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
    completion_status: 'IMPLEMENTED',
    spelling_grammar_test: 'ENABLED'
  });
});

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

server.listen(PORT, () => {
  console.log(`🚀 Talent IA Backend corriendo en puerto ${PORT}`);
  console.log(`✅ RAILWAY_DATABASE_URL: ${process.env.RAILWAY_DATABASE_URL ? 'SET' : 'NOT SET'}`);
  console.log(`✅ DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
});
RENDER_REBUILD=1784129080
