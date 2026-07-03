// VALIDACIÓN DE EMAIL
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// VALIDACIÓN DE TELÉFONO
export const isValidPhone = (phone) => {
  const regex = /^[\d\s\-\+\(\)]+$/;
  return regex.test(phone) && phone.length >= 7;
};

// VALIDACIÓN DE CONTRASEÑA (mínimo 8 caracteres, 1 mayúscula, 1 número)
export const isValidPassword = (password) => {
  const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};

// VALIDACIÓN DE NOMBRE
export const isValidName = (name) => {
  const regex = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]{2,50}$/;
  return regex.test(name);
};

// SANITIZAR STRING (remover caracteres peligrosos)
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/script/gi, '') // Remover script
    .trim();
};

// SANITIZAR OBJETO
export const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeString(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

// VALIDAR NÚMERO POSITIVO
export const isPositiveNumber = (num) => {
  return Number.isInteger(Number(num)) && Number(num) > 0;
};

// VALIDAR URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// OBJETO DE REGLAS DE VALIDACIÓN
export const validationRules = {
  email: (value) => {
    if (!value) return 'Email es requerido';
    if (!isValidEmail(value)) return 'Email inválido';
    return null;
  },

  password: (value) => {
    if (!value) return 'Contraseña es requerida';
    if (value.length < 8) return 'Contraseña debe tener mínimo 8 caracteres';
    if (!/[A-Z]/.test(value)) return 'Debe contener al menos una mayúscula';
    if (!/\d/.test(value)) return 'Debe contener al menos un número';
    return null;
  },

  firstName: (value) => {
    if (!value) return 'Nombre es requerido';
    if (!isValidName(value)) return 'Nombre inválido';
    return null;
  },

  lastName: (value) => {
    if (!value) return 'Apellido es requerido';
    if (!isValidName(value)) return 'Apellido inválido';
    return null;
  },

  phone: (value) => {
    if (value && !isValidPhone(value)) return 'Teléfono inválido';
    return null;
  },

  title: (value) => {
    if (!value) return 'Título es requerido';
    if (value.length < 3) return 'Título debe tener mínimo 3 caracteres';
    if (value.length > 100) return 'Título no debe exceder 100 caracteres';
    return null;
  },

  description: (value) => {
    if (value && value.length > 500) return 'Descripción no debe exceder 500 caracteres';
    return null;
  },
};

// FUNCIÓN PARA VALIDAR FORMULARIO
export const validateForm = (formData, rules) => {
  const errors = {};

  for (const field in rules) {
    const error = rules[field](formData[field] || '');
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// DETECTAR POSIBLE ATAQUE XSS
export const hasXSSPatterns = (str) => {
  if (typeof str !== 'string') return false;

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc
    /javascript:/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(str));
};

export default {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidName,
  sanitizeString,
  sanitizeObject,
  isPositiveNumber,
  isValidUrl,
  validationRules,
  validateForm,
  hasXSSPatterns,
};
