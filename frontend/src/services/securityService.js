// SERVICIO DE SEGURIDAD - Manejo seguro de datos

// ALMACENAR TOKEN DE FORMA SEGURA
export const setToken = (token) => {
  if (!token || typeof token !== 'string') {
    console.error('Token inválido');
    return;
  }

  // Validar formato básico de JWT
  if (!token.match(/^[A-Za-z0-9\-_.]*$/)) {
    console.error('Token con formato inválido');
    return;
  }

  // Almacenar en localStorage
  try {
    localStorage.setItem('token', token);
  } catch (error) {
    console.error('Error almacenando token:', error);
  }
};

// OBTENER TOKEN DE FORMA SEGURA
export const getToken = () => {
  try {
    const token = localStorage.getItem('token');

    // Validar que existe y tiene formato correcto
    if (token && token.match(/^[A-Za-z0-9\-_.]*$/)) {
      return token;
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
  }
};

// LIMPIAR TOKEN
export const clearToken = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  } catch (error) {
    console.error('Error limpiando token:', error);
  }
};

// VERIFICAR SI TOKEN EXISTE Y ES VÁLIDO
export const isTokenValid = () => {
  const token = getToken();

  if (!token) {
    return false;
  }

  try {
    // Intentar decodificar JWT (sin validar firma)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Verificar expiración
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearToken();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validando token:', error);
    clearToken();
    return false;
  }
};

// ALMACENAR DATOS SENSIBLES (usuario)
export const setUserData = (userData) => {
  if (!userData || typeof userData !== 'object') {
    console.error('Datos de usuario inválidos');
    return;
  }

  try {
    // Almacenar solo datos necesarios (no sensibles)
    const safeData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
    };
    localStorage.setItem('user', JSON.stringify(safeData));
  } catch (error) {
    console.error('Error almacenando datos de usuario:', error);
  }
};

// OBTENER DATOS DE USUARIO
export const getUserData = () => {
  try {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error obteniendo datos de usuario:', error);
    return null;
  }
};

// OBTENER ROLE
export const getUserRole = () => {
  try {
    return localStorage.getItem('role') || 'user';
  } catch (error) {
    console.error('Error obteniendo role:', error);
    return 'user';
  }
};

// VERIFICAR SI USUARIO ESTÁ AUTENTICADO
export const isAuthenticated = () => {
  return isTokenValid() && getUserData() !== null;
};

// DETECTAR POSIBLE SESIÓN EXPIRADA
export const checkSessionExpiry = () => {
  if (!isTokenValid()) {
    clearToken();
    return false;
  }
  return true;
};

// LOG DE ACCIONES SENSIBLES (Cliente-side)
export const logSecurityEvent = (eventType, details = {}) => {
  const event = {
    timestamp: new Date().toISOString(),
    type: eventType,
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...details,
  };

  // En producción, enviar a servidor
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/security/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(err => console.error('Error logging security event:', err));
  } else {
    console.log('🔒 [SECURITY EVENT]', event);
  }
};

// VALIDAR ORIGEN DE SOLICITUD
export const validateOrigin = () => {
  const allowedOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
    process.env.REACT_APP_API_URL,
  ];

  const origin = window.location.origin;
  return allowedOrigins.includes(origin);
};

// PROTEGER CONTRA CLICKJACKING
export const protectAgainstClickjacking = () => {
  if (window.self !== window.top) {
    window.top.location = window.self.location;
  }
};

// INICIALIZAR PROTECCIONES DE SEGURIDAD
export const initSecurityProtections = () => {
  // Proteger contra clickjacking
  protectAgainstClickjacking();

  // Verificar sesión en tiempo real
  setInterval(() => {
    if (!checkSessionExpiry()) {
      window.location.href = '/login';
    }
  }, 60000); // Cada minuto

  // Log de evento de carga
  logSecurityEvent('page_load');

  console.log('🔒 Security protections initialized');
};

export default {
  setToken,
  getToken,
  clearToken,
  isTokenValid,
  setUserData,
  getUserData,
  getUserRole,
  isAuthenticated,
  checkSessionExpiry,
  logSecurityEvent,
  validateOrigin,
  protectAgainstClickjacking,
  initSecurityProtections,
};
