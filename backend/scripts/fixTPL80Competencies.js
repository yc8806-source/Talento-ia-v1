const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function fixTPL80() {
  try {
    console.log('🔧 ASIGNANDO COMPETENCIAS CORRECTAS A PREGUNTAS DEL TPL-80\n');

    const examId = 27;

    // Obtener todas las preguntas del TPL-80 por orden
    const questionsResult = await pool.query(
      `SELECT q.id, eq.question_order
       FROM exam_questions eq
       INNER JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = $1
       ORDER BY eq.question_order`,
      [examId]
    );

    console.log(`📝 Encontradas ${questionsResult.rows.length} preguntas\n`);

    // Mapeo de pregunta a competencia (8 preguntas por competencia)
    const competencies = [
      7,  // Responsabilidad (1-8)
      8,  // Orientación al Logro (9-16)
      9,  // Trabajo Bajo Presión (17-24)
      10, // Adaptabilidad (25-32)
      11, // Trabajo en Equipo (33-40)
      12, // Orientación al Cliente (41-48)
      13, // Integridad (49-56)
      14, // Inteligencia Emocional (57-64)
      15, // Iniciativa (65-72)
      16  // Resiliencia (73-80)
    ];

    let updatedCount = 0;

    for (const question of questionsResult.rows) {
      const competencyIndex = Math.floor((question.question_order - 1) / 8);
      const competencyId = competencies[competencyIndex];

      if (!competencyId) {
        console.warn(`⚠️ Pregunta ${question.id} (orden ${question.question_order}) sin competencia asignada`);
        continue;
      }

      await pool.query(
        `UPDATE questions SET competency_id = $1 WHERE id = $2`,
        [competencyId, question.id]
      );

      updatedCount++;

      if (updatedCount % 20 === 0) {
        console.log(`   ${updatedCount}/80 preguntas actualizadas...`);
      }
    }

    console.log(`\n✅ ${updatedCount} preguntas actualizadas con competencias correctas\n`);

    // Verificar resultado
    const verifyResult = await pool.query(
      `SELECT COUNT(DISTINCT competency_id) as competencies, COUNT(*) as total_questions
       FROM questions q
       INNER JOIN exam_questions eq ON q.id = eq.question_id
       WHERE eq.exam_id = $1`,
      [examId]
    );

    console.log(`📊 VERIFICACIÓN:`);
    console.log(`   Total de preguntas: ${verifyResult.rows[0].total_questions}`);
    console.log(`   Competencias con preguntas: ${verifyResult.rows[0].competencies}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixTPL80();
