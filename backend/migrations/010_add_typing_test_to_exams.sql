-- ============================================================
-- Migration: Link typing_tests to exams
-- ============================================================

-- Agregar columna typing_test_id a exams para vincular typing tests
ALTER TABLE exams
ADD COLUMN IF NOT EXISTS typing_test_id INTEGER REFERENCES typing_tests(id) ON DELETE SET NULL;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_exams_typing_test_id ON exams(typing_test_id);

SELECT 'Migration 010: Add typing_test_id to exams - COMPLETE' AS status;
