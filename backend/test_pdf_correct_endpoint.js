const axios = require('axios');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function testPDFDownload() {
  try {
    console.log('\n📥 TESTING PDF DOWNLOAD (ENDPOINT CORRECTO)\n');

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Obtener candidateVacancyId para candidate 90
    const cvResult = await pool.query(
      `SELECT id FROM candidate_vacancies WHERE candidate_id = 90 LIMIT 1`
    );

    if (cvResult.rows.length === 0) {
      console.log('❌ No candidate_vacancy found for candidate 90');
      pool.end();
      return;
    }

    const candidateVacancyId = cvResult.rows[0].id;
    console.log(`✅ Candidate Vacancy ID: ${candidateVacancyId}\n`);

    const apiUrl = 'http://localhost:3000/api';
    const endpoint = `${apiUrl}/evaluations/${candidateVacancyId}/pdf-download`;

    console.log(`📋 Endpoint: ${endpoint}\n`);

    const response = await axios.get(endpoint, {
      responseType: 'arraybuffer'
    });

    console.log('✅ PDF descargado exitosamente');
    console.log(`📊 Tamaño: ${response.data.length} bytes`);
    console.log(`📋 Content-Type: ${response.headers['content-type']}`);

    // Guardar el PDF localmente para verificar
    const pdfPath = `D:\\Loboy\\Proyectos\\Talent IA\\backend\\test_pdf_candidate_90_${Date.now()}.pdf`;
    fs.writeFileSync(pdfPath, response.data);
    console.log(`\n💾 Guardado en: ${pdfPath}`);
    console.log(`\n✅ PDF listo para descargar`);

    pool.end();

  } catch (error) {
    console.error('❌ Error descargando PDF:');
    console.error('   Mensaje:', error.message);
    if (error.response?.status) {
      console.error('   Status:', error.response.status);
      try {
        const data = error.response.data.toString('utf8');
        console.error('   Response:', data.substring(0, 300));
      } catch (e) {
        console.error('   (Binary response)');
      }
    }
  }
}

testPDFDownload();
