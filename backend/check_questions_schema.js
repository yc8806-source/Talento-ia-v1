require('dotenv').config();
const pool = require('./src/config/database');

async function check() {
  try {
    const res = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'questions'
       ORDER BY ordinal_position`
    );

    console.log('\nQuestions table columns:');
    res.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

check();
