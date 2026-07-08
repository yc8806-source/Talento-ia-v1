const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function assignExams() {
  try {
    console.log('🔄 Asignando exámenes a vacante...\n');

    const vacancyId = 5; // Asesor Televentas
    const examIds = [1, 4]; // Test de Competencias Técnicas, Test de Conocimientos Específicos

    // Primero eliminar asignaciones previas
    await pool.query('DELETE FROM vacancy_exams WHERE vacancy_id = $1', [vacancyId]);
    console.log('🗑️  Exámenes previos eliminados');

    // Asignar nuevos exámenes
    for (let i = 0; i < examIds.length; i++) {
      await pool.query(
        'INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order) VALUES ($1, $2, $3)',
        [vacancyId, examIds[i], i + 1]
      );
      console.log(`✅ Examen ${examIds[i]} asignado (orden ${i + 1})`);
    }

    // Verificar
    const result = await pool.query(
      `SELECT e.id, e.name FROM exams e
       INNER JOIN vacancy_exams ve ON e.id = ve.exam_id
       WHERE ve.vacancy_id = $1
       ORDER BY ve.exam_order`,
      [vacancyId]
    );

    console.log('\n✅ Exámenes actualmente asignados a vacante 5:');
    result.rows.forEach((row, i) => console.log(`  ${i + 1}. ${row.name}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

assignExams();
