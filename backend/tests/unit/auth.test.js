const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication Unit Tests', () => {
  describe('Password Hashing', () => {
    test('debe hashear una contraseña correctamente', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(30);
    });

    test('debe validar una contraseña hasheada', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    test('debe rechazar una contraseña incorrecta', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token', () => {
    test('debe crear un token JWT válido', () => {
      const payload = { id: 1, email: 'test@example.com', role: 'admin' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('debe verificar un token JWT válido', () => {
      const payload = { id: 1, email: 'test@example.com', role: 'admin' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    test('debe rechazar un token JWT inválido', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, process.env.JWT_SECRET);
      }).toThrow();
    });

    test('debe rechazar un token JWT expirado', (done) => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });

      setTimeout(() => {
        expect(() => {
          jwt.verify(token, process.env.JWT_SECRET);
        }).toThrow();
        done();
      }, 100);
    }, 10000);
  });

  describe('Email Validation', () => {
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    test('debe validar un email correcto', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('debe rechazar un email inválido', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    const isValidPassword = (password) => {
      return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
    };

    test('debe validar una contraseña fuerte', () => {
      expect(isValidPassword('StrongPass123')).toBe(true);
      expect(isValidPassword('AnotherGood1Pass')).toBe(true);
    });

    test('debe rechazar una contraseña débil', () => {
      expect(isValidPassword('weak')).toBe(false);
      expect(isValidPassword('nouppercaseornumber')).toBe(false);
      expect(isValidPassword('NoNumbers')).toBe(false);
    });
  });
});
