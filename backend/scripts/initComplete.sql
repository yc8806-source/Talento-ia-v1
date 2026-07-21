-- ============================================================
-- Complete Schema for Talent IA - PostgreSQL
-- ============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'candidato',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  cv_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Vacancies Table
CREATE TABLE IF NOT EXISTS vacancies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(100),
  status VARCHAR(50) DEFAULT 'open',
  available_positions INTEGER DEFAULT 1,
  filled_positions INTEGER DEFAULT 0,
  assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Exams Table
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  category VARCHAR(100),
  difficulty VARCHAR(50),
  max_time_minutes INTEGER,
  total_questions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  title VARCHAR(500),
  type VARCHAR(50),
  difficulty VARCHAR(50),
  competency_id INTEGER,
  competency_name VARCHAR(100),
  correct_answer VARCHAR(500),
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Candidate Vacancies Table
CREATE TABLE IF NOT EXISTS candidate_vacancies (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  token VARCHAR(256) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, vacancy_id)
);

-- 7. Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  candidate_vacancy_id INTEGER REFERENCES candidate_vacancies(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  token VARCHAR(256) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  score DECIMAL(5,2),
  accuracy DECIMAL(5,2),
  time_seconds INTEGER,
  assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Exam Answers Table
CREATE TABLE IF NOT EXISTS exam_answers (
  id SERIAL PRIMARY KEY,
  evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer_value VARCHAR(500),
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Evaluation Results Table
CREATE TABLE IF NOT EXISTS evaluation_results (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2),
  competency_results JSONB,
  total_questions INTEGER,
  answered_questions INTEGER,
  correct_answers INTEGER,
  time_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Evaluation Assignments Table
CREATE TABLE IF NOT EXISTS evaluation_assignments (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  token VARCHAR(256) UNIQUE,
  evaluation_ids JSONB,
  current_index INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Vacancy Exams Table (many-to-many)
CREATE TABLE IF NOT EXISTS vacancy_exams (
  id SERIAL PRIMARY KEY,
  vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vacancy_id, exam_id)
);

-- 12. Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  department VARCHAR(255),
  manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  department VARCHAR(255),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

-- 14. Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  permission_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_name, permission_key)
);

-- 15. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Typing Tests Table
CREATE TABLE IF NOT EXISTS typing_tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50),
  language VARCHAR(50) DEFAULT 'en',
  duration_seconds INTEGER DEFAULT 300,
  text_content TEXT,
  average_wpm DECIMAL(8,2),
  total_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Typing Results Table
CREATE TABLE IF NOT EXISTS typing_results (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE SET NULL,
  typing_test_id INTEGER REFERENCES typing_tests(id) ON DELETE CASCADE,
  wpm DECIMAL(8,2),
  accuracy DECIMAL(5,2),
  time_seconds INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Spelling & Grammar Tests Table
CREATE TABLE IF NOT EXISTS spelling_grammar_tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50),
  test_type VARCHAR(50),
  language VARCHAR(50) DEFAULT 'es',
  duration_seconds INTEGER DEFAULT 300,
  total_questions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Spelling & Grammar Questions Table
CREATE TABLE IF NOT EXISTS spelling_grammar_questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES spelling_grammar_tests(id) ON DELETE CASCADE,
  question_type VARCHAR(50),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer VARCHAR(500),
  explanation TEXT,
  difficulty VARCHAR(50),
  order_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. Spelling & Grammar Results Table
CREATE TABLE IF NOT EXISTS spelling_grammar_results (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  candidate_vacancy_id INTEGER REFERENCES candidate_vacancies(id) ON DELETE SET NULL,
  test_id INTEGER REFERENCES spelling_grammar_tests(id) ON DELETE CASCADE,
  total_questions INTEGER,
  correct_answers INTEGER,
  score DECIMAL(5,2),
  accuracy DECIMAL(5,2),
  time_seconds INTEGER,
  answers JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. Skills Assessment Tests Table
CREATE TABLE IF NOT EXISTS skills_assessments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  skill_type VARCHAR(100),
  difficulty VARCHAR(50),
  language VARCHAR(50),
  total_points INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. Skills Assessment Problems Table
CREATE TABLE IF NOT EXISTS skills_assessment_problems (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES skills_assessments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  expected_output TEXT,
  points INTEGER DEFAULT 10,
  difficulty VARCHAR(50),
  order_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. Skills Assessment Results Table
CREATE TABLE IF NOT EXISTS skills_assessment_results (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  candidate_vacancy_id INTEGER REFERENCES candidate_vacancies(id) ON DELETE SET NULL,
  assessment_id INTEGER REFERENCES skills_assessments(id) ON DELETE CASCADE,
  total_points INTEGER,
  earned_points INTEGER,
  problems_solved INTEGER,
  total_problems INTEGER,
  time_seconds INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 24. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_assigned_user ON vacancies(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_exams_category ON exams(category);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_candidate ON candidate_vacancies(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_vacancy ON candidate_vacancies(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_token ON candidate_vacancies(token);
CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_assigned_user ON candidate_vacancies(assigned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_token ON evaluations(token);
CREATE INDEX IF NOT EXISTS idx_evaluations_assigned_user ON evaluations(assigned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_evaluation ON exam_answers(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_candidate ON evaluation_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_vacancy_exams_vacancy ON vacancy_exams(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_vacancy_exams_exam ON vacancy_exams(exam_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_typing_results_candidate ON typing_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_spelling_grammar_results_candidate ON spelling_grammar_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_skills_assessment_results_candidate ON skills_assessment_results(candidate_id);

-- 25. Insert default admin user if not exists
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@talent-ia.com', '$2a$10$8YJbmhW3hkVqBpYaJOQGe.A8KqQ5XELZKdVHEqmCNvT8l6qZ/YA0i', 'Admin', 'Talent IA', 'admin')
ON CONFLICT (email) DO NOTHING;

SELECT 'Database schema initialized successfully!' AS status;
