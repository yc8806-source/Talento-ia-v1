const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Railway
  },
});

pool.on('error', (err) => {
  console.error('Error en conexión a BD:', err);
});

console.log('✅ Conectado a PostgreSQL en Railway');

module.exports = pool;
