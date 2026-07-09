const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  try {
    console.log('🔍 VERIFICANDO DATOS DE RESPUESTAS\n');

    // Buscar el candidato TestUser
    const candidate = await pool.query(
      'SELECT id FROM candidates WHERE first_name = $1',
      ['TestUser']
    );

    if (candidate.rows.length === 0) {
      console.log('❌ Candidato TestUser no encontrado');
      process.exit(0);
    }

    const candidateId = candidate.rows[0].id;
    console.log(`Candidato ID: ${candidateId}\n`);

    // Verificar cantidad de respuestas
    const answerCount = await pool.query(
      'SELECT COUNT(*) as count FROM exam_answers WHERE candidate_id = $1',
      [candidateId]
    );
    console.log(`Total de respuestas guardadas: ${answerCount.rows[0].count}\n`);

    // Ver cada respuesta con su score
    const answers = await pool.query(`
      SELECT
        ea.id,
        ea.question_id,
        q.title as question_title,
        comp.name as competency,
        ea.answer_value,
        qo.score,
        qo.text as option_text
      FROM exam_answers ea
      INNER JOIN questions q ON ea.question_id = q.id
      INNER JOIN competencies comp ON q.competency_id = comp.id
      LEFT JOIN question_options qo ON qo.id = ea.answer_value
      WHERE ea.candidate_id = $1
      ORDER BY comp.name, q.id
    `, [candidateId]);

    console.log('📝 RESPUESTAS DETALLADAS:\n');

    let currentCompetency = null;
    let competencyTotal = 0;
    let competencyCount = 0;

    answers.rows.forEach((row, idx) => {
      if (row.competency !== currentCompetency && currentCompetency !== null) {
        console.log(`   → Subtotal ${currentCompetency}: ${competencyTotal} puntos en ${competencyCount} preguntas\n`);
      }

      if (row.competency !== currentCompetency) {
        currentCompetency = row.competency;
        competencyTotal = 0;
        competencyCount = 0;
      }

      console.log(`${idx + 1}. ${row.question_title}`);
      console.log(`   Competencia: ${row.competency}`);
      console.log(`   Opción: ${row.option_text}`);
      console.log(`   Score: ${row.score}\n`);

      competencyTotal += row.score || 0;
      competencyCount += 1;
    });

    if (currentCompetency) {
      console.log(`   → Subtotal ${currentCompetency}: ${competencyTotal} puntos en ${competencyCount} preguntas\n`);
    }

    // Verificar si hay duplicados
    const duplicates = await pool.query(`
      SELECT question_id, COUNT(*) as count
      FROM exam_answers
      WHERE candidate_id = $1
      GROUP BY question_id
      HAVING COUNT(*) > 1
    `, [candidateId]);

    if (duplicates.rows.length > 0) {
      console.log('⚠️  DUPLICADOS ENCONTRADOS:');
      duplicates.rows.forEach(d => {
        console.log(`   Pregunta ${d.question_id}: ${d.count} respuestas`);
      });
    } else {
      console.log('✅ No hay duplicados - Una respuesta por pregunta');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
