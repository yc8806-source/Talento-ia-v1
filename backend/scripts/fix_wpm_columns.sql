-- Fix script para migración 011: Actualizar columnas de WPM a DECIMAL(10,2)
-- Ejecutar esto en Render si la migración automática falla

-- Paso 1: Verificar estructura actual
SELECT 'ANTES: Verificando columnas' as paso;
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'typing_results'
  AND column_name IN ('wpm', 'accuracy', 'gross_wpm', 'net_wpm')
ORDER BY column_name;

-- Paso 2: Actualizar cada columna de DECIMAL(5,2) a DECIMAL(10,2)
ALTER TABLE typing_results
ALTER COLUMN wpm TYPE DECIMAL(10,2);

ALTER TABLE typing_results
ALTER COLUMN accuracy TYPE DECIMAL(10,2);

ALTER TABLE typing_results
ALTER COLUMN gross_wpm TYPE DECIMAL(10,2);

ALTER TABLE typing_results
ALTER COLUMN net_wpm TYPE DECIMAL(10,2);

-- Paso 3: Verificar que la actualización fue exitosa
SELECT 'DESPUES: Verificando columnas' as paso;
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'typing_results'
  AND column_name IN ('wpm', 'accuracy', 'gross_wpm', 'net_wpm')
ORDER BY column_name;

-- Paso 4: Verificar que no hay datos que exceden el rango permitido
SELECT 'Verificando valores que pueden exceder rango' as verificacion;
SELECT COUNT(*) as total_records,
       COUNT(CASE WHEN wpm > 9999.99 THEN 1 END) as wpm_overflow,
       MAX(wpm) as max_wpm,
       MAX(accuracy) as max_accuracy,
       MAX(gross_wpm) as max_gross_wpm,
       MAX(net_wpm) as max_net_wpm
FROM typing_results;

SELECT '✅ Migración completada exitosamente' as resultado;
