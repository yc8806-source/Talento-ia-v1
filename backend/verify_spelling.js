const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function verifySpelling() {
  try {
    console.log('✅ Verificando prueba de Ortografía...\n');

    // Contar preguntas
    const questionsResult = await pool.query(
      `SELECT COUNT(*) as total, id, test_id FROM spelling_grammar_questions
       WHERE test_id = 1
       GROUP BY test_id`
    );

    console.log(`📝 Total de preguntas: ${questionsResult.rows[0]?.total || 0}`);

    // Ver algunas preguntas
    const samplesResult = await pool.query(
      `SELECT id, question_type, question_text, correct_answer
       FROM spelling_grammar_questions
       WHERE test_id = 1
       LIMIT 5`
    );

    console.log('\n📌 Muestra de preguntas:');
    samplesResult.rows.forEach((q, idx) => {
      console.log(`${idx + 1}. [${q.question_type}] ${q.question_text.substring(0, 50)}...`);
    });

    // Verificar si existe en tabla exams
    const examsResult = await pool.query(
      `SELECT * FROM exams WHERE name LIKE '%Ortografía%' OR name LIKE '%ortografia%'`
    );

    console.log(`\n🔍 ¿Existe en tabla exams? ${examsResult.rows.length > 0 ? '✅ Sí' : '❌ No'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifySpelling();
