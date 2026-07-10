const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function testOnDemandPDF(cvId) {
  try {
    console.log(`📄 PRUEBANDO PDF ON-DEMAND para CV ID ${cvId}\n`);

    // Obtener info candidato
    const info = await pool.query(
      `SELECT cv.candidate_id, c.first_name, c.last_name, c.email, v.title
       FROM candidate_vacancies cv
       INNER JOIN candidates c ON cv.candidate_id = c.id
       INNER JOIN vacancies v ON cv.vacancy_id = v.id
       WHERE cv.id = $1`,
      [cvId]
    );

    if (info.rows.length === 0) {
      console.log('❌ Evaluación no encontrada');
      return;
    }

    const candidate = info.rows[0];
    const candidateId = candidate.candidate_id;
    console.log(`✅ Candidato: ${candidate.first_name} ${candidate.last_name}\n`);

    // Obtener respuestas
    const answers = await pool.query(
      `SELECT eq.question_order, q.id, q.is_inverse, CAST(qo.score AS FLOAT) as score
       FROM exam_answers ea
       INNER JOIN questions q ON ea.question_id = q.id
       INNER JOIN exam_questions eq ON q.id = eq.question_id AND eq.exam_id = 27
       INNER JOIN question_options qo ON ea.answer_value = qo.id
       WHERE ea.candidate_id = $1 AND ea.exam_id = 27
       ORDER BY eq.question_order`,
      [candidateId]
    );

    if (answers.rows.length === 0) {
      console.log('❌ Sin respuestas');
      return;
    }

    console.log(`✅ Respuestas encontradas: ${answers.rows.length}`);

    // Calcular competencias
    const competencyNames = {
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

    const compMap = {};
    for (let i = 1; i <= 10; i++) {
      const compId = 6 + i;
      compMap[compId] = { name: competencyNames[compId], scores: [], total: 0 };
    }

    answers.rows.forEach(row => {
      const compId = 7 + Math.floor((row.question_order - 1) / 8);
      let score = row.score || 0;

      if (row.is_inverse && score >= 1 && score <= 5) {
        score = 6 - score;
      }

      if (compMap[compId]) {
        compMap[compId].scores.push(score);
        compMap[compId].total += score;
      }
    });

    // Calcular niveles
    const competencies = [];
    let totalScore = 0;
    for (let i = 1; i <= 10; i++) {
      const compId = 6 + i;
      const comp = compMap[compId];
      const score = comp.total;
      const maxScore = comp.scores.length * 5;
      const percentage = (score / maxScore) * 100;

      let level;
      if (percentage >= 85) level = 'Muy Alto';
      else if (percentage >= 70) level = 'Alto';
      else if (percentage >= 55) level = 'Medio';
      else if (percentage >= 40) level = 'Bajo';
      else level = 'Muy Bajo';

      competencies.push({
        name: comp.name,
        score: Math.round(score * 100) / 100,
        maxScore: maxScore,
        percentage: Math.round(percentage * 100) / 100,
        level: level
      });

      totalScore += score;
    }

    const maxScore = competencies.length * 40;
    const overallPercentage = (totalScore / maxScore) * 100;

    console.log(`📊 RESULTADO:`);
    console.log(`   Overall: ${Math.round(overallPercentage * 100) / 100}%`);
    console.log(`   Total: ${Math.round(totalScore * 100) / 100}/${maxScore}\n`);

    // Generar PDF
    console.log(`🎨 Generando PDF...`);
    const doc = new PDFDocument({ margin: 40 });
    const filename = `TPL80_${candidate.first_name}_test.pdf`;
    const filepath = path.join(__dirname, `../../test_output/${filename}`);

    // Crear directorio si no existe
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Generar PDF (mismo código del endpoint)
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#1A237E').text('Talent IA', { align: 'center' });
    doc.fontSize(14).font('Helvetica').fillColor('#424242').text('TEST DE PERSONALIDAD LABORAL (TPL-80)', { align: 'center' });
    doc.moveTo(50, 80).lineTo(550, 80).stroke('#1A237E');

    let yPos = 100;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Candidato: ' + candidate.first_name + ' ' + candidate.last_name, 50, yPos);
    yPos += 18;
    doc.fontSize(10).font('Helvetica').fillColor('#424242').text('Email: ' + candidate.email, 50, yPos);
    yPos += 25;

    let overallLevel;
    if (overallPercentage >= 85) overallLevel = 'Muy Alto';
    else if (overallPercentage >= 70) overallLevel = 'Alto';
    else if (overallPercentage >= 55) overallLevel = 'Medio';
    else if (overallPercentage >= 40) overallLevel = 'Bajo';
    else overallLevel = 'Muy Bajo';

    const overallColor = overallLevel === 'Muy Alto' ? '#1B5E20' :
                        overallLevel === 'Alto' ? '#2E7D32' :
                        overallLevel === 'Medio' ? '#F57F17' : '#D84315';
    doc.rect(50, yPos - 5, 500, 45).fill(overallColor).fillColor('#FFF');
    doc.fontSize(24).font('Helvetica-Bold').text(Math.round(overallPercentage * 100) / 100 + '%', 70, yPos + 5);
    doc.fontSize(11).font('Helvetica').text(Math.round(totalScore * 100) / 100 + '/' + maxScore + ' pts', 70, yPos + 35);
    doc.fontSize(11).text('Nivel: ' + overallLevel, 300, yPos + 5);
    yPos += 60;

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A237E').text('Competencias:', 50, yPos);
    yPos += 20;

    competencies.forEach((comp) => {
      const levelColor = comp.level === 'Muy Alto' ? '#1B5E20' :
                        comp.level === 'Alto' ? '#2E7D32' :
                        comp.level === 'Medio' ? '#F57F17' : '#D84315';

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(comp.name, 50, yPos);
      doc.fontSize(8).fillColor('#666').text(comp.percentage + '%', 250, yPos);

      const barWidth = 200;
      const filledWidth = (comp.percentage / 100) * barWidth;
      doc.rect(310, yPos - 2, barWidth, 10).stroke('#CCC');
      doc.rect(310, yPos - 2, Math.min(filledWidth, barWidth), 10).fill(levelColor);

      yPos += 18;
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
    });

    doc.end();

    stream.on('finish', () => {
      const fileSize = fs.statSync(filepath).size;
      const fileSizeKB = (fileSize / 1024).toFixed(2);
      console.log(`\n✅ PDF GENERADO EXITOSAMENTE!`);
      console.log(`   Archivo: ${filename}`);
      console.log(`   Tamaño: ${fileSizeKB} KB`);
      console.log(`   Ubicación: ${filepath}\n`);
      pool.end();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

// Probar con CV IDs
const testCVs = [61, 62, 63, 64, 65, 66];
console.log('🧪 PROBANDO GENERACIÓN ON-DEMAND DE PDFs\n');

testOnDemandPDF(testCVs[0]); // Empezar con Carlos
