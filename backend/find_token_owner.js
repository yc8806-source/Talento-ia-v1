require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function findToken() {
  try {
    const badToken = '90zn-n9ht-9n9h-n9nh';

    console.log(`\n🔍 Looking for token: ${badToken}\n`);

    // Search for token - try exact match and pattern
    const result = await pool.query(
      `SELECT cv.id, cv.token, c.id, c.first_name, c.last_name,
              COUNT(e.id) as exam_count,
              STRING_AGG(DISTINCT ex.name, ', ') as exam_names
       FROM candidate_vacancies cv
       JOIN candidates c ON cv.candidate_id = c.id
       LEFT JOIN evaluations e ON cv.id = e.candidate_vacancy_id
       LEFT JOIN exams ex ON e.exam_id = ex.id
       WHERE cv.token = $1
          OR cv.token LIKE $2
       GROUP BY cv.id, cv.token, c.id, c.first_name, c.last_name`,
      [badToken, '%90zn%']
    );

    if (result.rows.length === 0) {
      console.log(`❌ Token not found in database`);
    } else {
      result.rows.forEach(row => {
        console.log(`✅ Found token in database:`);
        console.log(`   Candidate: ${row.first_name} ${row.last_name} (ID: ${row.id})`);
        console.log(`   CV ID: ${row.id}`);
        console.log(`   Token: ${row.token}`);
        console.log(`   Exams: ${row.exam_names || 'none'}`);
      });
    }

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

findToken();
