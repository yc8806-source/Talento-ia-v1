const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    console.log('🔍 Verificando vacantes y exámenes asignados...\n');

    // 1. Ver todas las vacantes
    const vacancies = await pool.query('SELECT id, title, status FROM vacancies ORDER BY id DESC');
    console.log('📋 Últimas vacantes:');
    vacancies.rows.slice(0, 5).forEach(v => console.log(`  ID ${v.id}: ${v.title} (${v.status})`));

    // 2. Ver asignaciones por vacante
    console.log('\n🔗 Exámenes asignados por vacante:');
    const assignments = await pool.query(`
      SELECT ve.vacancy_id, v.title, e.id as exam_id, e.name, ve.exam_order
      FROM vacancy_exams ve
      JOIN vacancies v ON ve.vacancy_id = v.id
      JOIN exams e ON ve.exam_id = e.id
      ORDER BY ve.vacancy_id DESC, ve.exam_order
    `);
    
    if (assignments.rows.length === 0) {
      console.log('  ⚠️ NO HAY ASIGNACIONES');
    } else {
      let currentVacancy = null;
      assignments.rows.forEach(a => {
        if (a.vacancy_id !== currentVacancy) {
          currentVacancy = a.vacancy_id;
          console.log(`\n  Vacante ${a.vacancy_id} (${a.title}):`);
        }
        console.log(`    - Examen ${a.exam_id}: ${a.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

check();
