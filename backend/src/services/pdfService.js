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

      const pageWidth = 595;
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = 50;

      // ═══════════════════════════════════════════════════════════════════
      // HEADER PROFESIONAL
      // ═══════════════════════════════════════════════════════════════════
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1A237E').text('Talent IA', margin, yPos);
      doc.fontSize(10).font('Helvetica').fillColor('#666').text('Sistema Integral de Evaluación de Talentos', margin, yPos + 25);

      // Línea decorativa
      doc.moveTo(margin, yPos + 42).lineTo(pageWidth - margin, yPos + 42).stroke('#1A237E');
      doc.moveTo(margin, yPos + 43).lineTo(pageWidth - margin, yPos + 43).stroke('#4A90E2');

      yPos += 65;

      // ═══════════════════════════════════════════════════════════════════
      // INFORMACIÓN DEL CANDIDATO
      // ═══════════════════════════════════════════════════════════════════
      // Fondo de caja
      doc.rect(margin, yPos - 5, contentWidth, 50).fill('#F5F7FA').stroke('#E0E0E0');

      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1A237E').text(resultsData.candidateName, margin + 10, yPos);
      doc.fontSize(10).font('Helvetica').fillColor('#0066cc').text(resultsData.email, margin + 10, yPos + 25);

      yPos += 60;

      // Fecha de generación
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.fontSize(8).font('Helvetica').fillColor('#999').text(`Generado: ${dateStr}`, margin, yPos);
      yPos += 20;

      // ═══════════════════════════════════════════════════════════════════
      // PUNTUACIÓN GENERAL
      // ═══════════════════════════════════════════════════════════════════
      const overallScore = calculateOverallScore(resultsData.evaluationResults);
      const overallLevel = getLevelLabel(overallScore);
      const overallColor = getLevelColor(overallScore);
      const badgeLabel = overallLevel === 'Muy Alto' ? 'Rango Alto' : overallLevel === 'Alto' ? 'Rango Medio-Alto' : overallLevel === 'Medio' ? 'Rango Medio' : 'Rango Bajo';

      // Badge de rango (lado derecho)
      const badgeWidth = 120;
      doc.rect(pageWidth - margin - badgeWidth, yPos - 10, badgeWidth, 55).fill(overallColor).stroke('#000').lineWidth(1);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFFFFF').text(badgeLabel, pageWidth - margin - badgeWidth + 10, yPos + 2, { width: badgeWidth - 20, align: 'center' });
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#FFFFFF').text(`${overallScore.toFixed(1)}%`, pageWidth - margin - badgeWidth + 10, yPos + 20, { width: badgeWidth - 20, align: 'center' });

      yPos += 70;

      // ═══════════════════════════════════════════════════════════════════
      // RESULTADOS DE EVALUACIONES
      // ═══════════════════════════════════════════════════════════════════
      if (resultsData.evaluationResults && Array.isArray(resultsData.evaluationResults)) {
        resultsData.evaluationResults.forEach((result, idx) => {
          if (yPos > 680) {
            doc.addPage();
            yPos = 50;
          }

          if (result.type === 'evaluation' && result.data) {
            // Sección de evaluación de competencias
            drawSectionHeader(doc, result.name || 'Evaluación', margin, yPos, contentWidth);
            yPos += 25;

            if (result.description) {
              doc.fontSize(9).font('Helvetica').fillColor('#666');
              const descHeight = doc.heightOfString(result.description, { width: contentWidth });
              doc.text(result.description, margin, yPos, { width: contentWidth });
              yPos += descHeight + 15;
            }

            const entries = Object.entries(result.data);
            if (entries.length > 0) {
              // Encabezado de sección
              doc.fontSize(11).font('Helvetica-Bold').fillColor('#1A237E').text('Resumen por Competencia', margin + 10, yPos);
              yPos += 20;

              entries.forEach(([competency, values]) => {
                if (yPos > 680) {
                  doc.addPage();
                  yPos = 50;
                }

                const pct = values && values.percentage ? parseFloat(values.percentage) : 0;
                const level = getLevelLabel(pct);
                const levelColor = getLevelColor(pct);
                const description = getCompetencyDescription(competency, level);

                // Fila de competencia con mejor layout
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(competency, margin + 10, yPos);
                doc.fontSize(8).font('Helvetica').fillColor('#999').text(level, margin + 310, yPos);
                doc.fontSize(10).font('Helvetica-Bold').fillColor(levelColor).text(`${pct.toFixed(1)}%`, margin + 420, yPos);

                yPos += 16;

                // Barra de progreso con mejor diseño
                doc.rect(margin + 10, yPos, contentWidth - 20, 8).fill('#EEEEEE').stroke('#DDD').lineWidth(0.5);
                const barWidth = ((contentWidth - 20) * pct) / 100;
                doc.rect(margin + 10, yPos, barWidth, 8).fill(levelColor).stroke('none');

                yPos += 14;

                // Descripción de la competencia
                doc.fontSize(8).font('Helvetica').fillColor('#666');
                const descHeight = doc.heightOfString(description, { width: contentWidth - 40 });
                doc.text(`Resultado Competencia: ${description}`, margin + 10, yPos, { width: contentWidth - 40 });
                yPos += descHeight + 12;
              });
            }

            yPos += 10;

          } else if (result.type === 'typing' && result.data) {
            // Prueba de mecanografía
            drawSectionHeader(doc, result.name || 'Prueba de Mecanografía', margin, yPos, contentWidth);
            yPos += 25;

            if (result.description) {
              doc.fontSize(9).font('Helvetica').fillColor('#666');
              const descHeight = doc.heightOfString(result.description, { width: contentWidth });
              doc.text(result.description, margin, yPos, { width: contentWidth });
              yPos += descHeight + 15;
            }

            // Métrica de velocidad
            const wpm = result.data.wpm || 0;
            const wpmColor = wpm >= 60 ? '#1B5E20' : wpm >= 40 ? '#F57F17' : '#D84315';

            doc.rect(margin, yPos, contentWidth / 2 - 10, 50).fill('#F5F7FA').stroke('#E0E0E0');
            doc.fontSize(24).font('Helvetica-Bold').fillColor(wpmColor).text(wpm, margin + 15, yPos + 8);
            doc.fontSize(9).font('Helvetica').fillColor('#666').text('Palabras por Minuto', margin + 15, yPos + 32);

            const netWpm = result.data.netWPM || 0;
            doc.rect(margin + contentWidth / 2, yPos, contentWidth / 2 - 10, 50).fill('#F5F7FA').stroke('#E0E0E0');
            doc.fontSize(24).font('Helvetica-Bold').fillColor('#2E7D32').text(netWpm, margin + contentWidth / 2 + 15, yPos + 8);
            doc.fontSize(9).font('Helvetica').fillColor('#666').text('Net WPM (ajustado)', margin + contentWidth / 2 + 15, yPos + 32);

            yPos += 65;

            // Otras métricas
            const accuracy = result.data.accuracy || 0;
            const errors = result.data.totalErrors || 0;

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('Precisión', margin, yPos);
            doc.fontSize(10).font('Helvetica').fillColor('#666').text(`${accuracy}%`, margin + 300, yPos);
            doc.rect(margin, yPos + 12, contentWidth / 2 - 10, 8).fill('#EEEEEE');
            doc.rect(margin, yPos + 12, (contentWidth / 2 - 10) * accuracy / 100, 8).fill(getLevelColor(accuracy));

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('Errores', margin + contentWidth / 2, yPos);
            doc.fontSize(10).font('Helvetica').fillColor('#666').text(errors, margin + contentWidth / 2 + 300, yPos);

            yPos += 30;

          } else if (result.type === 'spelling' && result.data) {
            // Prueba de ortografía
            drawSectionHeader(doc, result.name || 'Prueba de Ortografía', margin, yPos, contentWidth);
            yPos += 25;

            if (result.description) {
              doc.fontSize(9).font('Helvetica').fillColor('#666');
              const descHeight = doc.heightOfString(result.description, { width: contentWidth });
              doc.text(result.description, margin, yPos, { width: contentWidth });
              yPos += descHeight + 15;
            }

            // Métricas en cajas
            const accuracy = result.data.accuracy || 0;
            const correctAnswers = result.data.correctAnswers || 0;
            const score = result.data.score || 0;

            const boxWidth = (contentWidth - 10) / 3;
            const boxHeight = 45;

            // Caja 1: Correctas
            doc.rect(margin, yPos, boxWidth, boxHeight).fill('#F0F5F9').stroke('#E0E0E0');
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#1B5E20').text(correctAnswers, margin + 10, yPos + 5);
            doc.fontSize(8).font('Helvetica').fillColor('#666').text('Respuestas Correctas', margin + 10, yPos + 28);

            // Caja 2: Precisión
            doc.rect(margin + boxWidth + 5, yPos, boxWidth, boxHeight).fill('#F0F5F9').stroke('#E0E0E0');
            doc.fontSize(20).font('Helvetica-Bold').fillColor(getLevelColor(accuracy)).text(`${accuracy}%`, margin + boxWidth + 15, yPos + 5);
            doc.fontSize(8).font('Helvetica').fillColor('#666').text('Precisión', margin + boxWidth + 15, yPos + 28);

            // Caja 3: Puntuación
            doc.rect(margin + (boxWidth + 5) * 2, yPos, boxWidth, boxHeight).fill('#F0F5F9').stroke('#E0E0E0');
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#4A90E2').text(score, margin + (boxWidth + 5) * 2 + 10, yPos + 5);
            doc.fontSize(8).font('Helvetica').fillColor('#666').text('Puntuación Total', margin + (boxWidth + 5) * 2 + 10, yPos + 28);

            yPos += boxHeight + 20;
          }
        });
      }

      // ═══════════════════════════════════════════════════════════════════
      // FOOTER
      // ═══════════════════════════════════════════════════════════════════
      doc.fontSize(8).font('Helvetica').fillColor('#999');
      doc.text(
        `Talent IA - Sistema de Evaluación de Talentos | Reporte Confidencial | ${dateStr}`,
        margin,
        760,
        { align: 'center', width: contentWidth }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

function drawSectionHeader(doc, title, x, y, width) {
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#FFFFFF').rect(x, y, width, 22).fill('#1A237E').stroke();
  doc.text(title, x + 10, y + 4, { width: width - 20, align: 'left' });
}

function calculateOverallScore(evaluationResults) {
  if (!evaluationResults || !Array.isArray(evaluationResults)) return 0;

  let totalScore = 0;
  let count = 0;

  evaluationResults.forEach(result => {
    if (result.type === 'evaluation' && result.data) {
      const entries = Object.entries(result.data);
      entries.forEach(([_, values]) => {
        if (values && values.percentage) {
          totalScore += parseFloat(values.percentage);
          count++;
        }
      });
    } else if (result.type === 'typing' && result.data) {
      totalScore += result.data.wpm || 0;
      count++;
    } else if (result.type === 'spelling' && result.data) {
      totalScore += result.data.accuracy || 0;
      count++;
    }
  });

  return count > 0 ? totalScore / count : 0;
}

function getRecommendation(score) {
  if (score >= 80) return 'Excelente desempeño. Candidato altamente calificado.';
  if (score >= 60) return 'Buen desempeño. Candidato calificado para el rol.';
  if (score >= 40) return 'Desempeño aceptable. Requiere evaluación adicional.';
  return 'Desempeño bajo. Requiere desarrollo o reconsideración.';
}

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

function getCompetencyDescription(competency, level) {
  const descriptions = {
    'Muy Alto': `Puntajes altos denotan que la persona muestra un dominio excepcional en esta competencia. Desempeño superior y consistente.`,
    'Alto': `Puntajes altos denotan que la persona muestra capacidad avanzada en esta competencia. Desempeño sólido y confiable.`,
    'Medio': `Puntajes promedio denotan que la persona tiene capacidades aceptables en esta competencia. Posibilidad de mejora identificada.`,
    'Bajo': `Puntajes bajos denotan que la persona tiene limitaciones en esta competencia. Área que requiere desarrollo y entrenamiento.`
  };
  return descriptions[level] || 'Competencia evaluada sin clasificación específica.';
}

module.exports = {
  generateResultsPDF,
  generateEvaluationResultsPDF,
};
