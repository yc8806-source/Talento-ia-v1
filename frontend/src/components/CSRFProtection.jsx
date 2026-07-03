import { useEffect, useState } from 'react';
import api from '../api/api';

// Hook para obtener y validar CSRF token
export const useCSRFToken = () => {
  const [csrfToken, setCsrfToken] = useState(null);

  useEffect(() => {
    // Obtener CSRF token del servidor (si es necesario)
    // Por ahora, usamos un token simple basado en timestamp
    const token = generateClientSideCSRFToken();
    setCsrfToken(token);

    // Agregar token a interceptor de requests
    api.interceptors.request.use((config) => {
      if (csrfToken && ['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase())) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
      return config;
    });
  }, [csrfToken]);

  return csrfToken;
};

// Generar token CSRF en cliente
const generateClientSideCSRFToken = () => {
  const crypto = window.crypto || window.msCrypto;

  if (crypto?.getRandomValues) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
  }

  // Fallback para navegadores sin crypto
  return btoa(Math.random().toString() + Date.now().toString());
};

// Validar origen de referrer
export const validateReferrer = () => {
  const expectedOrigin = window.location.origin;
  const referrer = document.referrer;

  if (referrer && !referrer.startsWith(expectedOrigin)) {
    console.warn('⚠️ Posible ataque CSRF detectado');
    return false;
  }

  return true;
};

// Detectar cambio de origen (navegación a sitio externo)
export const detectExternalNavigation = () => {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');

    if (link?.href) {
      const linkOrigin = new URL(link.href, window.location.href).origin;

      if (linkOrigin !== window.location.origin && !link.target === '_blank') {
        console.warn('⚠️ Navegación externa detectada:', link.href);
      }
    }
  });
};

// Componente para envolver formularios sensibles
export const CSRFProtectedForm = ({ children, onSubmit }) => {
  const csrfToken = useCSRFToken();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar referrer antes de enviar
    if (!validateReferrer()) {
      console.error('Request blocked due to referrer validation');
      return;
    }

    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="csrf_token" value={csrfToken || ''} />
      {children}
    </form>
  );
};

export default useCSRFToken;
