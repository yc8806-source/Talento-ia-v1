require('dotenv').config();
const pool = require('./src/config/database');

async function verify() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 FINAL VERIFICATION - CANDIDATE 84');
    console.log('='.repeat(60) + '\n');

    // 1. Check evaluation status
    const evalRes = await pool.query(
      `SELECT e.id, e.status, c.email
       FROM evaluations e
       JOIN candidate_vacancies cv ON e.candidate_vacancy_id = cv.id
       JOIN candidates c ON cv.candidate_id = c.id
       WHERE cv.candidate_id = 84 AND e.exam_id = 29`
    );

    if (evalRes.rows.length === 0) {
      console.log('❌ No evaluation found for candidate 84');
      pool.end();
      return;
    }

    const evaluation = evalRes.rows[0];
    console.log('📋 EVALUATION:');
    console.log(`   Status: ${evaluation.status} ${evaluation.status === 'completed' ? '✅' : '❌'}`);

    // 2. Check exam_answers
    const answersRes = await pool.query(
      `SELECT COUNT(*) as total,
              COUNT(DISTINCT question_id) as unique_questions
       FROM exam_answers
       WHERE candidate_id = 84 AND exam_id = 29`
    );

    const answers = answersRes.rows[0];
    console.log('\n📊 RESPONSES SAVED:');
    console.log(`   Total: ${answers.total} / 55 ${answers.total === 55 ? '✅' : '❌'}`);
    console.log(`   Unique Questions: ${answers.unique_questions} / 55 ${answers.unique_questions === 55 ? '✅' : '❌'}`);

    // 3. Show sample responses
    const sampleRes = await pool.query(
      `SELECT q.title, ea.answer_value
       FROM exam_answers ea
       JOIN questions q ON ea.question_id = q.id
       WHERE ea.candidate_id = 84 AND ea.exam_id = 29
       ORDER BY q.id
       LIMIT 5`
    );

    console.log('\n📝 SAMPLE RESPONSES (First 5):');
    sampleRes.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.title.substring(0, 50)}... → Answer: ${row.answer_value}`);
    });

    console.log('\n' + '='.repeat(60));
    if (evaluation.status === 'completed' && answers.total === 55) {
      console.log('✅ ¡VERIFICACIÓN EXITOSA! - Test de ortografía funciona correctamente');
    } else {
      console.log('❌ VERIFICACIÓN FALLIDA');
    }
    console.log('='.repeat(60) + '\n');

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

verify();
