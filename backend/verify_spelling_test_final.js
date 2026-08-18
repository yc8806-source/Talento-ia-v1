require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verify() {
  try {
    console.log('\n🔍 VERIFYING SPELLING TEST COMPLETION\n');

    // Get candidate 86 (local test candidate)
    const candRes = await pool.query(
      `SELECT id, first_name, last_name FROM candidates WHERE id = 86`
    );

    if (candRes.rows.length === 0) {
      console.log('❌ Candidate 86 not found');
      pool.end();
      return;
    }

    const candidate = candRes.rows[0];
    console.log(`✅ Candidate: ${candidate.first_name} ${candidate.last_name} (ID: ${candidate.id})\n`);

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
      console.log('❌ No evaluation found for candidate 86, exam 29');
      pool.end();
      return;
    }

    const evaluation = evalRes.rows[0];
    console.log(`🎯 SPELLING TEST EVALUATION (Exam 29):`);
    console.log(`   Evaluation ID: ${evaluation.id}`);
    console.log(`   Status: ${evaluation.status}`);
    console.log(`   Started at: ${evaluation.started_at}`);
    console.log(`   Completed at: ${evaluation.completed_at}\n`);

    // Count saved answers
    const answersRes = await pool.query(
      `SELECT COUNT(*) as total FROM exam_answers
       WHERE candidate_id = $1 AND exam_id = $2`,
      [candidate.id, 29]
    );

    const totalAnswers = answersRes.rows[0].total;
    console.log(`📝 SAVED ANSWERS: ${totalAnswers} / 55`);

    if (totalAnswers > 0) {
      // Show first 5 answers
      const sampleRes = await pool.query(
        `SELECT candidate_id, exam_id, question_id, answer_value, time_spent_seconds
         FROM exam_answers
         WHERE candidate_id = $1 AND exam_id = $2
         ORDER BY question_id
         LIMIT 5`,
        [candidate.id, 29]
      );

      console.log(`\n📊 SAMPLE ANSWERS (first 5):`);
      sampleRes.rows.forEach((ans, idx) => {
        console.log(`   Q${idx + 1}: question_id=${ans.question_id}, answer=${ans.answer_value}, time=${ans.time_spent_seconds}s`);
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ VERIFICATION RESULTS:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`  1️⃣  Status changed to 'completed': ${evaluation.status === 'completed' ? '✅ YES' : '❌ NO'}`);
    console.log(`  2️⃣  All 55 answers saved: ${totalAnswers === 55 ? '✅ YES' : `❌ NO (${totalAnswers}/55)`}`);
    console.log(`  3️⃣  Completion timestamp: ${evaluation.completed_at ? '✅ YES' : '❌ NO'}`);
    console.log(`${'='.repeat(60)}\n`);

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

verify();
