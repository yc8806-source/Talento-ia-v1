const axios = require('axios');
const fs = require('fs');

async function testPDFDownload() {
  try {
    console.log('\n📥 TESTING PDF DOWNLOAD\n');

    // Probar con un candidato que tenga respuestas completas (TPL-80)
    const apiUrl = 'http://localhost:3000/api';
    const candidateId = 90;

    console.log(`Candidato: ${candidateId}`);
    console.log(`Endpoint: ${apiUrl}/candidates/${candidateId}/results/pdf\n`);

    const response = await axios.get(`${apiUrl}/candidates/${candidateId}/results/pdf`, {
      responseType: 'arraybuffer'
    });

    console.log('✅ PDF descargado exitosamente');
    console.log(`📊 Tamaño: ${response.data.length} bytes`);
    console.log(`📋 Content-Type: ${response.headers['content-type']}`);

    // Guardar el PDF localmente para verificar
    const pdfPath = `D:\\Loboy\\Proyectos\\Talent IA\\backend\\test_download_${candidateId}_${Date.now()}.pdf`;
    fs.writeFileSync(pdfPath, response.data);
    console.log(`💾 Guardado en: ${pdfPath}`);

  } catch (error) {
    console.error('❌ Error descargando PDF:');
    console.error('   Mensaje:', error.message);
    if (error.response?.status) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data?.toString('utf8'));
    }
    if (error.response?.data) {
      try {
        const data = JSON.parse(error.response.data.toString('utf8'));
        console.error('   JSON:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('   Raw response:', error.response.data.toString('utf8').substring(0, 500));
      }
    }
  }
}

testPDFDownload();
