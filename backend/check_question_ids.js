require('dotenv').config();
const pool = require('./src/config/database');

async function checkQuestionIds() {
  try {
    // Get question IDs for exam 29
    const result = await pool.query(
      `SELECT q.id, q.title
       FROM questions q
       INNER JOIN exam_questions eq ON q.id = eq.question_id
       WHERE eq.exam_id = 29
       ORDER BY eq.question_order
       LIMIT 10`
    );

    console.log('\nQuestion IDs for exam_id=29 (first 10):');
    result.rows.forEach(row => {
      console.log(`  ID: ${row.id} - "${row.title.substring(0, 50)}..."`);
    });

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM exam_questions WHERE exam_id = 29`
    );
    console.log(`\nTotal questions for exam 29: ${countResult.rows[0].total}`);

    // Check what question 615 is
    const q615 = await pool.query(`SELECT id, title FROM questions WHERE id = 615`);
    console.log(`\nQuestion 615 (if exists): ${q615.rows.length > 0 ? q615.rows[0].title : 'NOT FOUND'}`);

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

checkQuestionIds();
