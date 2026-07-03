import io from 'socket.io-client';

let socket = null;
let notificationCallbacks = [];
let messageCallbacks = [];
let updateCallbacks = [];

// CONECTAR AL SERVIDOR DE WEBSOCKETS
export const connectNotificationSocket = (token, userName) => {
  if (socket?.connected) {
    console.log('Ya estás conectado al servidor de notificaciones');
    return socket;
  }

  const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  socket = io(SOCKET_URL, {
    auth: {
      token,
      userName,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  // CONEXIÓN EXITOSA
  socket.on('connect', () => {
    console.log('✅ Conectado al servidor de notificaciones');
  });

  // DESCONEXIÓN
  socket.on('disconnect', () => {
    console.log('❌ Desconectado del servidor de notificaciones');
  });

  // RECONEXIÓN
  socket.on('reconnect', () => {
    console.log('🔄 Reconectado al servidor de notificaciones');
  });

  // NOTIFICACIONES
  socket.on('notification', (notification) => {
    console.log('🔔 Notificación recibida:', notification);
    notificationCallbacks.forEach(cb => cb(notification));
  });

  // NOTIFICACIONES DE BROADCAST
  socket.on('broadcast_notification', (broadcast) => {
    console.log('📢 Broadcast recibido:', broadcast);
    notificationCallbacks.forEach(cb => cb({
      type: 'broadcast',
      ...broadcast,
    }));
  });

  // MENSAJES PRIVADOS
  socket.on('receive_message', (message) => {
    console.log('💬 Mensaje recibido:', message);
    messageCallbacks.forEach(cb => cb(message));
  });

  // ACTUALIZACIONES EN TIEMPO REAL
  socket.on('real_time_update', (update) => {
    console.log('🔄 Actualización en tiempo real:', update);
    updateCallbacks.forEach(cb => cb(update));
  });

  // ACTUALIZACIÓN DE DASHBOARD
  socket.on('dashboard_update', (data) => {
    console.log('📊 Actualización de dashboard:', data);
    updateCallbacks.forEach(cb => cb({
      type: 'dashboard',
      ...data,
    }));
  });

  // USUARIO CONECTADO
  socket.on('user_connected', (data) => {
    console.log('👤 Usuario conectado:', data.userName);
    updateCallbacks.forEach(cb => cb({
      type: 'user_connected',
      ...data,
    }));
  });

  // USUARIO DESCONECTADO
  socket.on('user_disconnected', (data) => {
    console.log('👤 Usuario desconectado:', data.userName);
    updateCallbacks.forEach(cb => cb({
      type: 'user_disconnected',
      ...data,
    }));
  });

  // CONFIRMACIÓN DE MENSAJE
  socket.on('message_sent', (data) => {
    console.log('✅ Mensaje enviado:', data);
  });

  // ERRORES
  socket.on('error', (error) => {
    console.error('❌ Error en socket:', error);
  });

  return socket;
};

// DESCONECTAR
export const disconnectNotificationSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Desconectado del servidor de notificaciones');
  }
};

// SUSCRIBIRSE A NOTIFICACIONES
export const onNotification = (callback) => {
  notificationCallbacks.push(callback);

  // Retornar función para desuscribirse
  return () => {
    notificationCallbacks = notificationCallbacks.filter(cb => cb !== callback);
  };
};

// SUSCRIBIRSE A MENSAJES
export const onMessage = (callback) => {
  messageCallbacks.push(callback);

  return () => {
    messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
  };
};

// SUSCRIBIRSE A ACTUALIZACIONES
export const onUpdate = (callback) => {
  updateCallbacks.push(callback);

  return () => {
    updateCallbacks = updateCallbacks.filter(cb => cb !== callback);
  };
};

// EMITIR EVENTOS

export const emitEvaluationStarted = (data) => {
  if (socket?.connected) {
    socket.emit('evaluation_started', data);
  }
};

export const emitEvaluationCompleted = (data) => {
  if (socket?.connected) {
    socket.emit('evaluation_completed', data);
  }
};

export const emitInvitationSent = (data) => {
  if (socket?.connected) {
    socket.emit('invitation_sent', data);
  }
};

export const emitWarningAlert = (data) => {
  if (socket?.connected) {
    socket.emit('warning_alert', data);
  }
};

export const emitEvaluationProgress = (data) => {
  if (socket?.connected) {
    socket.emit('evaluation_progress', data);
  }
};

export const emitCandidateStatusChanged = (data) => {
  if (socket?.connected) {
    socket.emit('candidate_status_changed', data);
  }
};

// ENVIAR MENSAJE PRIVADO
export const sendPrivateMessage = (recipientId, content) => {
  if (socket?.connected) {
    socket.emit('send_message', {
      recipientId,
      content,
    });
  }
};

// ENVIAR BROADCAST (solo admins)
export const sendBroadcast = (title, message) => {
  if (socket?.connected) {
    socket.emit('broadcast_message', {
      title,
      message,
    });
  }
};

// SOLICITAR ACTUALIZACIÓN DE DASHBOARD
export const requestDashboardUpdate = () => {
  if (socket?.connected) {
    socket.emit('request_dashboard_update');
  }
};

// VERIFICAR CONEXIÓN
export const isConnected = () => {
  return socket?.connected || false;
};

// OBTENER SOCKET (para uso avanzado)
export const getSocket = () => {
  return socket;
};

export default {
  connectNotificationSocket,
  disconnectNotificationSocket,
  onNotification,
  onMessage,
  onUpdate,
  emitEvaluationStarted,
  emitEvaluationCompleted,
  emitInvitationSent,
  emitWarningAlert,
  emitEvaluationProgress,
  emitCandidateStatusChanged,
  sendPrivateMessage,
  sendBroadcast,
  requestDashboardUpdate,
  isConnected,
  getSocket,
};
