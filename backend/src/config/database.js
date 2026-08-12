const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL no está configurado');
  process.exit(1);
}

const connectionConfig = {
  connectionString: dbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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

let isConnected = false;
let connectionError = null;

pool.on('error', (err) => {
  isConnected = false;
  connectionError = err;
  console.error(`❌ Error en BD:`, err.message);
});

pool.on('connect', () => {
  isConnected = true;
  connectionError = null;
  console.log('✅ Conectado a PostgreSQL');
});

// Test de conexión con timeout agresivo
let connectionTested = false;
(async () => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Connection timeout')), 8000)
  );

  try {
    const testPromise = (async () => {
      const client = await pool.connect();
      console.log('✅ Test de conexión exitoso');
      client.release();
      isConnected = true;
    })();

    await Promise.race([testPromise, timeout]);
    connectionTested = true;
  } catch (err) {
    console.error('⚠️ Test de conexión FALLÓ:', err.message);
    console.error('📝 Motivo: Railway puede estar caído o DATABASE_URL es incorrecto');
    console.error('📝 Verifica: Render Environment Variables → DATABASE_URL');
    connectionTested = true;
    isConnected = false;
  }
})();

// Exportar pool con información de estado
pool.isConnected = () => isConnected;
pool.getConnectionError = () => connectionError;

module.exports = pool;
