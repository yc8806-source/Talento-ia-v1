require('dotenv').config();
const pool = require('../src/config/database');

const testsToDelete = [
  'Test de Resolución de Problemas',
  'Test de Manejo de Objeciones',
  'Test de Empatía',
  'Test de Escucha Activa',
  'Test de Comunicación Verbal'
];

async function deleteTests() {
  try {
    console.log('🔍 Buscando tests a eliminar...\n');

    for (const testName of testsToDelete) {
      // Buscar el test
      const findResult = await pool.query(
        'SELECT id, name FROM exams WHERE name = $1',
        [testName]
      );

      if (findResult.rows.length > 0) {
        const testId = findResult.rows[0].id;
        console.log(`✅ Encontrado: "${testName}" (ID: ${testId})`);

        // Eliminar en orden de dependencias
        try {
          await pool.query('DELETE FROM exam_answers WHERE exam_id = $1', [testId]);
          console.log(`   ✓ Eliminadas respuestas de examen`);
        } catch (e) {
          console.log(`   - (sin respuestas)`);
        }

        try {
          await pool.query('DELETE FROM exam_scores WHERE exam_id = $1', [testId]);
          console.log(`   ✓ Eliminadas puntuaciones de examen`);
        } catch (e) {
          console.log(`   - (sin puntuaciones)`);
        }

        try {
          await pool.query('DELETE FROM exam_questions WHERE exam_id = $1', [testId]);
          console.log(`   ✓ Eliminadas preguntas de examen`);
        } catch (e) {
          console.log(`   - (sin preguntas)`);
        }

        try {
          await pool.query('DELETE FROM evaluation_results WHERE exam_id = $1', [testId]);
          console.log(`   ✓ Eliminados resultados de evaluación`);
        } catch (e) {
          console.log(`   - (sin resultados)`);
        }

        try {
          await pool.query('DELETE FROM vacancy_exams WHERE exam_id = $1', [testId]);
          console.log(`   ✓ Eliminadas asignaciones de vacantes`);
        } catch (e) {
          console.log(`   - (sin asignaciones de vacantes)`);
        }

        try {
          await pool.query('DELETE FROM evaluation_assignments WHERE exam_id = $1', [testId]);
          console.log(`   ✓ Eliminadas asignaciones de evaluación`);
        } catch (e) {
          console.log(`   - (sin asignaciones de evaluación)`);
        }

        // Eliminar el exam
        const deleteResult = await pool.query('DELETE FROM exams WHERE id = $1', [testId]);
        console.log(`   ✓ Test eliminado de la base de datos\n`);
      } else {
        console.log(`❌ No encontrado: "${testName}"\n`);
      }
    }

    console.log('✅ Proceso completado - Todos los tests han sido eliminados');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteTests();
