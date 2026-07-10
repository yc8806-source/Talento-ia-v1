const { Pool } = require('pg');

// Las variables de entorno ya fueron cargadas en server.js
// Intentar RAILWAY_DATABASE_URL primero (para evitar var de Render), luego DATABASE_URL
const dbUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

const connectionConfig = {
  connectionString: dbUrl,
};

// Usar SSL solo si no es localhost
if (dbUrl && !dbUrl.includes('localhost')) {
  connectionConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  console.error('Error en conexión a BD:', err);
});

console.log('✅ Conectado a PostgreSQL en Railway');

module.exports = pool;
