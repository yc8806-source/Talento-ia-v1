const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

const competencyNameMap = {
  7: 'Responsabilidad',
  8: 'Orientación al Logro',
  9: 'Trabajo Bajo Presión',
  10: 'Adaptabilidad',
  11: 'Trabajo en Equipo',
  12: 'Orientación al Cliente',
  13: 'Integridad',
  14: 'Inteligencia Emocional',
  15: 'Iniciativa',
  16: 'Resiliencia'
};

async function calculateTPLResults(candidateId, examId) {
  const allAnswers = await pool.query(
    `SELECT
      ea.question_id,
      ea.answer_value,
      q.competency_id,
      q.is_inverse,
      eq.question_order
     FROM exam_answers ea
     INNER JOIN questions q ON ea.question_id = q.id
     INNER JOIN exam_questions eq ON q.id = eq.question_id AND eq.exam_id = $2
     WHERE ea.candidate_id = $1 AND ea.exam_id = $2
     ORDER BY eq.question_order, q.id`,
    [candidateId, examId]
  );

  if (allAnswers.rows.length === 0) {
    console.log('❌ No hay respuestas');
    return null;
  }

  console.log(`✅ Encontradas ${allAnswers.rows.length} respuestas`);

  // Obtener scores
  const optionIdsToGet = [...new Set(allAnswers.rows.map(a => a.answer_value).filter(v => v))];
  const optionScores = {};

  if (optionIdsToGet.length > 0) {
    const scoresResult = await pool.query(
      `SELECT id, CAST(score AS FLOAT) as score FROM question_options WHERE id = ANY($1::int[])`,
      [optionIdsToGet]
    );
    scoresResult.rows.forEach(row => {
      optionScores[row.id] = row.score;
    });
  }

  console.log(`   Scores mapeados: ${Object.keys(optionScores).length} opciones`);

  // Procesar respuestas
  const competencyMap = {};
  allAnswers.rows.forEach(answer => {
    let compId = answer.competency_id;

    if (!compId && answer.question_order) {
      const compIndex = Math.floor((answer.question_order - 1) / 8);
      compId = 7 + compIndex;
    }

    if (!compId) return;

    const compName = competencyNameMap[compId];

    if (!competencyMap[compId]) {
      competencyMap[compId] = {
        name: compName,
        id: compId,
        questions: [],
        totalScore: 0
      };
    }

    let score = optionScores[answer.answer_value] || 0;

    if (answer.is_inverse && score >= 1 && score <= 5) {
      score = 6 - score;
    }

    competencyMap[compId].questions.push(answer.question_id);
    competencyMap[compId].totalScore += score;
  });

  const getLevelTPL = (score) => {
    if (score >= 34) return { level: 'Muy Alto', range: '34-40' };
    if (score >= 28) return { level: 'Alto', range: '28-33' };
    if (score >= 22) return { level: 'Medio', range: '22-27' };
    if (score >= 16) return { level: 'Bajo', range: '16-21' };
    return { level: 'Muy Bajo', range: '8-15' };
  };

  const competencies = Object.values(competencyMap).map(comp => {
    const uniqueQuestions = [...new Set(comp.questions)];
    const totalQuestions = uniqueQuestions.length;
    const maxScore = totalQuestions * 5;
    const levelInfo = getLevelTPL(comp.totalScore);

    return {
      name: comp.name,
      id: comp.id,
      score: Math.round(comp.totalScore * 100) / 100,
      maxScore: maxScore,
      percentage: Math.round((comp.totalScore / maxScore) * 100 * 100) / 100,
      level: levelInfo.level,
      range: levelInfo.range
    };
  }).sort((a, b) => b.score - a.score);

  return competencies;
}

async function main() {
  console.log('🧪 PROBANDO CÁLCULO DE PDF PARA CV ID 66 (Gabriela)\n');

  try {
    const cvId = 66;

    // Obtener info
    const info = await pool.query(
      `SELECT cv.candidate_id, c.first_name, c.last_name
       FROM candidate_vacancies cv
       INNER JOIN candidates c ON cv.candidate_id = c.id
       WHERE cv.id = $1`,
      [cvId]
    );

    if (info.rows.length === 0) {
      console.log('❌ CV no encontrado');
      process.exit(1);
    }

    const candidate = info.rows[0];
    console.log(`📝 Candidato: ${candidate.first_name} ${candidate.last_name} (ID: ${candidate.candidate_id})\n`);

    // Calcular resultados
    const competencies = await calculateTPLResults(candidate.candidate_id, 27);

    if (!competencies) {
      console.log('❌ No se pudieron calcular resultados');
      process.exit(1);
    }

    // Calcular overall
    const totalScore = competencies.reduce((sum, c) => sum + c.score, 0);
    const maxScore = competencies.length * 40;
    const overallPercentage = (totalScore / maxScore) * 100;

    console.log(`📊 RESULTADOS:\n`);
    console.log(`   Total competencias: ${competencies.length}`);
    console.log(`   Puntaje total: ${Math.round(totalScore * 100) / 100}/${maxScore}`);
    console.log(`   Porcentaje: ${Math.round(overallPercentage * 100) / 100}%\n`);

    console.log(`📋 DESGLOSE POR COMPETENCIA:\n`);
    competencies.forEach((comp, idx) => {
      console.log(`   ${idx + 1}. ${comp.name}`);
      console.log(`      Score: ${comp.score}/${comp.maxScore} (${comp.percentage}%) - ${comp.level}`);
    });

    console.log(`\n✅ Cálculo completado exitosamente`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }

  pool.end();
  process.exit(0);
}

main();
