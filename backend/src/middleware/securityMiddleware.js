const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitizeHtml = require('sanitize-html');

// RATE LIMITING - Limitar intentos de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de login. Por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// RATE LIMITING - Limitar intentos de registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 intentos
  message: 'Demasiados intentos de registro. Por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// RATE LIMITING - Limitar requests generales de API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests
  message: 'Demasiadas requests. Por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// RATE LIMITING - Limitar evaluaciones (evitar spam)
const evaluationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 evaluaciones por hora
  message: 'Límite de evaluaciones excedido. Por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// HELMET - Protección de headers HTTP
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
});

// SANITIZACIÓN - Limpiar inputs de XSS
const sanitizeInput = (obj) => {
  if (!obj) return obj;

  const sanitizedObj = {};

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remover etiquetas HTML peligrosas
      sanitizedObj[key] = sanitizeHtml(obj[key], {
        allowedTags: [],
        allowedAttributes: {},
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizedObj[key] = sanitizeInput(obj[key]);
    } else {
      sanitizedObj[key] = obj[key];
    }
  }

  return sanitizedObj;
};

// MIDDLEWARE - Sanitizar request body, params, query
const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeInput(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeInput(req.params);
  }

  next();
};

// AUDITORÍA - Logging de acciones
const auditLogger = (req, res, next) => {
  const startTime = Date.now();

  // Interceptar response para loguear
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;

    // Log solo para cambios significativos
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const user = req.headers.authorization ? 'authenticated' : 'anonymous';
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        user,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      };

      console.log('📋 [AUDIT]', JSON.stringify(logEntry));
    }

    return originalJson.call(this, data);
  };

  next();
};

// VALIDACIÓN DE TOKEN - Verificar token JWT válido
const tokenValidator = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  // Validar formato básico del token
  if (token && !token.match(/^[A-Za-z0-9\-_.]*$/)) {
    return res.status(401).json({
      error: 'Token inválido',
    });
  }

  next();
};

// PREVENCIÓN CSRF - Token CSRF (si es necesario)
const generateCsrfToken = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// VALIDAR PARAMETROS NUMÉRICOS
const validateNumericParams = (req, res, next) => {
  const numericParams = ['id', 'candidateId', 'vacancyId', 'examId', 'evaluationId'];

  for (const param of numericParams) {
    if (req.params[param] && isNaN(req.params[param])) {
      return res.status(400).json({
        error: `Parámetro inválido: ${param} debe ser numérico`,
      });
    }
  }

  next();
};

module.exports = {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  evaluationLimiter,
  helmetConfig,
  sanitizeInput,
  sanitizeMiddleware,
  auditLogger,
  tokenValidator,
  generateCsrfToken,
  validateNumericParams,
};
