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
      const doc = new PDFDocument();
      const filename = `reporte_${candidateData.id}_${Date.now()}.pdf`;
      const filepath = path.join(pdfDir, filename);

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Talent IA', 50, 50);
      doc.fontSize(12).font('Helvetica').text('Reporte de Evaluación', 50, 80);
      doc.moveTo(50, 100).lineTo(550, 100).stroke();

      // Información del candidato
      doc.fontSize(14).font('Helvetica-Bold').text('Información del Candidato', 50, 120);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Nombre: ${candidateData.firstName} ${candidateData.lastName}`, 50, 145);
      doc.text(`Email: ${candidateData.email}`, 50, 165);
      doc.text(`Teléfono: ${candidateData.phone || 'N/A'}`, 50, 185);
      doc.text(`Vacante: ${evaluationData.vacancy}`, 50, 205);

      // Puntajes por competencia
      doc.fontSize(14).font('Helvetica-Bold').text('Puntajes por Competencia', 50, 240);
      doc.fontSize(11).font('Helvetica');

      let yPos = 265;
      evaluationData.competencies.forEach((comp) => {
        doc.text(`${comp.name}:`, 50, yPos);
        doc.text(`${comp.percentage}% (${comp.score}/${comp.maxScore})`, 250, yPos);

        // Barra de progreso
        const barWidth = 200;
        const filledWidth = (comp.percentage / 100) * barWidth;
        doc.rect(50, yPos + 15, barWidth, 10).stroke();
        doc.rect(50, yPos + 15, filledWidth, 10).fill('#0066CC');

        yPos += 50;
      });

      // Recomendaciones
      doc.fontSize(14).font('Helvetica-Bold').text('Recomendaciones por Operación', 50, yPos);
      doc.fontSize(11).font('Helvetica');

      yPos += 30;
      evaluationData.recommendations.forEach((rec, idx) => {
        const bgColor = idx === 0 ? '#E8F5E9' : '#F5F5F5';
        const prefix = idx === 0 ? '🏆 RECOMENDADO: ' : `Opción ${rec.rank}: `;

        doc.rect(50, yPos - 5, 500, 25).fill(bgColor);
        doc.fillColor('#000');
        doc.text(
          `${prefix}${rec.operation} - Afinidad: ${rec.affinityScore}`,
          60,
          yPos
        );

        yPos += 40;
      });

      // Footer
      doc.fontSize(9).font('Helvetica').text(
        `Generado el ${new Date().toLocaleDateString('es-ES')} | Talent IA v1.0`,
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

module.exports = {
  generateResultsPDF,
};
