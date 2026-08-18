require('dotenv').config();

const { Pool } = require('pg');
const crypto = require('crypto');

// Use local DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function create() {
  try {
    // Create vacancy
    const vacRes = await pool.query(
      `INSERT INTO vacancies (title, description)
       VALUES ($1, $2) RETURNING id`,
      ['Local Test Spelling', 'Test for spelling functionality']
    );
    const vacancyId = vacRes.rows[0].id;

    // Create candidate
    const candRes = await pool.query(
      `INSERT INTO candidates (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Local', 'Test', `local-${Date.now()}@test.com`, '+5555555']
    );
    const candidateId = candRes.rows[0].id;

    // Link to vacancy
    const token = crypto.randomBytes(32).toString('hex');
    const cvRes = await pool.query(
      `INSERT INTO candidate_vacancies (candidate_id, vacancy_id, token)
       VALUES ($1, $2, $3) RETURNING id`,
      [candidateId, vacancyId, token]
    );

    // Assign spelling test (exam 29)
    await pool.query(
      `INSERT INTO vacancy_exams (vacancy_id, exam_id) VALUES ($1, $2)`,
      [vacancyId, 29]
    );

    // Create evaluation
    const accessToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO evaluations (candidate_vacancy_id, exam_id, status, access_token)
       VALUES ($1, $2, $3, $4)`,
      [cvRes.rows[0].id, 29, 'pending', accessToken]
    );

    console.log(`✅ LOCAL Candidate created`);
    console.log(`   Candidate ID: ${candidateId}`);
    console.log(`   Vacancy ID: ${vacancyId}`);
    console.log(`   Token: ${token}\n`);
    console.log(`🔗 Test URL: http://localhost:3001/evaluacion?token=${token}\n`);

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

create();
