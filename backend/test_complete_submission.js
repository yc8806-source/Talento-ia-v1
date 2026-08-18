const axios = require('axios');

async function testCompleteSubmission() {
  try {
    const token = '7bc30840cf8f5f5d16de76d62be67887a2384544488adea55d6614e0da357a19';
    const examId = 29;
    const apiUrl = 'http://localhost:3000/api';

    console.log('\n🧪 TESTING COMPLETE EXAM SUBMISSION\n');
    console.log(`Token: ${token.substring(0, 20)}...`);
    console.log(`ExamId: ${examId}`);
    console.log(`Endpoint: ${apiUrl}/evaluations/${token}/exam-answers\n`);

    // Simulate 55 answers (one for each question)
    const answers = {};
    for (let i = 0; i < 55; i++) {
      // Each answer is an object with: questionId, selected (the answer value), timeSpent
      answers[i] = {
        questionId: 833 + i, // Assuming question IDs start at 833
        selected: (i % 4) + 1, // Cycle through answers 1-4
        timeSpent: Math.floor(Math.random() * 60) // Random time 0-60 seconds
      };
    }

    console.log(`📤 Submitting ${Object.keys(answers).length} answers...`);

    const response = await axios.post(`${apiUrl}/evaluations/${token}/exam-answers`, {
      examId,
      answers
    });

    console.log('\n✅ SUCCESS! Response:');
    console.log(JSON.stringify(response.data, null, 2));

    // Verify the answers were saved
    console.log('\n🔍 VERIFYING ANSWERS WERE SAVED\n');
    const pool = require('pg').Pool;
    const dotenv = require('dotenv');
    dotenv.config();

    const db = new pool({ connectionString: process.env.DATABASE_URL });

    const result = await db.query(
      `SELECT COUNT(*) as total FROM exam_answers WHERE candidate_id = 90 AND exam_id = 29`
    );

    console.log(`📊 Answers saved in database: ${result.rows[0].total}/55`);

    // Check status
    const statusRes = await db.query(
      `SELECT status FROM evaluations
       WHERE candidate_vacancy_id = (SELECT id FROM candidate_vacancies WHERE candidate_id = 90)
       AND exam_id = 29`
    );

    console.log(`📋 Evaluation status: ${statusRes.rows[0]?.status || 'NOT FOUND'}`);

    db.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCompleteSubmission();
