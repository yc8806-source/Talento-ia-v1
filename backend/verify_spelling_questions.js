require('dotenv').config();
const pool = require('./src/config/database');

async function verify() {
  try {
    // Find questions 615-669 (55 questions)
    const res = await pool.query(
      `SELECT id, title FROM questions WHERE id BETWEEN 615 AND 669 ORDER BY id`
    );

    console.log(`\nQuestions in range 615-669: ${res.rows.length}`);
    if (res.rows.length > 0) {
      console.log('First 5:');
      res.rows.slice(0, 5).forEach(q => {
        console.log(`  ${q.id}: ${q.title.substring(0, 60)}`);
      });
      console.log('Last 5:');
      res.rows.slice(-5).forEach(q => {
        console.log(`  ${q.id}: ${q.title.substring(0, 60)}`);
      });
    }

    // Check current exam_questions mapping
    const mappingRes = await pool.query(
      `SELECT COUNT(*) as total FROM exam_questions WHERE exam_id = 29`
    );
    console.log(`\nCurrent mappings for exam 29: ${mappingRes.rows[0].total}`);

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

verify();
