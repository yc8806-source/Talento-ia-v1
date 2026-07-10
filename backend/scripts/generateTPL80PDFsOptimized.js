const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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
  // Obtener todas las respuestas del candidato
  const answersResult = await pool.query(
    `SELECT ea.question_id, ea.answer_value, qo.score, q.is_inverse, q.competency_id, eq.question_order
     FROM exam_answers ea
     INNER JOIN question_options qo ON ea.answer_value = qo.id
     LEFT JOIN questions q ON ea.question_id = q.id
     LEFT JOIN exam_questions eq ON q.id = eq.question_id AND eq.exam_id = $2
     WHERE ea.candidate_id = $1 AND ea.exam_id = $2`,
    [candidateId, examId]
  );

  const competencyScores = {};
  for (let i = 1; i <= 10; i++) {
    const compId = 6 + i;
    competencyScores[compId] = { scores: [], total: 0, count: 0 };
  }

  // Procesar respuestas
  for (const answer of answersResult.rows) {
    let score = answer.score || 0;

    // Aplicar inversión
    if (answer.is_inverse && score >= 1 && score <= 5) {
      score = 6 - score;
    }

    // Determinar competencia
    let compId = answer.competency_id;
    if (compId === null && answer.question_order) {
      compId = 7 + Math.floor((answer.question_order - 1) / 8);
    }

    if (compId && competencyScores[compId]) {
      competencyScores[compId].scores.push(score);
      competencyScores[compId].total += score;
      competencyScores[compId].count++;
    }
  }

  // Calcular competencias
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

async function generatePDF(candidateData, evaluationData, cvId) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '../../pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 40 });
      const filename = `TPL80_${candidateData.firstName}_${Date.now()}.pdf`;
      const filepath = path.join(pdfDir, filename);

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      doc.fontSize(28).font('Helvetica-Bold').fillColor('#1A237E').text('Talent IA', { align: 'center' });
      doc.fontSize(14).font('Helvetica').fillColor('#424242').text('TEST DE PERSONALIDAD LABORAL (TPL-80)', { align: 'center' });
      doc.moveTo(50, 80).lineTo(550, 80).stroke('#1A237E');

      let yPos = 100;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Información del Candidato', 50, yPos);
      yPos += 20;

      doc.fontSize(10).font('Helvetica').fillColor('#424242');
      doc.text(`Nombre: ${candidateData.firstName} ${candidateData.lastName}`, 50, yPos);
      yPos += 18;
      doc.text(`Email: ${candidateData.email}`, 50, yPos);
      yPos += 18;
      if (candidateData.phone) {
        doc.text(`Teléfono: ${candidateData.phone}`, 50, yPos);
        yPos += 18;
      }
      doc.text(`Vacante: ${evaluationData.vacancy}`, 50, yPos);
      yPos += 25;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A237E').text('Resultado General', 50, yPos);
      yPos += 20;

      const overallColor = evaluationData.overall.level === 'Muy Alto' ? '#1B5E20' :
                          evaluationData.overall.level === 'Alto' ? '#2E7D32' :
                          evaluationData.overall.level === 'Medio' ? '#F57F17' :
                          evaluationData.overall.level === 'Bajo' ? '#D84315' : '#B71C1C';

      doc.rect(50, yPos - 5, 500, 45).fill(overallColor).fillColor('#FFF');
      doc.fontSize(24).font('Helvetica-Bold').text(`${evaluationData.overall.percentage}%`, 70, yPos + 5, { width: 200 });
      doc.fontSize(11).font('Helvetica').text(`${evaluationData.overall.score}/${evaluationData.overall.maxScore} puntos`, 70, yPos + 35);
      doc.fontSize(11).font('Helvetica').text(`Nivel: ${evaluationData.overall.level}`, 300, yPos + 5);

      yPos += 65;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A237E').text('Perfil de Competencias (10 Dimensiones)', 50, yPos);
      yPos += 20;

      evaluationData.competencies.forEach((comp, idx) => {
        let levelColor;
        if (comp.level === 'Muy Alto') levelColor = '#1B5E20';
        else if (comp.level === 'Alto') levelColor = '#2E7D32';
        else if (comp.level === 'Medio') levelColor = '#F57F17';
        else if (comp.level === 'Bajo') levelColor = '#D84315';
        else levelColor = '#B71C1C';

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(`${idx + 1}. ${comp.name}`, 50, yPos);
        doc.fontSize(8).fillColor('#424242').text(`${comp.score}/${comp.maxScore} (${comp.percentage}%)`, 250, yPos);

        const barWidth = 200;
        const filledWidth = (comp.percentage / 100) * barWidth;
        doc.rect(310, yPos - 2, barWidth, 10).stroke('#BDBDBD');
        doc.rect(310, yPos - 2, filledWidth, 10).fill(levelColor);

        doc.fontSize(8).fillColor('#666').text(comp.level, 520, yPos);

        yPos += 20;
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });

      doc.fontSize(8).fillColor('#999');
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Generado ${dateStr} | Talent IA v1.0 | CV ID: ${cvId}`, 50, 750, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({ filename, filepath });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  console.log('📄 GENERANDO PDFs PARA 6 CANDIDATOS\n');

  const candidates = [
    { cvId: 61, candidateId: 30 },
    { cvId: 62, candidateId: 31 },
    { cvId: 63, candidateId: 32 },
    { cvId: 64, candidateId: 33 },
    { cvId: 65, candidateId: 34 },
    { cvId: 66, candidateId: 35 }
  ];

  for (const { cvId, candidateId } of candidates) {
    try {
      console.log(`📝 CV ID: ${cvId}`);

      // Obtener info
      const infoResult = await pool.query(
        `SELECT cv.candidate_id, c.first_name, c.last_name, c.email, c.phone, v.title
         FROM candidate_vacancies cv
         INNER JOIN candidates c ON cv.candidate_id = c.id
         INNER JOIN vacancies v ON cv.vacancy_id = v.id
         WHERE cv.id = $1`,
        [cvId]
      );

      if (infoResult.rows.length === 0) {
        console.log(`   ❌ No encontrado\n`);
        continue;
      }

      const info = infoResult.rows[0];
      const realCandidateId = info.candidate_id;

      // Calcular resultados
      const results = await calculateTPLResults(realCandidateId, 27);

      const candidateData = {
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
      const pdfData = await generatePDF(candidateData, evaluationData, cvId);

      console.log(`   ✅ ${pdfData.filename}`);
      console.log(`   📊 ${results.overall.percentage}% - ${results.overall.level}\n`);

    } catch (error) {
      console.log(`   ❌ ${error.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ PDFs generados en: backend/pdfs/\n');

  pool.end();
  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error);
  pool.end();
  process.exit(1);
});
