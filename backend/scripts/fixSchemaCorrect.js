const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
  try {
    console.log('🔄 Renombrando columnas...\n');

    // Renombrar en tabla candidates
    await pool.query('ALTER TABLE candidates RENAME COLUMN firstname TO first_name');
    await pool.query('ALTER TABLE candidates RENAME COLUMN lastname TO last_name');
    console.log('✅ Tabla candidates corregida (firstname → first_name, lastname → last_name)');

    // Renombrar en tabla users
    await pool.query('ALTER TABLE users RENAME COLUMN firstName TO first_name');
    await pool.query('ALTER TABLE users RENAME COLUMN lastName TO last_name');
    console.log('✅ Tabla users corregida');

    console.log('\n✅ Schema actualizado correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixSchema();
