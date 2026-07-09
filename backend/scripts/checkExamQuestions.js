const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkExamQuestions() {
  try {
    console.log('🔍 Verificando preguntas por examen...\n');

    const result = await pool.query(`
      SELECT
        e.id,
        e.name,
        COUNT(eq.question_id) as total_preguntas,
        COUNT(DISTINCT eq.question_id) as preguntas_unicas
      FROM exams e
      LEFT JOIN exam_questions eq ON e.id = eq.exam_id
      GROUP BY e.id, e.name
      ORDER BY e.id
    `);

    console.log('📊 Estado de Exámenes:\n');
    result.rows.forEach(row => {
      const status = row.total_preguntas > 0 ? '✅' : '❌';
      console.log(`${status} ${row.name}`);
      console.log(`   ID: ${row.id}, Preguntas: ${row.total_preguntas}\n`);
    });

    // Detalles de preguntas
    console.log('\n📋 Detalles por examen:\n');

    for (const exam of result.rows) {
      const questions = await pool.query(`
        SELECT
          q.id,
          q.title,
          COUNT(qo.id) as opciones
        FROM exam_questions eq
        INNER JOIN questions q ON eq.question_id = q.id
        LEFT JOIN question_options qo ON q.id = qo.question_id
        WHERE eq.exam_id = $1
        GROUP BY q.id, q.title
        ORDER BY eq.question_order
      `, [exam.id]);

      if (questions.rows.length > 0) {
        console.log(`${exam.name} (${questions.rows.length} preguntas):`);
        questions.rows.forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.title} (${q.opciones} opciones)`);
        });
      } else {
        console.log(`${exam.name}: ⚠️  Sin preguntas`);
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkExamQuestions();
