const pool = require('../src/config/database');

async function createSpellingGrammarTables() {
  try {
    // Tabla de pruebas de ortografía y gramática
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spelling_grammar_tests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty VARCHAR(20) DEFAULT 'medium',
        language VARCHAR(20) DEFAULT 'es',
        test_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de preguntas de ortografía y gramática
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spelling_grammar_questions (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL,
        question_type VARCHAR(50) NOT NULL,
        question_text TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        options JSONB,
        difficulty VARCHAR(20) DEFAULT 'medium',
        order_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (test_id) REFERENCES spelling_grammar_tests(id) ON DELETE CASCADE
      );
    `);

    // Tabla de resultados
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spelling_grammar_results (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL,
        candidate_vacancy_id INTEGER,
        test_id INTEGER NOT NULL,
        total_questions INTEGER,
        correct_answers INTEGER,
        score DECIMAL(5,2),
        accuracy DECIMAL(5,2),
        time_taken_seconds INTEGER,
        answers JSONB,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_vacancy_id) REFERENCES candidate_vacancies(id) ON DELETE SET NULL,
        FOREIGN KEY (test_id) REFERENCES spelling_grammar_tests(id) ON DELETE CASCADE
      );
    `);

    // Índices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sg_results_candidate ON spelling_grammar_results(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_sg_results_test ON spelling_grammar_results(test_id);
      CREATE INDEX IF NOT EXISTS idx_sg_results_created ON spelling_grammar_results(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sg_questions_test ON spelling_grammar_questions(test_id);
    `);

    console.log('✅ Tablas de spelling/grammar tests creadas exitosamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
  } finally {
    await pool.end();
  }
}

createSpellingGrammarTables();
