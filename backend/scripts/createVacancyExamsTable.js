const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  try {
    console.log('🔄 Creando tabla vacancy_exams...\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vacancy_exams (
        id SERIAL PRIMARY KEY,
        vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
        exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        exam_order INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vacancy_id, exam_id)
      )
    `);

    console.log('✅ Tabla vacancy_exams creada correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTable();
