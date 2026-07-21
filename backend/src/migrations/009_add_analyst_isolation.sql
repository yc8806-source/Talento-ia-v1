-- Add analyst isolation columns for multi-tenant support
-- PHASE 1: Analyst Isolation Architecture

-- 1. Add assigned_to_user_id to vacancies table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vacancies') THEN
    ALTER TABLE vacancies
    ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS idx_vacancies_assigned_user
    ON vacancies(assigned_to_user_id);

    -- Backfill existing vacancies with admin user (id=1)
    UPDATE vacancies
    SET assigned_to_user_id = 1
    WHERE assigned_to_user_id IS NULL;
  END IF;
END $$;

-- 2. Add assigned_by_user_id to candidate_vacancies table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'candidate_vacancies') THEN
    ALTER TABLE candidate_vacancies
    ADD COLUMN IF NOT EXISTS assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_candidate_vacancies_assigned_user
    ON candidate_vacancies(assigned_by_user_id);
  END IF;
END $$;

-- 3. Add assigned_by_user_id to evaluations table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluations') THEN
    ALTER TABLE evaluations
    ADD COLUMN IF NOT EXISTS assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_evaluations_assigned_user
    ON evaluations(assigned_by_user_id);
  END IF;
END $$;
