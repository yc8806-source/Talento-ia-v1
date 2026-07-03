# 🔐 Sistema Granular de Permisos - Documentación

Sistema completo de gestión de permisos y control de acceso por roles y equipos en Talent IA.

## 📋 Tabla de Contenidos

1. [Descripción](#descripción)
2. [Arquitectura](#arquitectura)
3. [Permisos Disponibles](#permisos-disponibles)
4. [Roles Predefinidos](#roles-predefinidos)
5. [Equipos y Departamentos](#equipos-y-departamentos)
6. [API Endpoints](#api-endpoints)
7. [Middleware de Permisos](#middleware-de-permisos)
8. [Auditoría](#auditoría)
9. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción

El sistema de permisos granular proporciona:

✅ **Roles Predefinidos** - Admin, RRHH Manager, Manager, Evaluador, Viewer
✅ **Permisos por Módulo** - Control fino sobre cada acción del sistema
✅ **Equipos y Departamentos** - Asignación de permisos a nivel de equipo
✅ **Auditoría Completa** - Registro de todos los cambios de permisos
✅ **Middleware de Protección** - Validación automática en rutas
✅ **Gestión desde UI** - Panel de administración intuitivo

---

## Arquitectura

```
Backend
├── Middleware (permissionsMiddleware.js)
│   ├── PERMISSIONS - Definición de permisos
│   ├── ROLES - Roles predefinidos
│   ├── requirePermission() - Validar un permiso
│   ├── requireAnyPermission() - Validar múltiples (ANY)
│   ├── requireAllPermissions() - Validar múltiples (ALL)
│   └── requireTeamMembership() - Validar pertenencia a equipo
│
├── Controllers
│   ├── teamController.js - CRUD de equipos
│   └── permissionController.js - Gestión de permisos
│
├── Routes
│   ├── teams.js - /api/teams
│   └── permissions.js - /api/permissions
│
└── Database Tables
    ├── teams - Información de equipos
    ├── team_members - Membresía y roles
    ├── role_permissions - Permisos por rol
    ├── user_permissions - Permisos granulares
    └── permission_audit_logs - Auditoría

Frontend
├── Pages/PermissionsManagement.jsx
├── API/api.js (teamAPI, permissionAPI)
└── Navbar.jsx (enlace a /permisos)
```

---

## Permisos Disponibles

### 👥 Candidatos
- `candidates.view` - Ver candidatos
- `candidates.create` - Crear candidatos
- `candidates.edit` - Editar candidatos
- `candidates.delete` - Eliminar candidatos
- `candidates.download_cv` - Descargar CV
- `candidates.send_invitation` - Enviar invitaciones

### 📋 Vacantes
- `vacancies.view` - Ver vacantes
- `vacancies.create` - Crear vacantes
- `vacancies.edit` - Editar vacantes
- `vacancies.delete` - Eliminar vacantes
- `vacancies.close` - Cerrar vacantes

### 📊 Evaluaciones
- `evaluations.view` - Ver evaluaciones
- `evaluations.create` - Crear evaluaciones
- `evaluations.submit` - Enviar evaluaciones
- `evaluations.view_results` - Ver resultados
- `evaluations.export_pdf` - Exportar PDF

### ❓ Preguntas
- `questions.view` - Ver preguntas
- `questions.create` - Crear preguntas
- `questions.edit` - Editar preguntas
- `questions.delete` - Eliminar preguntas
- `questions.bulk_import` - Importar preguntas

### 📝 Exámenes
- `exams.view` - Ver exámenes
- `exams.create` - Crear exámenes
- `exams.edit` - Editar exámenes
- `exams.delete` - Eliminar exámenes
- `exams.assign` - Asignar exámenes

### 📈 Reportes
- `reports.view` - Ver reportes
- `reports.export` - Exportar reportes
- `reports.advanced_analytics` - Analytics avanzados

### 👤 Usuarios
- `users.view` - Ver usuarios
- `users.create` - Crear usuarios
- `users.edit` - Editar usuarios
- `users.delete` - Eliminar usuarios
- `users.manage_roles` - Gestionar roles
- `users.manage_permissions` - Gestionar permisos

### 🏢 Equipos
- `teams.view` - Ver equipos
- `teams.create` - Crear equipos
- `teams.edit` - Editar equipos
- `teams.delete` - Eliminar equipos
- `teams.manage_members` - Gestionar miembros

### ⚙️ Admin
- `admin.access` - Acceso administrador
- `admin.settings` - Configurar sistema
- `admin.audit_logs` - Ver logs de auditoría
- `admin.system_health` - Ver salud del sistema

---

## Roles Predefinidos

### Admin (Administrador)
**Descripción:** Acceso total al sistema
**Permisos:** Todos los permisos disponibles

```javascript
{
  name: 'Administrador',
  description: 'Acceso total al sistema',
  permissions: [/* todos los permisos */]
}
```

### RRHH (RRHH Manager)
**Descripción:** Gestión de candidatos y evaluaciones
**Permisos:**
- Candidatos (ver, crear, editar, descargar CV, enviar invitaciones)
- Evaluaciones (ver, crear, ver resultados, exportar PDF)
- Preguntas y Exámenes (solo lectura)
- Reportes (ver, exportar, analytics avanzados)
- Usuarios (solo lectura)

### Manager (Manager de Equipo)
**Descripción:** Gestión de equipo y evaluaciones
**Permisos:**
- Candidatos (ver, editar, descargar CV)
- Evaluaciones (ver, ver resultados, exportar PDF)
- Reportes (ver, exportar)
- Equipos (ver, gestionar miembros)
- Usuarios (solo lectura)

### Evaluator (Evaluador)
**Descripción:** Crear y ver evaluaciones
**Permisos:**
- Candidatos (ver, descargar CV)
- Evaluaciones (ver, crear, ver resultados)
- Exámenes (solo lectura)
- Reportes (ver)

### Viewer (Visualizador)
**Descripción:** Solo lectura
**Permisos:**
- Candidatos (ver)
- Evaluaciones (ver, ver resultados)
- Reportes (ver)

---

## Equipos y Departamentos

### Estructura de Equipos

```sql
teams
├── id: SERIAL PRIMARY KEY
├── name: VARCHAR(255) UNIQUE
├── description: TEXT
├── department: VARCHAR(255)
├── manager_id: INTEGER (FK users)
└── created_at, updated_at

team_members
├── id: SERIAL PRIMARY KEY
├── team_id: INTEGER (FK teams)
├── user_id: INTEGER (FK users)
├── role: VARCHAR(50) -- admin, manager, member
├── department: VARCHAR(255)
└── joined_at: TIMESTAMP
```

### Roles en Equipo

| Rol | Permisos |
|-----|----------|
| **admin** | Gestionar equipo completo |
| **manager** | Administrar miembros |
| **member** | Acceso normal |

### Flujo de Permisos

```
1. Usuario tiene ROLE global (admin, rrhh, etc.)
2. Usuario es MIEMBRO de TEAMS
3. En cada equipo tiene un ROL (admin, manager, member)
4. Puede tener PERMISOS GRANULARES adicionales por equipo
5. Sistema combina permisos global + equipo
```

---

## API Endpoints

### Teams

```bash
# Obtener todos los equipos
GET /api/teams
Header: Authorization: Bearer <token>

# Obtener equipo por ID
GET /api/teams/:id

# Crear equipo
POST /api/teams
Body: {
  "name": "Televentas A",
  "description": "Equipo de ventas",
  "department": "Ventas",
  "manager_id": 1
}

# Actualizar equipo
PUT /api/teams/:id
Body: { /* campos a actualizar */ }

# Eliminar equipo
DELETE /api/teams/:id

# Obtener miembros
GET /api/teams/:id/members

# Agregar miembro
POST /api/teams/:id/members
Body: {
  "user_id": 5,
  "role": "member" -- admin, manager, member
}

# Remover miembro
DELETE /api/teams/:id/members/:memberId
```

### Permissions

```bash
# Obtener todos los permisos
GET /api/permissions
Require: users.manage_permissions

# Obtener todos los roles
GET /api/permissions/roles/all

# Obtener permisos de un rol
GET /api/permissions/roles/:role

# Obtener permisos de un usuario
GET /api/permissions/users/:userId

# Obtener permisos en un equipo
GET /api/permissions/users/:userId/teams/:teamId

# Asignar permiso
POST /api/permissions/users/:userId/grant
Body: {
  "permission_key": "candidates.view",
  "team_id": 1  -- opcional, null = global
}

# Revocar permiso
POST /api/permissions/users/:userId/revoke
Body: {
  "permission_key": "candidates.view",
  "team_id": 1  -- opcional
}

# Asignar rol en equipo
POST /api/permissions/teams/:teamId/users/:userId/role
Body: { "role": "manager" }

# Obtener logs de auditoría
GET /api/permissions/audit/logs?userId=1&action=grant&limit=50
Require: admin.audit_logs
```

---

## Middleware de Permisos

### Uso en Rutas

```javascript
const { requirePermission, requireAnyPermission, requireAllPermissions } = require('../middleware/permissionsMiddleware');

// Requerir un permiso específico
router.post('/candidates', requirePermission('candidates.create'), createCandidate);

// Requerir cualquiera de los permisos
router.get('/reports', requireAnyPermission(['reports.view', 'reports.export']), getReports);

// Requerir todos los permisos
router.delete('/candidates/:id', requireAllPermissions(['candidates.view', 'candidates.delete']), deleteCandidate);
```

### Middleware en Controladores

```javascript
const { hasPermission, hasAnyPermission, hasAllPermissions } = require('../middleware/permissionsMiddleware');

const myController = (req, res) => {
  const userPermissions = req.user?.permissions || [];

  // Verificar permiso individual
  if (!hasPermission(userPermissions, 'candidates.view')) {
    return res.status(403).json({ error: 'Sin permisos' });
  }

  // Verificar múltiples permisos (ANY)
  if (!hasAnyPermission(userPermissions, ['reports.view', 'reports.export'])) {
    return res.status(403).json({ error: 'Sin permisos' });
  }

  // Verificar todos los permisos (ALL)
  if (!hasAllPermissions(userPermissions, ['candidates.view', 'candidates.delete'])) {
    return res.status(403).json({ error: 'Sin permisos' });
  }

  // Proceder...
};
```

---

## Auditoría

### Tabla de Logs

```sql
permission_audit_logs
├── id: SERIAL PRIMARY KEY
├── user_id: INTEGER (usuario afectado)
├── action: VARCHAR(50) -- grant, revoke, modify
├── permission_key: VARCHAR(100)
├── team_id: INTEGER (opcional)
├── actor_id: INTEGER (quien realizó la acción)
├── ip_address: VARCHAR(45)
├── user_agent: TEXT
└── created_at: TIMESTAMP
```

### Ejemplo de Entrada

```json
{
  "id": 1,
  "user_id": 5,
  "action": "grant",
  "permission_key": "candidates.edit",
  "team_id": 2,
  "actor_id": 1,
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2026-07-02T10:30:00Z"
}
```

### Obtener Logs

```bash
# Todos los cambios de un usuario
GET /api/permissions/audit/logs?userId=5

# Cambios en un equipo
GET /api/permissions/audit/logs?teamId=2

# Solo revocaciones
GET /api/permissions/audit/logs?action=revoke

# Con paginación
GET /api/permissions/audit/logs?limit=50&offset=100
```

---

## Ejemplos de Uso

### Ejemplo 1: Crear Equipo y Asignar Miembros

```javascript
// 1. Crear equipo
const teamRes = await teamAPI.create({
  name: 'Televentas Centro',
  description: 'Equipo central de televentas',
  department: 'Ventas',
  manager_id: 2
});
const teamId = teamRes.data.team.id;

// 2. Agregar miembros
await teamAPI.addMember(teamId, {
  user_id: 5,
  role: 'member'
});

await teamAPI.addMember(teamId, {
  user_id: 6,
  role: 'manager'
});

// 3. Verificar miembros
const members = await teamAPI.getMembers(teamId);
console.log(members.data.members);
```

### Ejemplo 2: Gestionar Permisos de Usuario

```javascript
// 1. Obtener permisos actuales
const perms = await permissionAPI.getUserPermissions(userId);

// 2. Asignar nuevo permiso
await permissionAPI.grantPermission(userId, {
  permission_key: 'reports.export',
  team_id: 2  // En el equipo 2
});

// 3. Revocar permiso
await permissionAPI.revokePermission(userId, {
  permission_key: 'candidates.delete',
  team_id: null  // Permiso global
});

// 4. Obtener logs de cambios
const logs = await permissionAPI.getAuditLogs({ userId, action: 'grant' });
```

### Ejemplo 3: Validación en API

```javascript
// Backend: Proteger ruta
router.post('/reports/export', 
  verifyToken,
  requirePermission('reports.export'),
  requireTeamMembership,  // Usuario debe ser miembro del equipo
  exportReports
);

// Frontend: Verificar antes de mostrar
const canExport = user.permissions.includes('reports.export');

if (canExport) {
  return <button onClick={exportReports}>Exportar</button>;
} else {
  return <p>No tienes permiso para exportar</p>;
}
```

### Ejemplo 4: Auditoría de Seguridad

```bash
# Obtener todos los cambios realizados por usuario 1
curl "http://localhost:3000/api/permissions/audit/logs?actor_id=1" \
  -H "Authorization: Bearer <token>"

# Respuesta
{
  "logs": [
    {
      "id": 1,
      "user_id": 5,
      "action": "grant",
      "permission_key": "candidates.edit",
      "team_id": 2,
      "actor_id": 1,
      "created_at": "2026-07-02T10:30:00Z"
    }
  ]
}
```

---

## Flujo de Autenticación con Permisos

```
1. Usuario hace LOGIN
   └─> Backend genera JWT con permisos

2. Usuario hace REQUEST
   └─> Middleware verifyToken
       └─> Extrae permisos del JWT
           └─> Asigna a req.user.permissions

3. Ruta protegida verifica permiso
   └─> requirePermission('module.action')
       └─> Compara req.user.permissions
           └─> ✅ Permitir o ❌ 403 Forbidden

4. Log de auditoría registra cambios
   └─> permission_audit_logs
```

---

## Integración en Rutas Existentes

### Paso 1: Actualizar Rutas

```javascript
// backend/src/routes/candidates.js
const { requirePermission } = require('../middleware/permissionsMiddleware');

router.post('/', requirePermission('candidates.create'), createCandidate);
router.get('/', requirePermission('candidates.view'), getAllCandidates);
router.put('/:id', requirePermission('candidates.edit'), updateCandidate);
router.delete('/:id', requirePermission('candidates.delete'), deleteCandidate);
```

### Paso 2: Actualizar Controladores

```javascript
// backend/src/controllers/candidateController.js
const createCandidate = async (req, res) => {
  // Permiso ya verificado por middleware
  // Proceder normalmente...
};
```

### Paso 3: Frontend - Ocultar Opciones

```javascript
// frontend/src/pages/Candidates.jsx
const userRole = localStorage.getItem('role');
const canEdit = userRole === 'admin' || userRole === 'rrhh';

return (
  <>
    {canEdit && <button>Editar</button>}
  </>
);
```

---

## Configuración Inicial

### 1. Ejecutar Migración

```bash
# Backend
psql -U usuario -d talent_ia -f backend/migrations/008_add_teams_and_permissions.sql
```

### 2. Crear Equipo Base

```sql
INSERT INTO teams (name, department, manager_id)
VALUES ('Default Team', 'General', 1);
```

### 3. Asignar Usuarios a Equipo

```sql
INSERT INTO team_members (team_id, user_id, role)
VALUES (1, 1, 'admin'), (1, 2, 'member');
```

---

## Mejoras Futuras

- [ ] Permisos tiempo-limitados
- [ ] Roles personalizados por usuario
- [ ] Auditoría en tiempo real
- [ ] Notificaciones de cambios de permisos
- [ ] Exportar/Importar configuración de permisos
- [ ] Dashboard de auditoría

---

**Última actualización:** 2026-07-02
**Versión:** 1.0.0
**Estado:** Implementado ✅
