# 🔐 Guía de Seguridad - Talent IA

Este documento describe todas las medidas de seguridad implementadas en Talent IA.

## 📋 Tabla de Contenidos

1. [Backend Security](#backend-security)
2. [Frontend Security](#frontend-security)
3. [Authentication & Authorization](#authentication--authorization)
4. [Rate Limiting](#rate-limiting)
5. [Input Sanitization](#input-sanitization)
6. [Security Headers](#security-headers)
7. [Audit Logging](#audit-logging)
8. [Best Practices](#best-practices)

---

## Backend Security

### 1. Helmet.js - Protección de Headers HTTP

**Ubicación:** `backend/src/middleware/securityMiddleware.js`

**Medidas Implementadas:**
- ✅ Content Security Policy (CSP)
- ✅ HSTS (HTTP Strict Transport Security) - 1 año
- ✅ X-Frame-Options: DENY (Protección contra clickjacking)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection

**Configuración:**
```javascript
const helmetConfig = helmet({
  contentSecurityPolicy: { /* ... */ },
  hsts: { maxAge: 31536000 },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
});
```

### 2. Rate Limiting

**Ubicación:** `backend/src/middleware/securityMiddleware.js`

**Limitadores Implementados:**

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/api/auth/login` | 5 intentos | 15 minutos |
| `/api/auth/register` | 3 intentos | 1 hora |
| `/api/` (general) | 100 requests | 15 minutos |
| `/api/evaluations/*` | 10 evaluaciones | 1 hora |

**Uso en Rutas:**
```javascript
router.post('/login', loginLimiter, authController.login);
```

### 3. Input Sanitization

**Función:** `sanitizeInput(obj)`

**Características:**
- Remover etiquetas HTML peligrosas
- Limpiar atributos maliciosos
- Sanitizar strings recursivamente
- Protección contra XSS

**Aplicación Automática:**
```javascript
app.use(sanitizeMiddleware); // Se aplica a todos los requests
```

### 4. CORS Mejorado

**Configuración:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
}));
```

**Variable de Entorno:**
```
FRONTEND_URL=http://localhost:3001
```

### 5. Audit Logging

**Función:** `auditLogger`

**Logs Registrados:**
- POST, PUT, DELETE requests
- User (authenticated/anonymous)
- HTTP status code
- Request duration
- IP address

**Formato:**
```json
{
  "timestamp": "2026-07-02T10:30:45.123Z",
  "method": "POST",
  "path": "/api/evaluations/start",
  "user": "authenticated",
  "status": 201,
  "duration": "45ms",
  "ip": "192.168.1.100"
}
```

---

## Frontend Security

### 1. Input Validation (`utils/validation.js`)

**Validadores Disponibles:**

```javascript
// Email validation
isValidEmail('user@example.com') // true/false

// Password validation (8+ chars, 1 uppercase, 1 number)
isValidPassword('MyPass123') // true/false

// Phone validation
isValidPhone('+1 (555) 123-4567') // true/false

// Name validation (2-50 chars, letters only)
isValidName('John Doe') // true/false

// URL validation
isValidUrl('https://example.com') // true/false

// Numeric validation
isPositiveNumber(42) // true/false
```

**Detección de XSS:**
```javascript
if (hasXSSPatterns(userInput)) {
  // Bloquear entrada sospechosa
}
```

### 2. Input Sanitization

**Función:** `sanitizeString(str)` y `sanitizeObject(obj)`

```javascript
// Remover caracteres peligrosos
const clean = sanitizeString('<script>alert("xss")</script>');
// Resultado: 'alert("xss")'

// Sanitizar objetos completos
const sanitized = sanitizeObject(formData);
```

### 3. Token Security (`services/securityService.js`)

**Almacenamiento Seguro:**
```javascript
// Guardar token
setToken(jwtToken);

// Obtener token con validación
const token = getToken(); // Valida formato y existencia

// Verificar validez
if (isTokenValid()) {
  // Token es válido y no ha expirado
}

// Limpiar al logout
clearToken();
```

**Validaciones de Token:**
- ✅ Validar formato JWT (3 partes separadas por puntos)
- ✅ Verificar expiración
- ✅ Remover automáticamente tokens expirados

### 4. Session Management

**Monitoreo Automático:**
```javascript
initSecurityProtections();
// Verifica sesión cada 60 segundos
// Redirige a login si expira
```

### 5. CSRF Protection

**Hook:** `useCSRFToken()`

**Uso en Formularios:**
```javascript
import { CSRFProtectedForm } from '../components/CSRFProtection';

<CSRFProtectedForm onSubmit={handleSubmit}>
  {/* Formulario content */}
</CSRFProtectedForm>
```

**Validaciones:**
- ✅ Token CSRF generado y verificado
- ✅ Validación de referrer
- ✅ Detección de navegación externa

### 6. Security Event Logging

**Función:** `logSecurityEvent(eventType, details)`

```javascript
// Log de login exitoso
logSecurityEvent('login_success', { email: 'user@example.com' });

// Log de intento fallido
logSecurityEvent('login_failed', { reason: 'Invalid password', attempts: 2 });

// Log de detección XSS
logSecurityEvent('xss_attempt_detected', { field: 'comment' });

// Log de carga de página
logSecurityEvent('page_load');
```

---

## Authentication & Authorization

### 1. Password Requirements

**Mínimos:**
- Longitud: 8+ caracteres
- 1 letra mayúscula
- 1 número
- No hay restricción en caracteres especiales

**Hash:** bcryptjs (bcrypt)

### 2. JWT Tokens

**Estructura:**
```
Header.Payload.Signature
```

**Validaciones:**
- Verificar firma
- Validar fecha de expiración
- Verificar usuario activo

### 3. Role-Based Access Control (RBAC)

**Roles Disponibles:**
- `admin`: Acceso total
- `rrhh`: Acceso a gestión de candidatos y evaluaciones
- `user`: Acceso básico

**Protección de Rutas:**
```javascript
// Solo admins pueden acceder
<Route path="/admin" element={
  userRole === 'admin' ? <Admin /> : <Navigate to="/dashboard" />
} />
```

---

## Rate Limiting

### Configuración

**Archivo:** `backend/src/middleware/securityMiddleware.js`

**Tipos de Limitadores:**

1. **Login Limiter**
   - Máximo: 5 intentos
   - Ventana: 15 minutos
   - Mensaje: "Demasiados intentos de login"

2. **Register Limiter**
   - Máximo: 3 intentos
   - Ventana: 1 hora
   - Mensaje: "Demasiados intentos de registro"

3. **API General Limiter**
   - Máximo: 100 requests
   - Ventana: 15 minutos
   - Se aplica a `/api/*`

4. **Evaluation Limiter**
   - Máximo: 10 evaluaciones
   - Ventana: 1 hora
   - Protege contra spam de evaluaciones

### Respuestas de Rate Limit

Cuando se excede el límite:
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1656571200

{
  "message": "Demasiados intentos de login. Por favor intenta más tarde."
}
```

---

## Input Sanitization

### Backend

**Aplicación Automática:**
- Todos los req.body
- Todos los req.query
- Todos los req.params

**Proceso:**
1. Remover etiquetas HTML
2. Remover atributos peligrosos
3. Procesar recursivamente en objetos

### Frontend

**Antes de Enviar:**
```javascript
// En Login.jsx
const sanitizedEmail = sanitizeString(email);
const formData = sanitizeObject(userData);

await authAPI.login(sanitizedEmail);
```

**Validación XSS:**
```javascript
if (hasXSSPatterns(userInput)) {
  // Bloquear y loguear
  logSecurityEvent('xss_attempt_detected');
}
```

---

## Security Headers

### Headers Implementados

| Header | Valor | Propósito |
|--------|-------|----------|
| `X-Frame-Options` | `DENY` | Evitar clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Protección XSS adicional |
| `Strict-Transport-Security` | `max-age=31536000` | Forzar HTTPS |
| `Content-Security-Policy` | `default-src 'self'` | Controlar fuentes |
| `CORS` | Configurable | Control de origen |

---

## Audit Logging

### Eventos Registrados

**Sistema:**
- Login exitoso/fallido
- Registro de usuario
- Cambios en base de datos (POST, PUT, DELETE)

**Seguridad:**
- Intentos de XSS detectados
- Rate limiting excedido
- Tokens inválidos
- Navegación a sitios externos

### Formato de Log

```
📋 [AUDIT] {
  "timestamp": "2026-07-02T10:30:45.123Z",
  "method": "POST",
  "path": "/api/candidates",
  "user": "authenticated",
  "status": 201,
  "duration": "42ms",
  "ip": "192.168.1.100"
}
```

---

## Best Practices

### Para Desarrolladores

1. **Siempre sanitizar inputs**
   ```javascript
   const clean = sanitizeString(userInput);
   ```

2. **Validar en ambos lados** (frontend + backend)
   ```javascript
   // Frontend
   const error = validationRules.email(email);

   // Backend (automático con sanitizeMiddleware)
   ```

3. **Usar tokens seguros**
   ```javascript
   import { setToken, isTokenValid } from '../services/securityService';
   ```

4. **Loguear eventos sospechosos**
   ```javascript
   logSecurityEvent('suspicious_event', { details });
   ```

5. **No almacenar datos sensibles en localStorage**
   ```javascript
   // ✅ BIEN - Solo datos no sensibles
   localStorage.setItem('user', JSON.stringify({ firstName, role }));

   // ❌ MAL - Nunca almacenes
   localStorage.setItem('password', password);
   localStorage.setItem('token', 'exp_date_might_leak');
   ```

### Para Admins

1. **Monitorear logs de auditoría**
   - Revisar intentos de login fallidos
   - Detectar patrones de ataque

2. **Actualizar rate limits si es necesario**
   - `backend/src/middleware/securityMiddleware.js`

3. **Mantener dependencias actualizadas**
   ```bash
   npm audit
   npm update
   ```

4. **Cambiar contraseñas de demo regularmente**
   - `admin@talent-ia.com / Admin123!`
   - `rrhh@talent-ia.com / RrHh123!`

5. **Habilitar HTTPS en producción**
   ```
   NODE_ENV=production
   HSTS_MAX_AGE=31536000
   ```

---

## Verificación de Seguridad

### Checklist

- [ ] Helmet.js configurado
- [ ] Rate limiting activo
- [ ] Sanitización de inputs funcionando
- [ ] CORS correctamente configurado
- [ ] JWT tokens validados
- [ ] CSRF protection en formularios
- [ ] Audit logs siendo registrados
- [ ] HTTPS en producción
- [ ] Dependencias actualizadas
- [ ] Contraseñas de demo cambiadas

---

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** publicar en issues públicas
2. Enviar email a: `security@talent-ia.com`
3. Incluir: descripción, pasos para reproducir, impacto

---

## Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Docs](https://helmetjs.github.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Última actualización:** 2026-07-02
**Versión:** 1.0.0
