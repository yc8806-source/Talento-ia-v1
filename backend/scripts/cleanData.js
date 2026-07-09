const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function cleanData() {
  try {
    console.log('🧹 LIMPIANDO DATOS DE EVALUACIONES...\n');

    // 1. Eliminar todas las respuestas de examen
    console.log('1️⃣  Eliminando respuestas de examen...');
    await pool.query('DELETE FROM exam_answers');
    console.log('   ✅ Respuestas eliminadas');

    // 2. Resetear estados de candidate_vacancies
    console.log('2️⃣  Reseteando estados de candidatos...');
    await pool.query('UPDATE candidate_vacancies SET status = $1, updated_at = NOW()', ['invited']);
    console.log('   ✅ Estados reseteados a "invited"');

    // 3. Contar registros finales
    const examAnswers = await pool.query('SELECT COUNT(*) as count FROM exam_answers');
    const cvUpdated = await pool.query('SELECT COUNT(*) as count FROM candidate_vacancies WHERE status = $1', ['invited']);

    console.log('\n✅ LIMPIEZA COMPLETADA\n');
    console.log('📊 Estado final:');
    console.log(`   Respuestas de examen: ${examAnswers.rows[0].count}`);
    console.log(`   Candidatos con estado "invited": ${cvUpdated.rows[0].count}\n`);

    // 4. Mostrar datos disponibles
    console.log('📚 DATOS DISPONIBLES:\n');

    const exams = await pool.query('SELECT id, name FROM exams');
    console.log(`Exámenes disponibles:`);
    exams.rows.forEach(e => {
      console.log(`  • ${e.name} (ID: ${e.id})`);
    });

    const vacancies = await pool.query('SELECT id, title FROM vacancies');
    console.log(`\nVacantes disponibles:`);
    vacancies.rows.forEach(v => {
      console.log(`  • ${v.title} (ID: ${v.id})`);
    });

    const candidates = await pool.query('SELECT id, first_name, last_name FROM candidates LIMIT 5');
    console.log(`\nCandidatos disponibles (primeros 5):`);
    candidates.rows.forEach(c => {
      console.log(`  • ${c.first_name} ${c.last_name} (ID: ${c.id})`);
    });

    console.log('\n🎉 Sistema listo para pruebas fresh\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanData();
