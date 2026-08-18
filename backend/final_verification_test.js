require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verify() {
  try {
    console.log('\n✨ FINAL VERIFICATION: SPELLING TEST COMPLETION ✨\n');

    // Get candidate 87 (second test candidate)
    const candRes = await pool.query(
      `SELECT id, first_name, last_name FROM candidates WHERE id = 87`
    );

    if (candRes.rows.length === 0) {
      console.log('❌ Candidate 87 not found');
      pool.end();
      return;
    }

    const candidate = candRes.rows[0];
    console.log(`👤 Candidate: ${candidate.first_name} ${candidate.last_name} (ID: ${candidate.id})\n`);

    // Get the evaluation for this candidate with exam 29
    const evalRes = await pool.query(
      `SELECT e.id, e.candidate_vacancy_id, e.exam_id, e.status, e.started_at, e.completed_at
       FROM evaluations e
       INNER JOIN candidate_vacancies cv ON e.candidate_vacancy_id = cv.id
       WHERE cv.candidate_id = $1 AND e.exam_id = 29
       LIMIT 1`,
      [candidate.id]
    );

    if (evalRes.rows.length === 0) {
      console.log('❌ No evaluation found for candidate 87, exam 29');
      pool.end();
      return;
    }

    const evaluation = evalRes.rows[0];
    console.log(`📋 SPELLING TEST EVALUATION (Exam 29):`);
    console.log(`   Evaluation ID: ${evaluation.id}`);
    console.log(`   Status: ${evaluation.status}`);
    console.log(`   Started at: ${evaluation.started_at}`);
    console.log(`   Completed at: ${evaluation.completed_at}\n`);

    // Count saved answers
    const answersRes = await pool.query(
      `SELECT COUNT(*) as total FROM exam_answers
       WHERE candidate_id = $1 AND exam_id = 29`,
      [candidate.id]
    );

    const totalAnswers = answersRes.rows[0].total;
    console.log(`📝 SAVED ANSWERS: ${totalAnswers} / 55\n`);

    if (totalAnswers > 0) {
      // Show first 5 answers
      const sampleRes = await pool.query(
        `SELECT candidate_id, exam_id, question_id, answer_value, time_spent_seconds
         FROM exam_answers
         WHERE candidate_id = $1 AND exam_id = 29
         ORDER BY question_id
         LIMIT 5`,
        [candidate.id]
      );

      console.log(`📊 SAMPLE ANSWERS (first 5):`);
      sampleRes.rows.forEach((ans, idx) => {
        console.log(`   Q${idx + 1}: question_id=${ans.question_id}, answer=${ans.answer_value}, time=${ans.time_spent_seconds}s`);
      });
      console.log();
    }

    console.log(`${'='.repeat(70)}`);
    console.log(`✅ FINAL VERIFICATION RESULTS:`);
    console.log(`${'='.repeat(70)}`);
    console.log(`  ✅ 1. Status changed to 'completed': ${evaluation.status === 'completed' ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  ✅ 2. All 55 answers saved: ${totalAnswers === 55 ? '✓ PASS' : `✗ FAIL (${totalAnswers}/55)`}`);
    console.log(`  ✅ 3. Completion timestamp set: ${evaluation.completed_at ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`${'='.repeat(70)}\n`);

    if (evaluation.status === 'completed' && totalAnswers === 55 && evaluation.completed_at) {
      console.log('🎉 SUCCESS! Spelling test migration is working correctly!\n');
    } else {
      console.log('⚠️  Some issues detected. See results above.\n');
    }

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

verify();
