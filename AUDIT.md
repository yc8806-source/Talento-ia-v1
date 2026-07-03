# 📋 Sistema de Auditoría - Talent IA

## Descripción General

El sistema de auditoría registra automáticamente todos los cambios realizados en los perfiles de candidatos, proporcionando un registro completo de:
- **Quién** realizó el cambio (email, rol)
- **Qué** cambió (campos modificados)
- **Cuándo** se cambió (timestamp)
- **De dónde** se cambió (IP address)
- **El estado** de la operación (éxito/error)

## Tabla: `audit_logs`

```sql
id              | SERIAL PRIMARY KEY
action          | VARCHAR(50)      - Tipo de acción (UPDATE, CREATE, DELETE)
entity_type     | VARCHAR(50)      - Tipo de entidad (CANDIDATE, USER)
entity_id       | INTEGER          - ID de la entidad afectada
user_id         | INTEGER          - ID del usuario que hizo el cambio
user_email      | VARCHAR(255)     - Email del usuario
user_role       | VARCHAR(50)      - Rol del usuario (admin, rrhh, candidate)
ip_address      | VARCHAR(50)      - IP del cliente
changes         | JSONB            - Campos que cambiaron
old_values      | JSONB            - Valores anteriores
new_values      | JSONB            - Valores nuevos
status          | VARCHAR(20)      - SUCCESS o ERROR
error_message   | TEXT             - Mensaje de error si aplica
user_agent      | TEXT             - User Agent del navegador
created_at      | TIMESTAMP        - Fecha/hora del evento
```

## Endpoints de Auditoría

### 1. Historial de una Entidad
```
GET /api/audit/entity/:entityType/:entityId
Authorization: Bearer {token}
```

**Requiere:** Admin

**Ejemplo:**
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/audit/entity/CANDIDATE/42
```

**Respuesta:**
```json
{
  "entityType": "CANDIDATE",
  "entityId": 42,
  "total": 5,
  "history": [
    {
      "id": 1,
      "action": "UPDATE",
      "modifiedBy": "juan@example.com",
      "userRole": "candidate",
      "ip": "192.168.1.100",
      "changes": {
        "cv_url": {
          "from": "/uploads/old.pdf",
          "to": "/uploads/new.pdf"
        },
        "phone": {
          "from": "+57 300 1111111",
          "to": "+57 300 2222222"
        }
      },
      "status": "SUCCESS",
      "error": null,
      "timestamp": "2026-07-03T10:45:23Z"
    }
  ]
}
```

### 2. Auditoría por Usuario
```
GET /api/audit/user/:userId?limit=100
Authorization: Bearer {token}
```

**Requiere:** Admin

**Ejemplo:**
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/audit/user/5?limit=50
```

### 3. Detectar Actividad Sospechosa
```
GET /api/audit/suspicious/check?timeWindow=60
Authorization: Bearer {token}
```

**Requiere:** Admin

**Parámetros:**
- `timeWindow`: minutos a analizar (default: 60)
- Alerta si: más de 10 acciones por usuario/acción en el timeWindow

**Ejemplo:**
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/audit/suspicious/check?timeWindow=30
```

**Respuesta:**
```json
{
  "timeWindow": "30 minutos",
  "threshold": "Más de 10 acciones por usuario/acción",
  "alertCount": 2,
  "alerts": [
    {
      "email": "suspicious@example.com",
      "userId": 12,
      "action": "UPDATE",
      "entityType": "CANDIDATE",
      "actionCount": 15,
      "ips": ["192.168.1.100", "10.0.0.50"],
      "lastAction": "2026-07-03T10:55:00Z"
    }
  ]
}
```

### 4. Resumen de Auditoría (7 días)
```
GET /api/audit/summary/recent
Authorization: Bearer {token}
```

**Requiere:** Admin

**Ejemplo:**
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/audit/summary/recent
```

**Respuesta:**
```json
{
  "period": "Últimos 7 días",
  "totalActions": 127,
  "errorCount": 3,
  "summary": [
    {
      "date": "2026-07-03",
      "action": "UPDATE",
      "entity_type": "CANDIDATE",
      "status": "SUCCESS",
      "count": 45
    },
    {
      "date": "2026-07-03",
      "action": "UPDATE",
      "entity_type": "CANDIDATE",
      "status": "ERROR",
      "count": 2
    }
  ]
}
```

## Registro Automático

### Cuándo se registra:
- ✅ **Actualización de perfil**: `/PUT /api/candidates/:id`
- ✅ **Éxitos y errores**: ambos se registran
- ✅ **Valores anteriores y nuevos**: se guardan en JSONB
- ✅ **Cambios detectados**: solo se registran los campos que realmente cambiaron

