require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function insertQuestions() {
  try {
    console.log('📥 Insertando nuevas preguntas de Ortografía y Gramática...\n');

    // Leer el archivo JSON con las preguntas
    const questionsPath = path.join(__dirname, 'newSpellingQuestions.json');
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < questionsData.length; i++) {
      const q = questionsData[i];

      try {
        const result = await pool.query(
          `INSERT INTO spelling_grammar_questions
           (test_id, question_type, question_text, correct_answer, explanation, options, difficulty, order_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            1,
            q.question_type,
            q.question_text,
            q.correct_answer,
            q.explanation,
            JSON.stringify({ options: q.options }),
            q.difficulty,
            i + 1
          ]
        );

        inserted++;
        if ((i + 1) % 10 === 0) {
          console.log(`  ✓ ${i + 1}/${questionsData.length} preguntas insertadas...`);
        }
      } catch (err) {
        errors++;
        console.error(`  ✗ Error en pregunta ${i + 1}:`, err.message);
      }
    }

    console.log(`\n✅ Proceso completado:`);
    console.log(`  • Insertadas: ${inserted} preguntas`);
    console.log(`  • Errores: ${errors}`);
    console.log(`  • Total: ${questionsData.length} preguntas`);

    await pool.end();
    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

insertQuestions();
