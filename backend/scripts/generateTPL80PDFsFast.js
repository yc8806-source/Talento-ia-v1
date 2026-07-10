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

async function generatePDF(candidateData, evaluationData, cvId) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '../../pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 40 });
      const filename = `TPL80_${candidateData.firstName}_${candidateData.lastName}_${Date.now()}.pdf`;
      const filepath = path.join(pdfDir, filename);

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#1A237E').text('Talent IA', { align: 'center' });
      doc.fontSize(14).font('Helvetica').fillColor('#424242').text('TEST DE PERSONALIDAD LABORAL (TPL-80)', { align: 'center' });
      doc.moveTo(50, 80).lineTo(550, 80).stroke('#1A237E');

      let yPos = 100;

      // Información del candidato
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

      // Resultado general
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

      // Competencias
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A237E').text('Perfil de Competencias (10 Dimensiones)', 50, yPos);
      yPos += 20;

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');

      evaluationData.competencies.forEach((comp, idx) => {
        let levelColor;
        switch (comp.level) {
          case 'Muy Alto': levelColor = '#1B5E20'; break;
          case 'Alto': levelColor = '#2E7D32'; break;
          case 'Medio': levelColor = '#F57F17'; break;
          case 'Bajo': levelColor = '#D84315'; break;
          case 'Muy Bajo': levelColor = '#B71C1C'; break;
          default: levelColor = '#757575';
        }

        doc.fillColor('#000').text(`${idx + 1}. ${comp.name}`, 50, yPos);
        doc.fontSize(8).fillColor('#424242').text(`${comp.score}/40 (${comp.percentage}%)`, 250, yPos);

        const barWidth = 200;
        const filledWidth = (comp.percentage / 100) * barWidth;
        doc.rect(310, yPos - 2, barWidth, 10).stroke('#BDBDBD');
        doc.rect(310, yPos - 2, filledWidth, 10).fill(levelColor);

        doc.fillColor('#666').fontSize(8).text(comp.level, 520, yPos);

        yPos += 20;

        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });

      yPos += 15;

      // Escala
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1A237E').text('Escala de Interpretación', 50, yPos);
      yPos += 20;

      const levels = [
        { range: '34-40 puntos', level: 'Muy Alto', desc: 'Fortaleza muy marcada' },
        { range: '28-33 puntos', level: 'Alto', desc: 'Competencia bien desarrollada' },
        { range: '22-27 puntos', level: 'Medio', desc: 'Competencia desarrollada' },
        { range: '16-21 puntos', level: 'Bajo', desc: 'Área de mejora identificada' },
        { range: '8-15 puntos', level: 'Muy Bajo', desc: 'Requiere desarrollo importante' }
      ];

      doc.fontSize(9).font('Helvetica');
      levels.forEach(l => {
        doc.fillColor('#666').text(`${l.range}: ${l.level} - ${l.desc}`, 50, yPos);
        yPos += 16;
      });

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#999');
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(
        `Generado el ${dateStr} | Talent IA v1.0 | CV ID: ${cvId}`,
        50,
        750,
        { align: 'center' }
      );

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

  const cvIds = [61, 62, 63, 64, 65, 66];

  for (const cvId of cvIds) {
    try {
      console.log(`📝 CV ID: ${cvId}`);

      // Obtener datos
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

      // Obtener resultados pre-calculados (ya existen en la BD)
      const resultsResult = await pool.query(
        `SELECT
          json_object_agg(
            'overall',
            json_build_object(
              'score', COUNT(CASE WHEN total_score > 0 THEN 1 END) * 10,
              'maxScore', 400,
              'percentage', ROUND(AVG((total_score::float / max_possible_score * 100))::numeric, 2),
              'level', CASE
                WHEN AVG((total_score::float / max_possible_score * 100)) >= 85 THEN 'Muy Alto'
                WHEN AVG((total_score::float / max_possible_score * 100)) >= 70 THEN 'Alto'
                WHEN AVG((total_score::float / max_possible_score * 100)) >= 55 THEN 'Medio'
                WHEN AVG((total_score::float / max_possible_score * 100)) >= 40 THEN 'Bajo'
                ELSE 'Muy Bajo'
              END
            )
          ) as result
         FROM evaluation_results
         WHERE candidate_vacancy_id = $1`,
        [cvId]
      );

      // Obtener competencias
      const competenciesResult = await pool.query(
        `SELECT
          c.id,
          c.name,
          er.total_score as score,
          er.max_possible_score as maxScore,
          ROUND((er.total_score::float / er.max_possible_score * 100)::numeric, 2) as percentage,
          CASE
            WHEN (er.total_score::float / er.max_possible_score * 100) >= 85 THEN 'Muy Alto'
            WHEN (er.total_score::float / er.max_possible_score * 100) >= 70 THEN 'Alto'
            WHEN (er.total_score::float / er.max_possible_score * 100) >= 55 THEN 'Medio'
            WHEN (er.total_score::float / er.max_possible_score * 100) >= 40 THEN 'Bajo'
            ELSE 'Muy Bajo'
          END as level
         FROM evaluation_results er
         INNER JOIN competencies c ON er.competency_id = c.id
         WHERE er.candidate_vacancy_id = $1
         ORDER BY c.id`,
        [cvId]
      );

      if (competenciesResult.rows.length === 0) {
        console.log(`   ⚠️  Sin resultados en BD, saltando...\n`);
        continue;
      }

      // Calcular overall
      const competencies = competenciesResult.rows;
      const totalScore = competencies.reduce((sum, c) => sum + parseFloat(c.score), 0);
      const maxScore = competencies.length * 40;
      const overallPercentage = (totalScore / maxScore) * 100;

      let overallLevel;
      if (overallPercentage >= 85) overallLevel = 'Muy Alto';
      else if (overallPercentage >= 70) overallLevel = 'Alto';
      else if (overallPercentage >= 55) overallLevel = 'Medio';
      else if (overallPercentage >= 40) overallLevel = 'Bajo';
      else overallLevel = 'Muy Bajo';

      const candidateData = {
        firstName: info.first_name,
        lastName: info.last_name,
        email: info.email,
        phone: info.phone
      };

      const evaluationData = {
        vacancy: info.title,
        overall: {
          score: Math.round(totalScore),
          maxScore,
          percentage: Math.round(overallPercentage * 100) / 100,
          level: overallLevel
        },
        competencies: competencies.map(c => ({
          name: c.name,
          score: Math.round(parseFloat(c.score)),
          maxScore: 40,
          percentage: parseFloat(c.percentage),
          level: c.level
        }))
      };

      // Generar PDF
      const pdfData = await generatePDF(candidateData, evaluationData, cvId);

      console.log(`   ✅ ${pdfData.filename}`);
      console.log(`   📊 ${evaluationData.overall.percentage}% - ${overallLevel}\n`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ PDFs generados en: backend/pdfs/\n');

  pool.end();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  pool.end();
  process.exit(1);
});
