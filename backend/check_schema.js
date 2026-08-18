require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    // Get columns from evaluations table
    const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'evaluations'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 EVALUATIONS TABLE SCHEMA:\n');
    res.rows.forEach((col, idx) => {
      console.log(`   ${idx + 1}. ${col.column_name}: ${col.data_type}`);
    });

    // Get 3 sample evaluations
    const evalRes = await pool.query(`
      SELECT * FROM evaluations LIMIT 3
    `);

    console.log(`\n📊 SAMPLE EVALUATIONS (${evalRes.rows.length} records):\n`);
    if (evalRes.rows.length > 0) {
      console.log(JSON.stringify(evalRes.rows[0], null, 2));
    }

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

check();
