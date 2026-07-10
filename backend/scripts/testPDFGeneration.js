const { Pool } = require('pg');
const { generateResultsPDF } = require('../src/services/pdfService');

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
    `SELECT ea.question_id, ea.answer_value, q.competency_id, q.is_inverse, eq.question_order
     FROM exam_answers ea
     INNER JOIN questions q ON ea.question_id = q.id
     INNER JOIN exam_questions eq ON q.id = eq.question_id AND eq.exam_id = $2
     WHERE ea.candidate_id = $1 AND ea.exam_id = $2
     ORDER BY eq.question_order`,
    [candidateId, examId]
  );

  if (allAnswers.rows.length === 0) return null;

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

  const competencyMap = {};
  allAnswers.rows.forEach(answer => {
    let compId = answer.competency_id;
    if (!compId && answer.question_order) {
      compId = 7 + Math.floor((answer.question_order - 1) / 8);
    }
    if (!compId) return;

    const compName = competencyNameMap[compId];
    if (!competencyMap[compId]) {
      competencyMap[compId] = { name: compName, id: compId, questions: [], totalScore: 0 };
    }

    let score = optionScores[answer.answer_value] || 0;
    if (answer.is_inverse && score >= 1 && score <= 5) {
      score = 6 - score;
    }

    competencyMap[compId].questions.push(answer.question_id);
    competencyMap[compId].totalScore += score;
  });

  const getLevelTPL = (score) => {
    if (score >= 34) return { level: 'Muy Alto' };
    if (score >= 28) return { level: 'Alto' };
    if (score >= 22) return { level: 'Medio' };
    if (score >= 16) return { level: 'Bajo' };
    return { level: 'Muy Bajo' };
  };

  return Object.values(competencyMap).map(comp => {
    const uniqueQuestions = [...new Set(comp.questions)];
    const maxScore = uniqueQuestions.length * 5;
    const levelInfo = getLevelTPL(comp.totalScore);
    return {
      name: comp.name,
      id: comp.id,
      score: Math.round(comp.totalScore * 100) / 100,
      maxScore: maxScore,
      percentage: Math.round((comp.totalScore / maxScore) * 100 * 100) / 100,
      level: levelInfo.level
    };
  }).sort((a, b) => b.score - a.score);
}

async function main() {
  console.log('📄 PROBANDO GENERACIÓN DE PDF\n');

  try {
    const cvId = 66;

    const info = await pool.query(
      `SELECT cv.candidate_id, c.first_name, c.last_name, c.email, c.phone, v.title
       FROM candidate_vacancies cv
       INNER JOIN candidates c ON cv.candidate_id = c.id
       INNER JOIN vacancies v ON cv.vacancy_id = v.id
       WHERE cv.id = $1`,
      [cvId]
    );

    if (info.rows.length === 0) {
      console.log('❌ CV no encontrado');
      process.exit(1);
    }

    const candidate = info.rows[0];
    console.log(`📝 Candidato: ${candidate.first_name} ${candidate.last_name}\n`);

    const competencies = await calculateTPLResults(candidate.candidate_id, 27);

    if (!competencies) {
      console.log('❌ Sin resultados');
      process.exit(1);
    }

    const totalScore = competencies.reduce((sum, c) => sum + c.score, 0);
    const maxScore = competencies.length * 40;
    const overallPercentage = (totalScore / maxScore) * 100;

    let overallLevel;
    if (overallPercentage >= 85) overallLevel = 'Muy Alto';
    else if (overallPercentage >= 70) overallLevel = 'Alto';
    else if (overallPercentage >= 55) overallLevel = 'Medio';
    else if (overallPercentage >= 40) overallLevel = 'Bajo';
    else overallLevel = 'Muy Bajo';

    const candidateData = {
      id: candidate.candidate_id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone
    };

    const evaluationData = {
      vacancy: candidate.title,
      overall: {
        score: Math.round(totalScore * 100) / 100,
        maxScore: maxScore,
        percentage: Math.round(overallPercentage * 100) / 100,
        level: overallLevel
      },
      competencies: competencies
    };

    console.log('📊 Datos preparados:');
    console.log(`   Overall: ${evaluationData.overall.percentage}% (${evaluationData.overall.level})`);
    console.log(`   Competencias: ${competencies.length}\n`);

    console.log('🎨 Generando PDF...');
    const pdfData = await generateResultsPDF(candidateData, evaluationData);

    console.log(`✅ PDF generado exitosamente!`);
    console.log(`   Archivo: ${pdfData.filename}`);
    console.log(`   Ruta: ${pdfData.filepath}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nStack:');
    console.error(error.stack);
  }

  pool.end();
  process.exit(0);
}

main();
