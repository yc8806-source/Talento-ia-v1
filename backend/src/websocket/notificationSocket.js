const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Almacenar conexiones activas
const activeUsers = new Map();
const userSockets = new Map();

// Inicializar Socket.IO
const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // MIDDLEWARE - Autenticar socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token requerido'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Token inválido'));
    }
  });

  // CONEXIÓN
  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userName = socket.handshake.auth.userName || 'Usuario';

    // Registrar usuario activo
    activeUsers.set(userId, {
      socketId: socket.id,
      userName,
      role: socket.userRole,
      connectedAt: new Date(),
    });

    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    userSockets.get(userId).push(socket.id);

    console.log(`✅ Usuario conectado: ${userName} (${userId})`);
    console.log(`📊 Usuarios activos: ${activeUsers.size}`);

    // Notificar a todos sobre nuevo usuario
    io.emit('user_connected', {
      userId,
      userName,
      activeUsers: activeUsers.size,
      timestamp: new Date(),
    });

    // ============================================
    // EVENTOS DE NOTIFICACIONES
    // ============================================

    // NOTIFICACIÓN - Evaluación iniciada
    socket.on('evaluation_started', (data) => {
      console.log(`📝 Evaluación iniciada: ${data.candidateName}`);

      io.emit('notification', {
        type: 'evaluation_started',
        title: 'Evaluación Iniciada',
        message: `${data.candidateName} ha iniciado una evaluación`,
        data: {
          candidateId: data.candidateId,
          vacancyTitle: data.vacancyTitle,
          timestamp: new Date(),
        },
        severity: 'info',
      });
    });

    // NOTIFICACIÓN - Evaluación completada
    socket.on('evaluation_completed', (data) => {
      console.log(`✅ Evaluación completada: ${data.candidateName}`);

      io.emit('notification', {
        type: 'evaluation_completed',
        title: 'Evaluación Completada',
        message: `${data.candidateName} ha completado su evaluación`,
        data: {
          candidateId: data.candidateId,
          candidateName: data.candidateName,
          affinityScore: data.affinityScore,
          recommendedOperation: data.recommendedOperation,
          timestamp: new Date(),
        },
        severity: 'success',
      });
    });

    // NOTIFICACIÓN - Invitación enviada
    socket.on('invitation_sent', (data) => {
      console.log(`📧 Invitación enviada a: ${data.candidateEmail}`);

      io.emit('notification', {
        type: 'invitation_sent',
        title: 'Invitación Enviada',
        message: `Se envió invitación a ${data.candidateEmail}`,
        data: {
          candidateEmail: data.candidateEmail,
          candidateName: data.candidateName,
          vacancyTitle: data.vacancyTitle,
          timestamp: new Date(),
        },
        severity: 'info',
      });
    });

    // NOTIFICACIÓN - Advertencia (límite de evaluaciones, etc)
    socket.on('warning_alert', (data) => {
      console.log(`⚠️ Alerta: ${data.message}`);

      io.emit('notification', {
        type: 'warning',
        title: data.title || 'Alerta',
        message: data.message,
        data: data.data || {},
        severity: 'warning',
      });
    });

    // ============================================
    // CHAT EN TIEMPO REAL
    // ============================================

    // MENSAJE - Enviar mensaje privado
    socket.on('send_message', (data) => {
      const recipientSockets = userSockets.get(data.recipientId) || [];

      const message = {
        senderId: userId,
        senderName: userName,
        senderRole: socket.userRole,
        recipientId: data.recipientId,
        content: data.content,
        timestamp: new Date(),
      };

      console.log(`💬 Mensaje de ${userName} a usuario ${data.recipientId}`);

      // Enviar al destinatario
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('receive_message', message);
      });

      // Confirmar al remitente
      socket.emit('message_sent', {
        messageId: Date.now(),
        status: 'sent',
      });
    });

    // MENSAJE - Broadcast a todos (solo admins)
    socket.on('broadcast_message', (data) => {
      if (socket.userRole !== 'admin') {
        socket.emit('error', { message: 'No tienes permiso para enviar broadcasts' });
        return;
      }

      console.log(`📢 Broadcast de ${userName}`);

      io.emit('broadcast_notification', {
        from: userName,
        title: data.title,
        message: data.message,
        timestamp: new Date(),
        icon: '📢',
      });
    });

    // ============================================
    // ACTUALIZACIONES EN TIEMPO REAL
    // ============================================

    // ACTUALIZACIÓN - Estado de candidato
    socket.on('candidate_status_changed', (data) => {
      console.log(`🔄 Estado de candidato actualizado: ${data.candidateName}`);

      io.emit('real_time_update', {
        type: 'candidate_status',
        action: 'updated',
        entity: 'candidate',
        data: {
          candidateId: data.candidateId,
          status: data.status,
          timestamp: new Date(),
        },
      });
    });

    // ACTUALIZACIÓN - Evaluación en progreso
    socket.on('evaluation_progress', (data) => {
      console.log(`⏳ Evaluación en progreso: ${data.progress}%`);

      io.emit('real_time_update', {
        type: 'evaluation_progress',
        data: {
          evaluationId: data.evaluationId,
          candidateId: data.candidateId,
          progress: data.progress, // 0-100
          currentQuestion: data.currentQuestion,
          totalQuestions: data.totalQuestions,
          timestamp: new Date(),
        },
      });
    });

    // ACTUALIZACIÓN - Dashboard (estadísticas vivas)
    socket.on('request_dashboard_update', () => {
      socket.emit('dashboard_update', {
        activeUsers: activeUsers.size,
        connectedAt: new Date(),
      });
    });

    // ============================================
    // DESCONEXIÓN
    // ============================================

    socket.on('disconnect', () => {
      activeUsers.delete(userId);

      const userSocketsList = userSockets.get(userId) || [];
      const index = userSocketsList.indexOf(socket.id);
      if (index > -1) {
        userSocketsList.splice(index, 1);
      }

      if (userSocketsList.length === 0) {
        userSockets.delete(userId);
      }

      console.log(`❌ Usuario desconectado: ${userName}`);
      console.log(`📊 Usuarios activos: ${activeUsers.size}`);

      io.emit('user_disconnected', {
        userId,
        userName,
        activeUsers: activeUsers.size,
        timestamp: new Date(),
      });
    });

    // MANEJO DE ERRORES
    socket.on('error', (error) => {
      console.error('Error en socket:', error);
    });
  });

  return io;
};

// FUNCIONES DE UTILIDAD PARA EMITIR NOTIFICACIONES DESDE EL BACKEND

const emitNotification = (io, userId, notification) => {
  const userSocketsList = userSockets.get(userId) || [];

  if (userSocketsList.length > 0) {
    io.to(userSocketsList[0]).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
  }
};

const emitBroadcast = (io, title, message) => {
  io.emit('broadcast_notification', {
    title,
    message,
    timestamp: new Date(),
  });
};

const getActiveUsers = () => {
  return Array.from(activeUsers.values());
};

const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};

module.exports = {
  initSocket,
  emitNotification,
  emitBroadcast,
  getActiveUsers,
  isUserOnline,
  activeUsers,
  userSockets,
};
