-- ============================================================
-- Migration: Add candidate_vacancies and evaluations tables
-- ============================================================

-- Tabla para tracking de candidatos asignados a vacantes
CREATE TABLE IF NOT EXISTS candidate_vacancies (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, vacancy_id)
);

-- Tabla para evaluaciones individuales (una por cada exam para cada candidato-vacante)
CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  candidate_vacancy_id INTEGER NOT NULL REFERENCES candidate_vacancies(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  status VARCHAR(50) DEFAULT 'pending',
  access_token VARCHAR(256) UNIQUE NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_candidate ON candidate_vacancies(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_vacancy ON candidate_vacancies(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_status ON candidate_vacancies(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_vacancy ON evaluations(candidate_vacancy_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_exam ON evaluations(exam_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_token ON evaluations(access_token);

SELECT 'Migration 009: Add candidate_vacancies and evaluations tables - COMPLETE' AS status;
