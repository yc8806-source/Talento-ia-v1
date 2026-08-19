require('dotenv').config();
const pool = require('../src/config/database');

async function linkQuestionsToExam() {
  try {
    console.log('🔗 Enlazando preguntas a exam ID 30 en tabla exam_questions...\n');

    const examId = 30;

    // Get all questions for this exam
    const questionsResult = await pool.query(
      'SELECT id FROM questions WHERE exam_id = $1 ORDER BY id',
      [examId]
    );

    console.log(`Encontradas ${questionsResult.rows.length} preguntas\n`);

    // Insert into exam_questions junction table
    for (let i = 0; i < questionsResult.rows.length; i++) {
      const questionId = questionsResult.rows[i].id;
      const order = i + 1;

      await pool.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)',
        [examId, questionId, order]
      );

      if ((i + 1) % 10 === 0) {
        console.log(`✓ Enlazadas ${i + 1}/${questionsResult.rows.length} preguntas`);
      }
    }

    console.log(`\n✅ ¡ÉXITO! Todas las ${questionsResult.rows.length} preguntas enlazadas correctamente`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

linkQuestionsToExam();
