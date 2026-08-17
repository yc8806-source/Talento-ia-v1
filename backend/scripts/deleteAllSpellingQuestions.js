require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function deleteAllQuestions() {
  try {
    console.log('🗑️  Eliminando todas las preguntas de Ortografía y Gramática...\n');

    const result = await pool.query(`
      DELETE FROM spelling_grammar_questions
      RETURNING id
    `);

    console.log(`✅ Preguntas eliminadas: ${result.rowCount}`);
    console.log(`📋 IDs eliminados: ${result.rows.map(r => r.id).join(', ')}`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAllQuestions();
