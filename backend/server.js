require('dotenv').config();

const express = require('express');
const path = require('path');
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

// SEGURIDAD - Helmet para protección de headers
app.use(helmetConfig);

// CORS mejorado
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware - JSON PRIMERO, luego urlencoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));

// SEGURIDAD - Sanitizar inputs
app.use(sanitizeMiddleware);

// AUDITORÍA - Logging de acciones
app.use(auditLogger);

// RATE LIMITING - Aplicar a API general
app.use('/api/', apiLimiter);

// SEGURIDAD - Validar tokens
app.use(tokenValidator);

// Servir archivos estáticos
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

// Log routes
console.log('✅ Rutas cargadas correctamente');
console.log('   - Exams stack length:', examRoutes.stack.length);
examRoutes.stack.forEach((layer, i) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods);
    console.log(`   [${i}] ${methods.join(',').toUpperCase()} ${layer.route.path}`);
  }
});

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Ruta de prueba de BD
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: 'Conexión a BD exitosa',
      timestamp: result.rows[0].now,
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET'
    });
  }
});

const PORT = process.env.PORT || 3000;
const http = require('http');
const { initSocket } = require('./src/websocket/notificationSocket');

// Crear servidor HTTP con Socket.IO
const server = http.createServer(app);
const io = initSocket(server);

// Hacer io disponible globalmente
global.io = io;

server.listen(PORT, () => {
  console.log(`🚀 Talent IA Backend en http://localhost:${PORT}`);
  console.log(`✅ Rate limiting ACTIVADO`);
  console.log(`📡 WebSocket habilitado`);
  console.log(`🔐 Usando Railway PostgreSQL`);
  console.log(`⚡ Deployment timestamp: ${new Date().toISOString()}`);
});