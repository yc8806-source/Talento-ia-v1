const { Pool } = require('pg');
require('dotenv').config();

const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Usar SSL solo si no es localhost
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')) {
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
