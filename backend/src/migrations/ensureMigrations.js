const pool = require('../config/database');

/**
 * Asegurar que todas las migraciones están aplicadas
 * Corre automáticamente al iniciar el servidor
 */
async function ensureMigrations() {
  try {
    console.log('🔄 Verificando migraciones...');

    // Migración 010: Agregar typing_test_id a exams
    try {
      const checkColumn = await pool.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'exams' AND column_name = 'typing_test_id'`
      );

      if (checkColumn.rows.length === 0) {
        console.log('📝 Aplicando migración 010: Agregar typing_test_id a exams...');

        await pool.query(`
          ALTER TABLE exams
          ADD COLUMN IF NOT EXISTS typing_test_id INTEGER REFERENCES typing_tests(id) ON DELETE SET NULL;
        `);

        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_exams_typing_test_id ON exams(typing_test_id);
        `);

        console.log('✅ Migración 010 aplicada');
      } else {
        console.log('✅ Migración 010 ya aplicada');
      }
    } catch (err) {
      console.error('⚠️ Error verificando migración 010:', err.message);
    }

  } catch (error) {
    console.error('❌ Error en ensureMigrations:', error.message);
  }
}

module.exports = ensureMigrations;
