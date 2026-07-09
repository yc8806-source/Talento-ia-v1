const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function cleanupAll() {
  try {
    console.log('🧹 Eliminando todos los exámenes y preguntas de prueba...\n');

    // Obtener todos los exámenes
    const examsResult = await pool.query('SELECT id FROM exams');
    const examIds = examsResult.rows.map(r => r.id);

    if (examIds.length === 0) {
      console.log('✅ No hay exámenes para eliminar');
      process.exit(0);
    }

    // Eliminar en orden: exam_answers → exam_questions → question_options → questions → vacancy_exams → exams
    console.log('1️⃣  Eliminando respuestas de exámenes...');
    await pool.query('DELETE FROM exam_answers WHERE exam_id = ANY($1::int[])', [examIds]);
    console.log('   ✅ Respuestas eliminadas');

    console.log('2️⃣  Eliminando vinculaciones examen-pregunta...');
    await pool.query('DELETE FROM exam_questions WHERE exam_id = ANY($1::int[])', [examIds]);
    console.log('   ✅ Vinculaciones eliminadas');

    console.log('3️⃣  Eliminando opciones de preguntas...');
    // Obtener todas las preguntas que no están vinculadas a ningún examen
    await pool.query(`
      DELETE FROM question_options
      WHERE question_id IN (
        SELECT q.id FROM questions q
        LEFT JOIN exam_questions eq ON q.id = eq.question_id
        WHERE eq.id IS NULL
      )
    `);
    console.log('   ✅ Opciones eliminadas');

    console.log('4️⃣  Eliminando preguntas...');
    await pool.query(`
      DELETE FROM questions
      WHERE id NOT IN (SELECT DISTINCT question_id FROM exam_questions)
    `);
    console.log('   ✅ Preguntas eliminadas');

    console.log('5️⃣  Eliminando asignaciones a vacantes...');
    await pool.query('DELETE FROM vacancy_exams WHERE exam_id = ANY($1::int[])', [examIds]);
    console.log('   ✅ Asignaciones eliminadas');

    console.log('6️⃣  Eliminando exámenes...');
    await pool.query('DELETE FROM exams WHERE id = ANY($1::int[])', [examIds]);
    console.log('   ✅ Exámenes eliminados');

    console.log('\n🎉 Base de datos limpia. Listo para crear nuevos exámenes.\n');

    // Verificar estado final
    const finalResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM exams) as exams,
        (SELECT COUNT(*) FROM questions) as questions,
        (SELECT COUNT(*) FROM question_options) as options,
        (SELECT COUNT(*) FROM competencies) as competencies
    `);

    const stats = finalResult.rows[0];
    console.log('📊 Estado final:');
    console.log(`   Exámenes: ${stats.exams}`);
    console.log(`   Preguntas: ${stats.questions}`);
    console.log(`   Opciones: ${stats.options}`);
    console.log(`   Competencias: ${stats.competencies}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupAll();
