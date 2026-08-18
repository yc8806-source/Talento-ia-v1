require('dotenv').config();
const pool = require('./src/config/database');

async function count() {
  try {
    const res = await pool.query(
      `SELECT COUNT(*) as total FROM questions`
    );
    console.log(`\nTotal questions in DB: ${res.rows[0].total}`);

    // Check max ID
    const maxRes = await pool.query(
      `SELECT MAX(id) as max_id FROM questions`
    );
    console.log(`Max question ID: ${maxRes.rows[0].max_id}`);

    // Check how many exams have question mappings
    const examsRes = await pool.query(
      `SELECT exam_id, COUNT(*) as q_count
       FROM exam_questions
       GROUP BY exam_id
       ORDER BY exam_id`
    );

    console.log('\nQuestions per exam:');
    examsRes.rows.forEach(row => {
      console.log(`  Exam ${row.exam_id}: ${row.q_count} questions`);
    });

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

count();
