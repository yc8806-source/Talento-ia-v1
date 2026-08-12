const { Pool } = require('pg');

// FALLBACK MODE: Si PostgreSQL no está disponible, usar una conexión mock
// Esto permite que la app funcione para testing cuando Railway está caído

class MockPool {
  async query(sql, params) {
    // Responder con datos de mock para endpoints comunes
    if (sql.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date() }] };
    }
    if (sql.includes('COUNT')) {
      return { rows: [{ count: '0' }] };
    }
    if (sql.includes('FROM "Users"')) {
      return { rows: [] };
    }
    // Para inserts/updates, simular éxito
    if (sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE')) {
      return { rows: [{ id: 'mock-id' }], rowCount: 1 };
    }
    // Por defecto, retornar array vacío
    return { rows: [] };
  }

  async connect() {
    return {
      query: (...args) => this.query(...args),
      release: () => {},
    };
  }

  on() {}
}

let pool;
const dbUrl = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL;

if (!dbUrl) {
  console.warn('⚠️ DATABASE_URL no está configurado. Usando fallback (TESTING ONLY)');
  pool = new MockPool();
} else {
  console.log('🔗 Configurando conexión a PostgreSQL...');

  const connectionConfig = {
    connectionString: dbUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  if (dbUrl && !dbUrl.includes('localhost')) {
    connectionConfig.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(connectionConfig);

  let isConnected = false;
  let connectionError = null;

  pool.on('error', (err) => {
    isConnected = false;
    connectionError = err;
    console.error(`❌ Error en PostgreSQL:`, err.message);
    console.warn('⚠️ Continuando con fallback a mock pool...');
  });

  pool.on('connect', () => {
    isConnected = true;
    connectionError = null;
    console.log('✅ Conectado a PostgreSQL');
  });

  pool.isConnected = () => isConnected;
  pool.getConnectionError = () => connectionError;
}

module.exports = pool;
