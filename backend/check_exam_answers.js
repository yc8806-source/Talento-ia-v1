require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    console.log('\n🔍 Checking exam answers for candidate 90, exam 29\n');

    const result = await pool.query(
      `SELECT COUNT(*) as answer_count, MAX(time_spent_seconds) as max_time
       FROM exam_answers
       WHERE candidate_id = 90 AND exam_id = 29`
    );

    const count = result.rows[0].answer_count;
    const maxTime = result.rows[0].max_time;

    console.log(`📝 Total answers saved: ${count}/55`);
    console.log(`⏱️  Max time spent: ${maxTime}s`);

    if (count > 0) {
      console.log('\n✅ Sample answers:');
      const sampleRes = await pool.query(
        `SELECT question_id, answer_value, time_spent_seconds
         FROM exam_answers
         WHERE candidate_id = 90 AND exam_id = 29
         ORDER BY question_id
         LIMIT 5`
      );
      sampleRes.rows.forEach(row => {
        console.log(`   Q${row.question_id}: answer=${row.answer_value}`);
      });
    }

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

check();
