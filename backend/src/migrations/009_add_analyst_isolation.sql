-- Add analyst isolation columns for multi-tenant support
-- PHASE 1: Analyst Isolation Architecture

-- 1. Add assigned_to_user_id to vacancies table
ALTER TABLE vacancies
ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- 2. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_vacancies_assigned_user
ON vacancies(assigned_to_user_id);

-- 3. Add assigned_to_user_id to candidate_vacancies table
ALTER TABLE candidate_vacancies
ADD COLUMN IF NOT EXISTS assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 4. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_assigned_user
ON candidate_vacancies(assigned_by_user_id);

-- 5. Add assigned_to_user_id to evaluations table (for metrics tracking)
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 6. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_evaluations_assigned_user
ON evaluations(assigned_by_user_id);

-- 7. Backfill existing vacancies with admin user (id=1) if assigned_to_user_id is NULL
-- This ensures existing vacancies have an owner
UPDATE vacancies
SET assigned_to_user_id = 1
WHERE assigned_to_user_id IS NULL;

-- 8. Make assigned_to_user_id NOT NULL after backfill (optional - comment out if you want to allow nulls)
-- ALTER TABLE vacancies ALTER COLUMN assigned_to_user_id SET NOT NULL;
