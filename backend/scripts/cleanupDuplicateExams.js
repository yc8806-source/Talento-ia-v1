const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function cleanupDuplicates() {
  try {
    console.log('🧹 Limpiando exámenes duplicados sin preguntas...\n');

    // Eliminar exam_questions de exámenes vacíos
    await pool.query('DELETE FROM exam_questions WHERE exam_id IN (5,6,7,8,9,10,11,12,13,14,15)');
    console.log('✅ Eliminadas relaciones de exámenes vacíos');

    // Eliminar vacancy_exams de exámenes vacíos
    await pool.query('DELETE FROM vacancy_exams WHERE exam_id IN (5,6,7,8,9,10,11,12,13,14,15)');
    console.log('✅ Eliminadas asignaciones a vacantes');

    // Eliminar exámenes duplicados
    await pool.query('DELETE FROM exams WHERE id IN (5,6,7,8,9,10,11,12,13,14,15)');
    console.log('✅ Eliminados exámenes duplicados\n');

    // Mostrar exámenes restantes
    const result = await pool.query(`
      SELECT e.id, e.name, COUNT(eq.question_id) as preguntas
      FROM exams e
      LEFT JOIN exam_questions eq ON e.id = eq.exam_id
      GROUP BY e.id, e.name
      ORDER BY e.id
    `);

    console.log('📊 Exámenes finales:\n');
    result.rows.forEach(row => {
      console.log(`✅ ${row.name} (ID: ${row.id}) - ${row.preguntas} preguntas`);
    });

    console.log('\n🎉 Limpieza completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupDuplicates();
