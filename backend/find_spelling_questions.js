require('dotenv').config();
const pool = require('./src/config/database');

async function find() {
  try {
    // Search for actual spelling/grammar questions
    const res = await pool.query(
      `SELECT id, title FROM questions
       WHERE title ILIKE '%ortogr%' 
          OR title ILIKE '%gramát%'
          OR title ILIKE '%palabra%'
          OR title ILIKE '%oración%'
          OR title ILIKE '%escrita%correctamente%'
       ORDER BY id
       LIMIT 20`
    );

    console.log(`\nFound ${res.rows.length} spelling/grammar questions:`);
    res.rows.forEach(q => {
      console.log(`  ${q.id}: ${q.title}`);
    });

    if (res.rows.length === 0) {
      console.log('\n❌ No spelling questions found with those keywords');
      console.log('Checking first 100 questions for pattern...');
      
      const allRes = await pool.query(
        `SELECT id, title FROM questions LIMIT 100`
      );
      
      allRes.rows.slice(0, 20).forEach(q => {
        console.log(`  ${q.id}: ${q.title}`);
      });
    }

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

find();
