const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function debug() {
  try {
    console.log('🔍 DEBUG: SIMULANDO CÁLCULO DE SCORING\n');

    // Buscar a Elida Lobo Navarro
    const candidate = await pool.query(
      'SELECT id FROM candidates WHERE first_name = $1 AND last_name = $2',
      ['Elida', 'Lobo Navarro']
    );

    if (candidate.rows.length === 0) {
      console.log('❌ Candidato no encontrado');
      process.exit(0);
    }

    const candidateId = candidate.rows[0].id;
    console.log(`Candidato ID: ${candidateId}\n`);

    // Obtener respuestas igual que en el código
    const allAnswers = await pool.query(
      `SELECT
        ea.id,
        ea.question_id,
        ea.answer_value,
        q.competency_id,
        comp.name as competency_name
       FROM exam_answers ea
       INNER JOIN questions q ON ea.question_id = q.id
       INNER JOIN competencies comp ON q.competency_id = comp.id
       WHERE ea.candidate_id = $1
       ORDER BY comp.id, q.id`,
      [candidateId]
    );

    console.log(`Total de respuestas obtenidas: ${allAnswers.rows.length}\n`);

    // Obtener scores
    const optionIdsToGet = [...new Set(allAnswers.rows.map(a => a.answer_value).filter(v => v))];
    console.log(`Opciones únicas a buscar: ${optionIdsToGet.length}\n`);

    const optionScores = {};
    if (optionIdsToGet.length > 0) {
      const scoresResult = await pool.query(
        `SELECT id, CAST(score AS FLOAT) as score FROM question_options WHERE id = ANY($1::int[])`,
        [optionIdsToGet]
      );
      console.log(`Opciones encontradas: ${scoresResult.rows.length}\n`);
      scoresResult.rows.forEach(row => {
        optionScores[row.id] = row.score;
      });
    }

    // Simular el agrupamiento
    const competencyMap = {};
    console.log('PROCESANDO RESPUESTAS:\n');

    allAnswers.rows.forEach((answer, idx) => {
      if (!competencyMap[answer.competency_id]) {
        competencyMap[answer.competency_id] = {
          name: answer.competency_name,
          id: answer.competency_id,
          questions: new Set(),
          totalScore: 0
        };
      }

      competencyMap[answer.competency_id].questions.add(answer.question_id);
      const score = optionScores[answer.answer_value] || 0;
      competencyMap[answer.competency_id].totalScore += score;

      if (idx < 5 || idx === allAnswers.rows.length - 1) {
        console.log(`${idx + 1}. Q${answer.question_id} (${answer.competency_name}): score=${score}, competencyTotal=${competencyMap[answer.competency_id].totalScore}`);
      } else if (idx === 5) {
        console.log('...');
      }
    });

    console.log('\n📊 RESULTADO FINAL:\n');

    let grandTotal = 0;
    let grandMax = 0;

    Object.values(competencyMap).forEach(comp => {
      const totalQuestions = comp.questions.size;
      const maxScore = totalQuestions * 5;
      const percentage = maxScore > 0
        ? (comp.totalScore / maxScore) * 100
        : 0;

      console.log(`${comp.name}:`);
      console.log(`  Preguntas únicas: ${totalQuestions}`);
      console.log(`  Score total: ${Math.round(comp.totalScore)}`);
      console.log(`  Máximo posible: ${maxScore}`);
      console.log(`  Porcentaje: ${Math.round(percentage)}%\n`);

      grandTotal += comp.totalScore;
      grandMax += maxScore;
    });

    const overallPercentage = grandMax > 0
      ? (grandTotal / grandMax) * 100
      : 0;

    console.log(`TOTAL GENERAL:`);
    console.log(`  Score: ${Math.round(grandTotal)}`);
    console.log(`  Máximo: ${grandMax}`);
    console.log(`  Porcentaje: ${Math.round(overallPercentage)}%`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debug();
