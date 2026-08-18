const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

async function testDeleteCandidateRender() {
  try {
    console.log('\n🧪 PROBANDO ELIMINACIÓN EN RENDER (PRODUCCIÓN)\n');

    // Usar la conexión de Railway/Render
    const pool = new Pool({
      connectionString: process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL
    });

    const apiUrl = 'https://talento-ia-backend.onrender.com/api';

    console.log(`📡 Conectando a Render...\n`);

    // Obtener un candidato existente
    const candRes = await pool.query(
      `SELECT id, first_name, last_name, email FROM candidates LIMIT 1`
    );

    if (candRes.rows.length === 0) {
      console.log('❌ No hay candidatos para probar');
      pool.end();
      return;
    }

    const candidateToDelete = candRes.rows[0];
    console.log(`👤 Candidato a eliminar:`);
    console.log(`   ID: ${candidateToDelete.id}`);
    console.log(`   Nombre: ${candidateToDelete.first_name} ${candidateToDelete.last_name}`);
    console.log(`   Email: ${candidateToDelete.email}\n`);

    // Contar datos relacionados antes
    const cvCountBefore = await pool.query(
      `SELECT COUNT(*) as count FROM candidate_vacancies WHERE candidate_id = $1`,
      [candidateToDelete.id]
    );
    const ansCountBefore = await pool.query(
      `SELECT COUNT(*) as count FROM exam_answers WHERE candidate_id = $1`,
      [candidateToDelete.id]
    );

    console.log(`📊 Datos relacionados ANTES de eliminar:`);
    console.log(`   Asignaciones a vacantes: ${cvCountBefore.rows[0].count}`);
    console.log(`   Respuestas de examen: ${ansCountBefore.rows[0].count}\n`);

    // Eliminar candidato vía API en Render
    console.log(`🗑️  Eliminando candidato en Render...\n`);
    const deleteRes = await axios.delete(`${apiUrl}/candidates/${candidateToDelete.id}`);

    console.log(`✅ Respuesta del servidor Render:`);
    console.log(`   ${deleteRes.data.message}`);
    console.log(`   Candidato ID: ${deleteRes.data.candidateId}\n`);

    // Verificar que fue eliminado
    const verifyRes = await pool.query(
      `SELECT id FROM candidates WHERE id = $1`,
      [candidateToDelete.id]
    );

    if (verifyRes.rows.length === 0) {
      console.log(`✅ CANDIDATO ELIMINADO CORRECTAMENTE EN RENDER\n`);
    } else {
      console.log(`❌ ERROR: Candidato aún existe\n`);
    }

    // Verificar que datos relacionados también fueron eliminados
    const cvCountAfter = await pool.query(
      `SELECT COUNT(*) as count FROM candidate_vacancies WHERE candidate_id = $1`,
      [candidateToDelete.id]
    );
    const ansCountAfter = await pool.query(
      `SELECT COUNT(*) as count FROM exam_answers WHERE candidate_id = $1`,
      [candidateToDelete.id]
    );

    console.log(`📊 Datos relacionados DESPUÉS de eliminar:`);
    console.log(`   Asignaciones a vacantes: ${cvCountAfter.rows[0].count}`);
    console.log(`   Respuestas de examen: ${ansCountAfter.rows[0].count}\n`);

    if (cvCountAfter.rows[0].count === 0 && ansCountAfter.rows[0].count === 0) {
      console.log(`✅ ELIMINACIÓN EN CASCADA EN RENDER FUNCIONÓ CORRECTAMENTE\n`);
      console.log(`🎉 ¡LA FUNCIONALIDAD ESTÁ LISTA EN PRODUCCIÓN!\n`);
    } else {
      console.log(`⚠️  Algunos datos relacionados aún existen\n`);
    }

    pool.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

testDeleteCandidateRender();
