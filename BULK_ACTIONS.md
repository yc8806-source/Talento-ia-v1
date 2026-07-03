# 🚀 Bulk Actions - Documentación

Sistema de acciones masivas para gestionar múltiples candidatos de forma eficiente.

## 📋 Tabla de Contenidos

1. [Descripción](#descripción)
2. [Características](#características)
3. [API Endpoints](#api-endpoints)
4. [Flujo del Usuario](#flujo-del-usuario)
5. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción

Las **Bulk Actions** permiten realizar operaciones en múltiples candidatos simultáneamente, ahorrando tiempo y mejorando la productividad del equipo de RRHH.

---

## Características

### ✅ Asignar Múltiples Candidatos a Vacante

**Descripción:** Asigna varios candidatos a una vacante de forma masiva.

**Flujo:**
1. Seleccionar candidatos disponibles
2. Elegir vacante destino
3. Confirmar asignación
4. Sistema asigna automáticamente a todos

**Respuesta:**
```json
{
  "message": "3 candidatos asignados exitosamente",
  "assigned": 3,
  "failed": 0,
  "results": [
    {
      "candidateId": 1,
      "success": true,
      "candidateVacancyId": 15
    }
  ]
}
```

---

### 📧 Enviar Invitaciones en Batch

**Descripción:** Envía invitaciones de evaluación a múltiples candidatos.

**Características:**
- Genera tokens de acceso únicos
- Envía email personalizado (con nodemailer)
- Rastrea envíos exitosos y fallidos
- Actualiza estado de evaluación

**Respuesta:**
```json
{
  "message": "2 invitaciones enviadas exitosamente",
  "sent": 2,
  "failed": 0,
  "results": [
    {
      "candidateVacancyId": 15,
      "email": "juan@example.com",
      "candidateName": "Juan",
      "vacancyTitle": "Desarrollador React",
      "success": true,
      "message": "Invitación enviada"
    }
  ]
}
```

---

### 📥 Exportar a CSV

**Descripción:** Descarga datos de candidatos en formato CSV.

**Campos Exportados:**
- ID
- Nombre (First Name + Last Name)
- Email
- Teléfono
- Fecha de Creación
- Total de Evaluaciones

**Uso:**
```javascript
const response = await bulkActionsAPI.exportCSV({
  candidateIds: [1, 2, 3],
  vacancyId: null
});

// Archivo descargado automáticamente: candidatos.csv
```

---

### 🗑️ Eliminar Múltiples Candidatos

**Descripción:** Elimina permanentemente candidatos de la base de datos.

⚠️ **Advertencia:** Esta acción es irreversible.

**Respuesta:**
```json
{
  "message": "2 candidatos eliminados",
  "deleted": 2,
  "deletedIds": [1, 2]
}
```

---

### 🔄 Cambiar Estado de Evaluaciones

**Descripción:** Actualiza el estado de múltiples evaluaciones simultáneamente.

**Estados Válidos:**
- `not_started` - No iniciada
- `in_progress` - En progreso
- `completed` - Completada

**Respuesta:**
```json
{
  "message": "5 evaluaciones actualizadas a in_progress",
  "updated": 5,
  "results": [
    {
      "id": 15,
      "candidate_id": 1,
      "vacancy_id": 2,
      "status": "in_progress"
    }
  ]
}
```

---

## API Endpoints

### GET /api/bulk-actions/candidates

Obtiene candidatos disponibles para selección masiva.

**Parámetros Query:**
- `vacancyId` (opcional): Filtra candidatos no asignados a esta vacante
- `search` (opcional): Busca por nombre o email

**Ejemplo:**
```bash
GET /api/bulk-actions/candidates?vacancyId=1&search=juan
```

**Respuesta:**
```json
{
  "candidates": [
    {
      "id": 1,
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan@example.com",
      "phone": "555-1234",
      "evaluation_count": 2
    }
  ],
  "total": 1
}
```

---

### POST /api/bulk-actions/assign

Asigna múltiples candidatos a una vacante.

**Body:**
```json
{
  "candidateIds": [1, 2, 3],
  "vacancyId": 5,
  "examId": 10
}
```

**Permisos Requeridos:** `candidates.edit`

---

### POST /api/bulk-actions/send-invitations

Envía invitaciones a múltiples candidatos.

**Body:**
```json
{
  "candidateVacancyIds": [15, 16, 17],
  "emailSubject": "Invitación a Evaluación",
  "emailTemplate": "default"
}
```

**Permisos Requeridos:** `candidates.send_invitation`

---

### POST /api/bulk-actions/export

Exporta datos de candidatos a CSV.

**Body:**
```json
{
  "candidateIds": [1, 2, 3],
  "vacancyId": null
}
```

**Respuesta:** Archivo CSV descargable

**Permisos Requeridos:** `candidates.view`

---

### POST /api/bulk-actions/delete

Elimina múltiples candidatos.

**Body:**
```json
{
  "candidateIds": [1, 2, 3]
}
```

**Permisos Requeridos:** `candidates.delete`

---

### POST /api/bulk-actions/update-status

Cambia estado de múltiples evaluaciones.

**Body:**
```json
{
  "candidateVacancyIds": [15, 16, 17],
  "newStatus": "in_progress"
}
```

**Permisos Requeridos:** `evaluations.view`

---

## Flujo del Usuario

### 1️⃣ Acceder a Bulk Actions

```
Página de Candidatos 
  → Click en "Acciones Masivas" (botón púrpura)
    → Se abre Modal
```

### 2️⃣ Seleccionar Candidatos

```
Step 1: Selection
├── Buscar por nombre/email
├── Seleccionar candidatos (checkboxes)
└── Mostrar contador: "Seleccionados: X / Total"
```

### 3️⃣ Elegir Acción

```
Step 2: Choose Action
├── Asignar a Vacante
├── Enviar Invitaciones
├── Exportar a CSV
└── Eliminar
```

### 4️⃣ Confirmar

```
Step 3: Confirm
├── Mostrar acción seleccionada
├── Mostrar cantidad de candidatos
└── Mostrar advertencias (si aplica)
```

### 5️⃣ Procesar

```
Step 4: Processing
├── Barra de progreso
├── Mostrar resultados
└── Cerrar modal automáticamente
```

---

## Ejemplos de Uso

### Frontend - JavaScript

```javascript
import { bulkActionsAPI } from './api/api';

// Obtener candidatos
const res = await bulkActionsAPI.getCandidates({
  vacancyId: 1,
  search: 'juan'
});

// Asignar múltiples
await bulkActionsAPI.assignToVacancy({
  candidateIds: [1, 2, 3],
  vacancyId: 5
});

// Enviar invitaciones
await bulkActionsAPI.sendInvitations({
  candidateVacancyIds: [15, 16, 17]
});

// Exportar
const csvData = await bulkActionsAPI.exportCSV({
  candidateIds: [1, 2, 3]
});

// Eliminar
await bulkActionsAPI.deleteCandidates({
  candidateIds: [1, 2]
});

// Cambiar estado
await bulkActionsAPI.updateStatus({
  candidateVacancyIds: [15, 16],
  newStatus: 'in_progress'
});
```

---

### Backend - cURL

```bash
# Asignar candidatos
curl -X POST http://localhost:3000/api/bulk-actions/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "candidateIds": [1, 2, 3],
    "vacancyId": 5
  }'

# Enviar invitaciones
curl -X POST http://localhost:3000/api/bulk-actions/send-invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "candidateVacancyIds": [15, 16, 17]
  }'

# Exportar CSV
curl -X POST http://localhost:3000/api/bulk-actions/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"candidateIds": [1, 2, 3]}' \
  > candidatos.csv
```

---

## Validaciones

### Asignación
- ✓ Candidato no asignado ya a la vacante
- ✓ Vacante existe
- ✓ Candidato existe

### Invitaciones
- ✓ Evaluación existe
- ✓ Email válido
- ✓ Token generado correctamente

### Eliminación
- ✓ Candidato existe
- ✓ Confirmación del usuario (requiere click extra)

### Cambio de Estado
- ✓ Estado válido (not_started, in_progress, completed)
- ✓ Evaluación existe

---

## Manejo de Errores

### Respuesta de Error Parcial

```json
{
  "message": "2 candidatos asignados exitosamente",
  "assigned": 2,
  "failed": 1,
  "results": [
    {
      "candidateId": 1,
      "success": true
    }
  ],
  "errors": [
    {
      "candidateId": 2,
      "error": "Ya asignado a esta vacante"
    }
  ]
}
```

### Respuesta de Error Total

```json
{
  "error": "Error al asignar candidatos",
  "details": "..."
}
```

---

## Performance

- **Máximo por operación:** 100 candidatos
- **Tiempo típico:** 
  - Asignación: < 2 segundos
  - Envío de emails: 5-10 segundos (depende del servidor de mail)
  - Exportación CSV: < 1 segundo
  - Eliminación: < 2 segundos

---

## Auditoría

Todas las bulk actions quedan registradas en:
- Logs de auditoría del sistema
- Timestamps de actualización en base de datos
- IP y user-agent del operador

---

**Última actualización:** 2026-07-02
**Versión:** 1.0.0
**Estado:** Implementado ✅
