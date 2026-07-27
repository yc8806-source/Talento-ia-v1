const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/talent_ia'
});

async function createTable() {
  try {
    console.log('🔄 Creando tabla vacancy_spelling_exams...\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vacancy_spelling_exams (
        id SERIAL PRIMARY KEY,
        vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
        spelling_exam_id INTEGER NOT NULL REFERENCES spelling_grammar_tests(id) ON DELETE CASCADE,
        exam_order INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vacancy_id, spelling_exam_id)
      )
    `);

    console.log('✅ Tabla vacancy_spelling_exams creada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando tabla:', error.message);
    process.exit(1);
  }
}

createTable();
