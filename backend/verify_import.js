require('dotenv').config();
const pool = require('./src/config/database');

async function verify() {
  try {
    const res = await pool.query(
      `SELECT COUNT(*) as total FROM exam_questions WHERE exam_id = 29`
    );
    console.log(`\n✅ Total questions mapped to exam 29: ${res.rows[0].total}\n`);
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

verify();
