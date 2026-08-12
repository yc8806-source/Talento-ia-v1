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

// Diagnostics endpoint
app.get('/api/admin/diagnostics', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    railwayDatabaseUrl: process.env.RAILWAY_DATABASE_URL ? 'SET' : 'NOT SET',
    frontendUrl: process.env.FRONTEND_URL || 'NOT SET',
    poolConnected: pool.isConnected ? pool.isConnected() : 'UNKNOWN',
    connectionError: pool.getConnectionError ? (pool.getConnectionError()?.message || 'NONE') : 'UNKNOWN',
    timestamp: new Date().toISOString(),
    advice: 'Si pool no está conectado, Railway puede estar caído. Verifica https://status.railway.app/'
  });
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
