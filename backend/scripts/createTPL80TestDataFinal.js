const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTestData() {
  try {
    console.log('🌱 CREANDO DATOS DE PRUEBA PARA TPL-80 (FINAL)\n');

    const candidateResult = await pool.query(
      `INSERT INTO candidates (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Andrea', 'Cuellar', 'andrea@vencorp.com', '5551234567']
    );
    const candidateId = candidateResult.rows[0].id;

    const vacancyResult = await pool.query(
      `INSERT INTO vacancies (title, description, department, status)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Asesor Inbound - Test', 'Evaluación de personalidad laboral', 'Contact Center', 'open']
    );
    const vacancyId = vacancyResult.rows[0].id;

    const token = crypto.randomBytes(16).toString('hex');
    const cvResult = await pool.query(
      `INSERT INTO candidate_vacancies (candidate_id, vacancy_id, status, token)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [candidateId, vacancyId, 'pending', token]
    );
    const cvId = cvResult.rows[0].id;

    const examResult = await pool.query(
      `SELECT id FROM exams WHERE name LIKE '%TPL-80%' LIMIT 1`
    );
    const examId = examResult.rows[0].id;

    await pool.query(
      `INSERT INTO vacancy_exams (vacancy_id, exam_id, exam_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [vacancyId, examId, 1]
    );

    console.log(`✅ Candidato y vacante creados\n`);

    // Obtener TODAS las preguntas SIN filtro de competencia
    const questionsResult = await pool.query(
      `SELECT eq.question_order, q.id
       FROM exam_questions eq
       INNER JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = $1
       ORDER BY eq.question_order`,
      [examId]
    );

    console.log(`📝 Procesando ${questionsResult.rows.length} preguntas:\n`);

    let answeredCount = 0;
    for (const question of questionsResult.rows) {
      // Obtener opciones
      const optionsResult = await pool.query(
        `SELECT id, score FROM question_options WHERE question_id = $1 ORDER BY score`,
        [question.id]
      );

      if (optionsResult.rows.length === 0) continue;

      // Seleccionar opción
      let idx = (question.question_order % 10 < 3) ? 0 :
                (question.question_order % 10 < 7) ? 3 : 4;
      idx = Math.min(idx, optionsResult.rows.length - 1);

      await pool.query(
        `INSERT INTO exam_answers (candidate_id, exam_id, question_id, answer_value, time_spent_seconds)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (candidate_id, exam_id, question_id) DO UPDATE SET answer_value = $4`,
        [candidateId, examId, question.id, optionsResult.rows[idx].id, Math.floor(Math.random() * 30) + 10]
      );

      answeredCount++;
      if (answeredCount % 20 === 0) {
        console.log(`   ${answeredCount}/80 respuestas...`);
      }
    }

    await pool.query(
      `UPDATE candidate_vacancies SET status = $1 WHERE id = $2`,
      ['completed', cvId]
    );

    console.log(`✅ ${answeredCount}/80 respuestas completadas\n`);
    console.log(`🎉 DATOS LISTOS\n`);
    console.log(`📊 CV ID: ${cvId}`);
    console.log(`🔗 Resultados: https://talento-ia-v1-frontend.onrender.com/resultados/${cvId}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestData();
