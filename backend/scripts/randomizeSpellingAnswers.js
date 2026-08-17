require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function randomizeAnswers() {
  try {
    console.log('🔀 Randomizando posiciones de respuestas correctas...\n');

    const result = await pool.query(`
      SELECT id, options, correct_answer FROM spelling_grammar_questions
      ORDER BY id
    `);

    const questions = result.rows;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < questions.length; i++) {
      try {
        const q = questions[i];
        const options = typeof q.options === 'string'
          ? JSON.parse(q.options).options
          : q.options.options;

        // Verificar que la respuesta correcta existe en las opciones
        if (!options.includes(q.correct_answer)) {
          console.error(`  ✗ Pregunta ${i + 1}: Respuesta correcta no está en opciones`);
          errors++;
          continue;
        }

        // Barajar las opciones
        const shuffledOptions = shuffleArray(options);

        // Actualizar en la BD
        await pool.query(
          `UPDATE spelling_grammar_questions
           SET options = $1
           WHERE id = $2`,
          [JSON.stringify({ options: shuffledOptions }), q.id]
        );

        updated++;
        if ((i + 1) % 10 === 0) {
          console.log(`  ✓ ${i + 1}/${questions.length} preguntas randomizadas...`);
        }
      } catch (err) {
        errors++;
        console.error(`  ✗ Error en pregunta ${i + 1}:`, err.message);
      }
    }

    console.log(`\n✅ Proceso completado:`);
    console.log(`  • Randomizadas: ${updated} preguntas`);
    console.log(`  • Errores: ${errors}`);
    console.log(`  • Total: ${questions.length} preguntas`);
    console.log(`\n📝 Las respuestas correctas ahora están en posiciones aleatorias (A, B, C o D)`);

    await pool.end();
    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

randomizeAnswers();
