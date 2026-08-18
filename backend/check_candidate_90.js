require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    console.log('\n🔍 CHECKING CANDIDATE 90 DATA\n');

    // Check candidate 90
    const candRes = await pool.query(
      `SELECT id, first_name, last_name, email FROM candidates WHERE id = 90`
    );

    if (candRes.rows.length === 0) {
      console.log('❌ Candidate 90 not found');
      pool.end();
      return;
    }

    const candidate = candRes.rows[0];
    console.log(`✅ Found: ${candidate.first_name} ${candidate.last_name} (${candidate.email})\n`);

    // Get candidate vacancies
    const cvRes = await pool.query(
      `SELECT cv.id, v.title, v.description
       FROM candidate_vacancies cv
       JOIN vacancies v ON cv.vacancy_id = v.id
       WHERE cv.candidate_id = $1`,
      [candidate.id]
    );

    console.log(`📋 Candidate Vacancies: ${cvRes.rows.length}`);
    cvRes.rows.forEach(cv => {
      console.log(`   - ID: ${cv.id}, Title: ${cv.title}`);
    });

    if (cvRes.rows.length > 0) {
      const cvId = cvRes.rows[0].id;
      console.log(`\n📊 Exams for first vacancy (CV ID: ${cvId}):`);

      const examsRes = await pool.query(
        `SELECT e.id, e.exam_id, ex.name, ex.type, e.status
         FROM evaluations e
         JOIN exams ex ON e.exam_id = ex.id
         WHERE e.candidate_vacancy_id = $1
         ORDER BY e.exam_id`,
        [cvId]
      );

      examsRes.rows.forEach(exam => {
        console.log(`   - Exam ${exam.exam_id}: ${exam.name} (${exam.type}), Status: ${exam.status}`);
      });
    }

    // Check token
    const tokenRes = await pool.query(
      `SELECT cv.id, cv.token, COUNT(e.id) as exam_count
       FROM candidate_vacancies cv
       LEFT JOIN evaluations e ON cv.id = e.candidate_vacancy_id
       WHERE cv.candidate_id = $1
       GROUP BY cv.id, cv.token`,
      [candidate.id]
    );

    console.log(`\n🔐 Tokens for candidate 90:`);
    tokenRes.rows.forEach(row => {
      console.log(`   Token: ${row.token}, CV_ID: ${row.id}, Exams: ${row.exam_count}`);
    });

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

check();
