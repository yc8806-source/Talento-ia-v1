require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function updateCorrections() {
  try {
    console.log('🚀 Actualizando preguntas de Spelling con correcciones...');

    // Correcciones por número de pregunta
    const corrections = [
      { numero: 3, respuesta: 'confundido' },
      { numero: 4, respuesta: 'Espero que venga mañana' },
      { numero: 6, respuesta: 'absoluto' },
      { numero: 11, respuesta: 'común' },
      { numero: 14, respuesta: 'mejor' },
      { numero: 15, respuesta: 'psicología' },
      { numero: 16, respuesta: 'va' },
      { numero: 19, respuesta: 'tuviera' },
      { numero: 21, respuesta: 'Me' },
      { numero: 22, respuesta: 'estarán' },
      { numero: 28, respuesta: 'jugaré' },
      { numero: 32, respuesta: 'vendrán' },
      { numero: 36, respuesta: "Debería ser 'había'" },
      { numero: 37, respuesta: "Debería ser 'estuvimos hablando'" },
      { numero: 38, respuesta: "Debería ser 'ningún'" },
      { numero: 39, respuesta: "Debería ser 'día'" },
      { numero: 40, respuesta: "Debería ser 'cómo'" },
      { numero: 41, respuesta: 'Correcto - sin error' },
      { numero: 42, respuesta: "Debería ser 'felices'" },
      { numero: 43, respuesta: 'Correcto - sin error' },
      { numero: 44, respuesta: "Debería ser 'está' e 'inglés'" },
      { numero: 45, respuesta: "Debería ser 'ha'" },
      { numero: 46, respuesta: 'Correcto - sin error' },
      { numero: 47, respuesta: "Debería ser 'tú'" },
      { numero: 48, respuesta: "Debería ser 'más'" },
      { numero: 49, respuesta: "Debería ser 'problema'" },
      { numero: 50, respuesta: 'Correcto - sin error' }
    ];

    let updated = 0;
    for (const correction of corrections) {
      // Primero buscar la pregunta por número
      const q = await pool.query(
        'SELECT id FROM spelling_grammar_questions WHERE order_number = $1 AND test_id = 1',
        [correction.numero]
      );

      if (q.rows.length > 0) {
        const questionId = q.rows[0].id;
        await pool.query(
          'UPDATE spelling_grammar_questions SET correct_answer = $1 WHERE id = $2',
          [correction.respuesta, questionId]
        );
        updated++;
        console.log(`✅ Pregunta ${correction.numero}: corregida`);
      }
    }

    console.log(`\n✨ Total de preguntas actualizadas: ${updated}`);

    if (pool.end) await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (pool.end) await pool.end();
    process.exit(1);
  }
}

updateCorrections();
