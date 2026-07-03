# 📡 Notificaciones en Tiempo Real - Documentación

Sistema de notificaciones en tiempo real usando Socket.IO para Talent IA.

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Eventos Disponibles](#eventos-disponibles)
3. [Uso en Backend](#uso-en-backend)
4. [Uso en Frontend](#uso-en-frontend)
5. [Tipos de Notificaciones](#tipos-de-notificaciones)
6. [Chat en Tiempo Real](#chat-en-tiempo-real)
7. [Actualizaciones en Vivo](#actualizaciones-en-vivo)

---

## Arquitectura

### Estructura

```
Backend (Node.js + Socket.IO)
    ↓
    ├── Evento: evaluation_started
    ├── Evento: evaluation_completed
    ├── Evento: invitation_sent
    └── Evento: warning_alert
    ↓
Frontend (React + Socket.IO Client)
    ↓
    ├── NotificationCenter (muestra notificaciones)
    ├── RealTimeChat (chat privado)
    └── Dashboard (actualizaciones vivas)
```

### Autenticación

Los WebSockets se aseguran con JWT tokens:

```javascript
// Backend
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.userId;
  next();
});

// Frontend
connectNotificationSocket(token, userName);
```

---

## Eventos Disponibles

### 1. Evaluación Iniciada

**Backend:**
```javascript
socket.on('evaluation_started', (data) => {
  io.emit('notification', {
    type: 'evaluation_started',
    title: 'Evaluación Iniciada',
    message: `${data.candidateName} ha iniciado una evaluación`,
    data: {
      candidateId: data.candidateId,
      vacancyTitle: data.vacancyTitle,
    },
  });
});
```

**Frontend:**
```javascript
import { emitEvaluationStarted } from '../services/notificationService';

emitEvaluationStarted({
  candidateId: 123,
  candidateName: 'Juan Pérez',
  vacancyTitle: 'Desarrollador React',
});
```

### 2. Evaluación Completada

**Backend:**
```javascript
socket.on('evaluation_completed', (data) => {
  io.emit('notification', {
    type: 'evaluation_completed',
    title: 'Evaluación Completada',
    message: `${data.candidateName} ha completado su evaluación`,
    data: {
      candidateId: data.candidateId,
      affinityScore: data.affinityScore,
      recommendedOperation: data.recommendedOperation,
    },
  });
});
```

**Frontend:**
```javascript
import { emitEvaluationCompleted } from '../services/notificationService';

emitEvaluationCompleted({
  candidateId: 123,
  candidateName: 'Juan Pérez',
  affinityScore: 85,
  recommendedOperation: 'Televentas',
});
```

### 3. Invitación Enviada

**Backend:**
```javascript
socket.on('invitation_sent', (data) => {
  io.emit('notification', {
    type: 'invitation_sent',
    title: 'Invitación Enviada',
    message: `Se envió invitación a ${data.candidateEmail}`,
  });
});
```

**Frontend:**
```javascript
import { emitInvitationSent } from '../services/notificationService';

emitInvitationSent({
  candidateEmail: 'candidate@example.com',
  candidateName: 'Juan Pérez',
  vacancyTitle: 'Desarrollador React',
});
```

### 4. Alerta de Advertencia

**Backend:**
```javascript
socket.on('warning_alert', (data) => {
  io.emit('notification', {
    type: 'warning',
    title: data.title || 'Alerta',
    message: data.message,
    severity: 'warning',
  });
});
```

**Frontend:**
```javascript
import { emitWarningAlert } from '../services/notificationService';

emitWarningAlert({
  title: 'Límite de Evaluaciones',
  message: 'Has alcanzado el límite de 10 evaluaciones por hora',
});
```

---

## Uso en Backend

### Emitir Notificación a Usuario Específico

```javascript
const { emitNotification } = require('./src/websocket/notificationSocket');

emitNotification(io, userId, {
  type: 'evaluation_completed',
  title: 'Evaluación Completada',
  message: 'Tu evaluación ha sido completada con éxito',
  severity: 'success',
});
```

### Emitir Broadcast a Todos

```javascript
const { emitBroadcast } = require('./src/websocket/notificationSocket');

emitBroadcast(io, 'Mantenimiento', 'El sistema estará en mantenimiento a las 22:00');
```

### Verificar si Usuario Está Online

```javascript
const { isUserOnline } = require('./src/websocket/notificationSocket');

if (isUserOnline(userId)) {
  console.log('Usuario está online');
}
```

### Obtener Usuarios Activos

```javascript
const { getActiveUsers } = require('./src/websocket/notificationSocket');

const activeUsers = getActiveUsers();
// [
//   {
//     socketId: 'socket_id_1',
//     userName: 'Admin User',
//     role: 'admin',
//     connectedAt: Date
//   },
//   ...
// ]
```

---

## Uso en Frontend

### Conectar al Servidor

```javascript
import { connectNotificationSocket } from '../services/notificationService';

useEffect(() => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  connectNotificationSocket(token, `${user.firstName} ${user.lastName}`);
}, []);
```

### Suscribirse a Notificaciones

```javascript
import { onNotification } from '../services/notificationService';

useEffect(() => {
  const unsubscribe = onNotification((notification) => {
    console.log('Notificación recibida:', notification);
    // Actualizar UI con la notificación
  });

  return unsubscribe; // Desuscribirse al desmontar
}, []);
```

### Suscribirse a Mensajes

```javascript
import { onMessage } from '../services/notificationService';

useEffect(() => {
  const unsubscribe = onMessage((message) => {
    console.log('Mensaje recibido:', message.content);
  });

  return unsubscribe;
}, []);
```

### Suscribirse a Actualizaciones

```javascript
import { onUpdate } from '../services/notificationService';

useEffect(() => {
  const unsubscribe = onUpdate((update) => {
    if (update.type === 'evaluation_progress') {
      console.log(`Progreso: ${update.data.progress}%`);
    }
  });

  return unsubscribe;
}, []);
```

### Verificar Conexión

```javascript
import { isConnected } from '../services/notificationService';

if (isConnected()) {
  console.log('Conectado al servidor de notificaciones');
}
```

---

## Tipos de Notificaciones

### Estructura Base

```javascript
{
  type: 'evaluation_started',           // Tipo de evento
  title: 'Evaluación Iniciada',         // Título
  message: 'Juan Pérez ha iniciado...', // Mensaje
  data: { /* datos adicionales */ },    // Datos contextuales
  severity: 'info',                     // info, success, warning, error
  timestamp: Date                       // Timestamp automático
}
```

### Severidades

| Nivel | Color | Ícono | Uso |
|-------|-------|-------|-----|
| `info` | Azul | ℹ️ | Información general |
| `success` | Verde | ✓ | Acciones exitosas |
| `warning` | Amarillo | ⚠️ | Advertencias |
| `error` | Rojo | ✗ | Errores |

### Ejemplos de Notificaciones

**Éxito:**
```javascript
{
  type: 'evaluation_completed',
  title: 'Evaluación Completada',
  message: 'Juan Pérez completó su evaluación con 85 puntos',
  severity: 'success',
}
```

**Advertencia:**
```javascript
{
  type: 'warning',
  title: 'Límite Alcanzado',
  message: 'Has enviado 10 invitaciones hoy (límite diario)',
  severity: 'warning',
}
```

---

## Chat en Tiempo Real

### Enviar Mensaje Privado

**Frontend:**
```javascript
import { sendPrivateMessage } from '../services/notificationService';

sendPrivateMessage(userId, 'Hola, ¿cómo estás?');
```

**Backend (automático):**
El socket manejará:
```javascript
socket.on('send_message', (data) => {
  // Envía el mensaje al destinatario
  io.to(recipientSocketId).emit('receive_message', message);
});
```

### Recibir Mensajes

**Frontend:**
```javascript
import { onMessage } from '../services/notificationService';

onMessage((message) => {
  console.log(`${message.senderName}: ${message.content}`);
});
```

### Componente de Chat

```javascript
import RealTimeChat from '../components/RealTimeChat';

<RealTimeChat
  recipientId={userId}
  recipientName="Juan Pérez"
  onClose={() => setChatOpen(false)}
/>
```

---

## Actualizaciones en Vivo

### Progreso de Evaluación

**Frontend (EvaluationTest.jsx):**
```javascript
import { emitEvaluationProgress } from '../services/notificationService';

// Cada vez que responde una pregunta
emitEvaluationProgress({
  evaluationId: evaluation.id,
  candidateId: candidate.id,
  progress: (currentQuestion / totalQuestions) * 100,
  currentQuestion: currentQuestion + 1,
  totalQuestions: totalQuestions,
});
```

**Backend (recibe y retransmite):**
```javascript
socket.on('evaluation_progress', (data) => {
  io.emit('real_time_update', {
    type: 'evaluation_progress',
    data: data,
  });
});
```

### Cambio de Estado de Candidato

**Frontend:**
```javascript
import { emitCandidateStatusChanged } from '../services/notificationService';

emitCandidateStatusChanged({
  candidateId: candidate.id,
  candidateName: candidate.name,
  status: 'completed',
});
```

### Actualización del Dashboard

**Frontend:**
```javascript
import { requestDashboardUpdate } from '../services/notificationService';

// Solicitar actualización
requestDashboardUpdate();

// Recibir actualización
onUpdate((update) => {
  if (update.type === 'dashboard') {
    console.log(`Usuarios activos: ${update.activeUsers}`);
  }
});
```

---

## Eventos de Conexión

### Usuario Conectado

**Emitido por:** Server
**Recibido por:** Todos los clientes

```javascript
{
  type: 'user_connected',
  userId: 123,
  userName: 'Juan Pérez',
  activeUsers: 5,
  timestamp: Date
}
```

### Usuario Desconectado

**Emitido por:** Server
**Recibido por:** Todos los clientes

```javascript
{
  type: 'user_disconnected',
  userId: 123,
  userName: 'Juan Pérez',
  activeUsers: 4,
  timestamp: Date
}
```

---

## Manejo de Errores

### Cliente

```javascript
connectNotificationSocket(token, userName)
  .on('error', (error) => {
    console.error('Error de conexión:', error);
    // error puede ser: 'Token requerido', 'Token inválido', etc.
  });
```

### Reconexión Automática

```javascript
// Configurado automáticamente en notificationService.js
{
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
}
```

---

## Mejor Prácticas

### 1. Desuscribirse Siempre

```javascript
useEffect(() => {
  const unsubscribe = onNotification(callback);
  return unsubscribe; // Limpiar al desmontar
}, []);
```

### 2. Validar Token

```javascript
if (!token || !isTokenValid()) {
  disconnectNotificationSocket();
  return;
}
```

### 3. Limitar Eventos

```javascript
// ✅ BIEN - Emitir cuando sea necesario
if (evaluationCompleted) {
  emitEvaluationCompleted(data);
}

// ❌ MAL - No emitir en cada render
emitEvaluationProgress(data); // En render loop
```

### 4. Manejar Desconexiones

```javascript
socket.on('disconnect', () => {
  console.log('Desconectado del servidor');
  // Mostrar mensaje al usuario
  // Intentar reconectar
});
```

---

## Configuración de Producción

### Variables de Entorno

```env
# Backend
FRONTEND_URL=https://talent-ia.example.com
SOCKET_IO_PORT=3000
REDIS_URL=redis://localhost:6379

# Frontend
REACT_APP_API_URL=https://api.talent-ia.example.com
```

### HTTPS/WSS

```javascript
// Backend - usar HTTPS
const https = require('https');
const server = https.createServer(app);
const io = initSocket(server);

// Frontend - automático (si está en HTTPS)
// ws:// → wss://
```

---

## Troubleshooting

### Problema: "Conexión rechazada"

**Solución:**
```javascript
// Verificar que Socket.IO esté iniciado en el servidor
// Verificar CORS en server.js
// Verificar que FRONTEND_URL sea correcto
```

### Problema: "Notificaciones no llegan"

**Solución:**
```javascript
// Verificar que socket está conectado
console.log(isConnected()); // debe ser true

// Verificar suscripción
onNotification(callback); // debe estar llamado
```

### Problema: "Mensajes duplicados"

**Solución:**
```javascript
// Desuscribirse correctamente
const unsubscribe = onNotification(callback);
useEffect(() => {
  return unsubscribe; // Limpiar en cleanup
}, []);
```

---

## Ejemplo Completo

### Backend

```javascript
// En evaluationController.js
exports.submitEvaluation = async (req, res) => {
  try {
    // ... código de evaluación ...

    // Emitir notificación
    emitNotification(global.io, adminId, {
      type: 'evaluation_completed',
      title: 'Nueva Evaluación',
      message: `${candidateName} completó evaluación`,
      severity: 'success',
    });

    res.json({ message: 'Evaluación completada' });
  } catch (error) {
    // ...
  }
};
```

### Frontend

```javascript
// En Dashboard.jsx
import { onNotification, onUpdate } from '../services/notificationService';

function Dashboard() {
  useEffect(() => {
    // Suscribirse a notificaciones
    const unsubNotif = onNotification((notification) => {
      if (notification.type === 'evaluation_completed') {
        // Actualizar lista de evaluaciones
        loadEvaluations();
      }
    });

    // Suscribirse a actualizaciones
    const unsubUpdate = onUpdate((update) => {
      if (update.type === 'user_connected') {
        console.log(`${update.userName} está online`);
      }
    });

    return () => {
      unsubNotif();
      unsubUpdate();
    };
  }, []);

  return (
    // ...
  );
}
```

---

## Performance

### Optimizaciones

1. **Lazy Loading:** Solo conectar cuando sea necesario
2. **Batching:** Agrupar múltiples eventos
3. **Debouncing:** Limitar frecuencia de eventos
4. **Memory Leaks:** Siempre desuscribirse

### Monitoreo

```javascript
// Verificar conexiones activas (backend)
const { getActiveUsers } = require('./src/websocket/notificationSocket');

setInterval(() => {
  const users = getActiveUsers();
  console.log(`📊 Usuarios activos: ${users.length}`);
}, 60000);
```

---

**Última actualización:** 2026-07-02
**Versión:** 1.0.0
