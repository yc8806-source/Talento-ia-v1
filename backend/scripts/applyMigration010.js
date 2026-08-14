const pool = require('../src/config/database');

async function applyMigration() {
  try {
    console.log('Aplicando migración 010: Agregando typing_test_id a exams...');

    await pool.query(`
      ALTER TABLE exams
      ADD COLUMN IF NOT EXISTS typing_test_id INTEGER REFERENCES typing_tests(id) ON DELETE SET NULL;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exams_typing_test_id ON exams(typing_test_id);
    `);

    console.log('✅ Migración 010 aplicada exitosamente');
  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
  }
}

applyMigration().then(() => process.exit(0));
