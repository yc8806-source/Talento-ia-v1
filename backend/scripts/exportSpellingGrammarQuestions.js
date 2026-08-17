require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function exportQuestions() {
  try {
    console.log('📥 Extrayendo preguntas de Ortografía y Gramática...\n');

    const result = await pool.query(`
      SELECT
        id,
        test_id,
        question_type,
        question_text,
        correct_answer,
        explanation,
        options,
        difficulty,
        order_number
      FROM spelling_grammar_questions
      ORDER BY test_id, order_number
    `);

    const questions = result.rows;
    console.log(`✅ Total de preguntas encontradas: ${questions.length}\n`);

    // Crear archivo JSON para fácil revisión
    const output = {
      totalQuestions: questions.length,
      questions: questions.map((q, idx) => {
        try {
          return {
            numero: idx + 1,
            id: q.id,
            tipo: q.question_type,
            pregunta: q.question_text,
            opciones: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
            respuestaCorrecta: q.correct_answer,
            explicacion: q.explanation || '',
            dificultad: q.difficulty
          };
        } catch (e) {
          console.error(`Error procesando pregunta ${idx + 1}:`, e.message);
          return null;
        }
      }).filter(q => q !== null)
    };

    const outputPath = path.join(__dirname, 'spelling_grammar_questions_export.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    console.log(`\n✅ Preguntas exportadas a: ${outputPath}`);
    console.log(`\n📋 Resumen:`);
    console.log(`   • Total: ${questions.length} preguntas`);

    // Mostrar primeras 3 para verificar
    console.log(`\n📌 Primeras 3 preguntas:`);
    questions.slice(0, 3).forEach((q, idx) => {
      console.log(`\n${idx + 1}. ${q.question_text}`);
      if (q.options) {
        console.log(`   Opciones: ${JSON.parse(q.options).join(', ')}`);
      }
      console.log(`   Respuesta correcta: ${q.correct_answer}`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

exportQuestions();
