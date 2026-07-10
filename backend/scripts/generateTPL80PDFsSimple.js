const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const baseURL = 'https://talento-ia-v1-production.up.railway.app/api/evaluations';

async function calculateLevel(percentage) {
  if (percentage >= 85) return 'Muy Alto';
  if (percentage >= 70) return 'Alto';
  if (percentage >= 55) return 'Medio';
  if (percentage >= 40) return 'Bajo';
  return 'Muy Bajo';
}

function getLevelColor(level) {
  switch (level) {
    case 'Muy Alto': return '#1B5E20';
    case 'Alto': return '#2E7D32';
    case 'Medio': return '#F57F17';
    case 'Bajo': return '#D84315';
    default: return '#B71C1C';
  }
}

async function generatePDFFromResults(cvId, results, candidateName) {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '../../pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 40 });
      const filename = `TPL80_${candidateName}_${Date.now()}.pdf`;
      const filepath = path.join(pdfDir, filename);

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#1A237E').text('Talent IA', { align: 'center' });
      doc.fontSize(14).font('Helvetica').fillColor('#424242').text('TEST DE PERSONALIDAD LABORAL (TPL-80)', { align: 'center' });
      doc.moveTo(50, 80).lineTo(550, 80).stroke('#1A237E');

      let yPos = 100;

      // Información
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Información del Candidato', 50, yPos);
      yPos += 20;

      doc.fontSize(10).font('Helvetica').fillColor('#424242');
      doc.text(`Nombre: ${candidateName}`, 50, yPos);
      yPos += 18;
      if (results.candidateEmail) {
        doc.text(`Email: ${results.candidateEmail}`, 50, yPos);
        yPos += 18;
      }

      // Resultado general
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A237E').text('Resultado General', 50, yPos + 5);
      yPos += 30;

      const overall = results.overall;
      const overallLevel = overall.level || await calculateLevel(overall.percentage);
      const overallColor = getLevelColor(overallLevel);

      doc.rect(50, yPos - 5, 500, 45).fill(overallColor).fillColor('#FFF');
      doc.fontSize(24).font('Helvetica-Bold').text(`${overall.percentage}%`, 70, yPos + 5, { width: 200 });
      doc.fontSize(11).font('Helvetica').text(`${overall.score}/${overall.maxScore} puntos`, 70, yPos + 35);
      doc.fontSize(11).font('Helvetica').text(`Nivel: ${overallLevel}`, 300, yPos + 5);

      yPos += 65;

      // Competencias
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A237E').text('Perfil de Competencias (10 Dimensiones)', 50, yPos);
      yPos += 20;

      results.competencies.forEach((comp, idx) => {
        const compLevel = comp.level || calculateLevel(comp.percentage);
        const levelColor = getLevelColor(compLevel);

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(`${idx + 1}. ${comp.name}`, 50, yPos);
        doc.fontSize(8).fillColor('#424242').text(`${comp.score}/40 (${comp.percentage}%)`, 250, yPos);

        const barWidth = 200;
        const filledWidth = (comp.percentage / 100) * barWidth;
        doc.rect(310, yPos - 2, barWidth, 10).stroke('#BDBDBD');
        doc.rect(310, yPos - 2, Math.min(filledWidth, barWidth), 10).fill(levelColor);

        doc.fontSize(8).fillColor('#666').text(compLevel, 520, yPos);

        yPos += 20;
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });

      // Footer
      doc.fontSize(8).fillColor('#999');
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Generado ${dateStr} | Talent IA v1.0 | CV ID: ${cvId}`, 50, 750, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({ filename });
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
  const names = ['Carlos', 'Diana', 'Eduardo', 'Valentina', 'Fernando', 'Gabriela'];

  for (let i = 0; i < cvIds.length; i++) {
    const cvId = cvIds[i];
    const name = names[i];

    try {
      console.log(`📝 ${name} (CV ID: ${cvId})`);

      // Obtener resultados del backend usando curl
      let results;
      try {
        const output = execSync(`curl -s "${baseURL}/${cvId}/results"`, { encoding: 'utf-8' });
        results = JSON.parse(output);
      } catch (error) {
        console.log(`   ❌ Error fetching results\n`);
        continue;
      }

      if (!results.overall || !results.competencies) {
        console.log(`   ❌ Datos incompletos\n`);
        continue;
      }

      // Generar PDF
      const pdfData = await generatePDFFromResults(cvId, results, name);

      console.log(`   ✅ ${pdfData.filename}`);
      console.log(`   📊 ${results.overall.percentage}% - ${results.overall.level}\n`);

    } catch (error) {
      console.log(`   ❌ ${error.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ PDFs generados en: backend/pdfs/\n');

  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
