const pool = require('../src/config/database');

async function createTypingTables() {
  try {
    // Tabla de textos para las pruebas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS typing_tests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        text TEXT NOT NULL,
        difficulty VARCHAR(20) DEFAULT 'medium',
        duration_seconds INTEGER DEFAULT 60,
        word_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de resultados de typing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS typing_results (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL,
        candidate_vacancy_id INTEGER,
        typing_test_id INTEGER NOT NULL,
        input_text TEXT,
        wpm DECIMAL(5,2),
        accuracy DECIMAL(5,2),
        gross_wpm DECIMAL(5,2),
        net_wpm DECIMAL(5,2),
        total_errors INTEGER,
        time_taken_seconds INTEGER,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_vacancy_id) REFERENCES candidate_vacancies(id) ON DELETE SET NULL,
        FOREIGN KEY (typing_test_id) REFERENCES typing_tests(id) ON DELETE CASCADE
      );
    `);

    // Índices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_typing_results_candidate ON typing_results(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_typing_results_test ON typing_results(typing_test_id);
      CREATE INDEX IF NOT EXISTS idx_typing_results_created ON typing_results(created_at DESC);
    `);

    console.log('✅ Tablas de typing tests creadas exitosamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
  } finally {
    await pool.end();
  }
}

createTypingTables();
