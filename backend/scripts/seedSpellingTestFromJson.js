require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function seedSpellingTest() {
  try {
    console.log('🚀 Iniciando seeding de Spelling Grammar Test...');

    // Leer el JSON de preguntas
    const questionsJsonPath = path.join(__dirname, 'spelling_grammar_questions_export.json');
    const questionsData = JSON.parse(fs.readFileSync(questionsJsonPath, 'utf8'));

    // 1. Crear o actualizar el test con ID 1 específicamente
    console.log('📋 Creando test con id=1...');
    const testResult = await pool.query(
      `INSERT INTO spelling_grammar_tests
       (id, title, description, difficulty, test_type, language)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET title = $2
       RETURNING id`,
      [1, 'Ortografía y Gramática', 'Prueba de ortografía y gramática', 'medium', 'multiple_choice', 'es']
    );

    const testId = testResult.rows[0].id;
    console.log(`✅ Test creado/actualizado con id: ${testId}`);

    // 2. Limpiar preguntas antiguas
    console.log('🧹 Limpiando preguntas antiguas...');
    await pool.query('DELETE FROM spelling_grammar_questions WHERE test_id = $1', [testId]);

    // 3. Insertar todas las preguntas
    console.log(`📝 Insertando ${questionsData.questions.length} preguntas...`);

    for (const q of questionsData.questions) {
      // Determinar la respuesta correcta
      let correctAnswer = null;
      if (q.opciones && q.opciones.options && Array.isArray(q.opciones.options)) {
        correctAnswer = q.respuestaCorrecta;
      }

      const options = JSON.stringify(q.opciones || { options: [] });

      await pool.query(
        `INSERT INTO spelling_grammar_questions
         (test_id, question_type, question_text, correct_answer, explanation, options, difficulty, order_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          testId,
          q.tipo,
          q.pregunta,
          correctAnswer,
          q.explicacion || 'Respuesta correcta',
          options,
          q.dificultad || 'medium',
          q.numero || questionsData.questions.indexOf(q) + 1
        ]
      );
    }

    console.log(`✅ ${questionsData.questions.length} preguntas insertadas exitosamente`);

    // Verificar
    const verification = await pool.query(
      'SELECT id, COUNT(*) as total_questions FROM spelling_grammar_questions WHERE test_id = $1 GROUP BY id',
      [testId]
    );

    console.log('📊 Verificación:', verification.rows);
    console.log('\n✨ Seeding completado exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool.end) await pool.end();
    process.exit(0);
  }
}

seedSpellingTest();
