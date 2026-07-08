const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  try {
    console.log('🔄 Creando tabla candidate_vacancies...\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_vacancies (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'invited',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(candidate_id, vacancy_id)
      )
    `);

    console.log('✅ Tabla candidate_vacancies creada correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTable();
