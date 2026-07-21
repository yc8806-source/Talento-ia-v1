-- ============================================================
-- Migration: Add analyst isolation for multi-user support
-- Date: 2026-07-21
-- ============================================================

-- 1. Add assigned_to_user_id to vacancies (who created/manages it)
ALTER TABLE vacancies
ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER REFERENCES users(id);

-- 2. Add assigned_to_user_id to candidate_vacancies (who assigned the candidate)
ALTER TABLE candidate_vacancies
ADD COLUMN IF NOT EXISTS assigned_by_user_id INTEGER REFERENCES users(id);

-- 3. Add assigned_to_user_id to evaluations (who sent/created the evaluation)
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS assigned_by_user_id INTEGER REFERENCES users(id);

-- 4. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_vacancies_assigned_to_user ON vacancies(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_assigned_by_user ON candidate_vacancies(assigned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_assigned_by_user ON evaluations(assigned_by_user_id);

-- 5. Log migration
SELECT 'Migration 009: Analyst isolation completed' as status;
