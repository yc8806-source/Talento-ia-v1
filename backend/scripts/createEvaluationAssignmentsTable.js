const pool = require('../src/config/database');

async function createEvaluationAssignmentsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluation_assignments (
        id SERIAL PRIMARY KEY,
        candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
        vacancy_id INT REFERENCES vacancies(id) ON DELETE CASCADE,
        evaluation_ids JSONB NOT NULL DEFAULT '[]',
        access_token VARCHAR(255) UNIQUE NOT NULL,
        current_evaluation_index INT DEFAULT 0,
        assigned_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_candidate
        ON evaluation_assignments(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_token
        ON evaluation_assignments(access_token);
      CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_vacancy
        ON evaluation_assignments(vacancy_id);
    `);

    console.log('✅ Tabla evaluation_assignments creada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando tabla:', error);
    process.exit(1);
  }
}

createEvaluationAssignmentsTable();
