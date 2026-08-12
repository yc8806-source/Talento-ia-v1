const { Pool } = require('pg');

// Las variables de entorno ya fueron cargadas en server.js
const dbUrl = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL no está configurado');
  process.exit(1);
}

const connectionConfig = {
  connectionString: dbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Usar SSL solo si no es localhost
if (dbUrl && !dbUrl.includes('localhost')) {
  connectionConfig.ssl = {
    rejectUnauthorized: false,
  };
}

console.log('🔗 Configurando conexión a BD...');
console.log('   Database:', dbUrl.substring(0, 50) + '...');

const pool = new Pool(connectionConfig);

// Reintentar conexión automáticamente
let connectionAttempts = 0;
const maxRetries = 3;

pool.on('error', (err) => {
  connectionAttempts++;
  console.error(`❌ Error en BD (intento ${connectionAttempts}/${maxRetries}):`, err.message);

  if (connectionAttempts >= maxRetries) {
    console.error('❌ Max retries alcanzado. Verifica DATABASE_URL en Render dashboard.');
  }
});

pool.on('connect', () => {
  connectionAttempts = 0;
  console.log('✅ Conectado a PostgreSQL');
});

// Test de conexión inmediata
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Test de conexión exitoso');
    client.release();
  } catch (err) {
    console.error('⚠️ Test de conexión FALLÓ:', err.message);
    console.error('📝 Verifica que DATABASE_URL sea correcto en Render Environment Variables');
  }
})();

module.exports = pool;
