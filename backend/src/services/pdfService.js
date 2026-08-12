const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateResultsPDF = (candidateData, evaluationData) => {
  return new Promise((resolve, reject) => {
    try {
      // Crear carpeta de PDFs si no existe
      const pdfDir = path.join(__dirname, '../../pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      // Crear documento PDF
      const doc = new PDFDocument({ margin: 40 });
      const filename = `TPL80_${candidateData.id}_${Date.now()}.pdf`;
      const filepath = path.join(pdfDir, filename);

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ═══════════════════════════════════════════════════════════════════
      // HEADER
      // ═══════════════════════════════════════════════════════════════════
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#1A237E').text('Talent IA', { align: 'center' });
      doc.fontSize(14).font('Helvetica').fillColor('#424242').text('TEST DE PERSONALIDAD LABORAL (TPL-80)', { align: 'center' });
      doc.moveTo(50, 80).lineTo(550, 80).stroke('#1A237E');

      let yPos = 100;

      // ═══════════════════════════════════════════════════════════════════
      // INFORMACIÓN DEL CANDIDATO
      // ═══════════════════════════════════════════════════════════════════
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

      // ═══════════════════════════════════════════════════════════════════
      // RESULTADO GENERAL
      // ═══════════════════════════════════════════════════════════════════
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A237E').text('Resultado General', 50, yPos);
      yPos += 20;

      // Caja con resultado general
      const overallColor = evaluationData.overall.level === 'Muy Alto' ? '#1B5E20' :
                          evaluationData.overall.level === 'Alto' ? '#2E7D32' :
                          evaluationData.overall.level === 'Medio' ? '#F57F17' :
                          evaluationData.overall.level === 'Bajo' ? '#D84315' : '#B71C1C';

      doc.rect(50, yPos - 5, 500, 45).fill(overallColor).fillColor('#FFF');
      doc.fontSize(24).font('Helvetica-Bold').text(`${evaluationData.overall.percentage}%`, 70, yPos + 5, { width: 200 });
      doc.fontSize(11).font('Helvetica').text(`${evaluationData.overall.score}/${evaluationData.overall.maxScore} puntos`, 70, yPos + 35);
      doc.fontSize(11).font('Helvetica').text(`Nivel: ${evaluationData.overall.level}`, 300, yPos + 5);

      yPos += 65;

      // ═══════════════════════════════════════════════════════════════════
      // PUNTAJES POR COMPETENCIA
      // ═══════════════════════════════════════════════════════════════════
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A237E').text('Perfil de Competencias (10 Dimensiones)', 50, yPos);
      yPos += 20;

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');

      evaluationData.competencies.forEach((comp, idx) => {
        // Determinar color según nivel
        let levelColor;
        switch (comp.level) {
          case 'Muy Alto':
            levelColor = '#1B5E20';
            break;
          case 'Alto':
            levelColor = '#2E7D32';
            break;
          case 'Medio':
            levelColor = '#F57F17';
            break;
          case 'Bajo':
            levelColor = '#D84315';
            break;
          case 'Muy Bajo':
            levelColor = '#B71C1C';
            break;
          default:
            levelColor = '#757575';
        }

        // Nombre competencia
        doc.fillColor('#000').text(`${idx + 1}. ${comp.name}`, 50, yPos);

        // Puntaje y barra
        doc.fontSize(8).fillColor('#424242').text(`${comp.score}/40 (${comp.percentage}%)`, 250, yPos);

        // Barra de progreso
        const barWidth = 200;
        const filledWidth = (comp.percentage / 100) * barWidth;
        doc.rect(310, yPos - 2, barWidth, 10).stroke('#BDBDBD');
        doc.rect(310, yPos - 2, filledWidth, 10).fill(levelColor);

        // Nivel
        doc.fillColor('#666').fontSize(8).text(comp.level, 520, yPos);

        yPos += 20;

        // Agregar página si es necesario
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });

      yPos += 15;

      // ═══════════════════════════════════════════════════════════════════
      // ESCALA DE INTERPRETACIÓN
      // ═══════════════════════════════════════════════════════════════════
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

      yPos += 10;

      // ═══════════════════════════════════════════════════════════════════
      // FECHA Y PIE DE PÁGINA
      // ═══════════════════════════════════════════════════════════════════
      doc.fontSize(8).font('Helvetica').fillColor('#999');
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(
        `Generado el ${dateStr} | Talent IA - Sistema de Evaluación de Personalidad Laboral v1.0`,
        50,
        750,
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => {
        resolve({
          filename,
          filepath,
          url: `/api/reports/pdf/${filename}`,
        });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

const generateEvaluationResultsPDF = (resultsData) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '../../pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const filename = `resultados_evaluacion_${resultsData.candidateId}_${Date.now()}.pdf`;
      const filepath = path.join(pdfDir, filename);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        fs.writeFileSync(filepath, pdfBuffer);
        resolve({
          filename,
          filepath,
          url: `/api/reports/pdf/${filename}`,
        });
      });
      doc.on('error', reject);

      let yPos = 50;

      // Header
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1A237E').text('Talent IA', 50, yPos);
      doc.fontSize(10).font('Helvetica').fillColor('#666').text('Reporte de Evaluaciones', 50, yPos + 20);
      doc.moveTo(50, yPos + 40).lineTo(545, yPos + 40).stroke('#E0E0E0');

      yPos += 60;

      // Candidate name as title
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#000').text(resultsData.candidateName, 50, yPos);

      // Email below name
      doc.fontSize(10).font('Helvetica').fillColor('#0066cc').text(resultsData.email, 50, yPos + 25);

      yPos += 50;

      // Evaluation results
      if (resultsData.evaluationResults && Array.isArray(resultsData.evaluationResults)) {
        resultsData.evaluationResults.forEach((result, idx) => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          if (result.type === 'evaluation' && result.data) {
            // Title
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#1A237E').text(result.name || 'Evaluación', 50, yPos);
            yPos += 20;

            // Description
            if (result.description) {
              doc.fontSize(9).font('Helvetica').fillColor('#666');
              doc.text(result.description, 50, yPos, { width: 445, align: 'left' });
              yPos += 40;
            }

            // Competencies
            const entries = Object.entries(result.data);
            if (entries.length > 0) {
              entries.forEach(([competency, values]) => {
                if (yPos > 700) {
                  doc.addPage();
                  yPos = 50;
                }

                const pct = values && values.percentage ? parseFloat(values.percentage) : 0;
                const level = getLevelLabel(pct);
                const levelColor = getLevelColor(pct);

                // Competency name and level
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text(competency, 50, yPos);
                doc.fontSize(9).font('Helvetica').fillColor('#666').text(level, 350, yPos);
                doc.fontSize(10).font('Helvetica-Bold').fillColor(levelColor).text(`${pct.toFixed(1)}%`, 480, yPos);

                yPos += 18;

                // Progress bar background
                doc.rect(50, yPos, 445, 8).fill('#E0E0E0');

                // Progress bar fill
                const barWidth = (pct / 100) * 445;
                doc.rect(50, yPos, barWidth, 8).fill(levelColor);

                yPos += 20;
              });
            }

            yPos += 20;
          } else if (result.type === 'typing' && result.data) {
            // Typing test results
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#1A237E').text(result.name || 'Prueba de Mecanografía', 50, yPos);
            yPos += 20;

            if (result.description) {
              doc.fontSize(9).font('Helvetica').fillColor('#666');
              doc.text(result.description, 50, yPos, { width: 445 });
              yPos += 30;
            }

            // Metrics
            doc.fontSize(9).font('Helvetica').fillColor('#333');
            doc.text(`Palabras por Minuto (WPM): ${result.data.wpm || 0}`, 60, yPos);
            yPos += 12;
            doc.text(`Net WPM: ${result.data.netWPM || 0}`, 60, yPos);
            yPos += 12;
            doc.text(`Precisión: ${result.data.accuracy || 0}%`, 60, yPos);
            yPos += 12;
            doc.text(`Errores: ${result.data.totalErrors || 0}`, 60, yPos);
            yPos += 20;
          } else if (result.type === 'spelling' && result.data) {
            // Spelling test results
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#1A237E').text(result.name || 'Prueba de Ortografía', 50, yPos);
            yPos += 20;

            if (result.description) {
              doc.fontSize(9).font('Helvetica').fillColor('#666');
              doc.text(result.description, 50, yPos, { width: 445 });
              yPos += 30;
            }

            // Metrics
            doc.fontSize(9).font('Helvetica').fillColor('#333');
            doc.text(`Respuestas Correctas: ${result.data.correctAnswers || 0}`, 60, yPos);
            yPos += 12;
            doc.text(`Precisión: ${result.data.accuracy || 0}%`, 60, yPos);
            yPos += 12;
            doc.text(`Puntuación: ${result.data.score || 0} puntos`, 60, yPos);
            yPos += 20;
          }
        });
      }

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#999');
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(
        `Generado el ${dateStr} | Talent IA - Sistema de Evaluación de Talentos`,
        50,
        760,
        { align: 'center', width: 445 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

function getLevelLabel(percentage) {
  if (percentage >= 80) return 'Muy Alto';
  if (percentage >= 60) return 'Alto';
  if (percentage >= 40) return 'Medio';
  return 'Bajo';
}

function getLevelColor(percentage) {
  if (percentage >= 80) return '#1B5E20';
  if (percentage >= 60) return '#2E7D32';
  if (percentage >= 40) return '#F57F17';
  return '#D84315';
}

module.exports = {
  generateResultsPDF,
  generateEvaluationResultsPDF,
};
