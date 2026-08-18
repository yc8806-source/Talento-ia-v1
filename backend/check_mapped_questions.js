require('dotenv').config();
const pool = require('./src/config/database');

async function check() {
  try {
    const res = await pool.query(
      `SELECT q.id, q.title
       FROM questions q
       INNER JOIN exam_questions eq ON q.id = eq.question_id
       WHERE eq.exam_id = 29
       ORDER BY eq.question_order
       LIMIT 10`
    );

    console.log(`\nCurrently mapped questions for exam_id=29 (first 10):`);
    res.rows.forEach(q => {
      console.log(`  ${q.id}: ${q.title.substring(0, 60)}`);
    });

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

check();
