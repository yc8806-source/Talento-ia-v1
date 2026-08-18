require('dotenv').config();
const pool = require('./src/config/database');
const crypto = require('crypto');

async function create() {
  try {
    // Create vacancy
    const vacRes = await pool.query(
      `INSERT INTO vacancies (title, description) 
       VALUES ($1, $2) RETURNING id`,
      ['Final Test - Spelling', 'Final verification test']
    );
    const vacancyId = vacRes.rows[0].id;

    // Create candidate
    const candRes = await pool.query(
      `INSERT INTO candidates (first_name, last_name, email, phone) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Final', 'Test', `final-${Date.now()}@test.com`, '+5555555']
    );
    const candidateId = candRes.rows[0].id;

    // Link candidate to vacancy
    const token = crypto.randomBytes(32).toString('hex');
    const cvRes = await pool.query(
      `INSERT INTO candidate_vacancies (candidate_id, vacancy_id, token) 
       VALUES ($1, $2, $3) RETURNING id`,
      [candidateId, vacancyId, token]
    );
    const cvId = cvRes.rows[0].id;

    // Assign spelling test
    await pool.query(
      `INSERT INTO vacancy_exams (vacancy_id, exam_id) VALUES ($1, $2)`,
      [vacancyId, 29]
    );

    // Create evaluation
    const accessToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO evaluations (candidate_vacancy_id, exam_id, status, access_token)
       VALUES ($1, $2, $3, $4)`,
      [cvId, 29, 'pending', accessToken]
    );

    console.log(`\n✅ Final test candidate created`);
    console.log(`   Candidate ID: ${candidateId}`);
    console.log(`   Token: ${token}`);
    console.log(`   URL: http://localhost:3001/evaluacion?token=${token}\n`);

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

create();
