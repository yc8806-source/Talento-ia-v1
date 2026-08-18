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

    // Get evaluations for this candidate
    const evalRes = await pool.query(
      `SELECT id, candidate_id, exam_id, status, created_at, updated_at
       FROM evaluations
       WHERE candidate_id = $1
       ORDER BY created_at DESC`,
      [candidate.id]
    );

    console.log(`📋 EVALUATIONS (${evalRes.rows.length} found):`);
    evalRes.rows.forEach((ev, idx) => {
      console.log(`   ${idx + 1}. Exam ${ev.exam_id} | Status: ${ev.status} | ID: ${ev.id}`);
    });
    console.log();

    // Get the spelling test evaluation (exam 29)
    const spellingEval = evalRes.rows.find(e => e.exam_id === 29);

    if (!spellingEval) {
      console.log('❌ No evaluation found for exam 29');
      pool.end();
      return;
    }

    console.log(`🎯 SPELLING TEST EVALUATION (Exam 29):`);
    console.log(`   ID: ${spellingEval.id}`);
    console.log(`   Status: ${spellingEval.status}`);
    console.log(`   Created: ${spellingEval.created_at}`);
    console.log(`   Updated: ${spellingEval.updated_at}\n`);

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

    console.log(`\n✅ VERIFICATION COMPLETE\n`);
    console.log(`Summary:`);
    console.log(`  ✅ Status changed to: ${spellingEval.status === 'completed' ? 'COMPLETED ✓' : 'PENDING ✗'}`);
    console.log(`  ✅ Answers saved: ${totalAnswers > 0 ? `${totalAnswers}/55 ✓` : '0 ✗'}`);

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

verify();
