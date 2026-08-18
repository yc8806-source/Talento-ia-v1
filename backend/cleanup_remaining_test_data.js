require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL
});

async function cleanupRemaining() {
  try {
    console.log('\n🧹 ELIMINANDO VACANTES RESTANTES DE PRUEBA\n');

    // Buscar todas las vacantes de prueba restantes
    const vacantesRes = await pool.query(
      `SELECT id, title FROM vacancies
       WHERE title LIKE '%Test%'
       ORDER BY id`
    );

    console.log(`📋 Vacantes encontradas: ${vacantesRes.rows.length}`);
    vacantesRes.rows.forEach(v => {
      console.log(`   - ID ${v.id}: ${v.title}`);
    });

    if (vacantesRes.rows.length === 0) {
      console.log('✅ No hay más vacantes de prueba');
      pool.end();
      return;
    }

    const vacancyIds = vacantesRes.rows.map(v => v.id);

    console.log('\n🗑️  Eliminando...\n');

    // 1. Eliminar respuestas de examen
    const answersRes = await pool.query(
      `DELETE FROM exam_answers
       WHERE candidate_id IN (
         SELECT c.id FROM candidates c
         INNER JOIN candidate_vacancies cv ON c.id = cv.candidate_id
         WHERE cv.vacancy_id = ANY($1)
       )`,
      [vacancyIds]
    );
    console.log(`   ✅ Respuestas de examen eliminadas: ${answersRes.rowCount}`);

    // 2. Eliminar evaluaciones
    const evalsRes = await pool.query(
      `DELETE FROM evaluations
       WHERE candidate_vacancy_id IN (
         SELECT id FROM candidate_vacancies WHERE vacancy_id = ANY($1)
       )`,
      [vacancyIds]
    );
    console.log(`   ✅ Evaluaciones eliminadas: ${evalsRes.rowCount}`);

    // 3. Eliminar candidate_vacancies
    const cvRes = await pool.query(
      `DELETE FROM candidate_vacancies WHERE vacancy_id = ANY($1)`,
      [vacancyIds]
    );
    console.log(`   ✅ Asignaciones candidate_vacancy eliminadas: ${cvRes.rowCount}`);

    // 4. Eliminar candidatos orfanos
    const candRes = await pool.query(
      `DELETE FROM candidates
       WHERE id NOT IN (SELECT candidate_id FROM candidate_vacancies)`
    );
    console.log(`   ✅ Candidatos orfanos eliminados: ${candRes.rowCount}`);

    // 5. Eliminar vacantes
    const vacRes = await pool.query(
      `DELETE FROM vacancies WHERE id = ANY($1)`,
      [vacancyIds]
    );
    console.log(`   ✅ Vacantes eliminadas: ${vacRes.rowCount}`);

    console.log('\n✅ LIMPIEZA TOTAL COMPLETADA\n');

    pool.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

cleanupRemaining();
