require('dotenv').config();
const pool = require('./src/config/database');
const fs = require('fs');

async function importToRender() {
  try {
    console.log('\n🚀 Importing spelling questions to Render...\n');

    const content = fs.readFileSync('extracted_content.txt', 'utf8');
    const lines = content.split('\n');

    let currentQuestion = null;
    let questions = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (questionMatch) {
        currentQuestion = {
          number: parseInt(questionMatch[1]),
          text: questionMatch[2],
          options: []
        };
        continue;
      }

      const optionMatch = line.match(/^([A-D])\)\s+(.+?)(?:\s+← RESPUESTA CORRECTA)?$/);
      if (optionMatch && currentQuestion) {
        const isCorrect = line.includes('← RESPUESTA CORRECTA');
        currentQuestion.options.push({
          letter: optionMatch[1],
          text: optionMatch[2],
          correct: isCorrect
        });

        if (currentQuestion.options.length === 4) {
          questions.push(currentQuestion);
          currentQuestion = null;
        }
      }
    }

    console.log(`✅ Parsed ${questions.length} questions\n`);

    // Clean up exam 29
    console.log('🔄 Cleaning up exam 29...');
    await pool.query('DELETE FROM exam_questions WHERE exam_id = 29');
    console.log('✅ Cleaned\n');

    // Import
    let importedCount = 0;
    console.log('📥 Importing questions...');

    for (const q of questions) {
      try {
        // Insert question
        const qRes = await pool.query(
          `INSERT INTO questions (title, description, type)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [
            `Q${q.number}: ${q.text}`,
            q.text,
            'spelling'
          ]
        );

        const questionId = qRes.rows[0].id;

        // Delete old options
        await pool.query('DELETE FROM question_options WHERE question_id = $1', [questionId]);

        // Insert options
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          const score = opt.correct ? 100 : 0;

          await pool.query(
            `INSERT INTO question_options (question_id, text, score, option_order)
             VALUES ($1, $2, $3, $4)`,
            [questionId, opt.text, score, j + 1]
          );
        }

        // Map to exam 29
        await pool.query(
          `INSERT INTO exam_questions (exam_id, question_id, question_order)
           VALUES ($1, $2, $3)`,
          [29, questionId, q.number]
        );

        importedCount++;
        if (importedCount % 10 === 0) {
          process.stdout.write(`  ✅ ${importedCount}/55\n`);
        }
      } catch (err) {
        console.error(`  ❌ Q${q.number}: ${err.message}`);
      }
    }

    // Verify
    const verifyRes = await pool.query(
      `SELECT COUNT(*) as total FROM exam_questions WHERE exam_id = 29`
    );

    console.log(`\n✅ IMPORT COMPLETE TO RENDER`);
    console.log(`   Questions imported: ${importedCount}/55`);
    console.log(`   Mapped to exam 29: ${verifyRes.rows[0].total}\n`);

    pool.end();
  } catch (err) {
    console.error('Fatal error:', err.message);
    pool.end();
  }
}

importToRender();
