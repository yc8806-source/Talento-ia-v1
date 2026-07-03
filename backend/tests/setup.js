// Setup de pruebas globales
beforeAll(() => {
  // Configurar variables de entorno para pruebas
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/talent_ia_test';
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Limpiar después de todas las pruebas
  jest.clearAllMocks();
});

// Mock console para evitar ruido en logs de prueba
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