### Ejemplo de registro en BD:
```json
{
  "action": "UPDATE",
  "entity_type": "CANDIDATE",
  "entity_id": 42,
  "user_email": "juan@example.com",
  "user_role": "candidate",
  "ip_address": "192.168.1.100",
  "changes": {
    "cv_url": {
      "from": "/uploads/old.pdf",
      "to": "/uploads/new.pdf"
    },
    "phone": {
      "from": "+57 300 1111111",
      "to": "+57 300 2222222"
    }
  },
  "status": "SUCCESS"
}
```

## Casos de Uso

### 1. Investigar cambios en un candidato
```bash
# Admin quiere saber qué pasó con el candidato #42
curl -H "Authorization: Bearer {admin_token}" \
  http://localhost:3000/api/audit/entity/CANDIDATE/42
```
✅ Ve exactamente quién cambió qué, cuándo y desde dónde

### 2. Auditoría de un usuario
```bash
# Quieres revisar todas las actividades de un usuario en RRHH
curl -H "Authorization: Bearer {admin_token}" \
  http://localhost:3000/api/audit/user/7
```
✅ Lista todos sus cambios (qué candidatos modificó, cuándo, etc)

### 3. Detectar fraude
```bash
# Alguien está haciendo cambios masivos
curl -H "Authorization: Bearer {admin_token}" \
  http://localhost:3000/api/audit/suspicious/check?timeWindow=10
```
✅ Identifica patrones sospechosos (muchos cambios rápidamente)

### 4. Reporte semanal
```bash
# Generar reporte de actividad semanal
curl -H "Authorization: Bearer {admin_token}" \
  http://localhost:3000/api/audit/summary/recent
```
✅ Resumen de qué se cambió, por quién, cuántos errores

## Permisos

| Endpoint | Requiere | Nivel |
|----------|----------|-------|
| `GET /audit/entity/...` | Auth + Admin | Alta |
| `GET /audit/user/...` | Auth + Admin | Alta |
| `GET /audit/suspicious/...` | Auth + Admin | Alta |
| `GET /audit/summary/...` | Auth + Admin | Alta |
| `GET /candidates/:id/audit-history` | Auth + Admin | Alta |

## Consultas SQL útiles

### Cambios en últimas 24 horas:
```sql
SELECT 
  user_email, action, entity_type, COUNT(*) 
FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_email, action, entity_type
ORDER BY COUNT(*) DESC;
```

### Errores en las últimas 48 horas:
```sql
SELECT 
  user_email, action, error_message, created_at
FROM audit_logs 
WHERE status = 'ERROR' 
  AND created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC;
```

### Cambios de CV:
```sql
SELECT 
  user_email, created_at, 
  changes->>'cv_url' as cambio_cv
FROM audit_logs 
WHERE changes ? 'cv_url'
ORDER BY created_at DESC;
```

### Usuarios por IP:
```sql
SELECT DISTINCT 
  user_email, ip_address, 
  COUNT(*) as acciones
FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_email, ip_address
ORDER BY acciones DESC;
```

## Análisis de Seguridad

### Indicadores de alerta:
- ⚠️ Más de 10 cambios por minuto del mismo usuario
- ⚠️ Cambios de múltiples IPs en corto tiempo
- ⚠️ Cambios en horarios extraños (2 AM, 3 AM, etc)
- ⚠️ Cambios después de cambio de contraseña
- ⚠️ Tasa de error alta (> 5% de operaciones)

### Query para análisis de riesgo:
```sql
SELECT 
  user_email,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN status = 'ERROR' THEN 1 END) as errors,
  ROUND(100.0 * COUNT(CASE WHEN status = 'ERROR' THEN 1 END) / COUNT(*), 2) as error_rate,
  COUNT(DISTINCT ip_address) as unique_ips,
  ARRAY_AGG(DISTINCT ip_address) as ips
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_email
HAVING COUNT(*) > 5 OR COUNT(DISTINCT ip_address) > 3
ORDER BY total_actions DESC;
```

## Retención de datos

La auditoría se guarda indefinidamente. Se recomienda:
- Archivar logs > 1 año mensualmente
- Mantener últimos 90 días en tabla activa
- Crear tabla histórica `audit_logs_archive` anualmente

```sql
-- Archivar logs de 2025
INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE EXTRACT(YEAR FROM created_at) = 2025;

DELETE FROM audit_logs 
WHERE EXTRACT(YEAR FROM created_at) = 2025;
```

## Integración futura

- [ ] Alertas en tiempo real (WebSocket)
- [ ] Dashboard de auditoría en frontend
- [ ] Exportación a CSV/PDF de reportes
- [ ] Integración con Slack para alertas críticas
- [ ] Machine Learning para detectar patrones anómalos
