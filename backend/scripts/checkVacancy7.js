const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    console.log('🔍 Verificando vacante 7 (Asesor Inbound)...\n');

    // Ver vacante
    const vacancy = await pool.query('SELECT id, title FROM vacancies WHERE id = 7');
    console.log('📋 Vacante:', vacancy.rows[0]?.title || 'No encontrada');

    // Ver exámenes asignados
    const exams = await pool.query(`
      SELECT e.id, e.name FROM exams e
      INNER JOIN vacancy_exams ve ON e.id = ve.exam_id
      WHERE ve.vacancy_id = 7
      ORDER BY ve.exam_order
    `);

    console.log('\n🔗 Exámenes asignados:');
    if (exams.rows.length === 0) {
      console.log('  ⚠️ NINGUNO - No hay exámenes');
    } else {
      exams.rows.forEach((e, i) => console.log(`  ${i + 1}. ${e.name}`));
    }

    // Ver candidatos de esa vacante
    const candidates = await pool.query(`
      SELECT c.id, c.first_name, c.last_name FROM candidates c
      INNER JOIN candidate_vacancies cv ON c.id = cv.candidate_id
      WHERE cv.vacancy_id = 7
    `);

    console.log('\n👥 Candidatos de vacante 7:');
    candidates.rows.forEach(c => console.log(`  - ${c.first_name} ${c.last_name}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

check();
