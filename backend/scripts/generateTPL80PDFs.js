const fetch = require('node-fetch');

const baseURL = 'https://talento-ia-v1-production.up.railway.app/api/evaluations';

async function generatePDFs() {
  console.log('📄 GENERANDO PDFs PARA 6 CANDIDATOS DE PRUEBA\n');

  const cvIds = [61, 62, 63, 64, 65, 66];
  const names = ['CARLOS', 'DIANA', 'EDUARDO', 'VALENTINA', 'FERNANDO', 'GABRIELA'];

  for (let i = 0; i < cvIds.length; i++) {
    const cvId = cvIds[i];
    const name = names[i];

    try {
      console.log(`📝 Generando PDF para: ${name} (CV ID: ${cvId})`);

      // Llamar al endpoint de generación de PDF
      const response = await fetch(`${baseURL}/${cvId}/pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();

      if (data.pdf && data.pdf.url) {
        console.log(`   ✅ PDF generado exitosamente`);
        console.log(`   📥 URL: ${baseURL}${data.pdf.url}`);
        console.log(`   💾 Archivo: ${data.pdf.filename}`);
      } else {
        console.log(`   ⚠️  Respuesta incompleta:`, data);
      }

      console.log('');

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Pequeño delay entre llamadas
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('═══════════════════════════════════════════════════\n');
  console.log('✅ Generación de PDFs completada\n');
}

generatePDFs().catch(console.error);
