const { Pool } = require('pg');
const { generateResultsPDF } = require('../src/services/pdfService');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

// Competency name map (mismo que en calculateTPLResults)
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
  const questionsResult = await pool.query(
    `SELECT eq.question_order, q.id, q.is_inverse, q.competency_id
     FROM exam_questions eq
     LEFT JOIN questions q ON eq.question_id = q.id
     WHERE eq.exam_id = $1
     ORDER BY eq.question_order`,
    [examId]
  );

  const competencyScores = {};
  for (let i = 1; i <= 10; i++) {
    const compId = 6 + i;
    competencyScores[compId] = { scores: [], total: 0, count: 0 };
  }

  for (const question of questionsResult.rows) {
    const answerResult = await pool.query(
      `SELECT qa.answer_value, qo.score
       FROM exam_answers qa
       LEFT JOIN question_options qo ON qa.answer_value = qo.id
       WHERE qa.candidate_id = $1 AND qa.question_id = $2 AND qa.exam_id = $3`,
      [candidateId, question.id, examId]
    );

    if (answerResult.rows.length > 0) {
      let score = answerResult.rows[0].score || 0;

      // Aplicar inversión si es necesario
      if (question.is_inverse && score >= 1 && score <= 5) {
        score = 6 - score;
      }

      // Determinar competencia
      let compId = question.competency_id;
      if (compId === null) {
        compId = 7 + Math.floor((question.question_order - 1) / 8);
      }

      if (competencyScores[compId]) {
        competencyScores[compId].scores.push(score);
        competencyScores[compId].total += score;
        competencyScores[compId].count++;
      }
    }
  }

  // Calcular resultados
  const competencies = [];
  let overallTotal = 0;
  let overallMax = 0;

  for (let i = 1; i <= 10; i++) {
    const compId = 6 + i;
    const comp = competencyScores[compId];
    const score = comp.count > 0 ? comp.total : 0;
    const maxScore = comp.count > 0 ? comp.count * 5 : 0;
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    let level;
    if (percentage >= 85) level = 'Muy Alto';
    else if (percentage >= 70) level = 'Alto';
    else if (percentage >= 55) level = 'Medio';
    else if (percentage >= 40) level = 'Bajo';
    else level = 'Muy Bajo';

    competencies.push({
      id: compId,
      name: competencyNameMap[compId] || `Competencia ${compId}`,
      score,
      maxScore,
      percentage: Math.round(percentage * 100) / 100,
      level
    });

    overallTotal += score;
    overallMax += maxScore;
  }

  const overallPercentage = overallMax > 0 ? (overallTotal / overallMax) * 100 : 0;
  let overallLevel;
  if (overallPercentage >= 85) overallLevel = 'Muy Alto';
  else if (overallPercentage >= 70) overallLevel = 'Alto';
  else if (overallPercentage >= 55) overallLevel = 'Medio';
  else if (overallPercentage >= 40) overallLevel = 'Bajo';
  else overallLevel = 'Muy Bajo';

  return {
    overall: {
      score: overallTotal,
      maxScore: overallMax,
      percentage: Math.round(overallPercentage * 100) / 100,
      level: overallLevel
    },
    competencies
  };
}

async function generatePDFsForAllCandidates() {
  console.log('📄 GENERANDO PDFs PARA 6 CANDIDATOS DE PRUEBA\n');

  // Obtener IDs reales de candidatos desde la BD
  const cvResult = await pool.query(
    `SELECT cv.id as cv_id, c.id as candidate_id, c.first_name, c.last_name
     FROM candidate_vacancies cv
     INNER JOIN candidates c ON cv.candidate_id = c.id
     WHERE cv.id IN (61, 62, 63, 64, 65, 66)
     ORDER BY cv.id`
  );

  const candidates = cvResult.rows.map(r => ({
    cvId: r.cv_id,
    candidateId: r.candidate_id,
    name: `${r.first_name.toUpperCase()} (${r.first_name})`
  }));

  for (const candidate of candidates) {
    try {
      console.log(`📝 Generando PDF: ${candidate.name}`);

      // Obtener información del candidato
      const infoResult = await pool.query(
        `SELECT c.first_name, c.last_name, c.email, c.phone, v.title
         FROM candidate_vacancies cv
         INNER JOIN candidates c ON cv.candidate_id = c.id
         INNER JOIN vacancies v ON cv.vacancy_id = v.id
         WHERE cv.id = $1`,
        [candidate.cvId]
      );

      if (infoResult.rows.length === 0) {
        console.log(`   ❌ Candidato no encontrado\n`);
        continue;
      }

      const info = infoResult.rows[0];

      // Calcular resultados
      const results = await calculateTPLResults(candidate.candidateId, 27);

      const candidateData = {
        id: candidate.candidateId,
        firstName: info.first_name,
        lastName: info.last_name,
        email: info.email,
        phone: info.phone
      };

      const evaluationData = {
        vacancy: info.title,
        overall: results.overall,
        competencies: results.competencies
      };

      // Generar PDF
      const pdfData = await generateResultsPDF(candidateData, evaluationData);

      console.log(`   ✅ PDF generado`);
      console.log(`   📁 Archivo: ${pdfData.filename}`);
      console.log(`   📊 Puntaje: ${results.overall.percentage}% (${results.overall.score}/${results.overall.maxScore})`);
      console.log('');

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════\n');
  console.log('✅ Generación de PDFs completada\n');
  console.log('📁 Ubicación: backend/pdfs/TPL80_*.pdf\n');

  process.exit(0);
}

generatePDFsForAllCandidates().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
