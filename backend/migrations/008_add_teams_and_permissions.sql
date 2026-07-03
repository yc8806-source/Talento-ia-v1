-- 008: Agregar tablas de Equipos y Permisos Granulares

-- Tabla: teams
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  department VARCHAR(255),
  manager_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Tabla: team_members
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- admin, manager, member
  department VARCHAR(255),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla: role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  permission_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_name, permission_key)
);

-- Tabla: user_permissions (permisos granulares por usuario)
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  team_id INTEGER,
  permission_key VARCHAR(100) NOT NULL,
  granted_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, team_id, permission_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id)
);

-- Tabla: permission_audit_logs
CREATE TABLE IF NOT EXISTS permission_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action VARCHAR(50), -- grant, revoke, modify
  permission_key VARCHAR(100),
  team_id INTEGER,
  actor_id INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (actor_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_team ON user_permissions(team_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON permission_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON permission_audit_logs(created_at);

-- Insertar permisos base por rol
INSERT INTO role_permissions (role_name, permission_key) VALUES
-- Admin permissions (todos)
('admin', 'candidates.view'),
('admin', 'candidates.create'),
('admin', 'candidates.edit'),
('admin', 'candidates.delete'),
('admin', 'candidates.download_cv'),
('admin', 'candidates.send_invitation'),
('admin', 'vacancies.view'),
('admin', 'vacancies.create'),
('admin', 'vacancies.edit'),
('admin', 'vacancies.delete'),
('admin', 'vacancies.close'),
('admin', 'evaluations.view'),
('admin', 'evaluations.create'),
('admin', 'evaluations.submit'),
('admin', 'evaluations.view_results'),
('admin', 'evaluations.export_pdf'),
('admin', 'questions.view'),
('admin', 'questions.create'),
('admin', 'questions.edit'),
('admin', 'questions.delete'),
('admin', 'questions.bulk_import'),
('admin', 'exams.view'),
('admin', 'exams.create'),
('admin', 'exams.edit'),
('admin', 'exams.delete'),
('admin', 'exams.assign'),
('admin', 'reports.view'),
('admin', 'reports.export'),
('admin', 'reports.advanced_analytics'),
('admin', 'users.view'),
('admin', 'users.create'),
('admin', 'users.edit'),
('admin', 'users.delete'),
('admin', 'users.manage_roles'),
('admin', 'users.manage_permissions'),
('admin', 'teams.view'),
('admin', 'teams.create'),
('admin', 'teams.edit'),
('admin', 'teams.delete'),
('admin', 'teams.manage_members'),
('admin', 'admin.access'),
('admin', 'admin.settings'),
('admin', 'admin.audit_logs'),
('admin', 'admin.system_health'),

-- RRHH permissions
('rrhh', 'candidates.view'),
('rrhh', 'candidates.create'),
('rrhh', 'candidates.edit'),
('rrhh', 'candidates.download_cv'),
('rrhh', 'candidates.send_invitation'),
('rrhh', 'evaluations.view'),
('rrhh', 'evaluations.create'),
('rrhh', 'evaluations.view_results'),
('rrhh', 'evaluations.export_pdf'),
('rrhh', 'questions.view'),
('rrhh', 'exams.view'),
('rrhh', 'reports.view'),
('rrhh', 'reports.export'),
('rrhh', 'reports.advanced_analytics'),
('rrhh', 'users.view'),

-- Manager permissions
('manager', 'candidates.view'),
('manager', 'candidates.edit'),
('manager', 'candidates.download_cv'),
('manager', 'evaluations.view'),
('manager', 'evaluations.view_results'),
('manager', 'evaluations.export_pdf'),
('manager', 'reports.view'),
('manager', 'reports.export'),
('manager', 'teams.view'),
('manager', 'teams.manage_members'),
('manager', 'users.view'),

-- Evaluator permissions
('evaluator', 'candidates.view'),
('evaluator', 'candidates.download_cv'),
('evaluator', 'evaluations.view'),
('evaluator', 'evaluations.create'),
('evaluator', 'evaluations.view_results'),
('evaluator', 'exams.view'),
('evaluator', 'reports.view'),

-- Viewer permissions
('viewer', 'candidates.view'),
('viewer', 'evaluations.view'),
('viewer', 'evaluations.view_results'),
('viewer', 'reports.view')
ON CONFLICT DO NOTHING;
