const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function assign() {
  try {
    console.log('🔄 Asignando exámenes a vacante 6 (Asesor Cobranzas)...\n');

    const vacancyId = 6;
    const examIds = [2, 3]; // Test de Soft Skills, Test de Lógica y Razonamiento

    // Eliminar asignaciones previas
    await pool.query('DELETE FROM vacancy_exams WHERE vacancy_id = $1', [vacancyId]);
    console.log('🗑️  Exámenes previos eliminados');

    // Asignar nuevos exámenes
    for (let i = 0; i < examIds.length; i++) {
      const result = await pool.query(
        'INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order) VALUES ($1, $2, $3) RETURNING *',
        [vacancyId, examIds[i], i + 1]
      );
      console.log(`✅ Examen ${examIds[i]} asignado (orden ${i + 1})`);
    }

    // Verificar
    const verify = await pool.query(`
      SELECT e.id, e.name FROM exams e
      INNER JOIN vacancy_exams ve ON e.id = ve.exam_id
      WHERE ve.vacancy_id = $1
      ORDER BY ve.exam_order
    `, [vacancyId]);

    console.log('\n✅ Exámenes ahora asignados a vacante 6:');
    verify.rows.forEach((row, i) => console.log(`  ${i + 1}. ${row.name}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

assign();
