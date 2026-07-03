const pool = require('../src/config/database');

async function createSkillsAssessmentTables() {
  try {
    // Tabla de evaluaciones de habilidades
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills_assessments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        skill_type VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) DEFAULT 'medium',
        estimated_time_minutes INTEGER DEFAULT 30,
        total_points INTEGER DEFAULT 100,
        passing_score INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de problemas/preguntas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills_problems (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER NOT NULL,
        problem_number INTEGER,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        problem_type VARCHAR(50) NOT NULL,
        language VARCHAR(20),
        starter_code TEXT,
        expected_output TEXT,
        test_cases JSONB,
        points INTEGER DEFAULT 10,
        difficulty VARCHAR(20) DEFAULT 'medium',
        solution_explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assessment_id) REFERENCES skills_assessments(id) ON DELETE CASCADE
      );
    `);

    // Tabla de respuestas/resultados
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills_submissions (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL,
        candidate_vacancy_id INTEGER,
        assessment_id INTEGER NOT NULL,
        problem_id INTEGER,
        code_submitted TEXT,
        output TEXT,
        is_correct BOOLEAN,
        points_earned INTEGER DEFAULT 0,
        execution_time_ms DECIMAL(10,2),
        memory_used_mb DECIMAL(10,2),
        feedback TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_vacancy_id) REFERENCES candidate_vacancies(id) ON DELETE SET NULL,
        FOREIGN KEY (assessment_id) REFERENCES skills_assessments(id) ON DELETE CASCADE,
        FOREIGN KEY (problem_id) REFERENCES skills_problems(id) ON DELETE CASCADE
      );
    `);

    // Tabla de resultados generales
    await pool.query(`
      CREATE TABLE IF NOT EXISTS skills_results (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL,
        candidate_vacancy_id INTEGER,
        assessment_id INTEGER NOT NULL,
        total_points INTEGER,
        points_earned INTEGER,
        score DECIMAL(5,2),
        problems_solved INTEGER,
        total_problems INTEGER,
        passed BOOLEAN,
        time_taken_seconds INTEGER,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_vacancy_id) REFERENCES candidate_vacancies(id) ON DELETE SET NULL,
        FOREIGN KEY (assessment_id) REFERENCES skills_assessments(id) ON DELETE CASCADE
      );
    `);

    // Índices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_skills_problems_assessment ON skills_problems(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_skills_submissions_candidate ON skills_submissions(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_skills_submissions_assessment ON skills_submissions(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_skills_results_candidate ON skills_results(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_skills_results_assessment ON skills_results(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_skills_results_created ON skills_results(created_at DESC);
    `);

    console.log('✅ Tablas de skills assessments creadas exitosamente');
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
  } finally {
    await pool.end();
  }
}

createSkillsAssessmentTables();
