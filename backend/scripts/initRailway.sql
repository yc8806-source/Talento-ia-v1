-- ============================================================
-- Tablas para Talent IA - Railway PostgreSQL
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  role VARCHAR(50) DEFAULT 'candidato',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  cv_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vacancies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  department VARCHAR(100),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  type VARCHAR(50),
  max_time_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id),
  title VARCHAR(500),
  type VARCHAR(50),
  difficulty VARCHAR(50),
  competencyId INTEGER,
  competencyName VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluation_assignments (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  token VARCHAR(256) UNIQUE,
  evaluation_ids JSONB,
  current_index INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_answers (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  exam_id INTEGER REFERENCES exams(id),
  question_id INTEGER REFERENCES questions(id),
  answer_value INTEGER,
  competency_id INTEGER,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, exam_id, question_id)
);

CREATE TABLE IF NOT EXISTS evaluation_results (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  exam_id INTEGER REFERENCES exams(id),
  overall_score DECIMAL(5,2),
  competency_results JSONB,
  total_questions INTEGER,
  answered_questions INTEGER,
  time_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  department VARCHAR(255),
  manager_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  department VARCHAR(255),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  permission_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_name, permission_key)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_assignments_token ON evaluation_assignments(token);
CREATE INDEX IF NOT EXISTS idx_exam_answers_candidate ON exam_answers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_candidate ON evaluation_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);

-- Insertar usuario admin
INSERT INTO users (email, password_hash, firstName, lastName, role)
VALUES ('admin@talent-ia.com', '$2a$10$8YJbmhW3hkVqBpYaJOQGe.A8KqQ5XELZKdVHEqmCNvT8l6qZ/YA0i', 'Admin', 'Talent IA', 'administrador')
ON CONFLICT (email) DO NOTHING;

SELECT 'Tablas creadas y admin insertado' AS status;
